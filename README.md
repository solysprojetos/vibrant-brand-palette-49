# Visual Brand Site

crie um site utilizando a logo, pegando referencia das cores e da apresentação do pdf tambem

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vibrant-brand-palette-49.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1f22df6a-80cf-4182-8da0-41dc71992ef6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Atualizar o conteúdo do site

As informações que mudam a cada encontro ficam em um arquivo só:
**`src/config/conteudo.ts`**. Não é preciso mexer no layout para atualizá-las.

| O que atualizar | Onde |
| --- | --- |
| Nome, data, horário, local, endereço, investimento, palavra, programação e vagas do próximo encontro | `proximoEncontro` |
| Depoimentos das participantes (três espaços) | `depoimentos` |
| Respostas das perguntas frequentes | `duvidas` |
| Instagram, WhatsApp, endereço e Termos de Uso do rodapé | `contato` |
| Serviço que recebe as inscrições | `ENDPOINT_INSCRICAO` |

Campo deixado vazio (`""`) não inventa nada: a página mostra discretamente
"Informações em breve" ou simplesmente não exibe aquele item.

## Otimizar imagens novas

As fotos ficam em `public/imagens`. Ao acrescentar uma foto nova, gere as
cópias em AVIF/WebP que o site serve:

```sh
bun add -d sharp
bun scripts/otimizar-imagens.mjs
```

O comando escreve em `public/imagens/otim/` e atualiza
`src/lib/imagens-manifesto.json`. Os arquivos originais não são alterados —
eles continuam servindo de reserva para navegadores antigos.
