#!/usr/bin/env node

import { runWidgets } from '../dist/browser-control-tool.esm.js';

console.log('Starting browser-control-tool...');

runWidgets('').catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
});