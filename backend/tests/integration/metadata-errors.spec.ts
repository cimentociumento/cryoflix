import request from 'supertest';
import { createApp } from '../../src/app';
import { container } from '../../src/shared/container';
import { TMDbClient } from '../../src/modules/metadata/infrastructure/http/TMDbClient';
import { HttpClientError } from '../../src/shared/infrastructure/http/HttpClientError';

const app = createApp();
const movieId = 91234567;
const movie = { id: movieId, title: 'Filme para verificar integração', overview: 'Dados externos simulados' };
const upstreamGet = jest.fn();
const client = new TMDbClient({ get: (url, config) => upstreamGet(url, config) });

describe('API de filmes: falhas externas, 404 e recuperação', () => {
  beforeEach(async () => {
    upstreamGet.mockReset();
    jest.spyOn(container.tmdbClient, 'getMovieDetails').mockImplementation((id) => client.getMovieDetails(id));
    jest.spyOn(container.tmdbClient, 'searchMovies').mockImplementation((query, page) => client.searchMovies(query, page));
    jest.spyOn(container.tmdbClient, 'getTrending').mockImplementation(() => client.getTrending());
    jest.spyOn(container.tmdbClient, 'getRecommendations').mockImplementation((id) => client.getRecommendations(id));
    await Promise.all([
      container.cacheProvider.delete('metadata:trending'),
      container.cacheProvider.delete(`metadata:movie:${movieId}`),
      container.cacheProvider.delete('metadata:search:teste-de-erro:1'),
      container.cacheProvider.delete(`metadata:recommendations:${movieId}`),
    ]);
  });

  afterEach(() => jest.restoreAllMocks());

  it('retorna 404 para um identificador inexistente', async () => {
    upstreamGet.mockRejectedValue(new HttpClientError('Não existe', 404));
    const response = await request(app).get(`/api/metadata/${movieId}`);
    expect(response.status).toBe(404);
    expect(response.body.message).toContain('Filme');
  });

  it('retorna indisponibilidade, e não 404, quando a consulta de detalhes falha', async () => {
    upstreamGet.mockRejectedValue(new HttpClientError('Timeout externo'));
    const response = await request(app).get(`/api/metadata/${movieId}`);
    expect(response.status).toBe(503);
    expect(response.body.message).toContain('indisponível');
  });

  it('retorna 503 para uma busca indisponível sem expor detalhes externos', async () => {
    upstreamGet.mockRejectedValue(new HttpClientError('Detalhe privado', 500, { private: 'não expor' }));
    const response = await request(app).get('/api/metadata/search').query({ query: 'teste-de-erro' });
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ message: 'O serviço de filmes está indisponível. Tente novamente em instantes.' });
  });

  it('retorna 200 e lista vazia quando a busca realmente não encontra filmes', async () => {
    upstreamGet.mockResolvedValue({ results: [] });
    const response = await request(app).get('/api/metadata/search').query({ query: 'teste-de-erro' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('permite recuperar a consulta após uma falha e armazena apenas o resultado válido no cache', async () => {
    upstreamGet.mockRejectedValueOnce(new HttpClientError('Serviço indisponível', 503))
      .mockResolvedValueOnce({ results: [movie] });
    expect((await request(app).get('/api/metadata/trending')).status).toBe(503);
    const recovered = await request(app).get('/api/metadata/trending');
    expect(recovered.status).toBe(200);
    expect(recovered.body).toEqual([expect.objectContaining({ id: movieId, title: movie.title })]);
    const cached = await request(app).get('/api/metadata/trending');
    expect(cached.status).toBe(200);
    expect(cached.body).toEqual(recovered.body);
    expect(upstreamGet).toHaveBeenCalledTimes(2);
  });

  it('rejeita um cache com filme de outro identificador e consulta o identificador solicitado', async () => {
    await container.cacheProvider.set(`metadata:movie:${movieId}`, { tmdbId: 550, title: 'Filme errado' }, 60);
    upstreamGet.mockRejectedValue(new HttpClientError('Não existe', 404));
    const response = await request(app).get(`/api/metadata/${movieId}`);
    expect(response.status).toBe(404);
    expect(upstreamGet).toHaveBeenCalledWith(`/movie/${movieId}`, expect.any(Object));
  });

  it('retorna erro de integração para uma resposta malformada em vez de sucesso vazio', async () => {
    upstreamGet.mockResolvedValue({ unexpected: true });
    const response = await request(app).get('/api/metadata/trending');
    expect(response.status).toBe(502);
    expect(response.body.message).toContain('resposta inválida');
  });
});
