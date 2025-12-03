import * as child_process from "node:child_process";
import { join }           from "path";
import { fileURLToPath }  from 'url';
import { dirname }        from 'path';

//@ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const viteConfig = join(__dirname, 'vite.build-widgets.config.ts');
child_process.execSync('npm run vite -- --config ' + viteConfig);