import 'dotenv/config';
import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@cryoflix.io';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@CryoFlix2024!';
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

  const demoEmail = 'demo@cryoflix.io';
  const demoPassword = 'Sup3rSecret!';
  const demoHash = await bcrypt.hash(demoPassword, 12);

  await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      passwordHash: demoHash,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
    create: {
      email: demoEmail,
      username: 'demo',
      displayName: 'Demo CryoFlix',
      passwordHash: demoHash,
      role: Role.USER,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
      preferences: {
        language: 'pt-BR',
        theme: 'light',
      },
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
