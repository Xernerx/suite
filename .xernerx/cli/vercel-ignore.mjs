/** @format */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const VALID_APPS = new Set(['www', 'api', 'cdn', 'account', 'app', 'docs', 'admin', 'info', 'store', 'portal', 'hosting', 'haste', 'blog']);

// Map each app to the top-level dictionary namespaces in packages/lib/src/dictionaries/*.json that it consumes
const APP_DICTIONARY_NAMESPACES = {
	www: new Set(['www', 'common', 'components', 'feedback', 'docs', 'info', 'faq']),
	api: new Set(['api', 'faq', 'docs', 'info']),
	cdn: new Set(['cdn', 'common', 'components', 'feedback']),
	account: new Set(['account', 'app', 'common', 'components', 'feedback']),
	app: new Set(['app', 'common', 'components', 'feedback']),
	docs: new Set(['docs', 'common', 'components', 'feedback']),
	admin: new Set(['admin', 'account', 'blog', 'info', 'common', 'components', 'feedback']),
	info: new Set(['info', 'faq', 'app', 'common', 'components', 'feedback']),
	store: new Set(['account', 'store', 'common', 'components', 'feedback']),
	portal: new Set(['app', 'portal', 'common', 'components', 'feedback']),
	hosting: new Set(['hosting', 'account', 'lib', 'common', 'components', 'feedback']),
	haste: new Set(['haste', 'common', 'components', 'feedback']),
	blog: new Set(['blog', 'common', 'components', 'feedback']),
};

function detectAppName() {
	const argApp = (process.argv[2] || '').trim().toLowerCase();
	if (VALID_APPS.has(argApp)) return argApp;

	const cwdBase = path.basename(process.cwd()).toLowerCase();
	if (VALID_APPS.has(cwdBase)) return cwdBase;

	const prodUrl = (process.env.VERCEL_PROJECT_PRODUCTION_URL || '').toLowerCase();
	for (const app of VALID_APPS) {
		if (prodUrl.startsWith(`${app}.`)) return app;
	}
	if (prodUrl === 'xernerx.com') return 'www';

	const projName = (process.env.VERCEL_PROJECT_NAME || '').toLowerCase().replace(/^xernerx[-_]?/, '');
	if (VALID_APPS.has(projName)) return projName;

	return null;
}

function proceedBuild(reason) {
	console.log(`[vercel-ignore] ▶ BUILD: ${reason}`);
	process.exit(1);
}

function skipBuild(reason) {
	console.log(`[vercel-ignore] ⏭ SKIP: ${reason}`);
	process.exit(0);
}

function isDocOrMetaFile(filePath) {
	const base = path.basename(filePath).toLowerCase();
	return (
		base === 'changelog.md' ||
		base === 'readme.md' ||
		base === 'agents.md' ||
		filePath.startsWith('.changeset/') ||
		filePath.startsWith('.github/') ||
		filePath.startsWith('.xernerx/') ||
		filePath.startsWith('services/') ||
		filePath.startsWith('clients/')
	);
}

function isVersionOnlyPackageJsonChange(prevSha, currSha, filePath) {
	try {
		const prevRaw = execSync(`git show ${prevSha}:"${filePath}"`, { cwd: repoRoot, stdio: ['pipe', 'pipe', 'ignore'] }).toString('utf8');
		const currRaw = execSync(`git show ${currSha}:"${filePath}"`, { cwd: repoRoot, stdio: ['pipe', 'pipe', 'ignore'] }).toString('utf8');
		const prevJson = JSON.parse(prevRaw);
		const currJson = JSON.parse(currRaw);
		delete prevJson.version;
		delete currJson.version;
		return JSON.stringify(prevJson) === JSON.stringify(currJson);
	} catch {
		return false;
	}
}

function getChangedDictionaryNamespaces(prevSha, currSha, changedDictFiles) {
	const changedNamespaces = new Set();
	for (const filePath of changedDictFiles) {
		try {
			const prevRaw = execSync(`git show ${prevSha}:"${filePath}"`, { cwd: repoRoot, stdio: ['pipe', 'pipe', 'ignore'] }).toString('utf8');
			const currRaw = execSync(`git show ${currSha}:"${filePath}"`, { cwd: repoRoot, stdio: ['pipe', 'pipe', 'ignore'] }).toString('utf8');
			const prevJson = JSON.parse(prevRaw);
			const currJson = JSON.parse(currRaw);
			const allKeys = new Set([...Object.keys(prevJson), ...Object.keys(currJson)]);
			for (const key of allKeys) {
				if (key === 'metadata') continue;
				if (JSON.stringify(prevJson[key]) !== JSON.stringify(currJson[key])) {
					changedNamespaces.add(key);
				}
			}
		} catch {
			return null;
		}
	}
	return changedNamespaces;
}

function main() {
	const appName = detectAppName();
	if (!appName) {
		proceedBuild('Could not determine target app name; building by default.');
	}

	const prevEnvSha = (process.env.VERCEL_GIT_PREVIOUS_SHA || '').trim();
	const currEnvSha = (process.env.VERCEL_GIT_COMMIT_SHA || 'HEAD').trim();

	if (prevEnvSha && prevEnvSha === currEnvSha) {
		proceedBuild(`[${appName}] Manual redeploy detected (${currEnvSha.slice(0, 7)}).`);
	}

	let prevSha = prevEnvSha || 'HEAD~1';
	let changedFiles = [];

	try {
		const raw = execSync(`git diff --name-only ${prevSha} ${currEnvSha}`, { cwd: repoRoot, stdio: ['pipe', 'pipe', 'ignore'] }).toString('utf8');
		changedFiles = raw
			.split(/\r?\n/)
			.map((f) => f.trim().replace(/\\/g, '/'))
			.filter(Boolean);
	} catch {
		try {
			const raw = execSync('git diff --name-only HEAD~1 HEAD', { cwd: repoRoot, stdio: ['pipe', 'pipe', 'ignore'] }).toString('utf8');
			prevSha = 'HEAD~1';
			changedFiles = raw
				.split(/\r?\n/)
				.map((f) => f.trim().replace(/\\/g, '/'))
				.filter(Boolean);
		} catch {
			proceedBuild(`[${appName}] Initial branch deployment or shallow clone without parent commit.`);
		}
	}

	if (changedFiles.length === 0) {
		proceedBuild(`[${appName}] No git diff range found; proceeding with build.`);
	}

	const reasons = [];
	const changedDictFiles = [];

	for (const file of changedFiles) {
		if (isDocOrMetaFile(file)) continue;

		// 1. Direct changes inside apps/<appName>
		if (file.startsWith(`apps/${appName}/`)) {
			if (file === `apps/${appName}/package.json` && isVersionOnlyPackageJsonChange(prevSha, currEnvSha, file)) {
				continue;
			}
			reasons.push(file);
			continue;
		}

		// 2. Ignore changes inside other apps/*
		if (file.startsWith('apps/')) {
			continue;
		}

		// 3. Shared static assets in packages/public/
		if (file.startsWith('packages/public/')) {
			reasons.push(file);
			continue;
		}

		// 4. Shared UI / layout / provider / style packages
		if (
			file.startsWith('packages/ui/') ||
			file.startsWith('packages/components/') ||
			file.startsWith('packages/providers/') ||
			file.startsWith('packages/feedback/') ||
			file.startsWith('packages/styles/')
		) {
			if (file.endsWith('/package.json') && isVersionOnlyPackageJsonChange(prevSha, currEnvSha, file)) {
				continue;
			}
			if (appName !== 'api') {
				reasons.push(file);
			}
			continue;
		}

		// 5. Shared @xernerx/lib package
		if (file.startsWith('packages/lib/')) {
			if (file === 'packages/lib/package.json' && isVersionOnlyPackageJsonChange(prevSha, currEnvSha, file)) {
				continue;
			}
			if (file === 'packages/lib/src/i18n.config.ts') {
				continue;
			}
			if (file.startsWith('packages/lib/src/dictionaries/') && file.endsWith('.json')) {
				changedDictFiles.push(file);
				continue;
			}
			if (file.startsWith('packages/lib/src/models/virtue/')) {
				if (appName === 'api' || appName === 'app') {
					reasons.push(file);
				}
				continue;
			}
			reasons.push(file);
			continue;
		}

		// 6. Root lockfile or root config changes
		if (file === 'pnpm-lock.yaml' || file === 'package.json' || file === 'tsconfig.json') {
			reasons.push(file);
		}
	}

	if (changedDictFiles.length > 0) {
		const changedNs = getChangedDictionaryNamespaces(prevSha, currEnvSha, changedDictFiles);
		const appNs = APP_DICTIONARY_NAMESPACES[appName];
		if (!changedNs || !appNs) {
			reasons.push(...changedDictFiles);
		} else {
			for (const ns of changedNs) {
				if (appNs.has(ns)) {
					reasons.push(`dictionaries:${ns}`);
				}
			}
		}
	}

	if (reasons.length > 0) {
		proceedBuild(`[${appName}] Relevant changes detected: ${reasons.slice(0, 6).join(', ')}${reasons.length > 6 ? ` (+${reasons.length - 6} more)` : ''}`);
	}

	skipBuild(`[${appName}] No relevant changes in ${changedFiles.length} modified file(s).`);
}

main();
