import { resolve } from 'path';
import UnpluginTypia from '@typia/unplugin/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [UnpluginTypia()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    // The suite accumulates heap across files within a reused worker (a real
    // leak — see .debug/OOM-leak.md). Until that is fixed, run in `forks`
    // (child processes reclaim memory better than reused worker threads) and
    // raise each fork's V8 heap via execArgv so its file slice fits. Cap
    // parallelism so total RAM stays within a CI runner's budget.
    // NB: Vitest 4 removed `poolOptions`; pool tuning is top-level now.
    pool: 'forks',
    maxWorkers: 2,
    minWorkers: 1,
    execArgv: ['--max-old-space-size=4096'],
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test-setup/vitest-setup.ts'],
    environmentOptions: {
      happyDOM: {
        settings: {
          disableCSSFileLoading: true,
          handleDisabledFileLoadingAsSuccess: true,
        },
      },
    },
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
        'src/core/ThreeDScene.ts',
        'src/core/MovingCameraScene.ts',
        'src/core/ZoomedScene.ts',
        'src/core/VectorScene.ts',
        'src/core/LinearTransformationScene.ts',
        'src/exporters/**',
        'src/mobjects/three-d/**',
        'src/mobjects/interaction/**',
        'src/index.ts',
        'src/integrations/**',
      ],
      thresholds: {
        lines: 30,
        functions: 20,
        branches: 15,
        statements: 30,
      },
    },
  },
});
