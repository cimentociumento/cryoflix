# Integração SuperEmbed - Correções e Melhorias

## 🔍 Problema Identificado

O erro "file not found" no player estava acontecendo porque:
1. A API do TMDb é apenas para **metadados** (título, sinopse, poster, etc.)
2. O **SuperEmbed** é responsável pelo **player** (reprodução de vídeo)
3. Estávamos usando URLs incorretas ou incompletas do SuperEmbed

## 📚 Documentação do SuperEmbed

Conforme a documentação oficial do SuperEmbed, existem 3 métodos:

### 1. Método Simples (URL Direta)
- **IMDB ID**: `https://multiembed.mov/?video_id=tt8385148`
- **TMDb ID**: `https://multiembed.mov/?video_id=522931&tmdb=1`
- Funciona em qualquer servidor, até Blogger
- Não precisa de arquivos extras

### 2. Método VIP (Recomendado)
- **IMDB ID**: `https://multiembed.mov/directstream.php?video_id=tt6791350`
- **TMDb ID**: `https://multiembed.mov/directstream.php?video_id=447365&tmdb=1`
- **Vantagens**:
  - Múltipla qualidade (qualidade seletor)
  - Streaming HLS rápido
  - Legendas integradas
  - Apenas 1 popup ad (ao invés de múltiplos)
- **Recomendado** quando IMDB ID está disponível

### 3. Método Avançado (PHP Proxy)
- Usa arquivo `se_player.php` local
- Faz proxy para `getsuperembed.link`
- Permite customização do player
- Requer servidor com PHP

## ✅ Correções Implementadas

### 1. SuperEmbedAdapter.ts

**Antes**: Usava apenas método simples com URL direta
```typescript
const url = `${this.baseUrl}/?${params.toString()}`;
```

**Depois**: Usa método VIP quando IMDB ID disponível, fallback para simples
```typescript
// Se tem IMDB ID: usa VIP player (directstream.php)
if (normalizedImdbId) {
  return this.buildVipUrl(normalizedImdbId);
}
// Fallback: método simples com TMDb ID
return this.buildSimpleUrl(movieId);
```

**Melhorias**:
- ✅ Prioriza VIP player quando IMDB ID disponível
- ✅ Normaliza IMDB ID (aceita com ou sem 'tt')
- ✅ Constrói URLs corretas conforme documentação
- ✅ Logging para debug
- ✅ Timeout aumentado para 10s

### 2. UrlValidator.ts

**Antes**: Apenas 3 hosts permitidos
```typescript
const ALLOWED_HOSTS = ['multiembed.mov', 'superembed.org', 'multiembed.mov.to'];
```

**Depois**: Inclui `getsuperembed.link` (usado pelo se_player.php)
```typescript
const ALLOWED_HOSTS = [
  'multiembed.mov',
  'superembed.org',
  'multiembed.mov.to',
  'getsuperembed.link', // URL usada pelo se_player.php
];
```

### 3. Fluxo de Dados

**Fluxo Atualizado**:
1. Frontend solicita embed: `GET /api/player/:movieId/embed`
2. Backend busca filme no TMDb (se necessário) para obter IMDB ID
3. Backend constrói URL do SuperEmbed:
   - **Com IMDB ID**: `https://multiembed.mov/directstream.php?video_id=tt0137523` (VIP)
   - **Sem IMDB ID**: `https://multiembed.mov/?video_id=550&tmdb=1` (Simples)
4. Frontend recebe URL e coloca no iframe
5. SuperEmbed carrega o player

## 🎯 Estratégia de Uso

### Prioridade 1: VIP Player (quando IMDB ID disponível)
- Melhor experiência do usuário
- Múltipla qualidade
- Menos ads (apenas 1 popup)
- Streaming HLS rápido
- Legendas integradas

### Prioridade 2: Método Simples (fallback)
- Quando IMDB ID não está disponível
- Usa TMDb ID com `&tmdb=1`
- Funciona, mas com mais ads

## 📋 Formato de URLs

### IMDB ID
- Aceita: `tt0137523` ou `0137523`
- Normalizado para: `tt0137523`
- URL VIP: `https://multiembed.mov/directstream.php?video_id=tt0137523`
- URL Simples: `https://multiembed.mov/?video_id=tt0137523`

### TMDb ID
- Formato: número (ex: `550`)
- **Sempre** incluir `&tmdb=1`
- URL Simples: `https://multiembed.mov/?video_id=550&tmdb=1`
- URL VIP: `https://multiembed.mov/directstream.php?video_id=550&tmdb=1`

## 🔧 Configuração

### Variáveis de Ambiente
```env
SUPEREMBED_BASE_URL=https://multiembed.mov
```

### Arquivo se_player.php
O arquivo `se_player.php` está na raiz do backend, mas **não é necessário** para Node.js/Express.

O método VIP (`directstream.php`) oferece as mesmas vantagens sem precisar do PHP.

## 🐛 Troubleshooting

### Problema: "File not found" no player

**Possíveis causas**:
1. IMDB ID inválido ou não encontrado
2. TMDb ID não existe no SuperEmbed
3. URL malformada
4. Timeout da requisição

**Soluções**:
1. Verificar se IMDB ID está sendo buscado corretamente do TMDb
2. Verificar logs do backend para ver URL gerada
3. Testar URL diretamente no navegador
4. Verificar se filme existe no SuperEmbed

### Problema: Player não carrega

**Soluções**:
1. Verificar console do navegador para erros
2. Verificar se URL está sendo gerada corretamente
3. Testar URL diretamente: `https://multiembed.mov/directstream.php?video_id=tt0137523`
4. Verificar se há bloqueadores de ads interferindo

## ✅ Resultado Esperado

Após as correções:
- ✅ Player carrega corretamente
- ✅ VIP player usado quando IMDB ID disponível
- ✅ Fallback para método simples quando necessário
- ✅ Menos ads (apenas 1 popup no VIP player)
- ✅ Melhor qualidade de streaming
- ✅ Legendas integradas (no VIP player)

## 📊 Comparação de Métodos

| Método | Qualidade | Ads | Legendas | Requer IMDB ID |
|--------|-----------|-----|----------|----------------|
| Simples | Variável | Múltiplos | Limitadas | Não |
| VIP | Múltipla | 1 popup | Integradas | Recomendado |
| PHP Proxy | Múltipla | 1 popup | Integradas | Recomendado |

## 🎯 Próximos Passos

1. ✅ Implementado: VIP player quando IMDB ID disponível
2. ✅ Implementado: Fallback para método simples
3. ✅ Implementado: Normalização de IMDB ID
4. ✅ Implementado: Logging para debug
5. ⚠️ Opcional: Implementar proxy Node.js equivalente ao se_player.php (não necessário, VIP já oferece as vantagens)

---

**Conclusão**: A integração agora usa o método VIP do SuperEmbed quando possível, oferecendo melhor experiência ao usuário com menos ads e melhor qualidade.

