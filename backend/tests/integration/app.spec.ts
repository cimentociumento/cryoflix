import request from 'supertest';
import { createApp } from '../../src/app';
import { container } from '../../src/shared/container';

const app = createApp();

async function registerVerifyLogin(label: string) {
  const email = `test+${label}+${Date.now()}@fflix.io`;
  const password = 'Sup3rSecret!';
  await request(app).post('/api/auth/register').send({ email, password, name: label });
  const registeredUser = await container.userRepository.findByEmail(email);
  await request(app)
    .get('/api/auth/verify-email')
    .query({ token: registeredUser?.emailVerifyToken });
  const loginResponse = await request(app).post('/api/auth/login').send({ email, password });
  return {
    accessToken: loginResponse.body.accessToken as string,
    userId: loginResponse.body.user.id as string,
  };
}

describe('FFlix API', () => {
  it('responds to health check', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ok',
      }),
    );
  });

  it('registers and authenticates a user', async () => {
    const email = `test+${Date.now()}@fflix.io`;
    const password = 'Sup3rSecret!';
    const name = 'Tester';

    const registerResponse = await request(app).post('/api/auth/register').send({ email, password, name });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user).toEqual(
      expect.objectContaining({
        email,
        name,
        roles: ['viewer'],
      }),
    );

    const registeredUser = await container.userRepository.findByEmail(email);
    const verifyToken = registeredUser?.emailVerifyToken;
    expect(verifyToken).toEqual(expect.any(String));

    const verifyResponse = await request(app)
      .get('/api/auth/verify-email')
      .query({ token: verifyToken });
    expect(verifyResponse.status).toBe(200);

    const loginResponse = await request(app).post('/api/auth/login').send({ email, password });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          email,
        }),
      }),
    );
  });

  it('lists catalog content', async () => {
    const response = await request(app).get('/api/content');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('rejects unauthenticated access to player embed', async () => {
    const response = await request(app).get('/api/player/123/embed');
    expect(response.status).toBe(401);
  });

  it('rejects a non-admin user creating content', async () => {
    const user = await registerVerifyLogin('content');

    const createResponse = await request(app)
      .post('/api/content')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: 'Filme de teste',
        description: 'Descrição com mais de dez caracteres',
        duration: 120,
      });

    expect(createResponse.status).toBe(403);
  });

  it('rejects requesting recommendations for another user id', async () => {
    const userA = await registerVerifyLogin('usera');
    const userB = await registerVerifyLogin('userb');

    const response = await request(app)
      .get(`/api/recommendations/${userA.userId}`)
      .set('Authorization', `Bearer ${userB.accessToken}`);

    expect(response.status).toBe(403);
  });

  it('rejects unauthenticated access to analytics', async () => {
    const metricsResponse = await request(app).get('/api/analytics/metrics');
    expect(metricsResponse.status).toBe(401);

    const eventsResponse = await request(app).post('/api/analytics/events').send({ event: 'test' });
    expect(eventsResponse.status).toBe(401);
  });

  it('rejects a non-admin user reading analytics metrics', async () => {
    const user = await registerVerifyLogin('analytics');

    const response = await request(app)
      .get('/api/analytics/metrics')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(response.status).toBe(403);
  });

  it('rejects unauthenticated heartbeat and heartbeat for another user session', async () => {
    const owner = await registerVerifyLogin('streamowner');
    const intruder = await registerVerifyLogin('streamintruder');

    const playbackResponse = await request(app)
      .get('/api/streaming/playback/42')
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(playbackResponse.status).toBe(200);
    const sessionId = playbackResponse.body.id as string;

    const noAuthResponse = await request(app).post(`/api/streaming/sessions/${sessionId}/heartbeat`);
    expect(noAuthResponse.status).toBe(401);

    const wrongOwnerResponse = await request(app)
      .post(`/api/streaming/sessions/${sessionId}/heartbeat`)
      .set('Authorization', `Bearer ${intruder.accessToken}`);
    expect(wrongOwnerResponse.status).toBe(403);

    const ownerResponse = await request(app)
      .post(`/api/streaming/sessions/${sessionId}/heartbeat`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(ownerResponse.status).toBe(200);
  });
});

