import request from 'supertest';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { createApp } from '../../src/app';
import { container } from '../../src/shared/container';
import { env } from '../../src/config/environment';

const app = createApp();
const adminRoutes = [
  ['get', '/api/admin/dashboard'],
  ['get', '/api/admin/users'],
  ['get', '/api/admin/users/target-user'],
  ['patch', '/api/admin/users/target-user/role'],
  ['patch', '/api/admin/users/target-user/status'],
  ['delete', '/api/admin/users/target-user'],
  ['get', '/api/admin/audit-logs'],
] as const;

describe('Permissões administrativas pela API', () => {
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
    const email = `security+${randomUUID()}@example.com`;
    const password = 'ValidPassword1!';
    const registration = await request(app).post('/api/auth/register').send({
      email, password, name: 'Usuário comum', role: 'ADMIN', roles: ['admin'],
    });
    expect(registration.status).toBe(201);
    expect(registration.body.user.role).toBe('USER');
    const user = await container.userRepository.findByEmail(email);
    if (!user) throw new Error('Usuário de teste não encontrado');
    userId = user.id;
    const verification = await request(app).get('/api/auth/verify-email').query({ token: user.emailVerifyToken });
    expect(verification.status).toBe(200);
    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    accessToken = login.body.accessToken;
  });

  it.each(adminRoutes)('bloqueia %s %s sem autenticação', async (method, path) => {
    const response = await request(app)[method](path).send({ role: 'ADMIN', status: 'ACTIVE' });
    expect(response.status).toBe(401);
  });

  it.each(adminRoutes)('bloqueia %s %s para um usuário comum', async (method, path) => {
    const response = await request(app)[method](path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: 'ADMIN', status: 'ACTIVE' });
    expect(response.status).toBe(403);
  });

  it('não confia no papel administrativo enviado no token', async () => {
    const token = jwt.sign({ sub: userId, role: 'ADMIN' }, env.jwtSecret, { expiresIn: '5m' });
    const response = await request(app).get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it('recusa autenticação com outro esquema e tokens inválidos', async () => {
    const wrongScheme = await request(app).get('/api/admin/users')
      .set('Authorization', `Basic ${accessToken}`);
    expect(wrongScheme.status).toBe(401);
    const invalidToken = await request(app).get('/api/admin/users')
      .set('Authorization', 'Bearer invalid-token');
    expect(invalidToken.status).toBe(401);
  });

  it('consulta o papel atual e bloqueia a sessão após retirar o acesso administrativo', async () => {
    const user = await container.userRepository.findById(userId);
    if (!user) throw new Error('Usuário de teste não encontrado');
    await container.userRepository.update(user.patch({ role: 'ADMIN' }));
    const adminToken = jwt.sign({ sub: userId, role: 'ADMIN' }, env.jwtSecret, { expiresIn: '5m' });
    // O administrador autenticado chega à verificação de disponibilidade do banco.
    const asAdmin = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(asAdmin.status).toBe(503);

    await container.userRepository.update(user.patch({ role: 'USER' }));
    const afterDemotion = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(afterDemotion.status).toBe(403);
  });
});
