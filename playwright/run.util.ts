import { join }                 from 'path';
import type { Page }            from 'playwright';

type PWModule = typeof import('playwright');
import { fileURLToPath }      from 'url';
import { dirname } from 'path';


let targetPage: Page;

async function runBrowser(path: string, chromium: any) {
    const browser = await chromium.launch({
        executablePath: path,
        headless: false,
        timeout: 1000_000,
        //args: ['--window-size=1920,1080'],
    });
    targetPage = await browser.newPage();
    await targetPage.goto('https://ya.ru');
}

export async function runWidgets(path: string): Promise<void> {
    let pw: PWModule;
    try {
        pw = (await import('@playwright/test')) as PWModule;
    } catch {
        throw new Error('Install "@playwright/test": npm i @playwright/test');
    }
    const browser = await pw.chromium.launch({
        executablePath: path,
        headless: false,
        timeout: 1000_000,
        devtools: true,
        //args: ['--window-size=1920,1080'],
    });

    const context = await browser.newContext({});
    const page = await context.newPage();

    //@ts-ignore
    const filename = fileURLToPath(import.meta.url);
    // TODO: rewrite by `import.meta.dirname`
    const __dirname = dirname(filename);
    const widgetsHtml = join(__dirname, 'widgets', 'dist', 'index-dist.html');

    let browserPath = '';
    page.addListener('console', async (consoleMessage) => {
        if (consoleMessage.type() === 'dirxml') {
            const text = consoleMessage.text();
            if (text.startsWith('dev_action')) {
                let strings = consoleMessage.text().split(' ');
                const action = strings[1];
                if (action === 'browser_path') {
                    const path = strings[2];
                    browserPath = path;
                    console.log('---------------', path);

                } else if (action === 'run_browser') {
                    console.log('---------------', path);
                    await runBrowser(path, pw.chromium);
                } else if (action === 'add_div') {
                    targetPage.evaluate(() => {
                        const div = document.createElement('div');
                        div.innerText = 'div is created from widgets dashboard';
                        div.setAttribute('style', 'z-index: 10000; border: 2px solid red; background: green;');
                        document.body.prepend(div);
                    });
                }
            }
        }
    });

    context.on('page', async (page: Page) => {
        console.log('---- autoclose page');
        await page.close();
    });
    await page.addInitScript(() => {
        (window as any).open = () => {
            console.log('------ auto close window');
            return null;
        };

        document.addEventListener('click', (e) => {
            const target = (e.target as any).closest('a[target="_blank"]');
            if (target) {
                e.preventDefault();
                console.log('----- opening new tab');
            }
        });
    });


    await page.goto('file:///' + widgetsHtml);
}
