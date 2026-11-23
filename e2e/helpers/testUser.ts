import { randomUUID } from 'crypto';

export type TestUser = {
  name: string;
  email: string;
  password: string;
};

export function makeTestUser(): TestUser {
  return {
    name: 'Playwright Tester',
    email: `playwright+${randomUUID()}@e2e.cryoflix.local`,
    password: 'Test1234!',
  };
}
