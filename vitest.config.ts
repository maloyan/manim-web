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
    pool: 'threads',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test-setup/happy-dom-patches.ts'],
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
