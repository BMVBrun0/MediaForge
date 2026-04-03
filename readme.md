# MediaForge

Projeto web focado em compressão e conversão de imagens, desenvolvido como estudo público para demonstrar arquitetura frontend moderna, processamento real de arquivos no servidor, experiência de uso bem pensada e organização de repositório para portfólio técnico.

A proposta do MediaForge não é ser apenas uma página visual ou um protótipo estático. Ele foi pensado como uma base prática para um toolkit de mídia na web, com foco em clareza de fluxo, responsividade, interface limpa, processamento real e possibilidade de evolução futura para novos formatos, filas maiores, presets, comparações visuais e mais ferramentas.

## Objetivo do projeto

Este projeto foi criado para:

- demonstrar um fluxo real de upload, processamento e download de imagens;
- estudar compressão e conversão de arquivos na web com interface moderna;
- servir como projeto público de portfólio com foco técnico e visual;
- mostrar organização de código, separação de responsabilidades e evolução incremental;
- criar uma base escalável para futuras ferramentas semelhantes.

## Proposta da aplicação

O MediaForge foi pensado como uma ferramenta web moderna para trabalhar com imagens de forma simples e clara.

Na versão atual, a aplicação permite:

- enviar uma ou várias imagens;
- escolher entre compactar ou converter;
- ajustar formato de saída, qualidade e limites dimensionais;
- acompanhar uma fila de processamento;
- visualizar resultados processados;
- manter histórico salvo localmente no navegador.

A ideia é que o projeto continue evoluindo com novos recursos, mas já entregue valor visual e técnico desde a primeira versão pública.

## Tecnologias utilizadas

### Next.js
O projeto usa Next.js como base principal por oferecer uma estrutura moderna para aplicações web, boa organização de rotas, suporte sólido a renderização híbrida e integração natural com deploy em plataformas como a Vercel.

### TypeScript
O TypeScript foi escolhido para melhorar segurança, legibilidade e previsibilidade do código, especialmente em fluxos com arquivos, tipos de processamento, fila e histórico.

### Node.js
O processamento no servidor usa runtime Node.js, o que permite lidar com operações reais de transformação de arquivos sem depender exclusivamente do navegador.

### Sharp
O Sharp foi utilizado para compressão e conversão de imagens. Ele é rápido, amplamente usado e combina muito bem com a proposta de processar imagens no backend com boa performance.

### CSS
A estilização foi construída com foco em layout responsivo, hierarquia visual, clareza de interface e uma linguagem visual menos genérica. A ideia foi fugir de layouts excessivamente “templateados” e aproximar mais a experiência de uma ferramenta real.

## Por que esse projeto foi feito com essa stack

A escolha dessa stack foi feita pensando em três frentes:

1. **Deploy simples**
   - Next.js e Node funcionam muito bem em plataformas como a Vercel;
   - isso facilita manter o projeto público e acessível.

2. **Processamento real**
   - como existe conversão e compressão de arquivos, fazia sentido usar uma stack que permitisse lógica de servidor sem complicar demais a arquitetura inicial.

3. **Evolução futura**
   - a base atual permite crescer para presets mais avançados, comparação visual, histórico expandido, novas rotas, autenticação, jobs em background e novos tipos de arquivo.

## Estrutura do projeto

A estrutura foi organizada para manter separação entre aplicação, componentes, lógica de domínio e utilitários:

```text
.
├── app
│   ├── about
│   ├── api
│   │   ├── compress
│   │   └── convert
│   ├── history
│   ├── how-to-use
│   ├── tool
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── src
│   ├── components
│   └── lib
├── public
├── package.json
├── tsconfig.json
└── next.config.js
```

## Organização da estrutura

### `app/`
Contém as rotas da aplicação, páginas principais e rotas de API.

### `app/api/`
Responsável pelos endpoints usados para compressão e conversão de imagens.

### `src/components/`
Contém os componentes reutilizáveis da interface, como área de upload, fila, histórico e elementos de layout.

### `src/lib/`
Agrupa tipos, funções auxiliares, regras de domínio, persistência local e utilidades compartilhadas.

### `app/globals.css`
Arquivo de estilos globais do projeto.

## Funcionalidades atuais

- upload de imagens por seleção de arquivo;
- suporte a múltiplos formatos de imagem;
- modo de compactação;
- modo de conversão;
- controle de qualidade;
- limite de largura e altura;
- presets rápidos;
- fila visual de processamento;
- preview dos resultados;
- histórico local salvo no navegador;
- interface separada por páginas;
- layout responsivo para desktop e mobile.

## O que este projeto demonstra tecnicamente

Mesmo sendo um projeto de portfólio, o MediaForge foi pensado para mostrar pontos técnicos relevantes, como:

- arquitetura baseada em componentes;
- separação entre UI, regras de processamento e persistência;
- uso de rotas de API dentro do Next.js;
- manipulação de arquivos no frontend e backend;
- experiência de uso orientada por fluxo;
- histórico local com persistência no navegador;
- preocupação com responsividade e clareza visual;
- evolução incremental guiada por melhorias reais.

## Próximas evoluções possíveis

Algumas evoluções previstas para versões futuras:

- comparação visual antes/depois;
- presets mais avançados;
- suporte a novos formatos;
- ferramentas adicionais além de imagem;
- processamento em lote mais robusto;
- jobs em background;
- autenticação;
- sincronização entre dispositivos;
- integração com storage externo;
- analytics básicos de uso.

## Rodando localmente

Após instalar as dependências, rode o projeto em ambiente de desenvolvimento:

```bash
npm install
npm run dev
```

## Observação final

O MediaForge foi criado como uma base pública para demonstrar não só interface, mas também decisões técnicas, estrutura de projeto, processamento real e cuidado com UX. Ele funciona como um projeto de portfólio, mas também como uma fundação sólida para uma ferramenta web maior no futuro.
