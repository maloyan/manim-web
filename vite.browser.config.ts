import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'manim-web.browser.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      // Do NOT externalize three — bundle it inline for browser use
      external: [],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
