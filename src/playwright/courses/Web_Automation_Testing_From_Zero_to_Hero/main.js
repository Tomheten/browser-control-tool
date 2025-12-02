"use strict";
/** `--trace`. `--debug` - allow do async actions in tests step by step */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const node_http_1 = require("node:http");
// import { expect, test } from '@playwright/test';
(0, node_http_1.createServer)((req, res) => {
    res.end(`<div id="parent">
            <div class="child" onclick="console.log('first click')">first child<div></div></div>
            <div class="child" onclick="console.log('second click')">second child<div></div></div>
        </div>`);
}).listen(8081);
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    let browser = yield test_1.chromium.launch({
        // executablePath: './chrome-win/chrome.exe',
        headless: false,
    });
    const page = yield browser.newPage();
    yield page.goto('http://localhost:8081');
    //////////// locators
    // locators in sequence. accept both - css and xpath
    // await page.locator('css=button').click();
    // await page.locator('xpath=//button').click();
    yield page.locator('#parent').locator('.child').nth(0).click();
    // highlight for debugging. It is similar to `select element` in devtools
    yield page.getByText('second child').highlight();
    yield page.locator('#parent').filter({ hasText: 'first child' }).click();
    const firstTextContent = yield page.getByText('second child').textContent();
    const firstTextInner = yield page.getByText('second child').innerText();
    const firstInnerHtml = yield page.getByText('second child').innerHTML();
    console.log(firstTextContent, firstInnerHtml, firstTextInner);
    ///////////////// http
});
run();
//# sourceMappingURL=main.js.map