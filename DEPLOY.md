# Publicar o Artist Release Hub na nuvem

Este projeto está pronto para publicar na Vercel como um app React/Vite.

## Importante sobre os dados

Nesta versão, os dados ficam no `localStorage` do navegador.

Isso significa:

- O app publicado abre por link em qualquer dispositivo.
- Cada navegador terá seus próprios dados locais.
- Para sincronizar dados entre computador e celular, ou entre vários usuários, a próxima etapa é adicionar banco de dados, como Supabase.

## Opção recomendada: Vercel + GitHub

### 1. Criar uma conta

Crie ou acesse:

- GitHub: https://github.com
- Vercel: https://vercel.com

### 2. Subir o projeto para o GitHub

No GitHub, crie um repositório novo, por exemplo:

```text
artist-release-hub
```

Depois, no terminal dentro desta pasta do projeto, rode:

```bash
git init
git add .
git commit -m "Primeira versão do Artist Release Hub"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/artist-release-hub.git
git push -u origin main
```

Troque `SEU_USUARIO` pelo seu usuário do GitHub.

### 3. Importar na Vercel

1. Entre em https://vercel.com.
2. Clique em **Add New Project**.
3. Escolha o repositório `artist-release-hub`.
4. A Vercel deve detectar Vite automaticamente.
5. Confira as configurações:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

6. Clique em **Deploy**.

### 4. Abrir o link

Quando terminar, a Vercel vai gerar um link parecido com:

```text
https://artist-release-hub.vercel.app
```

Esse será o link para acessar o painel na nuvem.

## Opção alternativa: Vercel CLI

Se preferir publicar pelo terminal:

```bash
npm install
npm run build
npx vercel
```

Na primeira vez, a Vercel vai pedir login e algumas confirmações.

Para publicar em produção:

```bash
npx vercel --prod
```

## Arquivo de configuração criado

O arquivo `vercel.json` foi adicionado para garantir que o app React/Vite funcione como SPA. Isso evita erro ao abrir links internos diretamente.

## Como testar antes de publicar

```bash
npm install
npm run build
npm run preview
```

Se o preview abrir normalmente, o projeto está pronto para deploy.

## Próxima etapa para virar produto completo

Para vender para artistas ou usar em vários dispositivos com os mesmos dados, recomendo a próxima fase:

- login;
- Supabase;
- salvamento em banco;
- upload de capas;
- domínio personalizado;
- backups.
