import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { join } from 'path';

import { fileURLToPath } from 'url';
import { dirname as dirnameFn } from 'path';
import checker from 'vite-plugin-checker';

//@ts-ignore
const filename = fileURLToPath(import.meta.url);
const dirname = dirnameFn(filename);

export default defineConfig(({ command }) => {
  const config = {
    plugins: [
      vue(),
    ],
  };

  if (command === 'serve') {
    return {
      ...config,
      plugins: [
        ...config.plugins,
        checker({
          vueTsc: true,
        }),
      ],
      root: join(dirname),
      server: {
        open: './index-serve.html',
      },
    };
  } else {
    return {
      ...config,
      base: './',
      define: {
        'process.env': {},
      },
      build: {
        assetsInlineLimit: 0,
        lib: {
          entry: join(dirname, 'src', 'main.ts'),
          name: 'MyVueApp',
          formats: ['iife'],
          fileName: 'index',
        },
        rollupOptions: {
          // input: resolve(dirname, 'index-dist.html'),
          output: {
            dir: join(dirname, 'dist', 'assets'),
            entryFileNames: 'index.js',
            assetFileNames: 'index.[ext]',
          },
        },
      },
    };
  }
});
