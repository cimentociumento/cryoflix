# CryoFlix — Modelo Conceitual (visão completa)

Este documento descreve **como o “banco de dados” funciona atualmente** (persistência em memória) e apresenta um **modelo conceitual visual** (ER) considerando **todo o projeto** (módulos do backend).

## Como a persistência funciona hoje (estado atual)

- **Persistência em memória**: o backend usa `InMemoryDatabase` com `Map`s para guardar registros de usuários, vídeos, assinaturas e progresso.
- **Histórico de conta**:
  - O `UserRecord` possui `history: [{ videoId, watchedAt, progress }]`.
  - O progresso de filmes (TMDb) é persistido em `watchProgress` (chave `${userId}:${movieId}`) via `PlayerRepository.saveProgress`.
  - Ao salvar progresso, o sistema **atualiza `users[userId].history`** (para alimentar “continue watching” no frontend).
- **Streaming (sessões)**:
  - O módulo `streaming` mantém sessões em um `Map` interno do `StreamingService` (não persiste no “banco”).
  - O endpoint `/api/streaming/playback/:videoId` cria uma sessão e devolve URLs (manifest, licença, stream).

## Modelo Conceitual (ER) — visual (Mermaid)

> Cole este bloco em qualquer visualizador Mermaid.

```mermaid
erDiagram
    USER ||--o{ USER_PREFERENCE : "tem"
    USER ||--o{ WATCH_HISTORY : "registra"
    USER ||--o{ WATCH_PROGRESS : "mantém"
    USER ||--o{ SUBSCRIPTION : "assina"
    USER ||--o{ PAYMENT : "paga"
    USER ||--o{ NOTIFICATION : "recebe"
    USER ||--o{ ANALYTICS_EVENT : "gera"

    MOVIE ||--o{ WATCH_PROGRESS : "tem progresso"
    MOVIE ||--o{ WATCH_HISTORY : "aparece no histórico"
    MOVIE ||--o{ SUBTITLE : "possui"
    MOVIE ||--o{ RECOMMENDATION_EDGE : "origem"
    MOVIE ||--o{ ANALYTICS_EVENT : "relaciona"

    CONTENT_ITEM ||--o{ UPLOAD_JOB : "origina"
    CONTENT_ITEM ||--o{ TRANSCODING_JOB : "gera"
    CONTENT_ITEM ||--o{ STREAM_ASSET : "publica"

    STREAM_ASSET ||--o{ PLAYBACK_SESSION : "serve"

    RECOMMENDATION_EDGE }o--|| MOVIE : "destino"

    USER {
      string id
      string email
      string password_hash
      string name
      string[] roles
      datetime created_at
      datetime updated_at
    }

    USER_PREFERENCE {
      string user_id
      json preferences
      datetime updated_at
    }

    MOVIE {
      int tmdb_id
      string imdb_id
      string title
      string overview
      date release_date
      string poster_url
      string backdrop_url
      float vote_average
    }

    WATCH_PROGRESS {
      string user_id
      int movie_tmdb_id
      float progress_0_1
      datetime updated_at
    }

    WATCH_HISTORY {
      string id
      string user_id
      string video_id   %% no projeto atual: string (ex: "550" p/ TMDb)
      float progress_0_1
      datetime watched_at
    }

    SUBTITLE {
      string id
      int movie_tmdb_id
      string language
      string format
      int download_count
      bool is_high_quality
      string file_ref
      datetime created_at
    }

    SUBSCRIPTION {
      string id
      string user_id
      string plan
      string status
      datetime renews_at
    }

    PAYMENT {
      string id
      string user_id
      float amount
      string currency
      string provider
      string status
      datetime created_at
      datetime updated_at
    }

    NOTIFICATION {
      string id
      string user_id
      string type
      string title
      string message
      bool is_read
      datetime created_at
    }

    ANALYTICS_EVENT {
      string id
      string user_id
      int movie_tmdb_id
      string event_type
      json metadata
      datetime created_at
    }

    RECOMMENDATION_EDGE {
      string id
      int source_movie_tmdb_id
      int target_movie_tmdb_id
      float score
      string reason
    }

    CONTENT_ITEM {
      string id
      string title
      string description
      string[] categories
      string status
      int duration_seconds
    }

    UPLOAD_JOB {
      string id
      string content_item_id
      string status
      string signed_url
      datetime created_at
    }

    TRANSCODING_JOB {
      string id
      string content_item_id
      string status
      json profiles
      datetime created_at
      datetime updated_at
    }

    STREAM_ASSET {
      string id
      string content_item_id
      string manifest_url
      string mp4_fallback_url
      string drm_license_url
      datetime created_at
    }

    PLAYBACK_SESSION {
      string id
      string user_id
      string stream_asset_id
      datetime last_heartbeat
    }
```

## Observações de alinhamento com o código atual

- **No estado atual do projeto**, `WATCH_PROGRESS` existe de forma concreta no `InMemoryDatabase.watchProgress`.
- **`WATCH_HISTORY` existe dentro do registro de usuário** (`UserRecord.history`) e agora é atualizado ao salvar progresso no player.
- **Streaming sessions** hoje estão só em memória no `StreamingService` (não em `InMemoryDatabase`), mas aparecem no modelo para representar o comportamento do domínio.

