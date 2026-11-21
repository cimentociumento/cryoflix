import request from 'supertest';
import { createApp } from '../../src/app';
import { container } from '../../src/shared/container';

const app = createApp();
const password = 'Sup3rSecret!';

describe('Validação de nomes e atualização parcial de preferências', () => {
  let accessToken: string;
  let userId: string;
  let email: string;

  beforeAll(async () => {
    email = `user-improvements+${Date.now()}@example.com`;
    const registration = await request(app)
      .post('/api/auth/register')
      .send({ email, password, name: '  Ana Silva  ' });

    expect(registration.status).toBe(201);
    expect(registration.body.user.name).toBe('Ana Silva');
    userId = registration.body.user.id as string;

    const user = await container.userRepository.findById(userId);
    expect(user?.displayName).toBe('Ana Silva');
    const verification = await request(app)
      .get('/api/auth/verify-email')
      .query({ token: user?.emailVerifyToken });
    expect(verification.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    accessToken = login.body.accessToken as string;
  });

  it.each([
    ['somente espaços', '   ', 'Nome deve ter pelo menos 2 caracteres válidos'],
    ['um caractere após remover espaços', ' A ', 'Nome deve ter pelo menos 2 caracteres válidos'],
    ['mais de 120 caracteres', 'A'.repeat(121), 'Nome deve ter no máximo 120 caracteres'],
  ])('rejeita cadastro com nome %s sem criar uma conta', async (_label, name, message) => {
    const invalidEmail = `invalid-name+${Date.now()}@example.com`;
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: invalidEmail, password, name });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({ path: 'name', message });
    expect(await container.userRepository.findByEmail(invalidEmail)).toBeNull();
  });

  it('remove espaços externos do nome antes de validar o limite e persistir o perfil', async () => {
    const displayName = 'A'.repeat(120);
    const response = await request(app)
      .patch('/api/users/me/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ displayName: `  ${displayName}  `, bio: 'Perfil de teste' });

    expect(response.status).toBe(200);
    expect(response.body.displayName).toBe(displayName);
    const saved = await container.userRepository.findById(userId);
    expect(saved?.displayName).toBe(displayName);
    expect(saved?.bio).toBe('Perfil de teste');
  });

  it.each([
    ['vazio após remover espaços', ' \t\n ', 'Nome de exibição não pode ficar vazio'],
    ['mais de 120 caracteres', 'A'.repeat(121), 'Nome de exibição deve ter no máximo 120 caracteres'],
  ])('rejeita alteração com nome %s e preserva os dados anteriores', async (_label, displayName, message) => {
    const before = await container.userRepository.findById(userId);
    const response = await request(app)
      .patch('/api/users/me/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ displayName, bio: 'Esta bio não deve ser salva' });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({ path: 'displayName', message });
    const after = await container.userRepository.findById(userId);
    expect(after?.displayName).toBe(before?.displayName);
    expect(after?.bio).toBe(before?.bio);
  });

  it('atualiza idioma e tema sem apagar outras preferências, histórico ou perfil', async () => {
    const user = await container.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário de teste não encontrado');
    }
    const history = [{ videoId: '550', watchedAt: new Date('2026-01-10T12:00:00Z'), progress: 1 }];
    await container.userRepository.update(
      user.withPreferences({
        language: 'pt-BR', theme: 'dark', autoplay: false, hiddenMovieIds: [550, 680],
      }).withHistory(history),
    );

    const languageUpdate = await request(app)
      .patch('/api/users/me/preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ preferences: { language: 'en-US' } });
    expect(languageUpdate.status).toBe(200);
    expect(languageUpdate.body.preferences).toEqual({
      language: 'en-US', theme: 'dark', autoplay: false, hiddenMovieIds: [550, 680],
    });

    const themeUpdate = await request(app)
      .patch('/api/users/me/preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ preferences: { theme: 'light' } });
    expect(themeUpdate.status).toBe(200);

    const saved = await container.userRepository.findById(userId);
    expect(saved?.preferences).toEqual({
      language: 'en-US', theme: 'light', autoplay: false, hiddenMovieIds: [550, 680],
    });
    expect(saved?.history).toEqual(history);
    expect(saved?.displayName).toBe(user.displayName);
    expect(saved?.bio).toBe(user.bio);
    expect(saved?.email).toBe(email);
    expect(saved?.role).toBe('USER');
  });

  it('preserva as preferências quando o PATCH envia um objeto vazio', async () => {
    const before = await container.userRepository.findById(userId);
    const response = await request(app)
      .patch('/api/users/me/preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ preferences: {} });

    expect(response.status).toBe(200);
    const after = await container.userRepository.findById(userId);
    expect(after?.preferences).toEqual(before?.preferences);
    expect(after?.history).toEqual(before?.history);
  });
});
