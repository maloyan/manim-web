import { resolve } from 'path';
import UnpluginTypia from '@typia/unplugin/vite';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    UnpluginTypia(),
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
      // NOTE: `@mathjax/src` MUST be bundled (not externalized). Splitting the
      // five submodules it exposes (mathjax, tex, svg, liteAdaptor, html) over
      // separate dynamic-import targets makes downstream re-bundlers (e.g.
      // esm.sh) duplicate the `mathjax` singleton and breaks MathTex (#396).
      // `./mobjects/text/MathJaxBundle.ts` concentrates the imports so Vite
      // emits a single MathJax chunk.
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
