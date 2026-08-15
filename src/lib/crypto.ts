const MAGIC = new TextEncoder().encode("MFORGE02");

function exactBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
const PBKDF2_ITERATIONS = 310_000;

function concat(...parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.byteLength; }
  return output;
}

function uint32(value: number) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, false);
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: exactBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptFile(file: File, password: string) {
  if (password.length < 8) throw new Error("Use uma senha com pelo menos 8 caracteres.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const meta = new TextEncoder().encode(JSON.stringify({ name: file.name, type: file.type || "application/octet-stream" }));
  const plaintext = concat(uint32(meta.byteLength), meta, new Uint8Array(await file.arrayBuffer()));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: exactBuffer(iv) }, key, exactBuffer(plaintext)));
  return new Blob([concat(MAGIC, salt, iv, encrypted)], { type: "application/octet-stream" });
}

export async function decryptFile(file: File, password: string) {
  const data = new Uint8Array(await file.arrayBuffer());
  if (data.byteLength < MAGIC.byteLength + 16 + 12 + 20) throw new Error("Arquivo criptografado inválido.");
  for (let i = 0; i < MAGIC.byteLength; i += 1) if (data[i] !== MAGIC[i]) throw new Error("Este arquivo não foi gerado pelo MediaForge.");
  const salt = data.slice(MAGIC.byteLength, MAGIC.byteLength + 16);
  const iv = data.slice(MAGIC.byteLength + 16, MAGIC.byteLength + 28);
  const encrypted = data.slice(MAGIC.byteLength + 28);
  const key = await deriveKey(password, salt);
  try {
    const decrypted = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: exactBuffer(iv) }, key, exactBuffer(encrypted)));
    const metaLength = new DataView(decrypted.buffer, decrypted.byteOffset, 4).getUint32(0, false);
    if (metaLength <= 0 || metaLength > 16_384 || 4 + metaLength > decrypted.byteLength) throw new Error("Cabeçalho inválido.");
    const meta = JSON.parse(new TextDecoder().decode(decrypted.slice(4, 4 + metaLength))) as { name?: string; type?: string };
    const content = decrypted.slice(4 + metaLength);
    return { blob: new Blob([content], { type: meta.type || "application/octet-stream" }), name: meta.name || "decrypted.bin", type: meta.type || "application/octet-stream" };
  } catch (cause) {
    if (cause instanceof Error && cause.message === "Cabeçalho inválido.") throw cause;
    throw new Error("Senha incorreta ou arquivo corrompido.");
  }
}

export async function hashFile(file: File, algorithm: "SHA-256" | "SHA-512") {
  const hash = await crypto.subtle.digest(algorithm, await file.arrayBuffer());
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function passwordMetrics(password: string) {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/\d/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 33;
  const entropy = password.length && pool ? password.length * Math.log2(pool) : 0;
  return { pool, entropy, hasLower: /[a-z]/.test(password), hasUpper: /[A-Z]/.test(password), hasNumber: /\d/.test(password), hasSymbol: /[^A-Za-z0-9]/.test(password) };
}

export function generatePassword(length = 20, symbols = true) {
  const alphabet = `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789${symbols ? "!@#$%&*+-_=.?" : ""}`;
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

export function crackTimeLabel(entropy: number, guessesPerSecond: number) {
  if (!entropy) return "instantâneo";
  const seconds = (2 ** Math.min(entropy - 1, 1023)) / guessesPerSecond;
  if (!Number.isFinite(seconds) || seconds > 31_557_600 * 1e12) return "> 1 trilhão de anos";
  if (seconds < 1) return "< 1 segundo";
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} h`;
  if (seconds < 31_557_600) return `${(seconds / 86400).toFixed(1)} dias`;
  return `${(seconds / 31_557_600).toExponential(2)} anos`;
}
