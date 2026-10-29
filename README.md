# ImportPro — build independente

Esta branch prepara o ImportPro para execução fora do Lovable. O projeto usa React, TypeScript, Vite, TanStack Start, Tailwind CSS e Supabase.

## Requisitos

- Node.js 22+ (recomendado)
- Bun (o repositório mantém `bun.lock`)
- Projeto Supabase configurado com as migrations deste repositório

## Desenvolvimento local

```bash
git clone https://github.com/vitinestelionato/pageimportpro.git
cd pageimportpro
git checkout chatgpt-independent-build
bun install
cp .env.example .env
# Preencha as variáveis necessárias em .env
bun run dev
```

## Build

```bash
bun run build
bun run preview
```

O servidor de produção é um app TanStack Start/Nitro. Configure a hospedagem para executar o artefato de servidor gerado pelo build. Não publique apenas os arquivos estáticos se a hospedagem não suportar rotas de servidor.

## Variáveis de ambiente

Veja `.env.example`. `SUPABASE_SERVICE_ROLE_KEY`, `CAKTO_WEBHOOK_SECRET`, `BREVO_API_KEY` e tokens de provedores são exclusivamente server-side. Nunca use o prefixo `VITE_` nelas.

As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` são públicas por definição; a segurança dos dados depende de RLS corretamente configurado no Supabase.

## Banco de dados

As migrations estão em `supabase/migrations`. Revise cada migration e faça backup antes de aplicar em um projeto Supabase com dados existentes. A migration de hardening adicionada nesta branch restringe atualização de campos privilegiados em `profiles` e cria índice único para eventos Cakto processados.

## Integrações opcionais

- Cakto: `CAKTO_WEBHOOK_SECRET`
- Scraping/análise: `FIRECRAWL_API_KEY` e chave do provedor de IA configurado
- E-mail: variáveis Brevo
- Rastreamento: variáveis LinkeTrack

Sem credenciais de um provedor, os módulos dependentes desse serviço não poderão completar operações reais.

## Estado da reconstrução

Esta branch ainda está em desenvolvimento. Execute instalação, lint, testes e build em ambiente local/CI antes de publicar. Não considere a aplicação pronta para produção até validar autenticação, RLS, webhooks e integrações externas.
