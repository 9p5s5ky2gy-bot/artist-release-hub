# Artist Release Hub

Painel web em React + Vite para organizar artistas, músicas, lançamentos, pré-save, links e calendário automático de divulgação musical.

## O que funciona

- Dashboard com artistas, lançamentos, dias pendentes, dias concluídos e progresso geral.
- Cadastro, edição e exclusão de artistas.
- Cadastro, edição e exclusão de lançamentos.
- Geração automática de calendário de lançamento com pré-save, semana final e pós-lançamento.
- Checklist simplificado por dia com o botão **Dia concluído**.
- Orientações de conteúdo editáveis por dia.
- Página de links por lançamento.
- Exportação CSV.
- Login por e-mail/senha com Supabase.
- Dados salvos na nuvem quando o Supabase está configurado.
- Fallback para `localStorage` quando as variáveis do Supabase não existem.

## Rodar no computador

Instale as dependências:

```bash
npm install
```

Rode o app:

```bash
npm run dev
```

Abra o endereço mostrado no terminal, normalmente:

```text
http://localhost:5173
```

## Configurar Supabase

Leia o passo a passo completo em:

```text
SUPABASE_SETUP.md
```

Resumo:

1. Rode o SQL de `supabase/schema.sql` no **SQL Editor** do Supabase.
2. Configure as variáveis no `.env.local`.
3. Crie conta no app usando e-mail e senha.
4. Publique no GitHub Pages usando os secrets `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Gerar versão de produção

```bash
npm run build
```

Para testar a versão final:

```bash
npm run preview
```

## Onde editar

- Calendário automático: `src/data/calendarTemplate.js`
- Lógica principal do app: `src/App.jsx`
- Login Supabase: `src/hooks/useSupabaseAuth.js`
- Salvamento em nuvem: `src/lib/workspaceStore.js`
- Cliente Supabase: `src/lib/supabaseClient.js`
- Visual geral: `src/styles/global.css`
- Banco/RLS: `supabase/schema.sql`
- Deploy GitHub Pages: `.github/workflows/deploy-pages.yml`

## Próximas evoluções

- Upload real de capa da música.
- Exportação PDF.
- Notificações.
- Modelos diferentes de calendário.
- Separação por clientes/artistas.
- Tabelas normalizadas no Supabase para relatórios avançados.
