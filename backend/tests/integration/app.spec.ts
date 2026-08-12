import request from 'supertest';
import { createApp } from '../../src/app';
import { container } from '../../src/shared/container';

const app = createApp();

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
    const email = `test+${Date.now()}@fflix.io`;
    const password = 'Sup3rSecret!';

    await request(app).post('/api/auth/register').send({ email, password, name: 'Tester' });

    const registeredUser = await container.userRepository.findByEmail(email);
    const verifyToken = registeredUser?.emailVerifyToken;
    await request(app).get('/api/auth/verify-email').query({ token: verifyToken });

    const loginResponse = await request(app).post('/api/auth/login').send({ email, password });
    const accessToken = loginResponse.body.accessToken as string;

    const createResponse = await request(app)
      .post('/api/content')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Filme de teste',
        description: 'Descrição com mais de dez caracteres',
        duration: 120,
      });

    expect(createResponse.status).toBe(403);
  });
});

