import { test, expect } from '@playwright/test';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken, prismaTest } from '../helpers/db';

test('GET /api/admin/users exige 401 sem token, 403 pra user comum e 200 pra admin', async ({
  request,
}) => {
  const user = makeTestUser();

  const registerResponse = await request.post('/api/auth/register', { data: user });
  expect(registerResponse.ok()).toBeTruthy();

  const verifyToken = await getEmailVerifyToken(user.email);
  const verifyResponse = await request.get(
    `/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`,
  );
  expect(verifyResponse.ok()).toBeTruthy();

  const userLoginResponse = await request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  });
  expect(userLoginResponse.ok()).toBeTruthy();
  const userToken = (await userLoginResponse.json()).accessToken as string;

  const noAuthResponse = await request.get('/api/admin/users');
  expect(noAuthResponse.status()).toBe(401);

  const nonAdminResponse = await request.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  expect(nonAdminResponse.status()).toBe(403);

  await prismaTest.user.update({ where: { email: user.email }, data: { role: 'ADMIN' } });

  const adminLoginResponse = await request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  });
  expect(adminLoginResponse.ok()).toBeTruthy();
  const adminToken = (await adminLoginResponse.json()).accessToken as string;

  const adminResponse = await request.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  expect(adminResponse.status()).toBe(200);
});
