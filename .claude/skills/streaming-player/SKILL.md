---
name: streaming-player
description: >
  Invoque ao trabalhar no player de vídeo, na incorporação (embed) de filmes ou
  séries, no componente que renderiza o <iframe> do provedor externo, ou ao
  montar a URL de embed a partir do IMDb ID. Impõe injeção SEGURA de iframe de
  terceiros (sandbox, referrerPolicy, allow), sanitização do ID e tratamento de
  erro/loading do player.
---

# Player via iframe embed (terceiros)

O conteúdo é carregado de um provedor externo por `<iframe>`, usando o IMDb ID:

- Filmes: `https://superflixhd.epizy.com/embed-2/?type=movies&imdb={imdbId}`
- Séries: `https://superflixhd.epizy.com/embed-2/?type=tvshows&imdb={imdbId}`

Como é conteúdo de terceiros dentro do seu site, ele é **fonte não confiável**.
Trate a incorporação com cuidado de segurança.

## Regras obrigatórias

1. **Sanitize o IMDb ID** antes de montar a URL. Nunca interpole entrada crua.
2. **Sempre** use `sandbox` no iframe, liberando só o necessário.
3. Use `referrerPolicy="no-referrer"` para não vazar sua URL ao provedor.
4. Use `allow` mínimo (fullscreen, autoplay se necessário).
5. Nunca dê ao iframe `sandbox="allow-same-origin allow-scripts"` JUNTOS sem
   necessidade — essa combinação permite que ele escape do sandbox.
6. Trate estados de **loading** e **erro** (embed pode falhar/cair).

## Componente de referência

```tsx
// src/features/player/EmbedPlayer.tsx
import { useState } from "react";

const EMBED_BASE = "https://superflixhd.epizy.com/embed-2/";

type Kind = "movie" | "series";

function isValidImdbId(id: string): boolean {
  return /^tt\d{7,8}$/.test(id);
}

function buildEmbedUrl(imdbId: string, kind: Kind): string | null {
  if (!isValidImdbId(imdbId)) return null;
  const type = kind === "movie" ? "movies" : "tvshows";
  const params = new URLSearchParams({ type, imdb: imdbId });
  return `${EMBED_BASE}?${params.toString()}`;
}

interface EmbedPlayerProps {
  imdbId: string;
  kind: Kind;
  title?: string;
}

export function EmbedPlayer({ imdbId, kind, title }: EmbedPlayerProps) {
  const [loaded, setLoaded] = useState(false);
  const src = buildEmbedUrl(imdbId, kind);

  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center
                      rounded-lg bg-neutral-900 text-neutral-400">
        Conteúdo indisponível
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg
                    bg-black">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center
                        text-neutral-400">
          Carregando player…
        </div>
      )}
      <iframe
        src={src}
        title={title ?? "Player"}
        onLoad={() => setLoaded(true)}
        className="h-full w-full"
        allow="fullscreen; autoplay; encrypted-media"
        allowFullScreen
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-forms allow-presentation"
        loading="lazy"
      />
    </div>
  );
}
```

## Notas importantes

- Provedores gratuitos de embed são instáveis e podem exibir anúncios/popups
  dentro do próprio iframe — o `sandbox` acima ajuda a conter comportamento, mas
  não controla o que roda dentro do embed. Comunique isso ao decidir UX.
- Se o provedor mudar de domínio, atualize também o `frameSrc` da CSP na skill
  `api-security` — os dois precisam concordar.
- Não guarde a URL do embed em estado de servidor/TanStack Query; ela é derivada
  do ID, então calcule na hora com `buildEmbedUrl`.

## Checklist

- [ ] IMDb ID validado (`tt` + dígitos) antes de montar a URL
- [ ] URL montada com `URLSearchParams`, sem interpolação crua
- [ ] `sandbox` presente, sem `allow-same-origin`+`allow-scripts` juntos
- [ ] `referrerPolicy="no-referrer"`
- [ ] Estados de loading e erro tratados
- [ ] Domínio do embed bate com o `frameSrc` da CSP
