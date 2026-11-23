---
name: api-security
description: >
  Invoque SEMPRE que a mudança tocar o backend Express: rotas, middlewares,
  proxy, validação de input, autenticação, CORS, variáveis de ambiente, ou o
  fetch de dados externos (catálogo, IMDb). Impõe validação de input, allowlist
  de proxy, proteção de segredos e boas práticas de segurança de API.
---

# Segurança de API — Express (site de streaming)

Um site de streaming que faz proxy/BFF e injeta conteúdo externo tem superfície
de ataque relevante. Trate toda entrada como não confiável.

## 1. Segredos

- NENHUM segredo (API key de catálogo, token) no bundle do frontend. Fica em
  variável de ambiente lida só no Express.
- `.env` no `.gitignore`. Nunca commitar chave.
- O frontend chama o SEU Express; o Express chama o serviço externo com a chave.

## 2. Validação de input (toda rota)

Valide `params`, `query` e `body` antes de usar. Um IMDb ID, por exemplo, tem
formato previsível (`tt` + dígitos) — rejeite o que não bater.

```js
function isValidImdbId(id) {
  return /^tt\d{7,8}$/.test(id);
}

app.get("/api/movie/:imdbId", (req, res) => {
  const { imdbId } = req.params;
  if (!isValidImdbId(imdbId)) {
    return res.status(400).json({ error: "invalid id" });
  }
  // ... segue
});
```

## 3. Proxy seguro (anti-SSRF)

Se o Express faz proxy para serviços externos, NUNCA use URL vinda do cliente
diretamente. Use allowlist de domínios/rotas conhecidas.

```js
const ALLOWED_HOSTS = new Set(["api.themoviedb.org"]);

function safeUpstream(url) {
  const u = new URL(url);
  if (!ALLOWED_HOSTS.has(u.hostname)) throw new Error("host not allowed");
  return u.toString();
}
```

## 4. Cabeçalhos e CORS

- Use `helmet` para cabeçalhos seguros por padrão.
- CORS restrito à origem do seu frontend, não `*`, em rotas com dado sensível.
- Defina uma **Content-Security-Policy**. Como você injeta iframe externo, o
  `frame-src` precisa listar o domínio do embed — e só ele.

```js
import helmet from "helmet";
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      frameSrc: ["https://superflixhd.epizy.com"], // só o embed permitido
      imgSrc: ["'self'", "https:", "data:"],
    },
  })
);
```

## 5. Rate limiting

Rotas de busca e proxy são caras/abusáveis. Aplique limite.

```js
import rateLimit from "express-rate-limit";
app.use("/api/", rateLimit({ windowMs: 60_000, max: 60 }));
```

## 6. Tratamento de erro

- Não devolva stack trace nem detalhe interno ao cliente. Log detalhado no
  servidor, mensagem genérica na resposta.
- Middleware de erro central no fim da cadeia.

## Checklist

- [ ] Nenhum segredo no frontend; `.env` fora do git
- [ ] `params`/`query`/`body` validados antes do uso
- [ ] Proxy com allowlist de host (sem SSRF)
- [ ] `helmet` + CSP com `frameSrc` restrito ao embed
- [ ] CORS restrito à origem do frontend
- [ ] Rate limit em `/api/`
- [ ] Erros não vazam detalhes internos
