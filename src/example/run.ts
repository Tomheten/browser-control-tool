/**
 * ****************************************************************************
 * Copyright (C), 2025, KNS Group LLC (YADRO).
 * All Rights Reserved.
 *
 * This software contains the intellectual property of YADRO or is licensed to
 * YADRO from third parties. Use of this software and the intellectual property
 * contained therein is expressly limited to the terms and conditions of the
 * License Agreement under which it is provided by YADRO.
 * ****************************************************************************
 */

import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { createServer as httpsCreateServer } from 'node:https';
import { join } from 'path';
import { generate } from 'selfsigned';
import { ConnectAppUtils } from '../connect-app-utils';

/** run simple http server but the request is intercepted by playwright below */
createServer((req, res) => {
    if (req.url.includes('http-response')) {
        res.end('respnse from simple http server');
    } else {
        res.writeHead(204);
        res.end('Not Found');
    }
}).listen(3001);

const attrs = [{ name: 'commonName', value: 'localhost' }];
const permissions = generate(attrs, { days: 365 });
httpsCreateServer({ key: permissions.private, cert: permissions.cert }, (req, resp) => {
    resp.writeHead(200, { 'access-control-allow-origin': '*' });
    resp.end('response from http secure server');
}).listen(3002);

(async () => {
    const browser = await chromium.launch({
        executablePath: join('C:', 'chrome-win_139', 'chrome.exe'),
        headless: false,
    });

    const context = await browser.newContext({
        ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    await ConnectAppUtils.registerRoute(
        page,
        url => url.toString().includes('http-response'),
        route => {
            return { body: 'fake response by playwright on the simple http server' };
        },
    );

    await ConnectAppUtils.forwardRoute(
        page,
        url => url.toString().includes('http-secure-response'),
        'https://localhost:3002',
    );

    ConnectAppUtils.attachBrowserLogger(page, 'log', 'log1.log');

    await page.goto('file://' + join(__dirname, 'index.html'));
})();
