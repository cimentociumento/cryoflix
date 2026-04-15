import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.test.json' }],
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFiles: ['<rootDir>/tests/jest.setup.ts'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/index.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
};

export default config;

