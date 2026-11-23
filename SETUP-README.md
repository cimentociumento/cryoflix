# Setup Claude Code — Site de Streaming (React + Express)

Este pacote contém a configuração pronta para o seu projeto: um `CLAUDE.md` na
raiz e 5 skills versionadas em `.claude/skills/`.

## O que vem aqui

```
seu-projeto/
├── CLAUDE.md                          # fonte de verdade do projeto
└── .claude/
    └── skills/
        ├── scaffold-component/        # gera componentes no padrão do projeto
        │   ├── SKILL.md
        │   └── REFERENCE.md           # design tokens (carregado sob demanda)
        ├── pr-review/SKILL.md         # revisão: perf React + segurança API
        ├── css-first-tailwind/SKILL.md# CSS antes de JS + migração p/ Tailwind
        ├── api-security/SKILL.md      # segurança do Express (proxy, CSP, etc.)
        └── streaming-player/SKILL.md  # iframe de embed seguro
```

## Instalação (arquivos)

1. Copie o `CLAUDE.md` para a **raiz** do seu repositório.
2. Copie a pasta `.claude/` para a **raiz** também.
3. Commite tudo — as skills são compartilháveis pelo git com o time.
4. Ajuste os pontos marcados como "ajuste conforme o repo real" (estrutura de
   pastas, paleta em `REFERENCE.md`, cor de marca).

As skills carregam sozinhas quando a tarefa bate com a `description`. Você também
pode chamar direto, ex.: pedir "scaffolde um componente de card" aciona
`scaffold-component`.

## Plugins recomendados (instale pelo Claude Code)

Rode `/plugin` no Claude Code e instale do marketplace oficial. Comece só com
estes — instalar tudo entope a janela de contexto e piora resultados.

```
/plugin marketplace add claude-plugins-official
/plugin install frontend-design@claude-plugins-official
/plugin install feature-dev@claude-plugins-official
```

- **frontend-design** — para a repaginação visual. Evita o "visual de IA
  genérico"; guia por propósito, tom, restrições e diferenciação.
- **feature-dev** — para as melhorias estruturais, com workflow de requisitos →
  exploração → arquitetura → implementação → testes → review.
- **Superpowers** (opcional) — TDD rígido, só se você quer travar qualidade por
  testes.
- **Karpathy skills** (opcional, recomendado) — CLAUDE.md de calibração que
  reduz suposições silenciosas e over-engineering. Não conflita com nada:
  `/plugin marketplace add forrestchang/andrej-karpathy-skills`

> ⚠️ Plugins de terceiros podem ler arquivos, rodar comandos e enviar dados
> externos. Verifique permissões/hooks antes de instalar. A Anthropic não
> controla o conteúdo de plugins da comunidade.

## MCP servers recomendados

Instale só o que seu fluxo usa — cada MCP carrega ferramentas no contexto.

- **Context7** — docs atualizadas e por versão de React/Express/libs. Corrige o
  Claude usar método deprecado.
- **Playwright** — Claude navega no app, clica e valida (ótimo p/ testar o player).
- **GitHub** — PRs e review integrados.

## Como usar no dia a dia

- Repaginar uma tela → `frontend-design` + `css-first-tailwind` fazem o trabalho.
- Criar componente/página → `scaffold-component` garante o padrão.
- Mexer no backend/proxy → `api-security` entra sozinha.
- Trabalhar no player → `streaming-player` entra sozinha.
- Antes de mergear → peça "revise este diff" e `pr-review` roda o checklist.
