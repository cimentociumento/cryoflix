import { randomUUID } from 'crypto';
import request from 'supertest';
import { createApp } from '../../src/app';
import { container } from '../../src/shared/container';
import { SaveWatchProgress } from '../../src/modules/player/application/use-cases/SaveWatchProgress';
import type { IPlayerRepository } from '../../src/modules/player/domain/repositories/IPlayerRepository';

const app = createApp();
const password = 'TesteSeguro1!';

async function account() {
  const email = `progress-${randomUUID()}@example.test`;
  const registered = await request(app).post('/api/auth/register').send({ email, password, name: 'Pessoa de teste' });
  expect(registered.status).toBe(201);
  const user = await container.userRepository.findByEmail(email);
  const verified = await request(app).get('/api/auth/verify-email').query({ token: user?.emailVerifyToken });
  expect(verified.status).toBe(200);
  const login = await request(app).post('/api/auth/login').send({ email, password });
  expect(login.status).toBe(200);
  return { email, userId: user!.id, token: login.body.accessToken as string };
}

describe('Ponto de reprodução e histórico por usuário', () => {
  let owner: Awaited<ReturnType<typeof account>>;
  let other: Awaited<ReturnType<typeof account>>;

  beforeAll(async () => {
    owner = await account();
    other = await account();
  });

  it('salva segundos e progresso parcial, inclui no histórico e recupera após novo login', async () => {
    const saved = await request(app).post('/api/player/progress')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ movieId: 550, progress: 0.42, timestamp: 95 });
    expect(saved.status).toBe(200);

    const profile = await request(app).get('/api/users/me').set('Authorization', `Bearer ${owner.token}`);
    expect(profile.body.history).toEqual(expect.arrayContaining([
      expect.objectContaining({ videoId: '550', progress: 0.42, timestamp: 95 }),
    ]));

    const logout = await request(app).post('/api/auth/logout')
      .set('Authorization', `Bearer ${owner.token}`).send({});
    expect(logout.status).toBe(200);
    const login = await request(app).post('/api/auth/login').send({ email: owner.email, password });
    expect(login.status).toBe(200);
    owner.token = login.body.accessToken as string;
    const resumed = await request(app).get('/api/player/550/progress')
      .set('Authorization', `Bearer ${owner.token}`);
    expect(resumed.status).toBe(200);
    expect(resumed.body).toEqual(expect.objectContaining({ movieId: 550, progress: 0.42, timestamp: 95 }));
  });

  it('isola a posição por usuário e ignora userId forjado no corpo', async () => {
    const empty = await request(app).get('/api/player/550/progress')
      .set('Authorization', `Bearer ${other.token}`);
    expect(empty.body).toEqual({ movieId: 550, progress: 0, timestamp: 0 });
    const forged = await request(app).post('/api/player/progress')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ movieId: 550, progress: 0.1, timestamp: 20, userId: owner.userId });
    expect(forged.status).toBe(200);
    const unchanged = await request(app).get('/api/player/550/progress')
      .set('Authorization', `Bearer ${owner.token}`);
    expect(unchanged.body.timestamp).toBe(95);
    expect(unchanged.body.progress).toBe(0.42);
  });

  it.each([
    { movieId: 0, progress: 0.5, timestamp: 10 },
    { movieId: 550.5, progress: 0.5, timestamp: 10 },
    { movieId: 550, progress: 1.1, timestamp: 10 },
    { movieId: 550, progress: 0.5, timestamp: -1 },
    { movieId: 550, progress: 0.5, timestamp: 1.5 },
    { movieId: 550, progress: 0.5, timestamp: 2_147_483_648 },
    { movieId: 550, progress: 0.5, timestamp: 20, recordedAt: new Date(Date.now() + 300_000).toISOString() },
  ])('recusa valores inválidos sem substituir o ponto salvo: %j', async (body) => {
    const response = await request(app).post('/api/player/progress')
      .set('Authorization', `Bearer ${owner.token}`).send(body);
    expect(response.status).toBe(400);
    const saved = await request(app).get('/api/player/550/progress')
      .set('Authorization', `Bearer ${owner.token}`);
    expect(saved.body.timestamp).toBe(95);
  });

  it('exige autenticação para ler e gravar o ponto', async () => {
    const get = await request(app).get('/api/player/550/progress');
    const post = await request(app).post('/api/player/progress').send({ movieId: 550, progress: 0.2, timestamp: 5 });
    expect(get.status).toBe(401);
    expect(post.status).toBe(401);
  });

  it('ignora um evento antigo que chega depois do ponto mais recente', async () => {
    const recent = new Date(Date.now() - 1_000).toISOString();
    const older = new Date(Date.now() - 2_000).toISOString();
    const saved = await request(app).post('/api/player/progress')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ movieId: 680, progress: 0.5, timestamp: 900, recordedAt: recent });
    expect(saved.status).toBe(200);
    const delayed = await request(app).post('/api/player/progress')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ movieId: 680, progress: 0.1, timestamp: 250, recordedAt: older });
    expect(delayed.status).toBe(200);
    const actual = await request(app).get('/api/player/680/progress')
      .set('Authorization', `Bearer ${owner.token}`);
    expect(actual.body).toEqual(expect.objectContaining({ progress: 0.5, timestamp: 900 }));
  });

  it('atualiza a mesma entrada ao concluir e permite reiniciar o progresso', async () => {
    const completed = await request(app).post('/api/player/progress')
      .set('Authorization', `Bearer ${owner.token}`).send({ movieId: 550, progress: 1, timestamp: 200 });
    expect(completed.status).toBe(200);
    const profile = await request(app).get('/api/users/me').set('Authorization', `Bearer ${owner.token}`);
    const history = profile.body.history.filter((entry: { videoId: string }) => entry.videoId === '550');
    expect(history).toHaveLength(1);
    expect(history[0]).toEqual(expect.objectContaining({ progress: 1, timestamp: 200 }));

    const restarted = await request(app).post('/api/player/progress')
      .set('Authorization', `Bearer ${owner.token}`).send({ movieId: 550, progress: 0, timestamp: 0 });
    expect(restarted.status).toBe(200);
    const empty = await request(app).get('/api/users/me').set('Authorization', `Bearer ${owner.token}`);
    expect(empty.body.history.some((entry: { videoId: string }) => entry.videoId === '550')).toBe(false);
  });
});

describe('Validação do caso de uso fora do controller', () => {
  it('recusa progresso não finito antes de chamar o repositório', async () => {
    const saveProgress = jest.fn();
    const useCase = new SaveWatchProgress({ saveProgress } as unknown as IPlayerRepository);
    await expect(useCase.execute({ movieId: 550, userId: 'pessoa', progress: Number.NaN, timestamp: 20 })).rejects.toThrow('Progresso deve estar entre 0 e 1');
    expect(saveProgress).not.toHaveBeenCalled();
  });
});
