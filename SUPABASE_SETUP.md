# Configurar nuvem com Supabase

O app agora suporta login por e-mail/senha e dados salvos na nuvem pelo Supabase.

## 1. Criar a tabela no Supabase

1. Abra o projeto no Supabase.
2. No menu lateral, clique em **SQL Editor**.
3. Clique em **New query**.
4. Abra o arquivo `supabase/schema.sql` deste projeto.
5. Copie todo o SQL e cole no Supabase.
6. Clique em **Run**.

Esse SQL cria a tabela `release_hub_workspaces` com RLS. Cada usuário só consegue ler e salvar os próprios dados.

## 2. Conferir o login por e-mail

1. No Supabase, vá em **Authentication**.
2. Entre em **Providers**.
3. Abra **Email**.
4. Deixe **Email provider** ativado.
5. Para testar mais rápido, você pode desativar **Confirm email**.

Se **Confirm email** ficar ativado, a pessoa precisa confirmar o e-mail antes de entrar.

## 3. Rodar no computador

O arquivo `.env.local` já foi criado neste computador com:

```text
VITE_SUPABASE_URL=https://jdqydenrxecchzhvanwe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_r_DHhkPpoyNyCvurlhqrJA_CgpU34vQ
```

Depois rode:

```bash
npm install
npm run dev
```

Abra o link que aparecer no terminal, normalmente:

```text
http://localhost:5173
```

## 4. Publicar no GitHub Pages com Supabase

No GitHub, entre no repositório:

```text
9p5s5ky2gy-bot/artist-release-hub
```

Depois faça:

1. Clique em **Settings**.
2. Clique em **Secrets and variables**.
3. Clique em **Actions**.
4. Clique em **New repository secret**.
5. Crie o secret:

```text
Name: VITE_SUPABASE_URL
Secret: https://jdqydenrxecchzhvanwe.supabase.co
```

6. Clique de novo em **New repository secret**.
7. Crie o segundo secret:

```text
Name: VITE_SUPABASE_PUBLISHABLE_KEY
Secret: sb_publishable_r_DHhkPpoyNyCvurlhqrJA_CgpU34vQ
```

8. Vá na aba **Actions**.
9. Abra **Deploy to GitHub Pages**.
10. Clique em **Run workflow**.

Quando terminar, o app fica em:

```text
https://9p5s5ky2gy-bot.github.io/artist-release-hub/
```

## 5. Como testar se a nuvem funcionou

1. Abra o app publicado.
2. Clique em **Criar conta**.
3. Cadastre e-mail e senha.
4. Cadastre um artista.
5. Cadastre um lançamento.
6. Marque um dia como **Dia concluído**.
7. Saia da conta.
8. Entre de novo no mesmo PC ou em outro dispositivo.

Se os dados aparecerem de novo, está salvo na nuvem.

## Importante

- Não use nem compartilhe a `service_role key`.
- A `publishable key` pode ser usada no frontend.
- A segurança dos dados vem do RLS no arquivo `supabase/schema.sql`.
- O app continua preparado para evoluir depois para upload de capa, vários clientes e tabelas separadas.
