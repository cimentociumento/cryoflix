---
name: anti-slop-design
description: >
  Invoque SEMPRE ao criar, redesenhar ou repaginar qualquer tela, página,
  componente visual, hero, layout, ou ao escolher cores, fontes e espaçamentos.
  Impõe a direção estética do DESIGN.md e bloqueia as "digitais" de design
  gerado por IA (fontes de sistema, gradiente roxo, três cards genéricos, etc.).
  Complementa o plugin oficial frontend-design.
---

# Anti-slop: tirar a cara de IA

A "cara de IA" é uma assinatura estatística, não um estilo. Sua função é forçar
uma decisão estética ANTES de escrever CSS, seguindo o `DESIGN.md` do projeto.

## Passo 1 — Leia a direção antes de codar

SEMPRE leia `DESIGN.md` na raiz do projeto primeiro. Toda cor, fonte e decisão de
layout deriva de lá. Se o `DESIGN.md` não existir, pare e crie um com uma direção
comprometida (não genérica) antes de gerar qualquer tela.

## Passo 2 — Lista de PROIBIÇÕES (as digitais de IA)

Nunca gere, a menos que o DESIGN.md peça explicitamente:

- **Fontes:** Inter, Roboto, Arial, fontes de sistema, e Space Grotesk (o
  "anti-Inter" que a IA converge). Use as fontes nomeadas no DESIGN.md.
- **Gradiente roxo/índigo/violeta** sobre branco — a digital nº 1 de IA.
- **Branco puro #FFF / preto puro #000.** Use os tons quentes do DESIGN.md.
- **Três cards em linha com ícone + título + parágrafo.** É o layout template.
- **Border-radius uniforme em tudo** e **sombras em 0.1 de opacidade.**
- **Herói template:** "número grande + label pequeno + acento em gradiente".
- **Marcadores numerados 01/02/03** a menos que o conteúdo seja de fato uma
  sequência (processo, timeline). Não decore com eles.
- **Copy de marketing vaga:** "a melhor experiência", "em um mundo cada vez mais".

## Passo 3 — Comprometa-se com a direção

Antes de escrever CSS, confirme em uma frase: qual é a vibe (do DESIGN.md), qual
é o elemento-assinatura desta tela, e onde vai o único momento de ousadia. Gaste
sua ousadia em UM lugar; mantenha o resto quieto e disciplinado. Antes de
finalizar, "tire um acessório": corte a decoração que não serve ao brief.

## Passo 4 — Auto-crítica (rode antes de entregar)

Pergunte-se: "se eu recebesse um prompt genérico de 'site de streaming', eu
chegaria neste mesmo resultado?". Se sim, a tela está na média estatística —
revise o que estiver template. Variância proposital é o objetivo.

## Cuidados técnicos de CSS

- Cuidado com especificidade que se cancela (seletor por tipo `.section` vs por
  elemento). Isso acontece muito em paddings/margins entre seções.
- Não misture CSS vanilla e Tailwind estilizando a mesma propriedade.

## Checklist final

- [ ] Li o DESIGN.md e derivei cores/fontes de lá
- [ ] Nenhuma fonte proibida; nenhum gradiente roxo; sem branco/preto puro
- [ ] O herói NÃO é o template "número grande + gradiente"
- [ ] Existe UM elemento-assinatura; o resto está quieto
- [ ] Passei no teste "um prompt genérico chegaria aqui?" — e a resposta é não
- [ ] Piso de qualidade: responsivo, focus-visible, reduced-motion, label visível
```
