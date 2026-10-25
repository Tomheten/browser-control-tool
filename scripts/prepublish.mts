import { execSync } from 'node:child_process'
import { cpSync }   from "fs";
import { join }     from 'node:path'

execSync('npm run build:ui && npm run build:lib', {stdio: 'inherit'});

const __dirname = import.meta.dirname;
const widgetsDistSrc = join(__dirname, '..', 'widgets', 'dist');
const widgetsDistDest = join(__dirname, '..', 'dist', 'widgets', 'dist');

cpSync(widgetsDistSrc, widgetsDistDest, {stdio: 'inherit', recursive: true});