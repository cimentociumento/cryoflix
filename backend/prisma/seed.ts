import 'dotenv/config';
import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new Error('Defina ADMIN_EMAIL com um e-mail válido antes de executar o seed.');
  }
  if (
    !adminPassword || adminPassword.length < 12 ||
    !/[a-z]/.test(adminPassword) || !/[A-Z]/.test(adminPassword) ||
    !/[0-9]/.test(adminPassword) || !/[^A-Za-z0-9]/.test(adminPassword)
  ) {
    throw new Error('Defina ADMIN_PASSWORD com ao menos 12 caracteres, maiúscula, minúscula, número e símbolo.');
  }
  const adminHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminHash,
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
    create: {
      email: adminEmail,
      username: 'admin',
      displayName: 'Administrador',
      passwordHash: adminHash,
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
      preferences: {},
    },
  });

}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
