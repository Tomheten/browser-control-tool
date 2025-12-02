/** `--trace`. `--debug` - allow do async actions in tests step by step */

import { Browser, Page, chromium } from '@playwright/test';
import { createServer } from 'node:http';
// import { expect, test } from '@playwright/test';

createServer((req, res) => {
    res.end(
        `<div id="parent">
            <div class="child" onclick="console.log('first click')">first child<div></div></div>
            <div class="child" onclick="console.log('second click')">second child<div></div></div>
        </div>`
    );
}).listen(8081);

const run = async () => {
    let browser: Browser = await chromium.launch({
        // executablePath: './chrome-win/chrome.exe',
        headless: false,
    });
    const page = await browser.newPage()
    await page.goto('http://localhost:8081');

    //////////// locators
    // locators in sequence. accept both - css and xpath
    // await page.locator('css=button').click();
    // await page.locator('xpath=//button').click();
    await page.locator('#parent').locator('.child').nth(0).click();
    // highlight for debugging. It is similar to `select element` in devtools
    await page.getByText('second child').highlight();

    await page.locator('#parent').filter({ hasText: 'first child' }).click();
    const firstTextContent = await page.getByText('second child').textContent();
    const firstTextInner = await page.getByText('second child').innerText();
    const firstInnerHtml = await page.getByText('second child').innerHTML();
    console.log(firstTextContent, firstInnerHtml, firstTextInner);

///////////////// http


};

run();
