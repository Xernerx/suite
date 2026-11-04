#!/usr/bin/env node
/** @format */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const cwd = process.cwd();

const args = new Set(process.argv.slice(2));
const syncOnly = args.has('--sync-only');
const forceInstall = args.has('--install');
const dryRun = args.has('--dry-run');
const isMonorepoBuild = process.env.SUITE_MONOREPO_BUILD === '1';

function getSharedPackageFilters() {
	const packagesDir = path.join(repoRoot, 'packages');
	const filters = [];
	if (!fs.existsSync(packagesDir)) return filters;

	for (const entry of fs.readdirSync(packagesDir)) {
		const pkgJsonPath = path.join(packagesDir, entry, 'package.json');
		if (fs.existsSync(pkgJsonPath)) {
			try {
				const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
				if (pkg.name) {
					filters.push('--filter', `${pkg.name}...`);
				}
			} catch {}
		}
	}
	return filters;
}

function shouldRunScopedInstall() {
	if (syncOnly || isMonorepoBuild) return false;
	if (forceInstall || dryRun) return true;

	const localNodeModules = path.join(cwd, 'node_modules');
	if (!fs.existsSync(localNodeModules)) return true;

	const isCIOrContainer =
		process.env.CI === 'true' || process.env.CI === '1' || Boolean(process.env.VERCEL) || Boolean(process.env.NIXPACKS_METADATA) || Boolean(process.env.CONTAINER) || fs.existsSync('/.dockerenv');

	if (isCIOrContainer) return true;

	// If local dev machine already has the full monorepo installed (including desktop),
	// avoid pruning other workspace node_modules unless explicitly requested via --install.
	const desktopNodeModules = path.join(repoRoot, 'clients', 'desktop', 'node_modules');
	if (process.platform === 'win32' && fs.existsSync(desktopNodeModules)) {
		return false;
	}

	return true;
}

function runScopedInstall() {
	const localPkgPath = path.join(cwd, 'package.json');
	if (!fs.existsSync(localPkgPath) || path.resolve(cwd) === repoRoot) {
		return;
	}

	const localPkg = JSON.parse(fs.readFileSync(localPkgPath, 'utf-8'));
	if (!localPkg.name) return;

	const filterArgs = ['--filter', `${localPkg.name}...`, ...getSharedPackageFilters()];
	if (dryRun) filterArgs.push('--dry-run');

	console.log(`[SUITE] Installing scoped dependencies for "${localPkg.name}" + packages/* ...`);

	const cmd = ['pnpm', 'install', ...filterArgs.map((arg) => (arg.startsWith('--') ? arg : `"${arg}"`))].join(' ');
	const res = spawnSync(cmd, {
		cwd: repoRoot,
		stdio: 'inherit',
		shell: true,
	});

	if (res.status !== 0) {
		process.exit(res.status || 1);
	}
}

function syncLocales() {
	const dictionariesDir = path.join(repoRoot, 'packages', 'lib', 'src', 'dictionaries');
	const outputFile = path.join(repoRoot, 'packages', 'lib', 'src', 'i18n.config.ts');
	if (!fs.existsSync(dictionariesDir)) return;

	const filenames = fs
		.readdirSync(dictionariesDir)
		.filter((file) => file.endsWith('.json'))
		.sort();

	const locales = [];
	for (const file of filenames) {
		const code = path.basename(file, '.json');
		const filePath = path.join(dictionariesDir, file);
		try {
			const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
			const label = content.metadata?.label || code;
			locales.push({ code, label, filename: file });
		} catch {}
	}

	if (locales.length === 0) return;

	const codeOutput = `/** @format */
// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.

export const localesConfig = {
${locales
	.map(
		(l) => `    '${l.code}': {
        label: '${l.label}',
        load: () => import('./dictionaries/${l.filename}').then((module) => module.default),
    },`
	)
	.join('\n')}
} as const;

export type Locale = keyof typeof localesConfig;
export const supportedLocales = Object.keys(localesConfig) as Locale[];
export const defaultLocale: Locale = supportedLocales[0] || 'en-GB';
`;

	const existing = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, 'utf-8') : '';
	if (existing !== codeOutput) {
		fs.writeFileSync(outputFile, codeOutput);
		console.log(`[SUITE] Synced packages/lib/src/i18n.config.ts (${locales.length} locales).`);
	}
}

function syncPublicAssets(from, to) {
	if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
	for (const element of fs.readdirSync(from)) {
		if (element.endsWith('.md')) continue;
		const srcPath = path.join(from, element);
		const destPath = path.join(to, element);
		const stat = fs.lstatSync(srcPath);
		if (stat.isFile()) {
			try {
				if (fs.existsSync(destPath)) {
					const destStat = fs.lstatSync(destPath);
					if (destStat.isFile() && destStat.size === stat.size && destStat.mtimeMs >= stat.mtimeMs) {
						continue;
					}
				}
				fs.copyFileSync(srcPath, destPath);
			} catch {
				try {
					fs.writeFileSync(destPath, fs.readFileSync(srcPath));
				} catch {}
			}
		} else if (stat.isSymbolicLink()) {
			try {
				if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
				fs.symlinkSync(fs.readlinkSync(srcPath), destPath);
			} catch {}
		} else if (stat.isDirectory()) {
			syncPublicAssets(srcPath, destPath);
		}
	}
}

function syncPublic() {
	const sourceDir = path.join(repoRoot, 'packages', 'public');
	if (!fs.existsSync(sourceDir)) return;

	const relCwd = path.relative(repoRoot, cwd).replace(/\\/g, '/');
	if (relCwd.startsWith('apps/') || relCwd.startsWith('clients/')) {
		const targetDir = path.join(cwd, 'public');
		syncPublicAssets(sourceDir, targetDir);
		console.log(`[SUITE] Synced packages/public -> ${relCwd}/public`);
		return;
	}

	if (path.resolve(cwd) === repoRoot) {
		for (const dirName of ['apps', 'clients']) {
			const fullDirPath = path.join(repoRoot, dirName);
			if (!fs.existsSync(fullDirPath)) continue;
			for (const sub of fs.readdirSync(fullDirPath)) {
				const subPath = path.join(fullDirPath, sub);
				if (fs.statSync(subPath).isDirectory() && fs.existsSync(path.join(subPath, 'package.json'))) {
					syncPublicAssets(sourceDir, path.join(subPath, 'public'));
				}
			}
		}
	}
}

if (shouldRunScopedInstall()) {
	runScopedInstall();
}

syncLocales();
syncPublic();
