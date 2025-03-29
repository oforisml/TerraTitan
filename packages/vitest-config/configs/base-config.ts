import { defineConfig } from 'vitest/config';

export const baseConfig = defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    passWithNoTests: true,
    clearMocks: true,
    isolate: false,
    coverage: {
      provider: 'istanbul',
      reporter: [
        [
          'json',
          {
            file: `../coverage.json`,
          },
        ],
      ],
      enabled: true,
    },
  },
});
