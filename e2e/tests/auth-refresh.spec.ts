import { test, expect } from '@playwright/test';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken } from '../helpers/db';

test('POST /api/auth/refresh rotaciona o token e invalida o anterior', async ({ request }) => {
  const user = makeTestUser();

  const registerResponse = await request.post('/api/auth/register', { data: user });
  expect(registerResponse.ok()).toBeTruthy();

  const verifyToken = await getEmailVerifyToken(user.email);
  const verifyResponse = await request.get(
    `/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`,
  );
  expect(verifyResponse.ok()).toBeTruthy();

  const loginResponse = await request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  });
  expect(loginResponse.ok()).toBeTruthy();
  const { refreshToken: originalRefreshToken } = await loginResponse.json();

  const refreshResponse = await request.post('/api/auth/refresh', {
    data: { refreshToken: originalRefreshToken },
  });
  expect(refreshResponse.ok()).toBeTruthy();
  const { accessToken, refreshToken: newRefreshToken } = await refreshResponse.json();
  expect(accessToken).toBeTruthy();
  expect(newRefreshToken).toBeTruthy();
  expect(newRefreshToken).not.toBe(originalRefreshToken);

  // Reuso do refresh token já revogado deve ser rejeitado.
  const reuseResponse = await request.post('/api/auth/refresh', {
    data: { refreshToken: originalRefreshToken },
  });
  expect(reuseResponse.status()).toBe(401);
});
