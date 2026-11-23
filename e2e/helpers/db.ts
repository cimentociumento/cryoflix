// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('../../backend/node_modules/@prisma/client');

export const prismaTest = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

export async function getEmailVerifyToken(email: string): Promise<string> {
  const user = await prismaTest.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.emailVerifyToken) {
    throw new Error(`Nenhum emailVerifyToken pendente para ${email}`);
  }
  return user.emailVerifyToken as string;
}
