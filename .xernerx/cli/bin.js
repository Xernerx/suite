#!/usr/bin/env node
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexTs = `"${path.join(__dirname, 'index.ts')}"`;

const tsxBin = `"${path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs')}"`;

const result = spawnSync('node', [tsxBin, indexTs, ...process.argv.slice(2)], {
	stdio: 'inherit',
	shell: true,
});

process.exit(result.status || 0);
