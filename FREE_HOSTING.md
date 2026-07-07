# Hospedagem grátis e com boa longevidade

Este app é um React/Vite estático. Isso é ótimo para hospedagem gratuita, porque não precisa de servidor pago.

## Minha recomendação

Para este projeto, use nesta ordem:

1. GitHub Pages: melhor para manter grátis por bastante tempo.
2. Cloudflare Pages: melhor free tier para crescer e usar domínio depois.
3. Vercel: mais fácil e bonita para deploy, mas eu deixaria como alternativa.

## Atenção sobre dados

O painel publicado na nuvem abre por link em qualquer dispositivo, mas os dados continuam no `localStorage`.

Na prática:

- se você cadastrar artistas no notebook, eles ficam no navegador do notebook;
- se abrir no celular, o app abre, mas os dados começam vazios naquele navegador;
- para sincronizar tudo entre dispositivos, precisa de banco de dados depois, como Supabase.

## Opção 1: GitHub Pages, grátis e durável

Arquivos já configurados:

- `.github/workflows/deploy-pages.yml`
- `vite.config.js` com `base: './'`
- `scripts/copy-404.mjs`

### Passo a passo

1. Crie uma conta no GitHub:

https://github.com

2. Crie um repositório público chamado:

```text
artist-release-hub
```

3. No terminal dentro desta pasta, rode:

```bash
git init
git add .
git commit -m "Publicar Artist Release Hub"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/artist-release-hub.git
git push -u origin main
```

Troque `SEU_USUARIO` pelo seu usuário do GitHub.

4. No GitHub, entre no repositório.

5. Vá em:

```text
Settings > Pages
```

6. Em **Build and deployment**, escolha:

```text
Source: GitHub Actions
```

7. Aguarde a aba **Actions** terminar.

8. O link final será parecido com:

```text
https://SEU_USUARIO.github.io/artist-release-hub/
```

## Opção 2: Cloudflare Pages, grátis e forte

Cloudflare Pages também é muito boa para longo prazo. O plano Free tem limites generosos para sites estáticos.

### Passo a passo

1. Suba o projeto no GitHub usando os passos acima.

2. Crie uma conta ou entre em:

https://dash.cloudflare.com

3. Vá em:

```text
Workers & Pages > Create > Pages > Connect to Git
```

4. Escolha o repositório `artist-release-hub`.

5. Configure:

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
```

6. Clique em deploy.

O link final será algo como:

```text
https://artist-release-hub.pages.dev
```

## Opção 3: Vercel, grátis e simples

Arquivos já configurados:

- `vercel.json`
- `.vercelignore`

### Passo a passo

1. Suba o projeto no GitHub.
2. Entre em https://vercel.com.
3. Clique em **Add New Project**.
4. Importe o repositório.
5. Confira:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

6. Clique em deploy.

## Como testar antes de publicar

```bash
npm install
npm run build
npm run preview
```

## Melhor escolha para você agora

Se você quer grátis e com longevidade, eu iria de:

```text
GitHub Pages primeiro
Cloudflare Pages se quiser algo mais profissional depois
```

Quando quiser dados sincronizados entre celular e computador, a próxima fase é Supabase.
