#!/usr/bin/env node

import { runWidgets } from '../dist/browser-control-tool.es.js';
import { parseArgs } from 'node:util';

const HELP = `
browser-control-tool

Usage:
  browser-control-tool [options]

Options:
  -h, --help  Show help

Examples:
  browser-control-tool
  bct
`;

async function main() {
    const { values } = parseArgs({
        options: {
            help: {
                type: 'boolean',
                short: 'h',
                default: false
            }
        }
    });

    if (values.help) {
        console.log(HELP);
        process.exit(0);
    }

    console.log('Starting browser-control-tool...');

    try {
        await runWidgets('');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();