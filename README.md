# Artist Release Hub

Painel web em React + Vite para organizar artistas, músicas, lançamentos, pré-save, tarefas de divulgação, links e calendário automático.

## O que já funciona

- Dashboard com artistas, lançamentos ativos, próximos lançamentos, tarefas pendentes, tarefas de hoje, atrasadas e finalizadas.
- Cadastro, edição e exclusão de artistas.
- Cadastro, edição e exclusão de lançamentos.
- Geração automática de calendário a partir da data de lançamento.
- Tarefas com título, descrição, tipo, data, status, prioridade, observação e link.
- Filtros por artista, lançamento, status, tipo, data e prioridade.
- Calendário visual, tabela de tarefas e página centralizada de links.
- Exportação das tarefas em CSV.
- Dados salvos no `localStorage` do navegador.

## Instalação

Instale o Node.js LTS no computador e rode:

```bash
npm install
```

## Rodar no computador

```bash
npm run dev
```

Depois abra o endereço mostrado no terminal, normalmente:

```text
http://localhost:5173
```

## Gerar versão de produção

```bash
npm run build
```

Para testar a versão final:

```bash
npm run preview
```

## Onde editar informações

- Calendário automático: `src/data/calendarTemplate.js`
- Status, tipos e prioridades: `src/data/calendarTemplate.js`
- Visual geral: `src/styles/global.css`
- Lógica de localStorage, salvar e exportar: `src/App.jsx`
- CSV: `src/utils/csv.js`

Os artistas, lançamentos e tarefas cadastrados pelo painel ficam no navegador em `localStorage`. Ao trocar de navegador ou dispositivo, esses dados não acompanham o app até entrar um banco como Supabase.

## Publicar online

Opção simples com Vercel:

1. Suba este projeto para um repositório no GitHub.
2. Entre em https://vercel.com e importe o repositório.
3. Use as configurações padrão de Vite:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Publique e acesse pelo link gerado.

## Próximas evoluções preparadas

- Login.
- Banco de dados Supabase.
- Deploy na Vercel.
- Exportação em PDF.
- Upload real de capa da música.
- Notificações.
- Modelos diferentes de calendário.
- Painel para vários clientes/artistas.
