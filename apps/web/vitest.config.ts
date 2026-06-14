import { defineConfig } from 'vitest/config';

// Domain logic is pure TypeScript, so the node environment is enough.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
