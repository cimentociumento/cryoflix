---
name: pr-review
description: >
  Invoque ao revisar código, um diff, um pull request, ou quando o usuário pedir
  "revise", "review", "está bom pra mergear?". Faz revisão estruturada focada em
  performance de React, correção de TanStack Query, segurança da API Express e
  qualidade geral. Não reescreve o código — aponta problemas priorizados.
---

# Revisão de PR — Streaming (React + Express)

Revise por severidade. Reporte assim: **[BLOQUEADOR] / [IMPORTANTE] / [NIT]**,
arquivo:linha, o problema em uma frase, e a correção sugerida. Não reescreva tudo;
seja cirúrgico.

## 1. Performance React

- Re-render por referência nova a cada render: objeto/array/função inline passado
  como prop cria nova referência → re-render. Sugerir `useMemo`/`useCallback` só
  onde há custo real (não memoize tudo).
- Listas de catálogo: `key` estável (id, nunca índice). Considerar virtualização
  se a lista passa de ~100 itens.
- `img` de pôster sem `loading="lazy"` = desperdício de banda.
- Componente pesado montando sem `Suspense`/skeleton → travadas de UI.

## 2. TanStack Query

- Dado de servidor guardado em `useState`/Context em vez de `useQuery` = BLOQUEADOR.
- `queryKey` instável (objeto recriado, faltando dependência) → cache furado.
- Falta de `staleTime` em dado que muda pouco → refetch desnecessário.
- Mutations sem invalidar as queries afetadas → UI dessincronizada.
- `enabled` ausente quando o input pode ser vazio (ex.: imdbId undefined).

## 3. Segurança da API (Express)

- Segredo/chave de API no bundle do frontend = BLOQUEADOR. Tudo sensível fica no
  Express.
- Input de rota sem validação (params, query, body) → validar antes de usar.
- Proxy do Express repassando URL controlada pelo cliente sem allowlist → SSRF.
- Falta de rate limit em rotas de busca/proxy.
- Erros vazando stack trace/detalhes internos na resposta.
- CORS aberto (`*`) em rota que serve dado sensível.

## 4. Player / iframe (crítico neste projeto)

- `<iframe>` de embed externo SEM `sandbox` e `referrerPolicy` = BLOQUEADOR
  (ver skill `streaming-player`).
- IMDb ID interpolado na URL sem sanitização.

## 5. Qualidade geral

- `console.log` esquecido, código morto, `any` em TypeScript.
- Tratamento de erro ausente em chamada de rede (estado de erro na UI).
- CSS vanilla novo onde a convenção é Tailwind.

## Formato da saída

```
[BLOQUEADOR] server/proxy.ts:42 — URL do proxy vem direto de req.query sem
allowlist (SSRF). Restringir a domínios conhecidos antes do fetch.

[IMPORTANTE] features/catalog/Grid.tsx:18 — key={index} em lista que reordena.
Trocar por movie.id.

[NIT] MovieCard.tsx:9 — img sem loading="lazy".
```

Termine com um veredito curto: **Pronto pra merge / Precisa de ajustes / Bloqueado**.
