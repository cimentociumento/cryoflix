import request from 'supertest';
import { createApp } from '../../src/app';

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
});

