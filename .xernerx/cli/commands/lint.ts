/** @format */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { runCommand } from '../utils/run';

const VALID_ROUTER_FILES = new Set([
	'page.tsx',
	'layout.tsx',
	'loading.tsx',
	'error.tsx',
	'not-found.tsx',
	'global-error.tsx',
	'route.ts',
	'template.tsx',
	'default.tsx',
	'opengraph-image.tsx',
	'icon.tsx',
	'robots.ts',
	'sitemap.ts',
	'manifest.ts',
	'globals.css',
]);

function walkFiles(dir: string): string[] {
	if (!fs.existsSync(dir)) return [];
	const results: string[] = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist' || entry.name === 'build') {
			continue;
		}
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...walkFiles(fullPath));
		} else {
			results.push(fullPath);
		}
	}
	return results;
}

function getNestedValue(obj: Record<string, any>, keyPath: string): unknown {
	return keyPath.split('.').reduce<any>((acc, part) => (acc !== null && acc !== undefined ? acc[part] : undefined), obj);
}

export function runSuiteArchitectureLint(): boolean {
	const rootDir = fs.existsSync(path.join(process.cwd(), 'pnpm-workspace.yaml')) ? process.cwd() : path.resolve(process.cwd(), '../..');
	const appsDir = path.join(rootDir, 'apps');
	const packagesDir = path.join(rootDir, 'packages');
	const enGbPath = path.join(rootDir, 'packages/lib/src/dictionaries/en-GB.json');

	const errors: string[] = [];

	const enGb: Record<string, any> = fs.existsSync(enGbPath) ? JSON.parse(fs.readFileSync(enGbPath, 'utf-8')) : {};

	if (fs.existsSync(appsDir)) {
		const appNames = fs
			.readdirSync(appsDir, { withFileTypes: true })
			.filter((d) => d.isDirectory())
			.map((d) => d.name);

		for (const appName of appNames) {
			const appSrcDir = path.join(appsDir, appName, 'src');
			if (!fs.existsSync(appSrcDir)) continue;

			const files = walkFiles(appSrcDir);

			for (const file of files) {
				const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
				const ext = path.extname(file);

				// 1. 500-Line Limit in apps/*/src
				if (ext === '.ts' || ext === '.tsx') {
					const content = fs.readFileSync(file, 'utf-8');
					const lineCount = content.split(/\r?\n/).length;
					if (lineCount > 500) {
						errors.push(`[500-Line Rule] ${relPath} has ${lineCount} lines (max 500). Extract sub-components into src/components/.`);
					}
				}

				// 2. Non-Route Files inside apps/*/src/app
				const appRouterDir = path.join(appSrcDir, 'app');
				if (file.startsWith(appRouterDir + path.sep)) {
					const baseName = path.basename(file);
					if (!VALID_ROUTER_FILES.has(baseName)) {
						errors.push(`[Component Placement Rule] ${relPath} is inside src/app/. Move components/helpers to src/components/ or src/lib/.`);
					}
				}

				// 3. Strict 3-Route Local /api Rule in frontend apps
				const apiDir = path.join(appSrcDir, 'app', 'api');
				if (!['api', 'cdn', 'docs'].includes(appName) && file.startsWith(apiDir + path.sep)) {
					const apiRel = path.relative(apiDir, file).replace(/\\/g, '/');
					const allowedApiRoutes = new Set(['auth/[...nextauth]/route.ts', 'changelog/route.ts', 'version/route.ts']);
					if (appName === 'account') {
						allowedApiRoutes.add('connections/[provider]/route.ts');
						allowedApiRoutes.add('connections/[provider]/callback/route.ts');
					}
					if (!allowedApiRoutes.has(apiRel)) {
						errors.push(`[3-Route API Rule] ${relPath} is not allowed in frontend app '${appName}'. Move backend endpoints to apps/api.`);
					}
				}
			}
		}
	}

	// 4. Localization (DictionaryProvider / t() Signature & en-GB.json Existence)
	const allSourceFiles = [...walkFiles(appsDir), ...walkFiles(packagesDir)].filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

	const invalidSecondArgRegex = /\bt\(\s*['"][^'"]+['"]\s*,\s*['"]/g;
	const invalidThreeArgsRegex = /\bt\(\s*['"][^'"]+['"]\s*,\s*\{[^}]*\}\s*,/g;
	const staticKeyRegex = /(?<![a-zA-Z0-9_])t\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g;

	for (const file of allSourceFiles) {
		const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
		const content = fs.readFileSync(file, 'utf-8');

		if (invalidSecondArgRegex.test(content)) {
			errors.push(`[t() Signature Rule] ${relPath} passes a string literal as the 2nd argument to t(). Signature is t(path, variables?).`);
		}
		if (invalidThreeArgsRegex.test(content)) {
			errors.push(`[t() Signature Rule] ${relPath} passes a 3rd fallback argument to t(). Add keys to en-GB.json instead.`);
		}

		let match: RegExpExecArray | null;
		staticKeyRegex.lastIndex = 0;
		while ((match = staticKeyRegex.exec(content)) !== null) {
			const key = match[1];
			if (key.includes('.') && !key.endsWith('.')) {
				const resolved = getNestedValue(enGb, key);
				if (resolved === undefined) {
					errors.push(`[Missing i18n Key] ${relPath} references t('${key}'), which is missing from packages/lib/src/dictionaries/en-GB.json.`);
				}
			}
		}
	}

	if (errors.length > 0) {
		console.error(`\n[Suite Lint] Found ${errors.length} AGENTS.md compliance violation(s):`);
		for (const err of errors) {
			console.error(`  ✖ ${err}`);
		}
		console.error('');
		return false;
	}

	console.log('[Suite Lint] ✔ All AGENTS.md architecture & localization checks passed (500-line cap, src/components, 3-route API, t() & en-GB.json).');
	return true;
}

export default function registerLint(program: Command) {
	program
		.command('lint')
		.description('Lint all workspaces and enforce AGENTS.md architecture & i18n rules')
		.action(() => {
			const ok = runSuiteArchitectureLint();
			if (!ok) {
				process.exit(1);
			}
			runCommand('pnpm', ['--recursive', 'run', 'lint']);
		});
}
