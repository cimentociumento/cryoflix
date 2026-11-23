# Pacote Anti-Slop — deixar o site sem "cara de IA"

A verdade primeiro: **nenhum plugin transforma sozinho um site em algo de "5 mil
reais".** O que tira a cara de IA é forçar uma DIREÇÃO estética comprometida antes
de gerar código. Este pacote faz exatamente isso.

## O que vem aqui

```
seu-projeto/
├── DESIGN.md                          # a "cara" do produto (direção comprometida)
└── .claude/skills/anti-slop-design/
    └── SKILL.md                       # força a direção e bloqueia digitais de IA
```

Copie os dois para a raiz do repo (junte com o setup anterior). O `DESIGN.md` fica
na raiz; a skill vai junto das outras em `.claude/skills/`.

## Por que a "cara de IA" acontece

O modelo foi treinado em milhares de páginas de marketing. Sem direção, ele
converge pro centro estatístico dessas páginas. A digital é sempre a mesma: Inter
ou fonte de sistema, gradiente roxo-índigo no hero, títulos gigantes com texto
vago, três cards em linha, border-radius uniforme, sombras em 0.1 de opacidade.
O `DESIGN.md` + a skill quebram isso forçando o Claude a se comprometer com uma
direção específica antes de escrever CSS.

## Plugins que de fato ajudam (do marketplace oficial)

```
/plugin install frontend-design@claude-plugins-official
```
O mais importante. É um arquivo markdown que força um framework de 4 perguntas
(propósito, tom, restrições, diferenciação) e um compromisso estético antes do
CSS. É o que eleva o piso do que o Claude gera. Auto-carrega em qualquer prompt
de frontend. Este pacote foi feito para trabalhar EM CIMA dele.

Também no diretório oficial de design, vale olhar:
- **Web typography** — pareamento de fontes, comprimento de linha, carregamento
  de web fonts. Ótimo para acertar a tipografia editorial do DESIGN.md.
- **UX audit / heurísticas (Nielsen)** — avaliação heurística priorizada por
  severidade.
- **Frontend design review (7 fases)** — review com WCAG 2.1 AA, teste responsivo
  e polish visual.

## Plugin de terceiros recomendado (open source)

**frontend-design-audit** (mistyhx) — revisa seu front-end contra 15 princípios de
usabilidade e corrige direto no código. Pega os erros que UI de IA comete: label
usada como placeholder que some ao digitar, viewport bloqueando pinch-to-zoom,
feedback via `alert()`. Funciona com React e aceita apontar para uma URL ao vivo
para gerar relatório.

```
/plugin marketplace add mistyhx/frontend-design-audit
```

> ⚠️ Segurança: plugins de terceiros podem ler arquivos, rodar comandos shell e
> se conectar a serviços externos. Antes de instalar qualquer um, cheque o
> mantenedor, as permissões, o código-fonte e as conexões externas. A Anthropic
> não controla nem garante plugins da comunidade. Trate cada um como uma
> dependência de dev que você revisaria antes de adicionar.

## MCP opcional para design

- **Figma MCP** — se você tiver (ou criar) um design no Figma, o Claude extrai
  tokens e gera código a partir dele. Fecha a lacuna entre design e código.

## Fluxo recomendado para repaginar

1. Ajuste o `DESIGN.md` até a direção ("Cinema noturno / marquee" ou a que você
   preferir) estar do seu gosto. Este arquivo faz a maior parte do trabalho.
2. Peça ao Claude para repaginar UMA tela por vez ("repagine a home seguindo o
   DESIGN.md"). A skill `anti-slop-design` entra sozinha.
3. Rode o `frontend-design-audit` na tela pronta para pegar problemas de
   usabilidade.
4. Itere em ajustes pontuais, não re-prompts do zero — é assim que se chega no
   acabamento "caro".

## Uma expectativa honesta

O `DESIGN.md` te dá uma base muito acima da média e sem cara de IA. O toque final
de "5 mil reais" costuma vir de: conteúdo real (capas boas, copy específica),
uma fonte licenciada bem escolhida, e 2–3 rodadas de polimento no detalhe
(espaçamento, timing de animação, hierarquia). A ferramenta te leva a 85%; os
últimos 15% são iteração com olho crítico.
