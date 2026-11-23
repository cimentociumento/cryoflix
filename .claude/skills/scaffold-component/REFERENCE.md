# REFERENCE — Design Tokens & Padrões Visuais

> Carregado sob demanda pela skill `scaffold-component`. Ajuste os valores para
> a identidade real do seu site de streaming.

## Paleta (sugestão base — tema dark, comum em streaming)

| Token            | Tailwind sugerido        | Uso                              |
|------------------|--------------------------|----------------------------------|
| Fundo principal  | `bg-neutral-950`         | body / shell                     |
| Superfície       | `bg-neutral-900`         | cards, painéis                   |
| Superfície hover | `bg-neutral-800`         | hover de card/linha              |
| Texto primário   | `text-neutral-50`        | títulos                          |
| Texto secundário | `text-neutral-400`       | metadados, legendas              |
| Destaque/marca   | `bg-red-600` / `text-red-500` | CTA "Assistir", ativo       |
| Borda sutil      | `border-white/10`        | divisórias                       |

> Defina a cor de marca real como `brand` no `tailwind.config` para não repetir
> `red-600` pelo código.

## Espaçamento e raio

- Raio padrão de card: `rounded-lg`. Botões: `rounded-md`. Avatares: `rounded-full`.
- Gap de grid de pôsteres: `gap-3` mobile, `gap-4` desktop.
- Poster mantém proporção `aspect-[2/3]`.

## Grid de catálogo (responsivo)

```tsx
<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5
                lg:grid-cols-6 xl:grid-cols-8">
  {items.map((m) => <MovieCard key={m.id} movie={m} />)}
</div>
```

## Tipografia

- Títulos de seção: `text-xl font-semibold tracking-tight`.
- Título de card: `text-sm font-medium`.
- Evite mais de dois pesos de fonte por tela.

## Acessibilidade (mínimo)

- Todo elemento clicável tem estado `focus-visible`.
- Contraste texto/fundo ≥ 4.5:1 para texto normal.
- `alt` descritivo em pôsteres; `aria-label` em botões só com ícone.
- Alvo de toque mínimo ~44px em mobile.

## Convenção de nomes de classe

Ordem recomendada nas classes Tailwind: layout → box → tipografia → cor → estado.
Ex.: `flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-neutral-800`.
