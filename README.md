This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Ligações de voz (WhatsApp)

O módulo **Ligações** (`/ligacoes`) faz e recebe ligações de voz do WhatsApp direto no navegador.
A parte de telefonia roda num serviço Go separado, o [ArendCalls](https://github.com/nathanarend/ArendCalls),
declarado no `docker-compose.yml` (serviço `arendcalls`).

```
navegador ──HTTPS──▶ Next.js /api/ligacoes/* ──API key──▶ ArendCalls (127.0.0.1:8090) ──▶ WhatsApp
    └──────────── áudio WebRTC (UDP 50000-50100) ─────────▶ ArendCalls
```

- O navegador nunca vê a API key: as rotas `app/api/ligacoes` conferem o login do Metha e só repassam
  uma lista fechada de rotas. Criar/excluir/parear contas é só para admin; o QR code só vai para admin.
- Áudio no navegador: `lib/ligacoes-audio.ts` + `public/worklets/ligacao-*.js` (PCM 16 kHz num data channel).
- A chamada fica num painel flutuante e continua ao navegar pelo app; recarregar a aba encerra a ligação.

**Requisitos de deploy**

1. `.env`: `ARENDCALLS_API_KEY=` (gere com `openssl rand -hex 32`).
2. **HTTPS** — o navegador só libera o microfone em HTTPS (ou localhost).
3. Firewall liberando **UDP 50000-50100** (o `deploy.sh` libera no ufw se estiver ativo).
4. Em `/ligacoes`, um admin cria a conta e lê o QR code com o WhatsApp da empresa.

Para investigar áudio no navegador: `localStorage.setItem("metha_ligacoes_debug", "1")` e veja o console
(`faltaMs` = buffer vazio/cortes, `descartadoMs` = atraso descartado).
