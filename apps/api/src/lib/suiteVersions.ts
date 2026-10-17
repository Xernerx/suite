/** @format */

import fs from 'fs';
import path from 'path';

export interface SuiteAppVersionInfo {
	id: string;
	name: string;
	domain: string;
	localVersion: string | null;
	canaryVersion: string | null;
	prodVersion: string | null;
	versions: string[];
}

export const SUITE_APPS = [
	{ id: 'app', name: 'App', domain: 'app.xernerx.com' },
	{ id: 'www', name: 'Website', domain: 'xernerx.com' },
	{ id: 'account', name: 'Account', domain: 'account.xernerx.com' },
	{ id: 'store', name: 'Store', domain: 'store.xernerx.com' },
	{ id: 'info', name: 'Info & Support', domain: 'info.xernerx.com' },
	{ id: 'docs', name: 'Docs', domain: 'docs.xernerx.com' },
	{ id: 'admin', name: 'Admin', domain: 'admin.xernerx.com' },
	{ id: 'api', name: 'API', domain: 'api.xernerx.com' },
	{ id: 'cdn', name: 'CDN', domain: 'cdn.xernerx.com' },
] as const;

export function compareSemver(a?: string | null, b?: string | null): number {
	if (!a || !b) return -1;
	const parse = (v: string) =>
		v
			.trim()
			.replace(/^v/i, '')
			.split('-')[0]
			.split('.')
			.map((n) => parseInt(n, 10) || 0);
	const [a1 = 0, a2 = 0, a3 = 0] = parse(a);
	const [b1 = 0, b2 = 0, b3 = 0] = parse(b);
	if (a1 !== b1) return a1 - b1;
	if (a2 !== b2) return a2 - b2;
	return a3 - b3;
}

function resolveMonorepoRoot(): string {
	const cwd = process.cwd();
	if (fs.existsSync(path.join(cwd, 'apps'))) return cwd;
	const twoUp = path.resolve(cwd, '..', '..');
	if (fs.existsSync(path.join(twoUp, 'apps'))) return twoUp;
	return cwd;
}

function readLocalAppVersions(appId: string): { localVersion: string | null; versions: string[] } {
	const root = resolveMonorepoRoot();
	const appDir = path.join(root, 'apps', appId);
	const versionSet = new Set<string>();
	let localVersion: string | null = null;

	try {
		const pkgPath = path.join(appDir, 'package.json');
		if (fs.existsSync(pkgPath)) {
			const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
			if (pkg?.version) {
				localVersion = String(pkg.version).trim();
				versionSet.add(localVersion);
			}
		}
	} catch {}

	try {
		const changelogPath = path.join(appDir, 'CHANGELOG.md');
		if (fs.existsSync(changelogPath)) {
			const content = fs.readFileSync(changelogPath, 'utf8');
			const versionRegex = /^#{1,3}\s+(?:\[?v?([\d]+\.[\d]+\.[\d]+[\w.-]*)\]?|([\d]+\.[\d]+\.[\d]+[\w.-]*))/gm;
			for (const match of content.matchAll(versionRegex)) {
				const ver = (match[1] || match[2] || '').trim();
				if (ver) versionSet.add(ver);
			}
		}
	} catch {}

	const sorted = Array.from(versionSet).sort((a, b) => compareSemver(b, a));
	return { localVersion, versions: sorted };
}

async function fetchRemoteVersion(url: string): Promise<string | null> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 2500);
		const res = await fetch(url, {
			signal: controller.signal,
			cache: 'no-store',
		});
		clearTimeout(timeout);
		if (!res.ok) return null;
		const data = await res.json();
		return data?.version ? String(data.version).trim() : null;
	} catch {
		return null;
	}
}

let cachedApps: Record<string, SuiteAppVersionInfo> | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

export async function getSuiteVersionsMap(forceRefresh = false): Promise<Record<string, SuiteAppVersionInfo>> {
	const now = Date.now();
	if (!forceRefresh && cachedApps && now - cachedAt < CACHE_TTL_MS) {
		return cachedApps;
	}

	const baseDomain = process.env.NEXT_PUBLIC_DOMAIN && !/^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)$/.test(process.env.NEXT_PUBLIC_DOMAIN) ? process.env.NEXT_PUBLIC_DOMAIN : 'xernerx.com';
	const envMode = (process.env.NEXT_PUBLIC_ENVIRONMENT || '').toLowerCase();
	const isLocalOrCanary = process.env.NODE_ENV !== 'production' || envMode === 'canary' || envMode === 'dev' || envMode === 'development';

	const entries = await Promise.all(
		SUITE_APPS.map(async (app) => {
			const { localVersion, versions } = readLocalAppVersions(app.id);
			const prodUrl = `https://${app.id}.${baseDomain}/api/version`;
			const canaryUrl = `https://${app.id}.canary.${baseDomain}/api/version`;

			const [remoteProd, remoteCanary] = await Promise.all([fetchRemoteVersion(prodUrl), fetchRemoteVersion(canaryUrl)]);

			const prodVersion = remoteProd || (!isLocalOrCanary ? localVersion : null);
			const canaryVersion = remoteCanary || (isLocalOrCanary ? localVersion : prodVersion);

			const combinedSet = new Set<string>(versions);
			if (canaryVersion) combinedSet.add(canaryVersion);
			if (prodVersion) combinedSet.add(prodVersion);
			const allVersions = Array.from(combinedSet).sort((a, b) => compareSemver(b, a));

			const info: SuiteAppVersionInfo = {
				id: app.id,
				name: app.name,
				domain: app.domain,
				localVersion,
				canaryVersion,
				prodVersion,
				versions: allVersions,
			};
			return [app.id, info] as const;
		})
	);

	cachedApps = Object.fromEntries(entries);
	cachedAt = now;
	return cachedApps;
}

export async function enrichIssuesWithVersionStatus<T extends Record<string, any>>(issues: T[]): Promise<T[]> {
	const hasVersionedIssue = issues.some((i) => i?.resolvedApp && i?.resolvedVersion);
	if (!hasVersionedIssue) return issues;

	const versionsMap = await getSuiteVersionsMap();

	return issues.map((issue) => {
		if (!issue?.resolvedApp || !issue?.resolvedVersion) return issue;
		const appInfo = versionsMap[issue.resolvedApp];
		if (!appInfo) {
			return {
				...issue,
				releaseStatus: 'pending',
				liveCanaryVersion: null,
				liveProdVersion: null,
			};
		}

		const isLiveOnProd = appInfo.prodVersion ? compareSemver(appInfo.prodVersion, issue.resolvedVersion) >= 0 : false;
		const isLiveOnCanary = isLiveOnProd || (appInfo.canaryVersion ? compareSemver(appInfo.canaryVersion, issue.resolvedVersion) >= 0 : false);

		const releaseStatus: 'production' | 'canary' | 'pending' = isLiveOnProd ? 'production' : isLiveOnCanary ? 'canary' : 'pending';

		return {
			...issue,
			releaseStatus,
			liveCanaryVersion: appInfo.canaryVersion,
			liveProdVersion: appInfo.prodVersion,
		};
	});
}
