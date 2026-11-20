#!/usr/bin/env node
/** @format */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const serviceArg = process.argv[2]?.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
if (!serviceArg || !serviceArg.startsWith('services/')) {
	console.error('[DOCKER] Usage: node .xernerx/cli/prepare-docker-service.mjs services/<name>');
	process.exit(1);
}

const servicePkgPath = path.join(repoRoot, serviceArg, 'package.json');
const libPkgPath = path.join(repoRoot, 'packages', 'lib', 'package.json');
const rootPkgPath = path.join(repoRoot, 'package.json');
const workspacePath = path.join(repoRoot, 'pnpm-workspace.yaml');

for (const filePath of [servicePkgPath, libPkgPath, rootPkgPath, workspacePath]) {
	if (!fs.existsSync(filePath)) {
		console.error(`[DOCKER] Missing required manifest: ${path.relative(repoRoot, filePath)}`);
		process.exit(1);
	}
}

// 1. Strip root devDependencies so Docker builds never install monorepo tooling (@xernerx/cli, next, prettier, etc.)
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
delete rootPkg.devDependencies;
fs.writeFileSync(rootPkgPath, `${JSON.stringify(rootPkg, null, '\t')}\n`);

// 2. Scope pnpm-workspace.yaml to packages/lib + target service while keeping allowBuilds & supply-chain exclusions
const workspaceYaml = fs.readFileSync(workspacePath, 'utf8');
const scopedWorkspace = workspaceYaml.replace(/^packages:[\s\S]*?(?=\r?\n\r?\n|\r?\n\S|\r?\n*$)/m, `packages:\n    - packages/lib\n    - ${serviceArg}`);
if (scopedWorkspace === workspaceYaml) {
	console.error('[DOCKER] Failed to scope packages list in pnpm-workspace.yaml');
	process.exit(1);
}
fs.writeFileSync(workspacePath, scopedWorkspace);

// 3. Trim @xernerx/lib to its headless ./core entrypoint (mongoose + @xernerx/terminal + tslib)
//    so bots/daemons never pull Next.js, @next/swc, React, Lucide, Sharp, or React Email (~390 MB saved per image).
const CORE_LIB_DEPS = ['@xernerx/terminal', 'mongoose', 'tslib'];
const libPkg = JSON.parse(fs.readFileSync(libPkgPath, 'utf8'));
const trimmedLibDeps = {};
for (const dep of CORE_LIB_DEPS) {
	if (libPkg.dependencies?.[dep]) {
		trimmedLibDeps[dep] = libPkg.dependencies[dep];
	}
}
libPkg.exports = {
	'./core': './core.ts',
};
libPkg.dependencies = trimmedLibDeps;
delete libPkg.devDependencies;
fs.writeFileSync(libPkgPath, `${JSON.stringify(libPkg, null, '\t')}\n`);

// 4. Trim target service manifest to production runtime deps (keeping tsx for `node --import tsx src/main.ts`)
const servicePkg = JSON.parse(fs.readFileSync(servicePkgPath, 'utf8'));
if (!servicePkg.dependencies?.tsx && servicePkg.devDependencies?.tsx) {
	servicePkg.dependencies = {
		...(servicePkg.dependencies || {}),
		tsx: servicePkg.devDependencies.tsx,
	};
}
if (!servicePkg.dependencies?.tsx) {
	console.error(`[DOCKER] Expected "tsx" in ${serviceArg}/package.json dependencies.`);
	process.exit(1);
}
delete servicePkg.devDependencies;
fs.writeFileSync(servicePkgPath, `${JSON.stringify(servicePkg, null, '\t')}\n`);

console.log(`[DOCKER] Prepared minimal headless workspace for ${serviceArg} (+ @xernerx/lib/core).`);
