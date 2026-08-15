# MediaForge

Toolkit web para processamento de imagens, vídeo, segurança de arquivos e geração de assets.

## Requisitos

- Node.js 20+
- npm 10+

## Instalação

```bash
npm ci
```

## Desenvolvimento

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Validação

```bash
npm run typecheck
npm test
npm run build
```

## Deploy

O projeto é compatível com Vercel usando a configuração padrão do Next.js.

A rota `/api/image/process` usa Sharp para AVIF e otimização remota de imagens pequenas. Operações de vídeo, criptografia, checksum, paleta, comparação, remoção de fundo e geração de assets são executadas no navegador.

O Video Lab carrega FFmpeg WebAssembly sob demanda a partir do jsDelivr, portanto requer acesso de rede no primeiro uso da ferramenta.
