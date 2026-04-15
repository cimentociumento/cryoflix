#!/usr/bin/env ts-node
/**
 * Script de diagnóstico para investigar problemas com TMDb API
 */

import { env } from '../src/config/environment';
import { TMDbClient } from '../src/modules/metadata/infrastructure/http/TMDbClient';
import { logger } from '../src/shared/utils/logger';

async function diagnoseTMDb() {
  console.log('\n🔍 Diagnóstico da Integração TMDb\n');
  console.log('='.repeat(60));

  // 1. Verificar configuração
  console.log('\n1. Verificando Configuração:');
  console.log(`   API Key configurada: ${env.tmdb.apiKey ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   Base URL: ${env.tmdb.baseUrl}`);
  if (env.tmdb.apiKey) {
    console.log(`   API Key (primeiros 10 chars): ${env.tmdb.apiKey.substring(0, 10)}...`);
  }

  // 2. Testar busca simples
  console.log('\n2. Testando Busca de Filmes:');
  try {
    const client = new TMDbClient();
    const results = await client.searchMovies('Batman', 1);
    console.log(`   ✅ Busca executada`);
    console.log(`   Resultados encontrados: ${results.length}`);
    if (results.length > 0) {
      console.log(`   Primeiro filme: ${results[0].title} (ID: ${results[0].id})`);
    } else {
      console.log('   ⚠️  Nenhum resultado retornado');
    }
  } catch (error: any) {
    console.log(`   ❌ Erro na busca: ${error.message}`);
    if (error.status) {
      console.log(`   Status HTTP: ${error.status}`);
    }
    if (error.cause) {
      console.log(`   Detalhes: ${JSON.stringify(error.cause, null, 2)}`);
    }
  }

  // 3. Testar trending
  console.log('\n3. Testando Trending:');
  try {
    const client = new TMDbClient();
    const results = await client.getTrending();
    console.log(`   ✅ Trending executado`);
    console.log(`   Resultados encontrados: ${results.length}`);
    if (results.length > 0) {
      console.log(`   Primeiro filme: ${results[0].title} (ID: ${results[0].id})`);
    } else {
      console.log('   ⚠️  Nenhum resultado retornado');
    }
  } catch (error: any) {
    console.log(`   ❌ Erro no trending: ${error.message}`);
    if (error.status) {
      console.log(`   Status HTTP: ${error.status}`);
    }
  }

  // 4. Testar detalhes de filme conhecido
  console.log('\n4. Testando Detalhes de Filme (ID 550 - Fight Club):');
  try {
    const client = new TMDbClient();
    const movie = await client.getMovieDetails(550);
    if (movie) {
      console.log(`   ✅ Filme encontrado: ${movie.title}`);
      console.log(`   TMDb ID: ${movie.id}`);
      console.log(`   IMDB ID: ${movie.external_ids?.imdb_id || 'Não disponível'}`);
      console.log(`   Overview: ${movie.overview.substring(0, 50)}...`);
    } else {
      console.log('   ❌ Filme não encontrado (retornou null)');
    }
  } catch (error: any) {
    console.log(`   ❌ Erro ao buscar detalhes: ${error.message}`);
    if (error.status) {
      console.log(`   Status HTTP: ${error.status}`);
      if (error.status === 404) {
        console.log('   ⚠️  Filme não existe no TMDb');
      } else if (error.status === 401) {
        console.log('   ⚠️  Problema de autenticação - verifique a API key');
      }
    }
  }

  // 5. Testar requisição HTTP direta
  console.log('\n5. Testando Requisição HTTP Direta:');
  if (env.tmdb.apiKey) {
    try {
      const axios = require('axios');
      const url = `${env.tmdb.baseUrl}/search/movie`;
      const response = await axios.get(url, {
        params: {
          api_key: env.tmdb.apiKey,
          query: 'Batman',
          page: 1,
        },
        timeout: 5000,
      });
      console.log(`   ✅ Requisição direta funcionou`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Resultados: ${response.data.results?.length || 0}`);
      if (response.data.results && response.data.results.length > 0) {
        console.log(`   Primeiro: ${response.data.results[0].title}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Erro na requisição direta: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  } else {
    console.log('   ⚠️  API key não configurada - pulando teste');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Diagnóstico concluído\n');
}

diagnoseTMDb().catch((error) => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
});

