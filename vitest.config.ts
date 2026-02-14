import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    pool: 'threads',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/core/Renderer.ts',
        'src/core/Camera.ts',
        'src/core/Scene.ts',
        'src/core/SceneExtensions.ts',
        'src/exporters/**',
        'src/mobjects/three-d/**',
        'src/mobjects/interaction/**',
        'src/index.ts',
        'src/integrations/**',
      ],
      thresholds: {
        lines: 0.5,
        functions: 0.5,
        branches: 0.2,
        statements: 0.5,
      },
    },
  },
});
