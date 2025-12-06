import { defineConfig } from 'vite';
import path             from 'path';
import dts              from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            insertTypesEntry: true,
        }),
    ],
    build: {
        target: 'esnext',
        rollupOptions: {
            external: (id: string) =>
                id === 'playwright' ||
                id.startsWith('playwright/') ||
                id === 'path' ||
                id === 'url' ||
                id.startsWith('node:'),
            output: {
                exports: 'named',
                // globals: {'@playwright/test': 'PlaywrightTest'} // только для UMD/IIFE
            }
        },
        lib: {
            formats: ['cjs', 'es'],
            entry: path.resolve(__dirname, 'playwright/run.util.ts'),
            name: 'BrowserControlTool',
            fileName: (format) => `browser-control-tool.${format}.js`,
        },
    },
});
