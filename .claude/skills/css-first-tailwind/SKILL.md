---
name: css-first-tailwind
description: >
  Invoque ao trabalhar em layout, animação, transição, hover, responsividade,
  tema, ou ao migrar CSS vanilla para Tailwind. Impõe a regra "CSS antes de JS":
  resolver com CSS/Tailwind antes de alcançar JavaScript. Também guia a migração
  incremental de CSS vanilla para Tailwind sem quebrar o que já existe.
---

# CSS-first + Migração para Tailwind

## Princípio central

Antes de escrever JS para algo visual, pergunte: "CSS resolve isso?". Muitas
soluções JS pesadas existem para problemas que CSS já resolve nativamente.

### Resolva com CSS, não JS

- Hover, focus, active → pseudo-classes (`hover:`, `focus-visible:`, `active:`).
- Mostrar/esconder em breakpoint → `hidden md:block`, não JS de largura de tela.
- Animação de entrada/loop → `transition`, `animate-*`, `@keyframes`, não libs de
  animação para casos simples.
- Sticky header, scroll snap (carrossel de pôsteres) → `position: sticky`,
  `scroll-snap-type`, não listener de scroll em JS.
- Aspect ratio de pôster → `aspect-[2/3]`, não cálculo em JS.
- Truncar texto → `truncate` / `line-clamp-2`, não slice de string.

### Quando JS é justificado

- Estado que depende de dado (playlist, favoritos).
- Interação complexa que CSS não expressa (drag, cálculo dinâmico real).
- Acessibilidade que exige `aria` dinâmico.

## Migração incremental (vanilla → Tailwind)

Regra de ouro: **não faça big-bang.** Migre por componente, quando já for mexer nele.

1. Código NOVO já nasce em Tailwind.
2. Ao editar um componente com CSS vanilla, migre só as classes que você tocar,
   deixando o resto funcionando. Não reescreva o arquivo `.css` inteiro sem pedido.
3. Extraia valores repetidos (cores, espaçamentos) para `tailwind.config` como
   tokens (`colors.brand`, etc.) antes de espalhar valores mágicos.
4. Para padrões repetidos, prefira um componente React reutilizável a `@apply`.
   Use `@apply` só para primitivas globais (ex.: `.btn` base).
5. Não deixe CSS vanilla e Tailwind estilizando a MESMA propriedade no mesmo
   elemento — isso gera conflito de especificidade. Escolha um.

## Setup de Tailwind (se ainda não instalado)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

`tailwind.config.js` — aponte o `content` para os arquivos do projeto e registre
a cor de marca:

```js
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { brand: { DEFAULT: "#e50914", dark: "#b20710" } },
    },
  },
  plugins: [],
};
```

## Checklist

- [ ] Tentei CSS/Tailwind antes de JS para o visual
- [ ] Não misturei vanilla + Tailwind na mesma propriedade/elemento
- [ ] Valores repetidos viraram tokens no config, não números mágicos
- [ ] Migração ficou restrita ao que a tarefa pediu
