---
name: scaffold-component
description: >
  SEMPRE invoque quando o usuário pedir para criar, scaffoldar ou gerar um
  componente React, uma página, ou um hook de query. Impõe as convenções do
  projeto (named exports, TanStack Query para dados de servidor, Context para
  estado de UI, Tailwind para styling). Use também ao revisar um componente novo
  para checar se segue essas convenções.
---

# Scaffold de Componente React

Gere componentes que já nascem no padrão do projeto. NÃO use padrões genéricos
de React (default export, useState para dados de servidor, CSS inline).

## Regras obrigatórias

1. **Named export**, um componente por arquivo, nome em PascalCase.
2. **Dado de servidor → TanStack Query.** Nunca `useState` + `fetch` para dado
   de API. Crie/consuma um hook de query dedicado.
3. **Estado de UI → Context ou `useState` local.** Nunca duplique dado de servidor
   no Context.
4. **Styling → Tailwind.** Sem CSS vanilla novo, sem estilo inline exceto valores
   dinâmicos calculados.
5. **Tipagem forte.** Props tipadas via `interface`/`type`. Sem `any`.
6. **Sem `fetch` direto** no componente — passe pelo `lib/api`.

## Estrutura de um componente

```tsx
// src/features/catalog/MovieCard.tsx
import { type Movie } from "@/lib/types";

interface MovieCardProps {
  movie: Movie;
  onSelect?: (id: string) => void;
}

export function MovieCard({ movie, onSelect }: MovieCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(movie.id)}
      className="group relative overflow-hidden rounded-lg bg-neutral-900
                 transition-transform duration-200 hover:scale-[1.03]
                 focus-visible:outline focus-visible:outline-2"
    >
      <img
        src={movie.poster}
        alt={movie.title}
        loading="lazy"
        className="aspect-[2/3] w-full object-cover"
      />
      <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 p-2
                       text-sm text-white">
        {movie.title}
      </span>
    </button>
  );
}
```

## Estrutura de um hook de query

```tsx
// src/hooks/queries/useMovie.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useMovie(imdbId: string) {
  return useQuery({
    queryKey: ["movie", imdbId],
    queryFn: () => api.getMovie(imdbId),
    staleTime: 1000 * 60 * 60, // catálogo muda pouco: cache 1h
    enabled: Boolean(imdbId),
  });
}
```

## Checklist antes de entregar

- [ ] Named export, PascalCase, um por arquivo
- [ ] Dado de servidor via `useQuery`, com `queryKey` estável e `staleTime`
- [ ] Props tipadas, sem `any`
- [ ] Tailwind, sem CSS vanilla novo
- [ ] `img` com `loading="lazy"` e `alt`
- [ ] Estados de foco/hover acessíveis (`focus-visible`)
- [ ] Sem `fetch` direto — usa `lib/api`

## Referência

Para o mapa de tokens de design, paleta e espaçamentos, veja `REFERENCE.md`
nesta mesma pasta.
