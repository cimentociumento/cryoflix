#!/usr/bin/env ts-node
/**
 * Script para testar o fluxo completo: TMDb + SuperEmbed
 */

import { env } from '../src/config/environment';
import { TMDbClient } from '../src/modules/metadata/infrastructure/http/TMDbClient';
import { MovieRepository } from '../src/modules/metadata/infrastructure/repositories/MovieRepository';
import { GetMovieDetails } from '../src/modules/metadata/application/use-cases/GetMovieDetails';
import { getCacheProvider } from '../src/shared/infrastructure/cache/CacheProviderFactory';
import { SuperEmbedAdapter } from '../src/modules/player/infrastructure/adapters/SuperEmbedAdapter';
import { logger } from '../src/shared/utils/logger';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testCompleteFlow() {
  log('\n🔍 Testando Fluxo Completo: TMDb + SuperEmbed\n', 'blue');
  console.log('='.repeat(60));

  // Teste com filme conhecido: Fight Club (TMDb ID: 550, IMDB: tt0137523)
  const testMovieId = 550;

  try {
    // 1. Testar TMDb Client diretamente
    log('\n1. Testando TMDb Client:', 'cyan');
    const tmdbClient = new TMDbClient();
    const tmdbMovie = await tmdbClient.getMovieDetails(testMovieId);
    
    if (!tmdbMovie) {
      log('   ❌ Filme não encontrado no TMDb', 'red');
      return;
    }
    
    log(`   ✅ Filme encontrado: ${tmdbMovie.title}`, 'green');
    log(`   TMDb ID: ${tmdbMovie.id}`, 'yellow');
    log(`   IMDB ID: ${tmdbMovie.external_ids?.imdb_id || 'N/A'}`, 'yellow');
    log(`   Poster Path: ${tmdbMovie.poster_path || 'N/A'}`, 'yellow');
    log(`   Backdrop Path: ${tmdbMovie.backdrop_path || 'N/A'}`, 'yellow');
    
    // 2. Testar Movie Repository
    log('\n2. Testando Movie Repository:', 'cyan');
    const movieRepo = new MovieRepository(tmdbClient);
    const movie = await movieRepo.findById(testMovieId);
    
    if (!movie) {
      log('   ❌ Filme não encontrado no repositório', 'red');
      return;
    }
    
    log(`   ✅ Filme convertido: ${movie.title}`, 'green');
    log(`   IMDB ID: ${movie.imdbId || 'N/A'}`, 'yellow');
    log(`   Poster URL: ${movie.posterUrl || 'N/A'}`, 'yellow');
    
    // 3. Testar GetMovieDetails (com cache)
    log('\n3. Testando GetMovieDetails (com cache):', 'cyan');
    const cache = getCacheProvider();
    const getMovieDetails = new GetMovieDetails(movieRepo, cache);
    const movieDetails = await getMovieDetails.execute({ id: testMovieId });
    
    log(`   ✅ Filme obtido: ${movieDetails.title}`, 'green');
    log(`   IMDB ID: ${movieDetails.imdbId || 'N/A'}`, 'yellow');
    log(`   Poster URL: ${movieDetails.posterUrl || 'N/A'}`, 'yellow');
    const json = movieDetails.toJSON();
    log(`   JSON Poster URL: ${json.posterUrl || 'N/A'}`, 'yellow');
    
    // 4. Testar SuperEmbed
    log('\n4. Testando SuperEmbed:', 'cyan');
    const superEmbed = new SuperEmbedAdapter();
    
    // Com IMDB ID
    if (movieDetails.imdbId) {
      const embedUrlWithImdb = await superEmbed.getEmbedUrl(testMovieId, movieDetails.imdbId);
      log(`   ✅ URL com IMDB ID: ${embedUrlWithImdb}`, 'green');
    }
    
    // Sem IMDB ID (fallback)
    const embedUrlWithoutImdb = await superEmbed.getEmbedUrl(testMovieId);
    log(`   ✅ URL sem IMDB ID: ${embedUrlWithoutImdb}`, 'green');
    
    // 5. Verificar estrutura da resposta do TMDb
    log('\n5. Verificando estrutura da resposta TMDb:', 'cyan');
    log(`   Response tem external_ids: ${!!tmdbMovie.external_ids}`, 'yellow');
    if (tmdbMovie.external_ids) {
      log(`   external_ids.imdb_id: ${tmdbMovie.external_ids.imdb_id || 'null'}`, 'yellow');
    }
    log(`   Response tem poster_path: ${!!tmdbMovie.poster_path}`, 'yellow');
    log(`   poster_path valor: ${tmdbMovie.poster_path || 'null'}`, 'yellow');
    
    // 6. Testar URLs de imagem
    log('\n6. Testando URLs de imagem:', 'cyan');
    if (movieDetails.posterPath) {
      const posterUrl = movieDetails.posterUrl;
      log(`   ✅ Poster URL gerada: ${posterUrl}`, 'green');
    } else {
      log('   ⚠️  Poster path é null - capa não disponível', 'yellow');
    }
    
    log('\n' + '='.repeat(60));
    log('✅ Teste completo finalizado\n', 'green');
    
  } catch (error: any) {
    log(`\n❌ Erro no teste: ${error.message}`, 'red');
    if (error.stack) {
      log(error.stack, 'red');
    }
  }
}

testCompleteFlow().catch((error) => {
  log(`\n💥 Erro fatal: ${error.message}`, 'red');
  process.exit(1);
});

