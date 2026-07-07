# Publicar o Artist Release Hub

O app está preparado para GitHub Pages, Vercel ou Cloudflare Pages. Neste projeto, o caminho atual é GitHub Pages.

## GitHub Pages com login Supabase

Antes de publicar, configure os secrets no GitHub:

1. Abra o repositório `9p5s5ky2gy-bot/artist-release-hub`.
2. Vá em **Settings**.
3. Entre em **Secrets and variables** > **Actions**.
4. Clique em **New repository secret**.
5. Adicione:

```text
VITE_SUPABASE_URL=https://jdqydenrxecchzhvanwe.supabase.co
```

6. Adicione outro secret:

```text
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_r_DHhkPpoyNyCvurlhqrJA_CgpU34vQ
```

Depois:

1. Vá em **Actions**.
2. Abra **Deploy to GitHub Pages**.
3. Clique em **Run workflow**.
4. Aguarde o build terminar.

Link do app:

```text
https://9p5s5ky2gy-bot.github.io/artist-release-hub/
```

## Supabase

O app só salva dados na nuvem depois que o SQL em `supabase/schema.sql` for executado no Supabase.

Veja o guia completo em `SUPABASE_SETUP.md`.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build local

```bash
npm run build
npm run preview
```

## Vercel alternativa

Se preferir Vercel:

1. Importe o repositório na Vercel.
2. Use:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

3. Em **Environment Variables**, adicione:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

4. Clique em **Deploy**.
