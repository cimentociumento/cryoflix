#!/usr/bin/env ts-node
/**
 * Script para testar integrações com APIs externas
 * Uso: npx ts-node scripts/test-integrations.ts
 */

import { env } from '../src/config/environment';
import { TMDbClient } from '../src/modules/metadata/infrastructure/http/TMDbClient';
import { SuperEmbedAdapter } from '../src/modules/player/infrastructure/adapters/SuperEmbedAdapter';
import { OpenSubtitlesAdapter } from '../src/modules/subtitle/infrastructure/adapters/OpenSubtitlesAdapter';
import { getCacheProvider } from '../src/shared/infrastructure/cache/CacheProviderFactory';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(50));
  log(title, 'blue');
  console.log('='.repeat(50));
}

async function testTMDb() {
  logSection('Testando TMDb API');

  if (!env.tmdb.apiKey) {
    log('❌ TMDB_API_KEY não configurada', 'red');
    return false;
  }

  try {
    const client = new TMDbClient();
    
    log('📡 Buscando filmes em trending...', 'yellow');
    const trending = await client.getTrending();
    log(`✅ Encontrados ${trending.results.length} filmes`, 'green');
    
    log('📡 Buscando "Inception"...', 'yellow');
    const search = await client.searchMovies('Inception', 1);
    log(`✅ Encontrados ${search.results.length} resultados`, 'green');
    
    if (search.results.length > 0) {
      const movie = search.results[0];
      log(`   Filme: ${movie.title} (${movie.release_date})`, 'green');
    }
    
    return true;
  } catch (error: any) {
    log(`❌ Erro: ${error.message}`, 'red');
    if (error.response?.status === 401) {
      log('   Verifique se TMDB_API_KEY está correta', 'yellow');
    }
    return false;
  }
}

async function testSuperEmbed() {
  logSection('Testando SuperEmbed');

  try {
    const adapter = new SuperEmbedAdapter();
    
    log('📡 Gerando URL de embed para filme ID 550 (Fight Club)...', 'yellow');
    const url = await adapter.getEmbedUrl(550);
    log(`✅ URL gerada: ${url}`, 'green');
    
    return true;
  } catch (error: any) {
    log(`❌ Erro: ${error.message}`, 'red');
    return false;
  }
}

async function testOpenSubtitles() {
  logSection('Testando OpenSubtitles API');

  if (!env.openSubtitles.apiKey) {
    log('❌ OPENSUBTITLES_API_KEY não configurada', 'red');
    return false;
  }

  try {
    const adapter = new OpenSubtitlesAdapter();
    
    log('📡 Buscando legendas PT-BR para filme ID 550...', 'yellow');
    const subtitles = await adapter.searchSubtitles({
      movieId: 550,
      language: 'pt-BR',
    });
    
    if (subtitles.length > 0) {
      log(`✅ Encontradas ${subtitles.length} legendas`, 'green');
      const best = subtitles[0];
      log(`   Melhor: ${best.language} - Downloads: ${best.downloadCount}`, 'green');
    } else {
      log('⚠️  Nenhuma legenda encontrada', 'yellow');
    }
    
    return true;
  } catch (error: any) {
    log(`❌ Erro: ${error.message}`, 'red');
    if (error.response?.status === 401) {
      log('   Verifique se OPENSUBTITLES_API_KEY está correta', 'yellow');
    }
    return false;
  }
}

async function testRedis() {
  logSection('Testando Redis Cache');

  if (!env.redis.enabled) {
    log('⚠️  Redis não está habilitado (REDIS_ENABLED=false)', 'yellow');
    log('   Usando cache em memória', 'yellow');
    return true;
  }

  try {
    const cache = getCacheProvider();
    
    log('📡 Testando set/get no cache...', 'yellow');
    await cache.set('test:key', { message: 'Hello Redis' }, 60);
    const value = await cache.get<{ message: string }>('test:key');
    
    if (value?.message === 'Hello Redis') {
      log('✅ Redis funcionando corretamente', 'green');
      await cache.delete('test:key');
      return true;
    } else {
      log('⚠️  Cache retornou valor inesperado', 'yellow');
      return false;
    }
  } catch (error: any) {
    log(`❌ Erro ao conectar Redis: ${error.message}`, 'red');
    log('   Verifique se Redis está rodando e as variáveis estão corretas', 'yellow');
    return false;
  }
}

async function main() {
  log('\n🚀 Iniciando testes de integração...\n', 'blue');
  
  const results = {
    tmdb: await testTMDb(),
    superEmbed: await testSuperEmbed(),
    openSubtitles: await testOpenSubtitles(),
    redis: await testRedis(),
  };

  logSection('Resumo dos Testes');
  
  Object.entries(results).forEach(([service, success]) => {
    const icon = success ? '✅' : '❌';
    const color = success ? 'green' : 'red';
    log(`${icon} ${service.toUpperCase()}: ${success ? 'OK' : 'FALHOU'}`, color);
  });

  const allPassed = Object.values(results).every((r) => r);
  
  if (allPassed) {
    log('\n🎉 Todos os testes passaram!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Alguns testes falharam. Verifique a configuração.', 'yellow');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n💥 Erro fatal: ${error.message}`, 'red');
  process.exit(1);
});

