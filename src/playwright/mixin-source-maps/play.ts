import {chromium, Route, APIResponse} from 'playwright';
import {promises as fs, readFileSync} from 'fs';
import {basename, join}               from 'path';
import {createServer}                 from 'node:http';
import {createReadStream}             from 'node:fs';

//server
const tinyPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
createServer(function (request, response) {
    if (request.url.includes('.js')) {
        response.writeHead(200, {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'access-control-allow-headers': '*',
            'access-control-allow-credentials': 'true'
        });
        createReadStream('./index.js').pipe(response);
    } else if (request.url.includes('favicon.ico')) {
        response.writeHead(200, {
            'content-type': 'image/png',
            'content-length': String(Buffer.from(tinyPngBase64, 'base64').length),
            'cache-control': 'no-store',
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'access-control-allow-headers': '*',
            'access-control-allow-credentials': 'true'
        });
        response.write(Buffer.from(tinyPngBase64, 'base64'));
        response.end();
    } else {
        response.writeHead(200, {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'access-control-allow-headers': '*',
            'access-control-allow-credentials': 'true'
        });
        createReadStream('./index.html').pipe(response);
    }
}).listen(8081);


const LOCAL_MAPS_PREFIX = '/local-maps/';
const LOCAL_MAPS_DIR = 'local-sourcemaps';
const REMOTE_MIN_JS = '**/*.min.js';

async function serveLocalMap(route: Route) {
    try {
        const url = route.request().url();
        const name = basename(url);
        const localPath = join(LOCAL_MAPS_DIR, name);
        const data = await fs.readFile(localPath);
        console.log(data.toString());
        await route.fulfill({
            status: 200,
            headers: {'content-type': 'application/json; charset=utf-8'},
            body: data
        });
    } catch {
        await route.continue();
    }
}

async function interceptMinifiedJs(route: Route) {
    const res: APIResponse = await route.fetch();
    const originalText = await res.text();
    const sourceMapComment = `//# sourceMappingURL=${LOCAL_MAPS_PREFIX}app.min.js.map`;
    const hasMapping = /sourceMappingURL=/.test(originalText);
    const newText = hasMapping
        ? originalText.replace(/(\/\/# sourceMappingURL=).*/m, sourceMapComment)
        : originalText + '\n' + sourceMapComment + '\n';
    
    const headers = {...res.headers()};
    headers['content-type'] = 'application/javascript; charset=utf-8';
    
    await route.fulfill({
        status: res.status(),
        headers,
        body: newText
    });
}

(async () => {
    const browser = await chromium.launch({
        executablePath: join('C:', 'chrome-win', 'chrome.exe'),
        headless: false,
        args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',]
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setExtraHTTPHeaders({
        'pragma': 'no-cache',
        'cache-control': 'no-cache, no-store, must-revalidate'
    });
    
    // Перехватываем минифицированный JS и подставляем ссылку на локальную .map
    // await page.route('**/*', async (route, request) => {
    //
    //     console.log('route handler sees:', request.url());
    //     if (request.url().includes('min.js')) {
    //         const res: APIResponse = await route.fetch();
    //         const originalText = await res.text();
    //
    //         // читаем локальную .map
    //         const mapPath = join(LOCAL_MAPS_DIR, 'app.min.js.map');
    //         const mapBuffer = await fs.readFile(mapPath);
    //         const mapBase64 = mapBuffer.toString('base64');
    //
    //         // формируем inline comment
    //         const inlineComment = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
    //
    //         // если в оригинале уже есть sourceMappingURL — заменяем, иначе дописываем
    //         const newText = /sourceMappingURL=/.test(originalText)
    //             ? originalText.replace(/(\/\/# sourceMappingURL=).*/m, inlineComment)
    //             : originalText + '\n' + inlineComment + '\n';
    //
    //         // const sourceMapComment = `//# sourceMappingURL=${LOCAL_MAPS_PREFIX}app.min.js.map`;
    //         // const hasMapping = /sourceMappingURL=/.test(originalText);
    //         // const newText = hasMapping
    //         //     ? originalText.replace(/(\/\/# sourceMappingURL=).*/m, sourceMapComment)
    //         //     : originalText + '\n' + sourceMapComment + '\n';
    //
    //         const headers = {
    //             ...res.headers(),
    //             'access-control-allow-origin': '*',
    //             'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    //             'access-control-allow-headers': '*',
    //             'access-control-allow-credentials': 'true'
    //         };
    //         //@ts-ignore
    //         headers['content-type'] = 'application/javascript; charset=utf-8';
    //
    //         await route.fulfill({
    //             status: res.status(),
    //             headers,
    //             body: newText
    //         });
    //     } else {
    //         await route.continue();
    //     }
    // });
    
    await page.goto('http://localhost:8081/');
    
    // Оставляем браузер открытым для интерактивного дебага
})();
