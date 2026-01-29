import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'integrations/react': resolve(__dirname, 'src/integrations/react.tsx'),
        'integrations/vue': resolve(__dirname, 'src/integrations/vue.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['three', 'react', 'react/jsx-runtime', 'vue'],
      output: {
        globals: {
          three: 'THREE',
          react: 'React',
          'react/jsx-runtime': 'ReactJSXRuntime',
          vue: 'Vue',
        },
        // Preserve directory structure for integrations
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
