# DESIGN.md — Direção Visual do Projeto

> Este arquivo é a "cara" do produto. Claude e qualquer plugin de design leem
> daqui a direção estética ANTES de escrever CSS. É o que impede o site de cair
> no visual genérico de IA. Ajuste a direção abaixo se quiser outra vibe — mas
> escolha UMA e comprometa-se com ela. O erro é não decidir.

---

## O produto

Site de streaming de filmes e séries. Público: quem quer descobrir e assistir
rápido, no sofá ou no celular. O trabalho de cada tela: **fazer o usuário
encontrar algo e dar play com o mínimo de atrito.**

## A direção estética escolhida: "Cinema noturno / marquee"

Comprometa-se com esta e execute com precisão. NÃO misture com outras vibes.

Referência mental: a sala de cinema no escuro, o letreiro (marquee) de neon, o
pôster como protagonista. O conteúdo (as capas) é colorido e vivo; a interface é
escura, quieta e sai da frente. A interface é o "teatro"; o filme é a "estrela".

Isto NÃO é: dashboard de SaaS, landing page de startup, três cards em linha com
ícones. É uma vitrine de cinema.

## Paleta (4–6 valores nomeados)

| Nome        | Hex        | Uso                                            |
|-------------|------------|------------------------------------------------|
| `ink`       | `#0B0B0F`  | fundo base (preto levemente azulado, não puro) |
| `velvet`    | `#15131C`  | superfícies elevadas (cards, painéis)          |
| `smoke`     | `#8A8699`  | texto secundário, metadados                    |
| `bone`      | `#F5F3EC`  | texto primário (branco quente, não #FFF puro)  |
| `marquee`   | `#FF3D5A`  | destaque de marca — o "neon" do letreiro       |
| `gold`      | `#E9B872`  | acento secundário raro (avaliações, selos)     |

Regras da paleta:
- Branco puro (#FFFFFF) e preto puro (#000000) são PROIBIDOS. Use `bone` e `ink`.
- `marquee` é o único acento vibrante. Use com moderação — botão de play, estado
  ativo, foco. Se estiver em todo lugar, perde o efeito de neon.
- Gradiente roxo/índigo (a digital clássica de IA) é PROIBIDO.
- Overlays sobre pôster: preto com opacidade, nunca cor.

## Tipografia (papéis distintos, pares deliberados)

- **Display** (títulos de seção, nome do título em destaque): uma serifada de alto
  contraste e caráter editorial — ex.: **Fraunces**, **Playfair Display** ou
  **Bodoni Moda**. Evoca cartaz de cinema. Usada com RESTRIÇÃO, em tamanhos
  grandes.
- **Body/UI** (navegação, metadados, botões): uma sem-serifa neutra de boa
  legibilidade — ex.: **Geist**, **Satoshi** ou **Söhne**. NÃO use Inter, Roboto,
  Arial nem Space Grotesk (são as digitais de IA).
- **Utility/data** (duração, ano, nota): mesma sem-serifa, peso menor, em
  `smoke`, tracking levemente aberto.

Escala de tipo com intenção: título de herói bem grande na display serifada,
corpo compacto. O contraste entre a serifada dramática e a sem-serifa quieta é
parte da identidade.

## Layout

- **Herói ≠ template.** Nada de "número grande + label pequeno + gradiente". O
  herói é um título em destaque ocupando a tela como um pôster de cinema: capa
  em alta, título na display serifada sobreposto, um botão `marquee` de play. É a
  vitrine, não um pitch.
- **Fileiras de descoberta** (estilo prateleira) com scroll horizontal e
  `scroll-snap`. Cada fileira tem um eyebrow curto ("Em alta", "Continue
  assistindo", "Porque você viu X").
- **Assimetria proposital.** O herói pode ser off-grid; as fileiras alinhadas.
  Quebra de grid onde faz sentido, não em tudo.
- Pôster mantém `aspect-[2/3]`; capa de destaque `aspect-video` ou `16/9`.

## Assinatura (o elemento memorável)

**O "marquee glow".** O item em foco (hover no desktop, item central no
carrossel mobile) ganha um leve halo/borda em `marquee`, como a luz de um
letreiro de neon caindo sobre o pôster. É o único efeito chamativo do site —
tudo ao redor fica quieto. Não espalhe glow em tudo; ele marca só o foco.

## Movimento (deliberado, não decorativo)

- Play/hover: escala sutil (1.03) + o marquee glow surgindo. Rápido (150–200ms).
- Fileiras: `scroll-snap`, sem animação de scroll customizada em JS.
- Transição de página/modal do player: fade curto no fundo escuro, como luzes
  baixando na sala. Um momento orquestrado vale mais que efeitos espalhados.
- Respeite `prefers-reduced-motion`: sem escala nem glow animado.

## Copy (voz da interface)

- Verbos ativos e diretos. Botão diz o que faz: "Assistir", não "Ver detalhes"
  quando a ação é dar play.
- Estados vazios convidam à ação: "Nada por aqui ainda. Explore os lançamentos."
- Erros do player não pedem desculpa e não são vagos: "Não foi possível carregar
  este título. Tente outro servidor." — em vez de "Ops! Algo deu errado."
- Sem texto de marketing vago ("a melhor experiência de streaming"). Nomeie o que
  a pessoa controla e reconhece.

## Piso de qualidade (sempre)

- Responsivo até mobile (o uso no celular é primário num site de streaming).
- Foco de teclado visível (`focus-visible` com borda `marquee`).
- `prefers-reduced-motion` respeitado.
- Contraste `bone`/`ink` e `smoke`/`velvet` ≥ 4.5:1 para texto.
- Nunca use label como placeholder; label sempre visível.
- Nunca bloqueie pinch-to-zoom no viewport.
