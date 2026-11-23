# CLAUDE.md — Projeto de Streaming (React + Express)

> Este arquivo é a fonte de verdade do projeto. Claude Code o lê no início de cada
> sessão. Mantenha-o curto e factual. Detalhes profundos vão nas skills em
> `.claude/skills/`, carregadas sob demanda.

## Sobre o projeto

Site de streaming de filmes e séries. Frontend em React (SPA), backend em Express
(API/BFF). O projeto está em fase de **repaginação visual** e **melhorias
estruturais** — trate mudanças como refatoração incremental de um codebase que já
está em produção, não como greenfield.

## Stack

- **Frontend:** React + TanStack Query (server state) + Context API (estado de UI/global leve)
- **Styling:** migrando de **CSS vanilla → Tailwind CSS**. Código novo usa Tailwind.
  Não reescreva CSS vanilla existente sem pedido explícito.
- **Backend:** Node.js + Express (serve a API e faz proxy/BFF)
- **Player de vídeo:** embed externo via `<iframe>` de terceiros
  (superflixhd) — filmes e séries carregados por IMDb ID. Tratado como fonte
  não confiável (ver skill `streaming-player`).

## Princípios de comportamento (leia antes de qualquer tarefa)

1. **Não presuma silenciosamente.** Se um requisito, contrato de dados ou
   convenção não está claro, PERGUNTE antes de codar. Suposição errada seguida
   em frente é o pior modo de falha.
2. **Mudança mínima.** Resolva o problema pedido e nada mais. Não refatore código
   ortogonal, não "melhore de passagem" arquivos que a tarefa não pediu.
3. **Sem over-engineering.** Prefira a solução de 50 linhas à de 500. Não
   introduza abstração, lib ou padrão novo sem justificativa clara.
4. **CSS antes de JS.** Para layout, animação e transição, resolva com CSS/Tailwind
   antes de alcançar JavaScript (ver skill `css-first-tailwind`).
5. **Verifique versões reais.** Antes de usar API de lib, confirme a versão no
   `package.json`. Não use métodos deprecados. (Context7 ajuda aqui.)

## Regras de estado

- **Dado de servidor** (catálogo, detalhes de título, busca) → SEMPRE TanStack Query.
  Nunca guarde resposta de API em `useState`/Context manualmente.
- **Estado de UI global** (tema, modal aberto, usuário logado) → Context API.
- Não crie um novo Context sem necessidade; prefira compor query + estado local.
- Use `queryKey` estruturada e estável. Configure `staleTime` conscientemente —
  catálogo muda pouco, então cache agressivo é desejável.

## Estrutura de pastas (ajuste conforme o repo real)

```
src/
  components/    # componentes de UI reutilizáveis
  features/      # domínios (catalog, player, search, auth)
  hooks/         # hooks compartilhados (inclui hooks de query)
  lib/           # api client, helpers
  context/       # providers de Context
server/          # Express (rotas, middlewares, proxy)
```

## Convenções

- Componentes: **named exports**, um componente por arquivo, PascalCase.
- Hooks de query em `hooks/queries/` com prefixo `use` (ex.: `useMovie`, `useSearch`).
- Chamadas de API centralizadas em `lib/api.ts` — componentes não usam `fetch` direto.
- Nunca exponha chaves/segredos no bundle do frontend. Segredo fica no Express.

## Definition of Done

- [ ] Compila sem erros de tipo/lint
- [ ] Sem `console.log` esquecido
- [ ] Dado de servidor via TanStack Query, não estado manual
- [ ] Componente novo estilizado com Tailwind (não CSS vanilla novo)
- [ ] Iframe de player segue a skill `streaming-player` (sandbox + referrerPolicy)
- [ ] Sem segredo vazando para o cliente
