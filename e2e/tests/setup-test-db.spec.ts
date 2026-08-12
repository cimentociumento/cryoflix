import { test, expect } from '@playwright/test';
import { assertTestDatabaseUrl } from '../scripts/setup-test-db';

test.describe('assertTestDatabaseUrl', () => {
  test('rejeita quando a URL não está definida', () => {
    expect(() => assertTestDatabaseUrl(undefined)).toThrow();
  });

  test('rejeita quando a URL aponta para o banco de dev', () => {
    expect(() =>
      assertTestDatabaseUrl('postgresql://cryoflix:cryoflix123@localhost:5433/cryoflix'),
    ).toThrow('cryoflix_test');
  });

  test('aceita e devolve a URL quando aponta para cryoflix_test', () => {
    const url = 'postgresql://cryoflix:cryoflix123@localhost:5433/cryoflix_test';
    expect(assertTestDatabaseUrl(url)).toBe(url);
  });
});
