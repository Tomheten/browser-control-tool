/** https://testengineer.ru/playwright-cheatsheet/ */
/** https://habr.com/ru/companies/jugru/articles/652919/ */

import { createServer } from 'node:http';
// @ts-ignore
import { Browser, chromium, ConsoleMessage, Page } from '@playwright/test';
import { createRequire } from 'module';
import { join } from 'path';
import { readFileSync } from 'fs';
// @ts-ignore
import { build } from 'vite';
// @ts-ignore
import vuePlugin from '@vitejs/plugin-vue';
import { ConnectAppUtils } from '../connect-app-utils';
import { appendFileSync, writeFileSync } from 'node:fs';
import { LoggableNetworkResourceType } from '../models';

const entry = join(__dirname, 'scenario', 'find-elems.entry.ts'); // ваш entry .ts/.js
const outDir = join(__dirname, 'scenario', 'dist');
const outFileName = 'find-elems.iife.min.js';
const widgetCssName = 'js-vanilla.css';

async function buildVueWidget() {
    await build({
        // inline конфиг вместо vite.config.ts
        plugins: [
            // подключаем plugin-vue только если у вас есть .vue SFC
            vuePlugin(),
        ],
        resolve: {
            alias: {
                // важный алиас — сборка с компилятором, чтобы работали строковые template
                'vue': 'vue/dist/vue.esm-bundler.js',
            },
        },
        define: {
            __VUE_OPTIONS_API__: 'false',
            __VUE_PROD_DEVTOOLS__: 'false',
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
            'process.env.NODE_ENV': JSON.stringify('production'),
            'process.env': JSON.stringify({}),
        },
        build: {
            lib: {
                entry,
                name: 'FindElemsBundle', // имя глобальной переменной в IIFE (может быть любым)
                formats: ['iife'],
            },
            outDir,
            rollupOptions: {
                // Гарантируем конкретное имя выходного файла и один файл (inline динамических импортов)
                inlineDynamicImports: true,
                external: ['vue'],
                output: {
                    entryFileNames: outFileName,

                    assetFileNames: (assetInfo) => {
                        const names = assetInfo.names || [];
                        const isCSS = names.some(n => n.endsWith('.css'));
                        if (isCSS) {
                            return widgetCssName; // фиксированное имя для css
                        }
                        return 'assets/[name][extname]';

                    },

                    // говорим IIFE где взять глобал для 'vue' — обычно это globalThis.Vue
                    globals: {
                        vue: 'Vue',
                    },
                },

            },
            minify: true, // или 'terser' / true если хотите минификацию
            target: 'ESNext',
        },
    });
}

//await buildVueWidget();
const VUE_CODE_ID = 'vue-code';

let p: Page;
const run = async () => {
    let pending = 0;
    let browser: Browser = await chromium.launch({
        /** дефолтный путь в Windows */
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        /**  */
        // executablePath: '/usr/bin/google-chrome-stable',
        // executablePath: '/usr/bin/chromium-browser'
        headless: false,
        devtools: true,
    });
    const require = createRequire(import.meta.url);
    const vueGlobalPath = require.resolve('vue/dist/vue.runtime.global.prod.js');
    const vueBase = readFileSync(vueGlobalPath, 'utf8');

    const widget = readFileSync(join(__dirname, 'scenario', 'dist', outFileName), 'utf8');

    const widgetCss = readFileSync(join(__dirname, 'scenario', 'dist', widgetCssName), 'utf8');

    function initVueFn(vueCode: string, widgetsCode: string) {
        document.addEventListener('DOMContentLoaded', () => {
                [vueCode, widgetsCode].forEach((code) => {
                    const s = document.createElement('script');
                    s.type = 'text/javascript';
                    s.text = code;
                    document.head.append(s);
                });
            },
            { once: true },
        );
    }

    const page: Page = await browser.newPage();
    p = page;
    await page.addInitScript({
        content: `(${initVueFn.toString()})(${JSON.stringify(vueBase)}, ${JSON.stringify(widget)});`,
    });
    const netLogName = 'net-log.log';
    writeFileSync(netLogName, '');
    await page.route('*/**', async (route, request) => {
        appendFileSync(netLogName, request.url() + '\n');
        await route.continue();
    });

    await page.addListener('console', async (consoleMessage: ConsoleMessage) => {
        if (consoleMessage.type() === 'dirxml') {
            const text = consoleMessage.text();
            if (text.startsWith('dev_action')) {
                let strings = consoleMessage.text().split(' ');
                const action = strings[1];
                const value = +strings[2];
                pending = value;
                console.log(action, value);
            }

        }
    });
    await page.route('*/**', async (route, request) => {
        if (pending > 0) {
            await new Promise(resolve => setTimeout(resolve, pending));
        }
        await route.continue();
    });
    await ConnectAppUtils.login(
        page,
        'https://nms-ui-green.tl.tel.yadro.com',
        'nms_test/nms_dev1',
        'Y@dro!NMS1234Y@dro!NMS',
    );
    await page.addStyleTag({ content: widgetCss.toString() });
};

await run();
console.log('------------- after run');
await (async () => {
    let browser: Browser = await chromium.launch({
        /** дефолтный путь в Windows */
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        /**  */
        // executablePath: '/usr/bin/google-chrome-stable',
        // executablePath: '/usr/bin/chromium-browser'
        headless: false,
    });
    const page: Page = await browser.newPage();
    await page.addListener('console', async (consoleMessage: ConsoleMessage) => {
        if (consoleMessage.type() === 'dirxml') {
            const text = consoleMessage.text();
            if (text.startsWith('show')) {
                console.log('---------show');
                await p.evaluate(() => {
                    let text1 = document.createElement('h2');
                    text1.setAttribute('style', 'background: red');
                    text1.textContent = 'created by util';
                    document.body.prepend(text1);
                });
            }

            if (text.startsWith('network_log')) {
                const parts = text.split(' ');
                if (parts.length >= 3) {
                    const type = parts[1] as LoggableNetworkResourceType;
                    const file = parts[2] ?? 'network-cdp.log';
                    console.log(type, file)

                    await ConnectAppUtils.attachCDPNetworkLogger(p, [type], file);
                }
            }
        }
    });
    await page.goto('file:///' + join(__dirname, 'widgets-util.html'));

})();
