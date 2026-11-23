import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import { prismaTest, getEmailVerifyToken } from '../helpers/db';

test('getEmailVerifyToken lê o token gravado no banco de teste', async () => {
  const email = `helper-test+${randomUUID()}@e2e.cryoflix.local`;
  const token = randomUUID();

  await prismaTest.user.create({
    data: {
      email,
      username: `helper_${randomUUID().slice(0, 8)}`,
      passwordHash: 'hash-nao-usado-neste-teste',
      emailVerifyToken: token,
      emailVerifyExpires: new Date(Date.now() + 60_000),
    },
  });

  await expect(getEmailVerifyToken(email)).resolves.toBe(token);

  await prismaTest.user.delete({ where: { email } });
});
