import request from 'supertest';
import { createApp } from '../../src/app';
import { container } from '../../src/shared/container';
import { EmailService } from '../../src/shared/services/EmailService';

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
  it('cria a conta já verificada quando não há SMTP configurado', async () => {
    jest.spyOn(EmailService.prototype, 'isConfigured').mockReturnValueOnce(false);
    const email = `test+nosmtp+${Date.now()}@fflix.io`;
    const password = 'Sup3rSecret!';
    const register = await request(app).post('/api/auth/register').send({ email, password, name: 'Sem SMTP' });
    expect(register.status).toBe(201);
    const stored = await container.userRepository.findByEmail(email);
    expect(stored?.status).toBe('ACTIVE');
    expect(stored?.emailVerifyToken).toBeNull();
    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
  });

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

  it('logout revoga o refresh token enviado pelo cookie', async () => {
    jest.spyOn(EmailService.prototype, 'isConfigured').mockReturnValueOnce(false);
    const email = `test+logout+${Date.now()}@fflix.io`;
    const password = 'Sup3rSecret!';
    await request(app).post('/api/auth/register').send({ email, password, name: 'Logout' });
    const agent = request.agent(app);
    const login = await agent.post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    const cookie = String(login.headers['set-cookie']);
    expect(cookie).toContain('cryoflix_refresh=');
    expect(cookie).toContain('Path=/api/auth;');

    const logout = await agent
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({});
    expect(logout.status).toBe(200);

    const refreshAfterLogout = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `cryoflix_refresh=${login.body.refreshToken}`)
      .send({});
    expect(refreshAfterLogout.status).toBe(401);
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

  it('rejects unauthenticated upload callback and callback for another user job', async () => {
    const owner = await registerVerifyLogin('uploadowner');
    const intruder = await registerVerifyLogin('uploadintruder');

    const signedUrlResponse = await request(app)
      .post('/api/upload/signed-url')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ fileName: 'filme.mp4', mimeType: 'video/mp4' });
    expect(signedUrlResponse.status).toBe(201);
    const jobId = signedUrlResponse.body.jobId as string;

    const noAuthResponse = await request(app).post('/api/upload/callback').send({ jobId });
    expect(noAuthResponse.status).toBe(401);

    const wrongOwnerResponse = await request(app)
      .post('/api/upload/callback')
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .send({ jobId });
    expect(wrongOwnerResponse.status).toBe(403);

    const ownerResponse = await request(app)
      .post('/api/upload/callback')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ jobId });
    expect(ownerResponse.status).toBe(200);
  });

  it('validates body on transcoding jobs and notification endpoints', async () => {
    const user = await registerVerifyLogin('validation');
    const auth = { Authorization: `Bearer ${user.accessToken}` };

    const invalidTranscoding = await request(app)
      .post('/api/transcoding/jobs')
      .set(auth)
      .send({});
    expect(invalidTranscoding.status).toBe(400);

    const validTranscoding = await request(app)
      .post('/api/transcoding/jobs')
      .set(auth)
      .send({ uploadJobId: 'job-123' });
    expect(validTranscoding.status).toBe(202);

    const invalidEmail = await request(app)
      .post('/api/notifications/email')
      .set(auth)
      .send({ to: 'not-an-email', subject: 'Oi', body: 'Corpo' });
    expect(invalidEmail.status).toBe(400);

    const validEmail = await request(app)
      .post('/api/notifications/email')
      .set(auth)
      .send({ to: 'user@example.com', subject: 'Oi', body: 'Corpo' });
    expect(validEmail.status).toBe(202);

    const invalidPush = await request(app).post('/api/notifications/push').set(auth).send({});
    expect(invalidPush.status).toBe(400);

    const validPush = await request(app)
      .post('/api/notifications/push')
      .set(auth)
      .send({ token: 'device-token', message: 'Oi' });
    expect(validPush.status).toBe(202);
  });
});

