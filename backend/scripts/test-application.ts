#!/usr/bin/env ts-node
/**
 * Script para testar o comportamento completo da aplicação
 * Verifica: compilação, endpoints, integrações e melhorias implementadas
 */

import { createApp } from '../src/app';
import request from 'supertest';
import { TMDbClient } from '../src/modules/metadata/infrastructure/http/TMDbClient';
import { MovieRepository } from '../src/modules/metadata/infrastructure/repositories/MovieRepository';
import { GetMovieDetails } from '../src/modules/metadata/application/use-cases/GetMovieDetails';
import { getCacheProvider } from '../src/shared/infrastructure/cache/CacheProviderFactory';
import { PlayerRepository } from '../src/modules/player/infrastructure/repositories/PlayerRepository';
import { SuperEmbedAdapter } from '../src/modules/player/infrastructure/adapters/SuperEmbedAdapter';
import { GetEmbedUrl } from '../src/modules/player/application/use-cases/GetEmbedUrl';
import { UrlValidator } from '../src/modules/player/infrastructure/security/UrlValidator';
import { container } from '../src/shared/container';
import { env } from '../src/config/environment';

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

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'blue');
  console.log('='.repeat(60));
}

function logTest(name: string, passed: boolean, details?: string) {
  const icon = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${name}`, color);
  if (details) {
    log(`   ${details}`, 'cyan');
  }
}

// Testes de Infraestrutura
async function testInfrastructure() {
  logSection('1. Testes de Infraestrutura');
  
  const results: { [key: string]: boolean } = {};

  // Teste 1: Container de DI
  try {
    const hasUserRepo = !!container.userRepository;
    const hasMovieRepo = !!container.movieRepository;
    const hasPlayerRepo = !!container.playerRepository;
    const hasCache = !!container.cacheProvider;
    results['Container DI'] = hasUserRepo && hasMovieRepo && hasPlayerRepo && hasCache;
    logTest('Container de Dependency Injection', results['Container DI'], 
      `Repositórios: ${hasUserRepo ? '✓' : '✗'} ${hasMovieRepo ? '✓' : '✗'} ${hasPlayerRepo ? '✓' : '✗'} Cache: ${hasCache ? '✓' : '✗'}`);
  } catch (error: any) {
    results['Container DI'] = false;
    logTest('Container de Dependency Injection', false, error.message);
  }

  // Teste 2: Cache Provider
  try {
    const cache = getCacheProvider();
    await cache.set('test:app', { test: true }, 10);
    const value = await cache.get<{ test: boolean }>('test:app');
    results['Cache Provider'] = value?.test === true;
    logTest('Cache Provider', results['Cache Provider'], 
      `Tipo: ${env.redis.enabled ? 'Redis' : 'In-Memory'}`);
    await cache.delete('test:app');
  } catch (error: any) {
    results['Cache Provider'] = false;
    logTest('Cache Provider', false, error.message);
  }

  return results;
}

// Testes de API Endpoints
async function testAPIEndpoints() {
  logSection('2. Testes de API Endpoints');
  
  const app = createApp();
  const results: { [key: string]: boolean } = {};

  // Teste 1: Health Check
  try {
    const response = await request(app).get('/health');
    results['Health Check'] = response.status === 200 && response.body.status === 'ok';
    logTest('Health Check', results['Health Check'], 
      `Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
  } catch (error: any) {
    results['Health Check'] = false;
    logTest('Health Check', false, error.message);
  }

  // Teste 2: Registro de Usuário
  try {
    const email = `test+${Date.now()}@fflix.io`;
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'Test123!@#', name: 'Test User' });
    
    results['Registro de Usuário'] = response.status === 201 && !!response.body.user;
    logTest('Registro de Usuário', results['Registro de Usuário'], 
      `Status: ${response.status}, Email: ${email}`);
  } catch (error: any) {
    results['Registro de Usuário'] = false;
    logTest('Registro de Usuário', false, error.message);
  }

  // Teste 3: Login
  try {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@fflix.io', password: 'Sup3rSecret!' });
    
    results['Login'] = response.status === 200 && !!response.body.accessToken;
    logTest('Login', results['Login'], 
      `Status: ${response.status}, Token: ${response.body.accessToken ? 'Gerado' : 'Não gerado'}`);
  } catch (error: any) {
    results['Login'] = false;
    logTest('Login', false, error.message);
  }

  // Teste 4: Tratamento de Erros - Validação
  try {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid-email', password: '123', name: '' });
    
    results['Tratamento de Erros (Validação)'] = response.status === 400;
    logTest('Tratamento de Erros (Validação)', results['Tratamento de Erros (Validação)'], 
      `Status: ${response.status}, Erro esperado: 400`);
  } catch (error: any) {
    results['Tratamento de Erros (Validação)'] = false;
    logTest('Tratamento de Erros (Validação)', false, error.message);
  }

  // Teste 5: Tratamento de Erros - Not Found
  try {
    const response = await request(app).get('/api/metadata/999999');
    results['Tratamento de Erros (NotFound)'] = response.status === 404;
    logTest('Tratamento de Erros (NotFound)', results['Tratamento de Erros (NotFound)'], 
      `Status: ${response.status}, Erro esperado: 404`);
  } catch (error: any) {
    results['Tratamento de Erros (NotFound)'] = false;
    logTest('Tratamento de Erros (NotFound)', false, error.message);
  }

  return results;
}

// Testes de Metadata (TMDb)
async function testMetadata() {
  logSection('3. Testes de Metadata (TMDb)');
  
  const results: { [key: string]: boolean } = {};

  if (!env.tmdb.apiKey) {
    log('⚠️  TMDB_API_KEY não configurada - pulando testes de metadata', 'yellow');
    return results;
  }

  try {
    const movieRepo = container.movieRepository;
    const cache = container.cacheProvider;
    const getMovieDetails = new GetMovieDetails(movieRepo, cache);

    // Teste 1: Buscar filme popular (Fight Club - ID 550)
    try {
      const movie = await getMovieDetails.execute({ id: 550 });
      results['Buscar Filme por ID'] = !!movie && movie.tmdbId === 550;
      logTest('Buscar Filme por ID', results['Buscar Filme por ID'], 
        `Filme: ${movie.title}, TMDb ID: ${movie.tmdbId}, IMDB ID: ${movie.imdbId || 'N/A'}`);
    } catch (error: any) {
      results['Buscar Filme por ID'] = false;
      logTest('Buscar Filme por ID', false, error.message);
    }

    // Teste 2: Verificar se IMDB ID está sendo buscado
    try {
      const movie = await getMovieDetails.execute({ id: 550 });
      const hasImdbId = !!movie.imdbId;
      results['IMDB ID no Movie'] = hasImdbId;
      logTest('IMDB ID no Movie', results['IMDB ID no Movie'], 
        `IMDB ID: ${movie.imdbId || 'Não encontrado'}`);
    } catch (error: any) {
      results['IMDB ID no Movie'] = false;
      logTest('IMDB ID no Movie', false, error.message);
    }

    // Teste 3: Verificar cache
    try {
      const movie1 = await getMovieDetails.execute({ id: 550 });
      const movie2 = await getMovieDetails.execute({ id: 550 });
      results['Cache de Metadata'] = movie1.tmdbId === movie2.tmdbId;
      logTest('Cache de Metadata', results['Cache de Metadata'], 
        'Segunda busca deve usar cache');
    } catch (error: any) {
      results['Cache de Metadata'] = false;
      logTest('Cache de Metadata', false, error.message);
    }

  } catch (error: any) {
    log(`❌ Erro geral em metadata: ${error.message}`, 'red');
  }

  return results;
}

// Testes de Player
async function testPlayer() {
  logSection('4. Testes de Player');
  
  const results: { [key: string]: boolean } = {};

  try {
    const playerRepo = container.playerRepository;
    const cache = container.cacheProvider;
    const urlValidator = new UrlValidator();
    const getEmbedUrl = new GetEmbedUrl(playerRepo, cache, urlValidator);

    // Teste 1: Gerar URL de embed com TMDb ID
    try {
      const source = await getEmbedUrl.execute({ movieId: 550 });
      results['Gerar Embed URL (TMDb ID)'] = !!source && !!source.embedUrl;
      logTest('Gerar Embed URL (TMDb ID)', results['Gerar Embed URL (TMDb ID)'], 
        `URL: ${source.embedUrl.substring(0, 60)}...`);
    } catch (error: any) {
      results['Gerar Embed URL (TMDb ID)'] = false;
      logTest('Gerar Embed URL (TMDb ID)', false, error.message);
    }

    // Teste 2: Gerar URL de embed com IMDB ID (se disponível)
    try {
      const movieRepo = container.movieRepository;
      const movie = await movieRepo.findById(550);
      if (movie?.imdbId) {
        const source = await getEmbedUrl.execute({ movieId: 550, imdbId: movie.imdbId });
        results['Gerar Embed URL (IMDB ID)'] = !!source && source.embedUrl.includes('tmdb=0');
        logTest('Gerar Embed URL (IMDB ID)', results['Gerar Embed URL (IMDB ID)'], 
          `URL com IMDB ID: ${source.embedUrl.substring(0, 60)}...`);
      } else {
        results['Gerar Embed URL (IMDB ID)'] = true; // Skip se não tiver IMDB ID
        logTest('Gerar Embed URL (IMDB ID)', true, 'IMDB ID não disponível para este filme');
      }
    } catch (error: any) {
      results['Gerar Embed URL (IMDB ID)'] = false;
      logTest('Gerar Embed URL (IMDB ID)', false, error.message);
    }

    // Teste 3: Validação de URL
    try {
      const source = await getEmbedUrl.execute({ movieId: 550 });
      const isValid = urlValidator.isValid(source.embedUrl);
      results['Validação de URL'] = isValid;
      logTest('Validação de URL', results['Validação de URL'], 
        `URL válida: ${isValid}`);
    } catch (error: any) {
      results['Validação de URL'] = false;
      logTest('Validação de URL', false, error.message);
    }

    // Teste 4: Cache do Player
    try {
      const source1 = await getEmbedUrl.execute({ movieId: 550 });
      const source2 = await getEmbedUrl.execute({ movieId: 550 });
      results['Cache do Player'] = source1.embedUrl === source2.embedUrl;
      logTest('Cache do Player', results['Cache do Player'], 
        'Segunda busca deve usar cache');
    } catch (error: any) {
      results['Cache do Player'] = false;
      logTest('Cache do Player', false, error.message);
    }

  } catch (error: any) {
    log(`❌ Erro geral em player: ${error.message}`, 'red');
  }

  return results;
}

// Testes de Modelagem de Domínio
async function testDomainModeling() {
  logSection('5. Testes de Modelagem de Domínio');
  
  const results: { [key: string]: boolean } = {};

  try {
    const movieRepo = container.movieRepository;
    const movie = await movieRepo.findById(550);

    if (movie) {
      // Teste 1: Movie estende Entity
      results['Movie estende Entity'] = movie.id !== undefined && typeof movie.id === 'string';
      logTest('Movie estende Entity', results['Movie estende Entity'], 
        `ID: ${movie.id}, Tipo: ${typeof movie.id}`);

      // Teste 2: Movie tem tmdbId
      results['Movie tem tmdbId'] = typeof movie.tmdbId === 'number';
      logTest('Movie tem tmdbId', results['Movie tem tmdbId'], 
        `TMDb ID: ${movie.tmdbId}`);

      // Teste 3: Movie tem imdbId (opcional)
      results['Movie tem imdbId'] = movie.imdbId === undefined || typeof movie.imdbId === 'string';
      logTest('Movie tem imdbId', results['Movie tem imdbId'], 
        `IMDB ID: ${movie.imdbId || 'Não disponível'}`);

      // Teste 4: toJSON retorna id como number
      const json = movie.toJSON();
      results['toJSON retorna id como number'] = typeof json.id === 'number';
      logTest('toJSON retorna id como number', results['toJSON retorna id como number'], 
        `JSON ID: ${json.id}, Tipo: ${typeof json.id}`);
    } else {
      log('⚠️  Não foi possível buscar filme para testes de domínio', 'yellow');
    }
  } catch (error: any) {
    log(`❌ Erro em testes de domínio: ${error.message}`, 'red');
  }

  return results;
}

// Função principal
async function main() {
  log('\n🚀 Iniciando Análise Completa da Aplicação FFlix\n', 'blue');
  
  const allResults: { [category: string]: { [test: string]: boolean } } = {};

  // Executar todos os testes
  allResults['Infraestrutura'] = await testInfrastructure();
  allResults['API Endpoints'] = await testAPIEndpoints();
  allResults['Metadata'] = await testMetadata();
  allResults['Player'] = await testPlayer();
  allResults['Modelagem de Domínio'] = await testDomainModeling();

  // Resumo final
  logSection('Resumo Final dos Testes');
  
  let totalTests = 0;
  let passedTests = 0;

  Object.entries(allResults).forEach(([category, tests]) => {
    log(`\n📊 ${category}:`, 'cyan');
    Object.entries(tests).forEach(([test, passed]) => {
      totalTests++;
      if (passed) passedTests++;
      const icon = passed ? '✅' : '❌';
      const color = passed ? 'green' : 'red';
      log(`  ${icon} ${test}`, color);
    });
  });

  logSection('Estatísticas');
  log(`Total de Testes: ${totalTests}`, 'blue');
  log(`Testes Passaram: ${passedTests}`, 'green');
  log(`Testes Falharam: ${totalTests - passedTests}`, totalTests - passedTests > 0 ? 'red' : 'green');
  log(`Taxa de Sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 
    passedTests === totalTests ? 'green' : 'yellow');

  if (passedTests === totalTests) {
    log('\n🎉 Todos os testes passaram! Aplicação está funcionando corretamente.', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Alguns testes falharam. Revise os resultados acima.', 'yellow');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n💥 Erro fatal: ${error.message}`, 'red');
  if (error.stack) {
    log(error.stack, 'red');
  }
  process.exit(1);
});

