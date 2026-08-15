"use client";

type FFmpegLoadConfig = {
  coreURL: string;
  wasmURL: string;
  workerLoadURL: string;
};

type FFmpegInstance = {
  loaded: boolean;
  on: (event: "log" | "progress", callback: (payload: any) => void) => void;
  load: (config: FFmpegLoadConfig) => Promise<boolean | void>;
  writeFile: (name: string, data: Uint8Array) => Promise<void>;
  exec: (args: string[]) => Promise<number>;
  readFile: (name: string) => Promise<Uint8Array | string>;
  deleteFile: (name: string) => Promise<void>;
};

declare global {
  interface Window {
    FFmpegWASM?: { FFmpeg: new () => FFmpegInstance };
    __mediaForgeFfmpegPatched?: boolean;
  }
}

const FFMPEG_VERSION = "0.12.15";
const CORE_VERSION = "0.12.10";
const WORKER_PATCH_FROM = "new URL(e.p+e.u(814),e.b)";
const WORKER_PATCH_TO = "r.workerLoadURL";

const FFMPEG_BASES = [
  `https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/umd`,
  `https://unpkg.com/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/umd`,
];

const CORE_BASES = [
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`,
  `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`,
];

let instance: FFmpegInstance | null = null;
let loading: Promise<FFmpegInstance> | null = null;
let activeLog: ((message: string) => void) | undefined;
let activeProgress: ((value: number) => void) | undefined;
const retainedBlobUrls: string[] = [];

function normalizeError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
    if (message.trim()) return message;
    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      // Ignore serialization failures and fall through to the generic message.
    }
  }
  return "Falha desconhecida ao iniciar o mecanismo de vídeo.";
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error(message)), milliseconds)),
  ]);
}

async function fetchResponse(url: string, milliseconds = 30_000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), milliseconds);
  try {
    const response = await fetch(url, { cache: "force-cache", signal: controller.signal });
    if (!response.ok) throw new Error(`Falha HTTP ${response.status} ao carregar ${new URL(url).pathname.split("/").pop()}.`);
    return response;
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`Tempo excedido ao carregar ${new URL(url).pathname.split("/").pop()}.`);
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function firstResponse(bases: string[], file: string) {
  let lastError: unknown;
  for (const base of bases) {
    try {
      return await fetchResponse(`${base}/${file}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Não foi possível carregar ${file} pelas fontes de contingência. ${normalizeError(lastError)}`);
}

async function firstBlobURL(bases: string[], file: string, type: string) {
  const response = await firstResponse(bases, file);
  const url = URL.createObjectURL(new Blob([await response.arrayBuffer()], { type }));
  retainedBlobUrls.push(url);
  return url;
}

function executeScriptSource(source: string) {
  return new Promise<void>((resolve, reject) => {
    const blobUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
    const script = document.createElement("script");
    script.src = blobUrl;
    script.async = true;
    script.dataset.mediaforgeFfmpeg = "wrapper";
    script.onload = () => {
      URL.revokeObjectURL(blobUrl);
      script.remove();
      resolve();
    };
    script.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      script.remove();
      reject(new Error("O navegador não conseguiu executar o carregador local do FFmpeg."));
    };
    document.head.appendChild(script);
  });
}

async function loadPatchedWrapper() {
  if (window.__mediaForgeFfmpegPatched && window.FFmpegWASM?.FFmpeg) return window.FFmpegWASM.FFmpeg;

  // Em desenvolvimento, HMR pode deixar na página o wrapper antigo que falhou ao
  // localizar o worker. Não reutilizamos uma instância sem a marca do MediaForge.
  if (window.FFmpegWASM && !window.__mediaForgeFfmpegPatched) {
    try { delete window.FFmpegWASM; } catch { window.FFmpegWASM = undefined; }
  }

  let lastError: unknown;
  for (const base of FFMPEG_BASES) {
    try {
      const response = await fetchResponse(`${base}/ffmpeg.js`, 20_000);
      const source = await response.text();
      if (!source.includes(WORKER_PATCH_FROM)) {
        throw new Error("O carregador do FFmpeg recebido não corresponde à versão esperada.");
      }

      // O build UMD do ffmpeg.wasm tenta resolver 814.ffmpeg.js relativamente à página.
      // Como o MediaForge carrega a biblioteca de CDN, substituímos esse caminho por uma
      // URL Blob fornecida explicitamente no load(), mantendo o worker como clássico.
      const patched = source.replace(WORKER_PATCH_FROM, WORKER_PATCH_TO);
      await withTimeout(executeScriptSource(patched), 10_000, "Tempo excedido ao preparar o carregador do FFmpeg.");
      if (window.FFmpegWASM?.FFmpeg) {
        window.__mediaForgeFfmpegPatched = true;
        return window.FFmpegWASM.FFmpeg;
      }
      throw new Error("O carregador do FFmpeg foi executado, mas a API não ficou disponível.");
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Não foi possível preparar o FFmpeg. ${normalizeError(lastError)}`);
}

function attachListeners(ffmpeg: FFmpegInstance) {
  ffmpeg.on("log", ({ message }) => activeLog?.(String(message ?? "")));
  ffmpeg.on("progress", ({ progress }) => activeProgress?.(Math.max(0, Math.min(1, Number(progress) || 0))));
}

export async function getFFmpeg(onLog?: (message: string) => void, onProgress?: (value: number) => void) {
  activeLog = onLog;
  activeProgress = onProgress;
  if (instance?.loaded) return instance;
  if (loading) return loading;

  loading = (async () => {
    activeLog?.("Preparando o mecanismo de vídeo local…");
    const FFmpeg = await loadPatchedWrapper();

    activeLog?.("Baixando os componentes de processamento (~31 MB apenas no primeiro uso)…");
    const [coreURL, wasmURL, workerLoadURL] = await Promise.all([
      firstBlobURL(CORE_BASES, "ffmpeg-core.js", "text/javascript"),
      firstBlobURL(CORE_BASES, "ffmpeg-core.wasm", "application/wasm"),
      firstBlobURL(FFMPEG_BASES, "814.ffmpeg.js", "text/javascript"),
    ]);

    const ffmpeg = new FFmpeg();
    attachListeners(ffmpeg);
    await withTimeout(
      ffmpeg.load({ coreURL, wasmURL, workerLoadURL }),
      90_000,
      "O mecanismo de vídeo demorou demais para iniciar. Verifique a conexão, bloqueadores de conteúdo e tente novamente.",
    );

    // Um comando sem arquivo confirma que worker, core JavaScript e WASM conversam entre si.
    const probeCode = await ffmpeg.exec(["-version"]);
    if (probeCode !== 0) throw new Error(`O mecanismo de vídeo iniciou, mas falhou no autoteste (código ${probeCode}).`);

    instance = ffmpeg;
    activeLog?.("Mecanismo de vídeo pronto.");
    return ffmpeg;
  })();

  try {
    return await loading;
  } catch (error) {
    instance = null;
    throw new Error(normalizeError(error));
  } finally {
    loading = null;
  }
}

export async function processVideo(
  file: File,
  argsBuilder: (inputName: string, outputName: string) => string[],
  outputName: string,
  onLog?: (message: string) => void,
  onProgress?: (value: number) => void,
) {
  const logs: string[] = [];
  const receiveLog = (message: string) => {
    logs.push(message);
    if (logs.length > 80) logs.shift();
    onLog?.(message);
  };

  let ffmpeg: FFmpegInstance;
  try {
    ffmpeg = await getFFmpeg(receiveLog, onProgress);
  } catch (error) {
    throw new Error(`Não foi possível iniciar o processamento de vídeo. ${normalizeError(error)}`);
  }

  activeLog = receiveLog;
  activeProgress = onProgress;

  const inputExt = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "input";
  const inputName = `input-${crypto.randomUUID()}.${inputExt}`;
  const outputFile = `${crypto.randomUUID()}-${outputName}`;
  await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

  try {
    const args = argsBuilder(inputName, outputFile);
    const exitCode = await ffmpeg.exec(["-y", ...args]);
    if (exitCode !== 0) {
      const tail = logs.slice(-10).filter(Boolean).join("\n").trim();
      throw new Error(tail ? `O processamento não foi concluído.\n${tail}` : `O processamento encerrou com código ${exitCode}.`);
    }

    const data = await ffmpeg.readFile(outputFile);
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    if (!bytes.byteLength) throw new Error("O processamento terminou sem gerar dados de saída.");
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return new Blob([buffer]);
  } catch (error) {
    const message = normalizeError(error);
    if (/memory|allocate|abort\(|out of bounds|OOM/i.test(message)) {
      throw new Error("O vídeo exigiu mais memória do que o navegador conseguiu reservar. Tente novamente usando o limite de 1920 px ou 1280 px.");
    }
    throw new Error(message);
  } finally {
    await Promise.allSettled([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile(outputFile)]);
  }
}
