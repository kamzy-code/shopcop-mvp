import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // baseUrl-relative imports without @ prefix (not covered by vite-tsconfig-paths)
      helpers: path.resolve(__dirname, 'src/helpers'),
      generated: path.resolve(__dirname, 'src/generated'),
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/config/seed.ts', 'src/generated/**'],
    },
  },
});
