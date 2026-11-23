import { TMDbClient } from '../../src/modules/metadata/infrastructure/http/TMDbClient';
import { HttpClientError } from '../../src/shared/infrastructure/http/HttpClientError';

describe('TMDbClient: indisponibilidade e resposta válida', () => {
  const get = jest.fn();
  const client = new TMDbClient({ get: (url, config) => get(url, config) });

  beforeEach(() => get.mockReset());

  it.each([
    ['busca', (unconfigured: TMDbClient) => unconfigured.searchMovies('Matrix', 1)],
    ['detalhes', (unconfigured: TMDbClient) => unconfigured.getMovieDetails(550)],
    ['filmes em alta', (unconfigured: TMDbClient) => unconfigured.getTrending()],
    ['recomendações', (unconfigured: TMDbClient) => unconfigured.getRecommendations(550)],
  ])('informa indisponibilidade em %s quando a integração não está configurada', async (_label, execute) => {
    await expect(execute(new TMDbClient(null))).rejects.toMatchObject({ status: 503 });
  });

  it('preserva uma busca bem-sucedida sem resultados', async () => {
    get.mockResolvedValue({ results: [] });
    await expect(client.searchMovies('filme inexistente', 1)).resolves.toEqual([]);
  });

  it.each([undefined, 401, 403, 429, 500, 503])(
    'não transforma falha do provedor (%s) em uma lista vazia nem em erro de login',
    async (status) => {
      get.mockRejectedValue(new HttpClientError('Detalhe privado do provedor', status, { private: 'não expor' }));
      await expect(client.getTrending()).rejects.toMatchObject({
        status: 503,
        message: 'O serviço de filmes está indisponível. Tente novamente em instantes.',
        cause: undefined,
      });
    },
  );

  it('distingue um filme inexistente da indisponibilidade do provedor', async () => {
    get.mockRejectedValueOnce(new HttpClientError('Filme inexistente', 404));
    await expect(client.getMovieDetails(999999)).resolves.toBeNull();
    get.mockRejectedValueOnce(new HttpClientError('Tempo limite excedido'));
    await expect(client.getMovieDetails(999999)).rejects.toMatchObject({ status: 503 });
  });

  it.each([null, {}, { results: {} }, { results: [{ id: 1 }] }])(
    'rejeita uma resposta de listagem malformada em vez de anunciar lista vazia: %j',
    async (response) => {
      get.mockResolvedValue(response);
      await expect(client.getTrending()).rejects.toMatchObject({ status: 502 });
    },
  );

  it('rejeita detalhes de outro identificador', async () => {
    get.mockResolvedValue({ id: 680, title: 'Outro filme' });
    await expect(client.getMovieDetails(550)).rejects.toMatchObject({ status: 502 });
  });

  it('mantém os dados válidos do filme e converte gêneros retornados nos detalhes', async () => {
    get.mockResolvedValue({
      id: 550, title: 'Clube da Luta', genres: [{ id: 18 }], external_ids: { imdb_id: 'tt0137523' },
    });
    await expect(client.getMovieDetails(550)).resolves.toMatchObject({
      id: 550, title: 'Clube da Luta', overview: '', genre_ids: [18], external_ids: { imdb_id: 'tt0137523' },
    });
  });

  it('não transforma um 404 de recomendações em uma lista bem-sucedida', async () => {
    get.mockRejectedValue(new HttpClientError('Filme inexistente', 404));
    await expect(client.getRecommendations(999999)).rejects.toMatchObject({ status: 404 });
  });
});
