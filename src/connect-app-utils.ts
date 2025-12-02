import { ConsoleMessage, Page, Request, Route } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { APIResponse } from 'playwright-core';
import { Serializable } from 'playwright-core/types/structs';
import { Protocol } from 'playwright-core/types/protocol';
import { LoggableNetworkResourceType } from './models';
import { join } from 'path';

export namespace ConnectAppUtils {
    /** Когда нужно перенаправить запрос. Например, playwright пока не может подменить ответ потоком,
     *  например, для ответа чанками, поэтому нужно прокинуть ответ на другой сервер.  */
    export async function forwardRoute(
      page: Page,
      routeUrlMatch: (url: URL) => boolean,
      forwardUrl: string,
    ): Promise<void> {
        return await page.route(routeUrlMatch, async (route: Route, request: Request) => {
            await route.continue({
                url: forwardUrl,
                method: route.request().method(),
                headers: route.request().headers(),
                postData: route.request().postData(),
            });
        });
    }

    /** вернуть ответ по-определенному урл, не работает с чанками */
    export async function registerRoute(
      page: Page,
      urlMatch: (url: URL) => boolean,
      /** тип для fake-response смотри в `options` {@link Route#fulfill} */
      fakeResponseFn: (route: Route) => {
          body?: string | Buffer;
          contentType?: string;
          headers?: { [key: string]: string };
          json?: Serializable;
          path?: string;
          response?: APIResponse;
          status?: number;
      },
    ): Promise<void> {
        return await page.route(urlMatch, async (route: Route, request: Request) => {
            let response = fakeResponseFn(route);
            await route.fulfill(response);
        });
    }

    /** Логирует сообщения консоли браузера в файл */
    export function attachBrowserLogger(page: Page, level = 'log', file = 'log.log', isoTime = false) {
        /** see {@link ConsoleMessage#type} */
        const logLevels = [
            'verbose',
            'log',
            'info',
            'warning',
            'error',
        ];
        const minLogLevel = logLevels.indexOf(level);
        page.on('console', (consoleMsg: ConsoleMessage) => {
            const type = consoleMsg.type();
            const logLevel = logLevels.indexOf(type);
            if (logLevel === -1 || logLevel < minLogLevel) {
                return;
            }

            const timestamp = performance.now() + performance.timeOrigin;
            let time = isoTime ? new Date(timestamp).toISOString() : Math.trunc(timestamp);
            const line = `[${time}] [${type}] ${consoleMsg.text()}`;
            writeFileSync(file, line + '\n', { flag: 'a' });
        });
    }

    export async function attachCDPNetworkLogger(
      page: Page,
      networkResourceTypes: LoggableNetworkResourceType[] = ['All'],
      filename = 'network-cdp.log',
      isoTime = false,
    ) {
        const client = await page.context().newCDPSession(page);
        await client.send('Network.enable');
        const filepath = join('./', '/logs', filename)

        const shouldNotLog = (resourceType?: Protocol.Network.ResourceType) => {
            if (!resourceType) return true;
            if (networkResourceTypes.includes('All')) return false;
            return networkResourceTypes.every(rt => rt !== resourceType);
        };

        // store requestId for which we need to get the body
        const pendingBodies = new Set<string>();

        client.on('Network.requestWillBeSent', (event) => {
            if (shouldNotLog(event.type)) return;

            const timestamp = Date.now();
            const time = isoTime ? new Date(timestamp).toISOString() : timestamp;
            const line = `[${time}] [REQUEST] ${event.request.method} ${event.request.url} [${event.type}]`;
            writeFileSync(filepath, line + '\n', { flag: 'a' });

            if (event.request.postData) {
                const bodyLine = `[${time}] [REQUEST BODY] ${event.request.postData}`;
                writeFileSync(filepath, bodyLine + '\n', { flag: 'a' });
            }
        });

        client.on('Network.responseReceived', (event) => {
            if (shouldNotLog(event.type)) return;

            const timestamp = Date.now();
            const time = isoTime ? new Date(timestamp).toISOString() : timestamp;
            const line = `[${time}] [RESPONSE] ${event.response.status} ${event.response.url} [${event.type}]`;
            writeFileSync(filepath, line + '\n', { flag: 'a' });

            // save requestId for subsequent receipt of body
            pendingBodies.add(event.requestId);
        });

        client.on('Network.loadingFinished', async (event) => {
            if (!pendingBodies.has(event.requestId)) return;
            pendingBodies.delete(event.requestId);

            try {
                const body = await client.send('Network.getResponseBody', {
                    requestId: event.requestId,
                });
                const timestamp = Date.now();
                const time = isoTime ? new Date(timestamp).toISOString() : timestamp;
                const bodyLine = `[${time}] [RESPONSE BODY] ${event.requestId}\n` +
                  (body.base64Encoded
                    ? Buffer.from(body.body, 'base64').toString('utf-8')
                    : body.body);
                writeFileSync(filepath, bodyLine + '\n', { flag: 'a' });
            } catch (err) {
                const timestamp = Date.now();
                const time = isoTime ? new Date(timestamp).toISOString() : timestamp;
                const errLine = `[${time}] [RESPONSE BODY ERROR] ${event.requestId} ${String(err)}`;
                writeFileSync(filepath, errLine + '\n', { flag: 'a' });
            }
        });
    }

    /** Логин на сервер. Это пример работы с playwright  */
    export async function login(page: Page, url: string, log: string, pass: string) {
        await page.goto(url);
        await page.waitForSelector(`//*[contains(text(), "Username")]`);
        await page.fill('#username', log);
        await page.fill('#password', pass);
        await page.getByRole('button', { name: 'Sign In' }).click();
    }

    export function getEnString(length = 5, prefix = ''): string {
        const aCode = 97;
        const zCode = 122;
        const rndChar = () => ConnectAppUtils.getNumber(zCode, aCode);
        const result: string[] = [];
        for (let i = 0; i < length; i++) {
            result.push(String.fromCharCode(rndChar()));
        }
        return prefix + result.join('');
    }

    /**
     * Random russian string by lower case letters
     */
    export function getRuString(length = 5, prefix = ''): string {
        const firstCode = 1072;
        const lastCode = 1090;
        const result: string[] = [];
        for (let i = 0; i < length; i++) {
            result.push(String.fromCharCode(Math.floor(Math.random() * (lastCode - firstCode) + firstCode)));
        }
        return prefix + result.join('');
    }

    /**
     * Random int
     * @param min 1 by default because of valid neIds
     * @param max 100 by default
     */
    export function getNumber(max = 100, min = 1): number {
        if (max < min) {
            throw new Error('the maximum limit must be greater than the minimum!');
        }
        return Math.floor(Math.random() * (max - min) + min);
    }

    export async function hideUsingPlaywright(page: Page): Promise<void> {
        await page.addInitScript(
          () => {
              /** exchange `navigator.webdriver`
               *  alternate approach
               *  @example Reflect.defineProperty(navigator, 'webdriver', {value: false})
               *  */
              delete (Reflect.getPrototypeOf(navigator) as any).webdriver;
              (Reflect.getPrototypeOf(navigator) as any).webdriver = false;
          });
    }

}
