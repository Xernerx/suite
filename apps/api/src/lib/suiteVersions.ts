/** @format */

export interface SuiteAppVersionInfo {
	id: string;
	name: string;
	domain: string;
	localVersion: string | null;
	devVersion: string | null;
	canaryVersion: string | null;
	prodVersion: string | null;
	devLatencyMs: number | null;
	canaryLatencyMs: number | null;
	prodLatencyMs: number | null;
	versions: string[];
}

export const SUITE_APPS = [
	{ id: 'www', name: 'Website', domain: 'www.xernerx.com', devPort: 4000 },
	{ id: 'app', name: 'App', domain: 'app.xernerx.com', devPort: 4004 },
	{ id: 'account', name: 'Account', domain: 'account.xernerx.com', devPort: 4003 },
	{ id: 'store', name: 'Store', domain: 'store.xernerx.com', devPort: 4008 },
	{ id: 'info', name: 'Info & Support', domain: 'info.xernerx.com', devPort: 4007 },
	{ id: 'docs', name: 'Docs', domain: 'docs.xernerx.com', devPort: 4005 },
	{ id: 'admin', name: 'Admin', domain: 'admin.xernerx.com', devPort: 4006 },
	{ id: 'api', name: 'API', domain: 'api.xernerx.com', devPort: 4001 },
	{ id: 'cdn', name: 'CDN', domain: 'cdn.xernerx.com', devPort: 4002 },
] as const;

const FETCH_HEADERS: Record<string, string> = {
	Accept: 'application/json',
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 XernerxSuite/1.0',
};

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

async function fetchRemoteVersion(url: string, timeoutMs = 6000): Promise<{ version: string | null; latencyMs: number | null }> {
	const start = Date.now();
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);
		const res = await fetch(url, {
			headers: FETCH_HEADERS,
			signal: controller.signal,
			cache: 'no-store',
		});
		clearTimeout(timeout);
		const latencyMs = Date.now() - start;
		if (!res.ok) return { version: null, latencyMs: null };
		const data = await res.json();
		return {
			version: data?.version ? String(data.version).trim() : null,
			latencyMs,
		};
	} catch {
		return { version: null, latencyMs: null };
	}
}

async function fetchRemoteChangelogVersions(url: string, timeoutMs = 5000): Promise<string[]> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);
		const res = await fetch(url, {
			headers: FETCH_HEADERS,
			signal: controller.signal,
			cache: 'no-store',
		});
		clearTimeout(timeout);
		if (!res.ok) return [];
		const data = await res.json();
		if (Array.isArray(data?.versions)) {
			return data.versions.map((v: any) => String(v).trim()).filter(Boolean);
		}
		return [];
	} catch {
		return [];
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
	const isDevEnv = process.env.ENVIRONMENT?.toLowerCase() === 'development' || process.env.NEXT_PUBLIC_ENVIRONMENT?.toLowerCase() === 'development';

	const entries = await Promise.all(
		SUITE_APPS.map(async (app) => {
			const prodHost = app.id === 'www' ? `www.${baseDomain}` : `${app.id}.${baseDomain}`;
			const canaryHost = `${app.id}.canary.${baseDomain}`;

			const prodUrl = `https://${prodHost}/api/version`;
			const canaryUrl = `https://${canaryHost}/api/version`;
			const changelogUrl = `https://${canaryHost}/api/changelog`;

			const devPromise = isDevEnv
				? fetchRemoteVersion(`http://127.0.0.1:${app.devPort}/api/version`, 2000).then((res) =>
						res.version ? res : fetchRemoteVersion(`https://${app.id}.dev.${baseDomain}/api/version`, 2500)
					)
				: Promise.resolve({ version: null, latencyMs: null });

			const [remoteProd, remoteCanary, remoteDev, changelogVersions] = await Promise.all([
				fetchRemoteVersion(prodUrl),
				fetchRemoteVersion(canaryUrl),
				devPromise,
				fetchRemoteChangelogVersions(changelogUrl),
			]);

			const prodVersion = remoteProd.version;
			const canaryVersion = remoteCanary.version;
			const devVersion = remoteDev.version;
			const localVersion = devVersion || canaryVersion || prodVersion;

			const combinedSet = new Set<string>(changelogVersions);
			if (devVersion) combinedSet.add(devVersion);
			if (canaryVersion) combinedSet.add(canaryVersion);
			if (prodVersion) combinedSet.add(prodVersion);
			const allVersions = Array.from(combinedSet).sort((a, b) => compareSemver(b, a));

			const info: SuiteAppVersionInfo = {
				id: app.id,
				name: app.name,
				domain: app.domain,
				localVersion,
				devVersion,
				canaryVersion,
				prodVersion,
				devLatencyMs: remoteDev.latencyMs,
				canaryLatencyMs: remoteCanary.latencyMs,
				prodLatencyMs: remoteProd.latencyMs,
				versions: allVersions,
			};
			return [app.id, info] as const;
		})
	);

	const result = Object.fromEntries(entries);
	const hasAnyLiveVersion = entries.some(([, info]) => Boolean(info.prodVersion || info.canaryVersion || info.devVersion));
	if (hasAnyLiveVersion) {
		cachedApps = result;
		cachedAt = now;
	}
	return result;
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
