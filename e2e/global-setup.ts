import dotenv from 'dotenv';
import path from 'path';
import { setupTestDatabase } from './scripts/setup-test-db';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default async function globalSetup(): Promise<void> {
  await setupTestDatabase(process.env.TEST_DATABASE_URL);
}
