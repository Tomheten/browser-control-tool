// vue-tsc -b && vite build


import * as child_process from 'node:child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { copyFileSync } from 'fs';


//@ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const viteConfig = join(__dirname, 'vite.build-widgets.config.ts');
// child_process.execSync('npm exec -- vue-tsc -- -b', { stdio: 'inherit', cwd: join(__dirname, '..') });
// child_process.execSync('npm run vue-tsc', {stdio: 'inherit'});
child_process.execSync('npm run vite build -- --config ' + `"${viteConfig}"`, { stdio: 'inherit' });

const indexHtmlSrc = join(__dirname, 'index-dist.html');
const indexHtmlDest = join(__dirname, 'dist', 'index-dist.html');
copyFileSync(indexHtmlSrc, indexHtmlDest);

