// Processo auxiliar usado somente pelos testes de persistência com PostgreSQL.
const path = require('path');
if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL) {
  throw new Error('O servidor auxiliar exige NODE_ENV=test e um banco de teste.');
}
if (new URL(process.env.DATABASE_URL).pathname !== '/cryoflix_test') {
  throw new Error('O servidor auxiliar só aceita o banco cryoflix_test.');
}
require('../../backend/node_modules/ts-node').register({
  transpileOnly: true,
  project: path.resolve(__dirname, '../../backend/tsconfig.json'),
});
const { createApp } = require('../../backend/src/app');
const { prisma } = require('../../backend/src/shared/database/prismaClient');
const server = createApp().listen(Number(process.env.PORT), '127.0.0.1', () => {
  if (process.send) process.send({ ready: true });
});
process.on('message', (message) => {
  if (message === 'shutdown') {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }
});
