/** @format */

import http from 'http';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { spawn, execSync, type ChildProcess } from 'child_process';
import { pipeStreamToTerminal, terminal, type Terminal } from './terminal';

export interface AppDefinition {
	id: string;
	label: string;
	port: number;
	internalPort: number;
	dir: string;
	color: string;
}

export const SUITE_APPS: AppDefinition[] = [
	{ id: 'www', label: 'WWW', port: 4000, internalPort: 14000, dir: 'apps/www', color: '\x1b[36m' },
	{ id: 'api', label: 'API', port: 4001, internalPort: 14001, dir: 'apps/api', color: '\x1b[32m' },
	{ id: 'cdn', label: 'CDN', port: 4002, internalPort: 14002, dir: 'apps/cdn', color: '\x1b[35m' },
	{ id: 'account', label: 'Account', port: 4003, internalPort: 14003, dir: 'apps/account', color: '\x1b[34m' },
	{ id: 'app', label: 'App', port: 4004, internalPort: 14004, dir: 'apps/app', color: '\x1b[95m' },
	{ id: 'docs', label: 'Docs', port: 4005, internalPort: 14005, dir: 'apps/docs', color: '\x1b[96m' },
	{ id: 'admin', label: 'Admin', port: 4006, internalPort: 14006, dir: 'apps/admin', color: '\x1b[31m' },
	{ id: 'info', label: 'Info', port: 4007, internalPort: 14007, dir: 'apps/info', color: '\x1b[33m' },
	{ id: 'store', label: 'Store', port: 4008, internalPort: 14008, dir: 'apps/store', color: '\x1b[92m' },
	{ id: 'portal', label: 'Portal', port: 4009, internalPort: 14009, dir: 'apps/portal', color: '\x1b[94m' },
	{ id: 'hosting', label: 'Hosting', port: 4010, internalPort: 14010, dir: 'apps/hosting', color: '\x1b[93m' },
	{ id: 'haste', label: 'Haste', port: 4011, internalPort: 14011, dir: 'apps/haste', color: '\x1b[90m' },
];

type AppState = 'sleeping' | 'booting' | 'running';

interface ManagedApp extends AppDefinition {
	state: AppState;
	child: ChildProcess | null;
	lastActiveAt: number;
	bootStartedAt: number;
	activeRequestsCount: number;
	pendingQueue: Array<() => void>;
	activeSockets: Set<net.Socket>;
	server: http.Server | null;
	readinessTimer: NodeJS.Timeout | null;
	logger: Terminal;
}

export interface LazySupervisorOptions {
	domain: string;
	isCustomDomain: boolean;
	idleTimeoutSeconds?: number;
}

const CORS_JSON_HEADERS: http.OutgoingHttpHeaders = {
	'Content-Type': 'application/json; charset=utf-8',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Cache-Control': 'no-store, max-age=0',
};

function getAppDisplayUrl(app: AppDefinition, domain: string, isCustomDomain: boolean): string {
	return isCustomDomain ? `https://${app.id}.dev.${domain}` : `http://${domain}:${app.port}`;
}

function serveStaticAppVersion(app: AppDefinition, res: http.ServerResponse): boolean {
	try {
		const pkgPath = path.join(process.cwd(), app.dir, 'package.json');
		const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
		res.writeHead(200, CORS_JSON_HEADERS);
		res.end(JSON.stringify({ version: pkg.version || '0.0.0' }));
		return true;
	} catch {
		return false;
	}
}

function serveStaticAppChangelog(app: AppDefinition, reqUrl: string, res: http.ServerResponse): boolean {
	try {
		const parsedUrl = new URL(reqUrl, 'http://localhost');
		const requestedVersion = parsedUrl.searchParams.get('version');
		const changelogPath = path.join(process.cwd(), app.dir, 'CHANGELOG.md');
		if (!fs.existsSync(changelogPath)) {
			res.writeHead(404, CORS_JSON_HEADERS);
			res.end(JSON.stringify({ error: 'Changelog not found' }));
			return true;
		}
		const content = fs.readFileSync(changelogPath, 'utf8');
		const versionRegex = /^#{1,3}\s+(?:\[?v?([\d.-]+\w*)\]?|([\d.-]+\w*))/gm;
		const matches = [...content.matchAll(versionRegex)];

		const versions: string[] = [];
		const parsedSections: { version: string; content: string }[] = [];

		for (let i = 0; i < matches.length; i++) {
			const currentMatch = matches[i];
			const version = currentMatch[1] || currentMatch[2];
			versions.push(version);
			const startIndex = currentMatch.index!;
			const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
			parsedSections.push({ version, content: content.slice(startIndex, endIndex).trim() });
		}

		if (parsedSections.length === 0 || requestedVersion === 'all') {
			res.writeHead(200, CORS_JSON_HEADERS);
			res.end(
				JSON.stringify({
					versions: versions.length > 0 ? versions : ['latest'],
					selectedVersion: requestedVersion === 'all' ? 'all' : 'latest',
					content: content.trim(),
					fullContent: content.trim(),
				})
			);
			return true;
		}

		if (requestedVersion) {
			const found = parsedSections.find((s) => s.version === requestedVersion);
			if (found) {
				res.writeHead(200, CORS_JSON_HEADERS);
				res.end(
					JSON.stringify({
						versions,
						selectedVersion: found.version,
						content: found.content,
						fullContent: content.trim(),
					})
				);
				return true;
			}
		}

		res.writeHead(200, CORS_JSON_HEADERS);
		res.end(
			JSON.stringify({
				versions,
				selectedVersion: parsedSections[0].version,
				content: parsedSections[0].content,
				fullContent: content.trim(),
			})
		);
		return true;
	} catch {
		return false;
	}
}

function killProcessTree(pid: number | undefined) {
	if (!pid) return;
	try {
		if (process.platform === 'win32') {
			execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
		} else {
			process.kill(-pid, 'SIGTERM');
		}
	} catch {
		try {
			process.kill(pid, 'SIGKILL');
		} catch {}
	}
}

function probePortReady(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const socket = new net.Socket();
		let settled = false;
		const finish = (ok: boolean) => {
			if (settled) return;
			settled = true;
			socket.destroy();
			resolve(ok);
		};
		socket.setTimeout(400);
		socket.once('connect', () => finish(true));
		socket.once('timeout', () => finish(false));
		socket.once('error', () => finish(false));
		socket.connect(port, '127.0.0.1');
	});
}

function isBrowserDocumentNavigation(req: http.IncomingMessage, app: AppDefinition): boolean {
	if (req.method !== 'GET') return false;
	const url = req.url || '/';

	if (
		url.startsWith('/__suite_status') ||
		url.startsWith('/_next/') ||
		url.startsWith('/api/') ||
		url.startsWith('/v1/') ||
		url.startsWith('/v2/') ||
		url.startsWith('/secure/') ||
		url.startsWith('/core/') ||
		url.startsWith('/info/') ||
		url.startsWith('/raw/')
	) {
		return false;
	}

	// API and CDN requests should always hold and proxy unless the user explicitly navigates to root in a browser
	if ((app.id === 'api' || app.id === 'cdn') && url !== '/') {
		return false;
	}

	if (req.headers['rsc'] || req.headers['next-router-state-tree'] || req.headers['x-nextjs-data']) {
		return false;
	}

	const accept = req.headers['accept'] || '';
	return accept.includes('text/html');
}

const FULL_LOGO_BOUNDS = {
	minX: 195,
	maxX: 1800,
	minY: 205,
	maxY: 710,
};

const FULL_LOGO_PATHS = [
	{
		tx: 570.5,
		ty: 430,
		d: 'M0 0.0153 C8.1594 0.0153 10.565 2.4793 23.3125 -0.4375 C25.5131 -0.9296 27.7144 -1.4181 29.9162 -1.9046 C31.901 -2.3448 33.8838 -2.7941 35.8665 -3.2439 C48.2374 -5.8182 61.1957 -7.1671 72.3125 -0.25 C76.9991 4.5705 79.257 9.7195 79.75 16.375 C79.4098 21.3086 77.8828 24.5967 74.3984 28.1328 C68.7038 32.6286 62.8926 36.8577 56.9375 41 C34.3906 56.715 26.2814 73.8897 18.7837 99.6201 C13.2209 118.4025 13.2209 118.4025 8.3452 121.2651 C7.4318 121.6289 7.4318 121.6289 6.5 122 C6.8614 126.0172 7.2344 130.0331 7.6169 134.0483 C7.807 136.0668 7.9886 138.0862 8.1699 140.1055 C9.3096 151.9701 11.3501 163.5628 15.1875 174.875 C15.4417 175.6262 15.6959 176.3774 15.9578 177.1514 C29.645 216.1688 58.1805 237.4706 91.8555 258.7578 C92.8348 259.3793 92.8348 259.3793 93.834 260.0134 C95.5673 261.1114 97.305 262.2024 99.043 263.293 C101.5 265 101.5 265 102.5 267 C95.1286 266.5442 88.4199 265.1224 81.375 262.9375 C79.8699 262.4711 79.8699 262.4711 78.3345 261.9954 C46.3636 251.7364 23.7571 228.4287 8.502 199.0376 C5.2008 192.3244 2.2408 185.2824 0.5 178 C0.1474 178.9044 0.1474 178.9044 0 179.8271 C-0.1474 178.9044 -0.1474 178.9044 -0.5 178 C-2.2408 185.2824 -5.2008 192.3244 -8.502 199.0376 C-23.7571 228.4287 -46.3636 251.7364 -78.3345 261.9954 C-79.8699 262.4711 -79.8699 262.4711 -81.375 262.9375 C-88.4199 265.1224 -95.1286 266.5442 -102.5 267 C-101.5 265 -101.5 265 -99.043 263.293 C-97.305 262.2024 -95.5673 261.1114 -93.834 260.0134 C-92.8348 259.3793 -92.8348 259.3793 -91.8555 258.7578 C-58.1805 237.4706 -29.645 216.1688 -15.9578 177.1514 C-15.6959 176.3774 -15.4417 175.6262 -15.1875 174.875 C-11.3501 163.5628 -9.3096 151.9701 -8.1699 140.1055 C-7.9886 138.0862 -7.807 136.0668 -7.6169 134.0483 C-7.2344 130.0331 -6.8614 126.0172 -6.5 122 C-7.4318 121.6289 -7.4318 121.6289 -8.3452 121.2651 C-13.2209 118.4025 -13.2209 118.4025 -18.7837 99.6201 C-26.2814 73.8897 -34.3906 56.715 -56.9375 41 C-62.8926 36.8577 -68.7038 32.6286 -74.3984 28.1328 C-77.8828 24.5967 -79.4098 21.3086 -79.75 16.375 C-79.257 9.7195 -76.9991 4.5705 -72.3125 -0.25 C-61.1957 -7.1671 -48.2374 -5.8182 -35.8665 -3.2439 C-33.8838 -2.7941 -31.901 -2.3448 -29.9162 -1.9046 C-27.7144 -1.4181 -25.5131 -0.9296 -23.3125 -0.4375 C-10.565 2.4793 -8.1594 0.0153 0 0.0153 Z',
	},
	{
		tx: 756.20703125,
		ty: 435.84375,
		d: 'M0 0 C25.28558362 -0.6462769 47.51049305 6.42986115 66.66796875 23.03125 C85.12917489 40.62750944 93.99450299 64.9548829 94.94140625 90.09765625 C95.03706079 99.42397388 95.03706079 99.42397388 93.79296875 103.15625 C42.64296875 103.15625 -8.50703125 103.15625 -61.20703125 103.15625 C-57.47216034 118.09573365 -54.43145258 129.24911105 -45.20703125 141.15625 C-44.27890625 142.39761719 -44.27890625 142.39761719 -43.33203125 143.6640625 C-32.53323637 156.32882561 -15.35112434 163.00243357 0.79296875 165.15625 C22.03032234 166.36453786 41.36290097 163.25553407 58.79296875 150.15625 C61.01007934 148.06394365 63.10326664 145.93055723 65.13671875 143.66015625 C66.79296875 142.15625 66.79296875 142.15625 69.79296875 142.15625 C71.9140625 144.421875 71.9140625 144.421875 74.23046875 147.40625 C77.45522254 151.54920909 77.45522254 151.54920909 81.140625 155.265625 C82.79296875 157.15625 82.79296875 157.15625 82.7578125 159.16796875 C76.63319366 171.78914684 58.85869862 179.72999998 46.46484375 184.4140625 C19.51608719 193.20170051 -12.68025435 191.84880944 -38.20703125 179.15625 C-59.27842329 167.7903651 -75.7688872 149.33087923 -82.78125 126.2265625 C-89.57595654 101.99289019 -89.17149651 76.48280621 -79.20703125 53.15625 C-78.57861328 51.65384766 -78.57861328 51.65384766 -77.9375 50.12109375 C-68.68074127 29.87360131 -51.46721952 15.0219392 -31.2265625 6.25 C-21.11962998 2.58901539 -10.71632448 0.52211081 0 0 Z M-45.20703125 44.15625 C-54.44666721 55.21324083 -60.20703125 68.72313729 -60.20703125 83.15625 C-17.63703125 83.15625 24.93296875 83.15625 68.79296875 83.15625 C67.93856976 73.2261992 67.93856976 73.2261992 65.16796875 64.09375 C64.90363037 63.41183594 64.63929199 62.72992188 64.36694336 62.02734375 C61.96838246 56.10767022 58.84045455 51.10416766 54.79296875 46.15625 C54.24898437 45.45113281 53.705 44.74601562 53.14453125 44.01953125 C44.05862678 32.82211378 30.0088308 25.29051618 15.79296875 23.15625 C-8.22592365 21.33826115 -28.49184522 26.17250074 -45.20703125 44.15625 Z',
	},
	{
		tx: 1409.785400390625,
		ty: 457.89306640625,
		d: 'M0 0 C18.00963521 16.00280615 26.80246699 38.58864056 29.21459961 62.10693359 C29.21459961 68.37693359 29.21459961 74.64693359 29.21459961 81.10693359 C-21.93540039 81.10693359 -73.08540039 81.10693359 -125.78540039 81.10693359 C-123.23789396 95.41442492 -123.23789396 95.41442492 -117.78540039 108.10693359 C-117.35485352 108.94611328 -116.92430664 109.78529297 -116.48071289 110.64990234 C-107.74105361 126.57385781 -92.60901038 135.76635492 -75.68774414 141.07958984 C-53.85040526 146.6755706 -31.87076337 143.26043239 -12.46801758 132.15917969 C-9.38047246 130.22834401 -6.73046181 127.93067242 -4.16821289 125.35693359 C-2.78540039 124.10693359 -2.78540039 124.10693359 -0.78540039 124.10693359 C-0.12540039 122.78693359 0.53459961 121.46693359 1.21459961 120.10693359 C4.35707536 120.40758048 5.25918625 121.15437935 7.46850586 123.50537109 C8.61125977 124.97876953 8.61125977 124.97876953 9.77709961 126.48193359 C12.68987469 130.3078924 12.68987469 130.3078924 16.05444336 133.70849609 C17.21459961 135.10693359 17.21459961 135.10693359 17.13256836 137.03271484 C12.12668772 148.34387492 -3.38969546 156.03915006 -14.41040039 160.48193359 C-40.29572133 170.44708038 -71.80531751 170.83705943 -97.41040039 159.73193359 C-120.45927473 149.07899756 -137.76133909 132.08651054 -146.91040039 108.16552734 C-155.61343059 83.11231908 -155.37492479 53.24597007 -143.92602539 29.02490234 C-140.30535429 21.80045423 -136.04864324 15.24947716 -130.78540039 9.10693359 C-130.3174707 8.50751953 -129.84954102 7.90810547 -129.36743164 7.29052734 C-117.14087681 -8.01835223 -96.86420888 -17.76777587 -77.78540039 -20.89306641 C-76.78573242 -21.05935547 -76.78573242 -21.05935547 -75.76586914 -21.22900391 C-48.14451813 -25.02117455 -21.23584707 -18.02774456 0 0 Z M-110.47290039 21.85693359 C-120.33924616 33.7710115 -124.3993492 45.86037055 -125.78540039 61.10693359 C-83.21540039 61.10693359 -40.64540039 61.10693359 3.21459961 61.10693359 C3.21459961 55.52475922 2.80904257 51.56421312 1.15209961 46.41943359 C0.92804443 45.72245361 0.70398926 45.02547363 0.47314453 44.30737305 C-5.25817431 27.33901305 -16.86752418 14.16969354 -32.78540039 6.10693359 C-59.74012976 -5.11643123 -90.42063668 0.37873114 -110.47290039 21.85693359 Z',
	},
	{
		tx: 1185,
		ty: 452,
		d: 'M0 0 C0.94939453 0.70576172 0.94939453 0.70576172 1.91796875 1.42578125 C15.44490559 12.02636089 21.98495855 30.01790646 24.54051208 46.4822998 C25.19777536 51.95492507 25.13162677 57.41918248 25.11352539 62.92382812 C25.11367142 64.0954248 25.11381744 65.26702148 25.1139679 66.47412109 C25.11327413 70.32651657 25.10550689 74.17886302 25.09765625 78.03125 C25.09579016 80.7102466 25.09431793 83.38924053 25.09336853 86.0682373 C25.09026921 92.38618782 25.08207479 98.70412088 25.07201904 105.02206373 C25.06081432 112.21920783 25.0553365 119.4163528 25.05032361 126.61350346 C25.03989092 141.40901242 25.02156294 156.20450269 25 171 C16.42 171 7.84 171 -1 171 C-1.01981934 167.77661865 -1.03963867 164.5532373 -1.06005859 161.23217773 C-1.12721896 150.53527638 -1.20485359 139.83846904 -1.28752708 129.1416769 C-1.3372932 122.66161136 -1.38362379 116.18156058 -1.421875 109.70141602 C-1.45897791 103.43786248 -1.50540306 97.17443876 -1.55806351 90.91099739 C-1.57647546 88.5314571 -1.59163108 86.15188913 -1.60334396 83.77230644 C-1.31952161 51.06605811 -1.31952161 51.06605811 -16.03515625 22.77734375 C-29.33538037 10.22774956 -44.90404328 8.30122883 -62.4921875 8.72265625 C-78.15162726 9.36035902 -92.21119156 15.14112508 -103.52734375 26.140625 C-115.23878717 39.68371597 -119.1029564 56.1947736 -119.20532227 73.70874023 C-119.22017166 75.29035194 -119.22017166 75.29035194 -119.23532104 76.90391541 C-119.26678508 80.37211906 -119.29163358 83.84033639 -119.31640625 87.30859375 C-119.33698882 89.71997931 -119.35798563 92.13136137 -119.37937927 94.54273987 C-119.43446534 100.87691402 -119.48393384 107.21112001 -119.53222656 113.54534912 C-119.58254009 120.01398539 -119.63817466 126.48257566 -119.69335938 132.95117188 C-119.8007762 145.63407668 -119.90176558 158.31702075 -120 171 C-128.91 171 -137.82 171 -147 171 C-147 109.95 -147 48.9 -147 -14 C-138.42 -14 -129.84 -14 -121 -14 C-120.505 0.355 -120.505 0.355 -120 15 C-117.69 12.03 -115.38 9.06 -113 6 C-85.00053691 -22.04612886 -30.76624503 -24.57924877 0 0 Z',
	},
	{
		tx: 923,
		ty: 241,
		d: 'M0 0 C-2.8665 29.2121 -24.0529 56.7392 -45.8579 75.1042 C-52.3585 80.3265 -59.5937 84.2258 -67 88 C-67.9449 88.4924 -68.8898 88.9848 -69.8633 89.4922 C-87.0934 97.9112 -107.0049 101.3374 -126 102 C-127.1782 102.0529 -128.3564 102.1057 -129.5703 102.1602 C-157.427 102.8521 -184.3306 94.1725 -207.9971 79.8645 C-210.1922 78.6874 -210.1922 78.6874 -213.5 79.75 C-215.2443 80.7357 -215.2443 80.7357 -217 82 C-217.6987 82.4473 -218.3973 82.8946 -219.1172 83.3555 C-227.901 89.5102 -234.0772 98.5826 -239 108 C-242.6064 98.6617 -234.9699 83.5327 -231.2712 74.9622 C-215.014 38.8083 -184.791 13.3576 -148.0625 -0.625 C-130.0304 -7.1994 -111.0409 -10.9031 -92 -13 C-91.1586 -13.095 -90.3173 -13.19 -89.4504 -13.2878 C-60.4824 -16.2643 -25.5895 -15.8784 0 0 Z M-96 6 C-96.0396 6.7487 -96.0793 7.4974 -96.1201 8.2688 C-97.1511 26.8646 -98.8591 44.3632 -105 62 C-118.4039 48.7692 -123.4704 30.1729 -126 12 C-142.5534 15.6448 -157.8922 22.7564 -172 32 C-173.0261 32.62 -174.0522 33.2401 -175.1094 33.8789 C-180.342 37.0772 -180.342 37.0772 -183.125 42.3125 C-183.0838 43.5294 -183.0425 44.7463 -183 46 C-183.0438 46.7399 -183.0877 47.4798 -183.1328 48.2422 C-183.4652 55.1783 -182.0847 61.4107 -180 68 C-179.7216 69.0596 -179.7216 69.0596 -179.4375 70.1406 C-178.0827 73.6816 -176.4356 74.7927 -173.0039 76.4258 C-169.0371 77.8488 -165.0864 78.9853 -161 80 C-159.7406 80.321 -158.4812 80.642 -157.1836 80.9727 C-148.2576 82.987 -139.3791 83.2744 -130.25 83.3125 C-129.1379 83.3181 -128.0257 83.3236 -126.8799 83.3293 C-95.8812 83.0612 -68.1203 71.5531 -46 50 C-43.5425 47.4227 -41.2502 44.7585 -39 42 C-38.4921 41.4496 -37.9842 40.8991 -37.4609 40.332 C-33.922 36.1703 -33.3215 32.6649 -33.5625 27.2578 C-34.496 20.3064 -35.8503 12.2994 -39 6 C-57.0363 1.1464 -77.7521 3.7615 -96 6 Z',
	},
	{
		tx: 218,
		ty: 241,
		d: 'M0 0 C25.5895 -15.8784 60.4824 -16.2643 89.4504 -13.2878 C90.3173 -13.19 91.1586 -13.095 92 -13 C111.0409 -10.9031 130.0304 -7.1994 148.0625 -0.625 C184.791 13.3576 215.014 38.8083 231.2712 74.9622 C234.9699 83.5327 242.6064 98.6617 239 108 C234.0772 98.5826 227.901 89.5102 219.1172 83.3555 C218.3973 82.8946 217.6987 82.4473 217 82 C215.2443 80.7357 215.2443 80.7357 213.5 79.75 C210.1922 78.6874 210.1922 78.6874 207.9971 79.8645 C184.3306 94.1725 157.427 102.8521 129.5703 102.1602 C128.3564 102.1057 127.1782 102.0529 126 102 C107.0049 101.3374 87.0934 97.9112 69.8633 89.4922 C68.8898 88.9848 67.9449 88.4924 67 88 C59.5937 84.2258 52.3585 80.3265 45.8579 75.1042 C24.0529 56.7392 2.8665 29.2121 0 0 Z M96 6 C77.7521 3.7615 57.0363 1.1464 39 6 C35.8503 12.2994 34.496 20.3064 33.5625 27.2578 C33.3215 32.6649 33.922 36.1703 37.4609 40.332 C37.9842 40.8991 38.4921 41.4496 39 42 C41.2502 44.7585 43.5425 47.4227 46 50 C68.1203 71.5531 95.8812 83.0612 126.8799 83.3293 C128.0257 83.3236 129.1379 83.3181 130.25 83.3125 C139.3791 83.2744 148.2576 82.987 157.1836 80.9727 C158.4812 80.642 159.7406 80.321 161 80 C165.0864 78.9853 169.0371 77.8488 173.0039 76.4258 C176.4356 74.7927 178.0827 73.6816 179.4375 70.1406 C179.7216 69.0596 179.7216 69.0596 180 68 C182.0847 61.4107 183.4652 55.1783 183.1328 48.2422 C183.0877 47.4798 183.0438 46.7399 183 46 C183.0425 44.7463 183.0838 43.5294 183.125 42.3125 C180.342 37.0772 180.342 37.0772 175.1094 33.8789 C174.0522 33.2401 173.0261 32.62 172 32 C157.8922 22.7564 142.5534 15.6448 126 12 C123.4704 30.1729 118.4039 48.7692 105 62 C98.8591 44.3632 97.1511 26.8646 96.1201 8.2688 C96.0793 7.4974 96.0396 6.7487 96 6 Z',
	},
	{
		tx: 1602,
		ty: 438,
		d: 'M0 0 C25.19235589 -2.84233909 25.19235589 -2.84233909 32.63378906 1.55712891 C36.94934515 5.60779913 39.85295219 10.51601274 42.6796875 15.67480469 C44.56014027 18.98646004 46.8576191 21.86180437 49.25 24.8125 C50.83359645 26.87479799 52.4169332 28.93729541 54 31 C55.66609253 33.16710847 57.33305199 35.33354953 59 37.5 C59.83334905 38.58332124 60.66668241 39.66665456 61.5 40.75 C61.9125 41.28625 62.325 41.8225 62.75 42.375 C69.83333333 51.58333333 76.91666667 60.79166667 84 70 C87.7004016 66.55329023 90.58144638 62.68219558 93.5625 58.625 C97.5152668 53.29817617 101.51036127 48.01544152 105.625 42.8125 C109.04979768 38.4798514 112.45063638 34.13193969 115.8125 29.75 C119.98025112 24.31787494 124.17206086 18.90494597 128.375 13.5 C128.97030518 12.73397461 129.56561035 11.96794922 130.17895508 11.17871094 C130.74638428 10.44942383 131.31381348 9.72013672 131.8984375 8.96875 C132.65133057 8.00098633 132.65133057 8.00098633 133.41943359 7.01367188 C133.94102051 6.34916016 134.46260742 5.68464844 135 5 C135.58507324 4.10321533 136.17014648 3.20643066 136.77294922 2.2824707 C139 0 139 0 142.11621094 -0.56762695 C143.31020508 -0.54144287 144.50419922 -0.51525879 145.734375 -0.48828125 C147.67763672 -0.46411133 147.67763672 -0.46411133 149.66015625 -0.43945312 C151.02345428 -0.39767939 152.38673552 -0.3553547 153.75 -0.3125 C155.12886624 -0.2874091 156.50777597 -0.26459729 157.88671875 -0.24414062 C161.25891356 -0.18518617 164.62890741 -0.10293171 168 0 C166.64255131 2.91616587 165.08255825 5.34662063 163.09375 7.87109375 C162.52011719 8.60328125 161.94648437 9.33546875 161.35546875 10.08984375 C160.74316406 10.86457031 160.13085938 11.63929688 159.5 12.4375 C158.21846538 14.07139139 156.93721662 15.70550702 155.65625 17.33984375 C155.02847656 18.13890137 154.40070313 18.93795898 153.75390625 19.76123047 C151.48322077 22.65964164 149.23951631 25.57743122 147 28.5 C142.41705283 34.46989171 137.79589513 40.40954493 133.171875 46.34765625 C129.76757571 50.72144077 126.37502406 55.10358707 123 59.5 C118.89360422 64.84786428 114.76364373 70.17705429 110.625 75.5 C110.02945312 76.26634766 109.43390625 77.03269531 108.8203125 77.82226562 C105.90526436 81.568765 102.97802228 85.30314475 100 89 C101.41602311 93.22523025 103.45350012 95.97026632 106.375 99.3125 C110.40726429 104.00939881 114.19329947 108.83654568 117.875 113.8125 C121.86034887 119.18746022 125.92518683 124.47822017 130.125 129.6875 C134.17171876 134.70688767 138.15900511 139.7600494 142.07519531 144.88232422 C145.05359057 148.77633506 148.06056831 152.64700118 151.078125 156.51074219 C156.39566794 163.3223991 161.6759067 170.15987733 166.875 177.0625 C167.39304199 177.74739502 167.91108398 178.43229004 168.44482422 179.13793945 C172 183.88000451 172 183.88000451 172 185 C164.43053916 185.5554261 156.87757668 185.89768716 149.2890625 185.72265625 C147.41275146 185.6918396 147.41275146 185.6918396 145.49853516 185.66040039 C140.94744479 184.8013146 139.31549774 183.38157317 136 180.1875 C134.9962094 178.4790484 133.9970392 176.76517665 133.09960938 174.99853516 C130.90639312 171.01237435 127.99047761 167.4953326 125.25 163.875 C124.04328204 162.22693536 122.83887056 160.57717954 121.63671875 158.92578125 C118.19656083 154.23683038 114.65090809 149.63855731 111.0625 145.0625 C105.26105609 137.66364062 99.59092038 130.17401619 93.97290039 122.63500977 C92.32053122 120.41932781 90.66175093 118.20864946 89 116 C88.23945312 114.98550781 87.47890625 113.97101563 86.6953125 112.92578125 C86.13585938 112.29027344 85.57640625 111.65476562 85 111 C84.34 111 83.68 111 83 111 C81.14697959 113.27569284 79.40757523 115.56376329 77.6875 117.9375 C76.59325777 119.4224721 75.49817906 120.90682812 74.40234375 122.390625 C73.83757324 123.15826172 73.27280273 123.92589844 72.69091797 124.71679688 C70.08351943 128.23750019 67.41854722 131.71304904 64.75 135.1875 C63.65870991 136.61186865 62.56756788 138.03635076 61.4765625 139.4609375 C60.63399902 140.56066895 60.63399902 140.56066895 59.77441406 141.68261719 C57.23024051 145.00530505 54.68803088 148.32942947 52.1550293 151.66064453 C50.79925188 153.4317154 49.43081093 155.19316203 48.05004883 156.94482422 C44.56169058 161.40969233 41.46365535 165.80804967 38.73828125 170.78125 C32.40688222 181.72575589 32.40688222 181.72575589 27 185 C16.85800481 187.35463187 6.24134744 186.24648925 -4 185 C0.05124627 179.57933112 4.13542231 174.18522855 8.25 168.8125 C9.1018689 167.69959595 9.1018689 167.69959595 9.97094727 166.56420898 C11.64669404 164.37567568 13.32319307 162.1877211 15 160 C15.66588135 159.13084961 15.66588135 159.13084961 16.34521484 158.24414062 C21.47127005 151.55603363 26.63378871 144.89734323 31.8125 138.25 C37.56923504 130.85977671 43.27487867 123.43203482 48.95703125 115.984375 C51.77306344 112.29372681 54.60323329 108.61415273 57.4375 104.9375 C60.99487652 100.31813343 64.51646643 95.67526874 68 91 C66.73674614 88.34034633 65.3685394 85.99006361 63.6015625 83.63671875 C62.89205444 82.68937866 62.89205444 82.68937866 62.16821289 81.72290039 C61.65895264 81.05121826 61.14969238 80.37953613 60.625 79.6875 C60.09189209 78.98036865 59.55878418 78.2732373 59.00952148 77.54467773 C54.95346581 72.19201898 50.78557459 66.93697675 46.56835938 61.7109375 C42.28481375 56.39113957 38.13069307 50.97941053 33.99414062 45.54492188 C30.04639404 40.36087031 26.06602567 35.20358764 22.0625 30.0625 C21.49072021 29.32725098 20.91894043 28.59200195 20.32983398 27.83447266 C17.24443587 23.8700622 14.14769784 19.91496875 11.0390625 15.96875 C10.07214478 14.73692993 10.07214478 14.73692993 9.08569336 13.48022461 C7.84518082 11.90018658 6.60133882 10.32275538 5.35375977 8.74829102 C4.79744873 8.03858154 4.2411377 7.32887207 3.66796875 6.59765625 C3.17578857 5.97383057 2.6836084 5.35000488 2.17651367 4.70727539 C1 3 1 3 0 0 Z',
	},
	{
		tx: 1583,
		ty: 436,
		d: 'M0 0 C0 8.25 0 16.5 0 25 C-2.31 25.0825 -4.62 25.165 -7 25.25 C-25.66885515 26.25515683 -41.02813016 31.8757237 -53.78515625 45.97265625 C-64.21814349 58.96719534 -67.10884699 75.33249387 -67.20532227 91.52514648 C-67.22017166 93.07749748 -67.22017166 93.07749748 -67.23532104 94.66120911 C-67.26677938 98.06448112 -67.29163129 101.46776707 -67.31640625 104.87109375 C-67.33698931 107.23763888 -67.35798614 109.60418044 -67.37937927 111.97071838 C-67.43446025 118.18652451 -67.48393097 124.40236304 -67.53222656 130.6182251 C-67.58254384 136.96621572 -67.63817644 143.31415952 -67.69335938 149.66210938 C-67.80076996 162.10803433 -67.90176122 174.55399926 -68 187 C-76.91 187 -85.82 187 -95 187 C-95 125.95 -95 64.9 -95 2 C-86.42 2 -77.84 2 -69 2 C-68.67 11.9 -68.34 21.8 -68 32 C-65.36 28.37 -62.72 24.74 -60 21 C-43.69805366 4.69805366 -22.35799255 0 0 0 Z',
	},
	{
		tx: 995,
		ty: 436,
		d: 'M0 0 C0 8.25 0 16.5 0 25 C-2.31 25.0825 -4.62 25.165 -7 25.25 C-25.66885515 26.25515683 -41.02813016 31.8757237 -53.78515625 45.97265625 C-64.21814349 58.96719534 -67.10884699 75.33249387 -67.20532227 91.52514648 C-67.22017166 93.07749748 -67.22017166 93.07749748 -67.23532104 94.66120911 C-67.26677938 98.06448112 -67.29163129 101.46776707 -67.31640625 104.87109375 C-67.33698931 107.23763888 -67.35798614 109.60418044 -67.37937927 111.97071838 C-67.43446025 118.18652451 -67.48393097 124.40236304 -67.53222656 130.6182251 C-67.58254384 136.96621572 -67.63817644 143.31415952 -67.69335938 149.66210938 C-67.80076996 162.10803433 -67.90176122 174.55399926 -68 187 C-76.91 187 -85.82 187 -95 187 C-95 125.95 -95 64.9 -95 2 C-86.42 2 -77.84 2 -69 2 C-68.67 11.9 -68.34 21.8 -68 32 C-65.36 28.37 -62.72 24.74 -60 21 C-43.69805366 4.69805366 -22.35799255 0 0 0 Z',
	},
];

function normalizeAccentColor(raw: string | undefined | null): string | null {
	if (!raw) return null;
	let val = raw.trim();
	try {
		val = decodeURIComponent(val).trim();
	} catch {}
	if (/^\d+$/.test(val)) {
		const num = parseInt(val, 10);
		if (!Number.isNaN(num) && num >= 0 && num <= 0xffffff) {
			return '#' + num.toString(16).padStart(6, '0');
		}
	}
	if (/^#[0-9a-fA-F]{3,8}$/.test(val)) {
		return val;
	}
	if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)$/i.test(val)) {
		return val;
	}
	return null;
}

export function parseSplashPreferences(cookieHeader?: string): { accent: string; theme: 'light' | 'dark' | 'system' } {
	let accent = '#8b7cf6';
	let theme: 'light' | 'dark' | 'system' = 'system';
	if (!cookieHeader) return { accent, theme };

	for (const part of cookieHeader.split(';')) {
		const eqIdx = part.indexOf('=');
		if (eqIdx === -1) continue;
		const key = part.slice(0, eqIdx).trim();
		const val = part.slice(eqIdx + 1).trim();
		if (key === 'accent') {
			const normalized = normalizeAccentColor(val);
			if (normalized) accent = normalized;
		} else if (key === 'theme') {
			let decoded = val;
			try {
				decoded = decodeURIComponent(val).trim();
			} catch {}
			if (decoded === 'light' || decoded === 'dark' || decoded === 'system') {
				theme = decoded;
			}
		}
	}
	return { accent, theme };
}

export function renderSplashHtml(app: AppDefinition, displayUrl: string, idleTimeoutSeconds: number, req?: http.IncomingMessage): string {
	const { accent, theme } = parseSplashPreferences(req?.headers.cookie);
	const initialThemeAttr = theme === 'light' || theme === 'dark' ? ` data-theme="${theme}"` : '';

	return `<!DOCTYPE html>
<html lang="en"${initialThemeAttr} style="--accent: ${accent};">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>Starting ${app.label} — Xernerx Dev</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
	<script>
		(function() {
			function getCookie(name) {
				var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
				return match ? decodeURIComponent(match[2]) : null;
			}
			function normalizeAccent(raw) {
				if (!raw) return null;
				var val = String(raw).trim();
				if (/^\\d+$/.test(val)) {
					return '#' + parseInt(val, 10).toString(16).padStart(6, '0');
				}
				if (/^#[0-9a-fA-F]{3,8}$/.test(val) || /^rgba?\\([^)]+\\)$/i.test(val)) {
					return val;
				}
				return null;
			}
			try {
				var storedAccent = normalizeAccent(localStorage.getItem('accent')) || normalizeAccent(getCookie('accent'));
				if (storedAccent) {
					document.documentElement.style.setProperty('--accent', storedAccent);
				}
				var storedTheme = localStorage.getItem('theme') || getCookie('theme') || '${theme}';
				var resolvedTheme = storedTheme === 'system'
					? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
					: (storedTheme === 'light' ? 'light' : 'dark');
				document.documentElement.setAttribute('data-theme', resolvedTheme);
			} catch (e) {}
		})();
	</script>
	<style>
		:root {
			--background: #09090b;
			--foreground: #18181b;
			--text: #fafafa;
			--text-muted: #a1a1aa;
			--border: #27272a;
			--accent: ${accent};
		}
		@media (prefers-color-scheme: light) {
			:root:not([data-theme="dark"]) {
				--background: #fafafa;
				--foreground: #f4f4f5;
				--text: #09090b;
				--text-muted: #52525b;
				--border: #d4d4d8;
			}
		}
		:root[data-theme="light"] {
			--background: #fafafa;
			--foreground: #f4f4f5;
			--text: #09090b;
			--text-muted: #52525b;
			--border: #d4d4d8;
		}
		:root[data-theme="dark"] {
			--background: #09090b;
			--foreground: #18181b;
			--text: #fafafa;
			--text-muted: #a1a1aa;
			--border: #27272a;
		}
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}
		body {
			min-height: 100vh;
			width: 100vw;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: flex-end;
			background:
				radial-gradient(circle at 50% 15%, color-mix(in srgb, var(--accent) 30%, var(--foreground)) 0%, var(--foreground) 75%),
				linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, var(--foreground)) 0%, var(--foreground) 50%, color-mix(in srgb, var(--accent) 20%, var(--foreground)) 100%);
			color: var(--text);
			font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
			padding: 32px 24px 44px;
			overflow: hidden;
			position: relative;
			user-select: none;
		}
		#dot-matrix-canvas {
			position: fixed;
			inset: 0;
			width: 100vw;
			height: 100vh;
			z-index: 1;
			display: block;
		}
		.hud {
			position: relative;
			z-index: 10;
			width: 100%;
			max-width: 480px;
			border-radius: 24px;
			background: color-mix(in srgb, var(--foreground) 68%, transparent);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid color-mix(in srgb, var(--border) 45%, transparent);
			box-shadow: 0 0 28px color-mix(in srgb, var(--accent) 20%, transparent);
			padding: 22px 26px;
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
			gap: 14px;
		}
		.badge {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 5px 14px;
			border-radius: 9999px;
			font-size: 11px;
			font-weight: 700;
			letter-spacing: 0.04em;
			background: color-mix(in srgb, var(--accent) 14%, transparent);
			color: var(--accent);
			border: 1px solid color-mix(in srgb, var(--accent) 32%, transparent);
		}
		.dot {
			width: 7px;
			height: 7px;
			border-radius: 9999px;
			background: var(--accent);
			box-shadow: 0 0 10px var(--accent);
			animation: blink 1.2s ease-in-out infinite;
		}
		@keyframes blink {
			0%, 100% { opacity: 0.35; transform: scale(0.9); }
			50% { opacity: 1; transform: scale(1.15); }
		}
		h1 {
			font-family: 'Fredoka', sans-serif;
			font-size: 24px;
			font-weight: 700;
			letter-spacing: -0.01em;
			color: var(--text);
		}
		p {
			font-size: 13px;
			line-height: 1.5;
			color: var(--text-muted);
		}
		.well {
			width: 100%;
			border-radius: 16px;
			background: color-mix(in srgb, var(--background) 58%, transparent);
			border: 1px solid color-mix(in srgb, var(--border) 35%, transparent);
			padding: 11px 15px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			font-size: 12px;
			color: var(--text-muted);
		}
		.well code {
			color: var(--accent);
			font-weight: 600;
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		}
		.elapsed-pill {
			font-variant-numeric: tabular-nums;
			font-weight: 700;
			color: var(--text);
		}
	</style>
</head>
<body>
	<canvas id="dot-matrix-canvas" aria-hidden="true"></canvas>
	<div class="hud">
		<div class="badge">
			<span class="dot"></span>
			<span id="status-pill">ON-DEMAND DEV LISTENER</span>
		</div>
		<div>
			<h1>Waking up ${app.label}</h1>
			<p id="status-desc" style="margin-top: 4px;">Spawning Next.js dev server on demand. This page will open automatically as soon as it is ready.</p>
		</div>
		<div class="well">
			<span>Endpoint: <code>${displayUrl}</code></span>
			<span id="elapsed" class="elapsed-pill">0.0s</span>
		</div>
		<p style="font-size: 11px; opacity: 0.72;">Idle spin-down active (${idleTimeoutSeconds > 0 ? idleTimeoutSeconds + 's timeout' : 'disabled'})</p>
	</div>
	<script>
		const FULL_LOGO_BOUNDS = ${JSON.stringify(FULL_LOGO_BOUNDS)};
		const FULL_LOGO_PATHS = ${JSON.stringify(FULL_LOGO_PATHS)};
		const SAMPLE_OFFSETS = [
			[0, 0],
			[-0.28, -0.28],
			[0.28, -0.28],
			[-0.28, 0.28],
			[0.28, 0.28],
		];

		function parseCssColor(raw, fallback) {
			const str = String(raw || '').trim();
			if (str.startsWith('#')) {
				const hex = str.slice(1);
				if (hex.length === 3) {
					return [parseInt(hex[0] + hex[0], 16), parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16)];
				}
				if (hex.length >= 6) {
					return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
				}
			}
			const rgbMatch = str.match(/rgba?\\(\\s*(\\d+)\\s*[, ]\\s*(\\d+)\\s*[, ]\\s*(\\d+)/i);
			if (rgbMatch) {
				return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
			}
			return fallback;
		}

		(function initDotMatrixLoader() {
			const canvas = document.getElementById('dot-matrix-canvas');
			const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
			if (!canvas || !ctx) return;

			const compiledFull = FULL_LOGO_PATHS.map((item) => ({
				tx: item.tx,
				ty: item.ty,
				path: new Path2D(item.d),
			}));

			let activeW = 0;
			let activeH = 0;
			let dpr = 1;
			let cellRadiusBase = 4;
			let repelRadius = 110;
			let dots = [];
			const pointer = { x: -9999, y: -9999, active: false };
			const shockwaves = [];

			let accentRgb = [139, 124, 246];
			let textRgb = [250, 250, 250];
			let mutedRgb = [161, 161, 170];

			function syncThemeColors() {
				const isLight = document.documentElement.getAttribute('data-theme') === 'light';
				const styles = getComputedStyle(document.documentElement);
				accentRgb = parseCssColor(styles.getPropertyValue('--accent'), [139, 124, 246]);
				textRgb = parseCssColor(styles.getPropertyValue('--text'), isLight ? [9, 9, 11] : [250, 250, 250]);
				mutedRgb = parseCssColor(styles.getPropertyValue('--text-muted'), isLight ? [82, 82, 91] : [161, 161, 170]);
			}

			function buildGrid() {
				activeW = Math.max(320, window.innerWidth || 1200);
				activeH = Math.max(240, window.innerHeight || 800);
				dpr = Math.min(window.devicePixelRatio || 1, 1.35);
				canvas.width = Math.round(activeW * dpr);
				canvas.height = Math.round(activeH * dpr);

				const isCompactBanner = activeH < 360;
				const gridCols = isCompactBanner
					? Math.max(32, Math.min(72, Math.round(activeW / 13)))
					: Math.max(48, Math.min(88, Math.round(activeW / 18)));
				const gridRows = Math.max(isCompactBanner ? 11 : 28, Math.round(gridCols * (activeH / activeW)));
				const cellStepX = activeW / gridCols;
				const cellStepY = activeH / gridRows;

				const svgSpanX = FULL_LOGO_BOUNDS.maxX - FULL_LOGO_BOUNDS.minX;
				const svgSpanY = FULL_LOGO_BOUNDS.maxY - FULL_LOGO_BOUNDS.minY;
				const aspect = svgSpanX / svgSpanY;
				const maxFracW = isCompactBanner ? 0.9 : 0.86;
				let boxW = Math.min(activeW * maxFracW, 1280);
				let boxH = boxW / aspect;
				const maxFracH = isCompactBanner ? 0.86 : 0.62;
				if (boxH > activeH * maxFracH) {
					boxH = activeH * maxFracH;
					boxW = boxH * aspect;
				}
				const offX = (activeW - boxW) * 0.5;
				const offY = isCompactBanner ? (activeH - boxH) * 0.5 : Math.max(activeH * 0.06, (activeH - boxH) * 0.34);

				cellRadiusBase = Math.min(cellStepX, cellStepY) * 0.33;
				repelRadius = Math.max(95, Math.min(activeW, activeH) * 0.16);

				dots = [];
				for (let r = 0; r < gridRows; r++) {
					for (let c = 0; c < gridCols; c++) {
						const u = (c + 0.5) / gridCols;
						const v = (r + 0.5) / gridRows;
						const homeX = u * activeW;
						const homeY = v * activeH;
						const nx = (u - 0.5) * 2;
						const ny = (v - 0.5) * 2;
						const distCenter = Math.hypot(nx, ny);

						let hits = 0;
						for (let s = 0; s < SAMPLE_OFFSETS.length; s++) {
							const px = homeX + SAMPLE_OFFSETS[s][0] * cellStepX;
							const py = homeY + SAMPLE_OFFSETS[s][1] * cellStepY;
							const lu = (px - offX) / boxW;
							const lv = (py - offY) / boxH;
							if (lu < 0 || lu > 1 || lv < 0 || lv > 1) continue;
							const svgX = FULL_LOGO_BOUNDS.minX + lu * svgSpanX;
							const svgY = FULL_LOGO_BOUNDS.minY + lv * svgSpanY;
							for (let i = 0; i < compiledFull.length; i++) {
								const item = compiledFull[i];
								if (ctx.isPointInPath(item.path, svgX - item.tx, svgY - item.ty, 'evenodd')) {
									hits++;
									break;
								}
							}
						}

						const rawCov = hits / SAMPLE_OFFSETS.length;
						const cov = rawCov > 0.08 ? Math.max(0.46, rawCov) : 0.22;
						const angle = Math.atan2(ny, nx);
						const scatter = 24 + distCenter * 32;
						dots.push({
							homeX,
							homeY,
							x: homeX + Math.cos(angle) * scatter,
							y: homeY + Math.sin(angle) * scatter + 10,
							vx: 0,
							vy: 0,
							nx,
							ny,
							distCenter,
							coverage: cov,
							phase: (c * 0.19 + r * 0.23) % (Math.PI * 2),
						});
					}
				}
			}

			syncThemeColors();
			buildGrid();

			window.addEventListener('resize', buildGrid);
			window.addEventListener('pointermove', (e) => {
				pointer.x = e.clientX;
				pointer.y = e.clientY;
				pointer.active = true;
			});
			window.addEventListener('pointerleave', () => {
				pointer.active = false;
			});
			window.addEventListener('click', (e) => {
				shockwaves.push({ x: e.clientX, y: e.clientY, birth: performance.now() });
				if (shockwaves.length > 4) shockwaves.shift();
			});

			let lastColorSync = performance.now();
			function renderFrame(now) {
				if (now - lastColorSync > 1500) {
					syncThemeColors();
					lastColorSync = now;
				}
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
				ctx.clearRect(0, 0, activeW, activeH);

				const t = now * 0.001;
				for (let i = shockwaves.length - 1; i >= 0; i--) {
					if (now - shockwaves[i].birth > 1500) shockwaves.splice(i, 1);
				}

				for (let i = 0; i < dots.length; i++) {
					const d = dots[i];
					const logoBlend = Math.max(0, Math.min(1, (d.coverage - 0.22) / 0.52));
					const waveDiag = Math.sin(d.nx * 5.2 - d.ny * 3.8 - t * 3.4);
					const waveRadial = Math.cos(d.distCenter * 6.4 - t * 2.8);
					const waveNorm = Math.pow((waveDiag * 0.65 + waveRadial * 0.35 + 1) * 0.5, 1.5);

					const floatScale = 2.8;
					const floatAmpX = 0.85 + logoBlend * 0.95;
					const floatAmpY = 1.25 + logoBlend * 1.65;
					const floatX = Math.cos(d.nx * 4.5 - d.ny * 2.5 - t * 3.1 + d.phase * 0.25) * floatAmpX * floatScale;
					const floatY = Math.sin(d.nx * 4.8 - d.ny * 3.0 - t * 3.4 + d.phase * 0.25) * floatAmpY * floatScale;
					const targetX = d.homeX + floatX;
					const targetY = d.homeY + floatY;

					let cursorBoost = 0;
					if (pointer.active) {
						const dx = d.x - pointer.x;
						const dy = d.y - pointer.y;
						const dist = Math.hypot(dx, dy);
						if (dist < repelRadius && dist > 0.001) {
							const influence = Math.pow(1 - dist / repelRadius, 2);
							const push = influence * 3.1;
							d.vx += (dx / dist) * push + (-dy / dist) * influence * 0.48;
							d.vy += (dy / dist) * push + (dx / dist) * influence * 0.48;
							cursorBoost = influence;
						}
					}

					let shockBoost = 0;
					if (shockwaves.length > 0) {
						for (let s = 0; s < shockwaves.length; s++) {
							const sw = shockwaves[s];
							const age = (now - sw.birth) * 0.001;
							const ringRadius = age * Math.max(activeW, activeH) * 0.85;
							const ringThickness = 42;
							const dx = d.homeX - sw.x;
							const dy = d.homeY - sw.y;
							const dist = Math.hypot(dx, dy);
							const delta = Math.abs(dist - ringRadius);
							if (delta < ringThickness && dist > 0.001) {
								const pulse = (1 - delta / ringThickness) * Math.max(0, 1 - age / 1.5);
								d.vx += (dx / dist) * pulse * 2.5;
								d.vy += (dy / dist) * pulse * 2.5;
								shockBoost = Math.max(shockBoost, pulse);
							}
						}
					}

					d.vx = (d.vx + (targetX - d.x) * 0.11) * 0.8;
					d.vy = (d.vy + (targetY - d.y) * 0.11) * 0.8;
					d.x += d.vx;
					d.y += d.vy;

					const restingScale = 0.62;
					const logoScaleFactor = restingScale + waveNorm * 0.68 + cursorBoost * 0.5 + shockBoost * 0.58;
					const logoRadius = Math.max(0.65, cellRadiusBase * d.coverage * logoScaleFactor);
					const activeEnergy = Math.max(cursorBoost, shockBoost, waveNorm * 0.35);
					const ambientRadius = Math.max(0.5, cellRadiusBase * (0.28 + activeEnergy * 0.38));
					const radius = ambientRadius + (logoRadius - ambientRadius) * logoBlend;

					const logoAccentMix = Math.min(1, waveNorm * 0.92 + cursorBoost * 0.95 + shockBoost * 0.98);
					const ambientAccentMix = Math.min(1, cursorBoost * 0.92 + shockBoost * 0.92 + waveNorm * 0.48);
					const baseR = mutedRgb[0] + (textRgb[0] - mutedRgb[0]) * logoBlend;
					const baseG = mutedRgb[1] + (textRgb[1] - mutedRgb[1]) * logoBlend;
					const baseB = mutedRgb[2] + (textRgb[2] - mutedRgb[2]) * logoBlend;
					const accentMix = ambientAccentMix + (logoAccentMix - ambientAccentMix) * logoBlend;
					const rCol = Math.round(baseR + (accentRgb[0] - baseR) * accentMix);
					const gCol = Math.round(baseG + (accentRgb[1] - baseG) * accentMix);
					const bCol = Math.round(baseB + (accentRgb[2] - baseB) * accentMix);

					const logoRawAlpha = Math.min(1, 0.52 + waveNorm * 0.48 + cursorBoost * 0.52 + shockBoost * 0.48);
					const ambientRawAlpha = 0.08 + activeEnergy * 0.34;
					const alpha = ambientRawAlpha + (logoRawAlpha - ambientRawAlpha) * logoBlend;

					if (alpha > 0.005 && radius > 0.15) {
						ctx.beginPath();
						ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
						ctx.fillStyle = 'rgba(' + rCol + ',' + gCol + ',' + bCol + ',' + alpha.toFixed(3) + ')';
						ctx.fill();
					}
				}

				requestAnimationFrame(renderFrame);
			}

			requestAnimationFrame(renderFrame);
		})();

		const start = Date.now();
		const elapsedEl = document.getElementById('elapsed');
		const descEl = document.getElementById('status-desc');
		const pillEl = document.getElementById('status-pill');

		setInterval(() => {
			const s = ((Date.now() - start) / 1000).toFixed(1);
			if (elapsedEl) elapsedEl.textContent = s + 's';
		}, 100);

		async function checkStatus() {
			try {
				const res = await fetch('/__suite_status?wake=1', { cache: 'no-store' });
				if (res.ok) {
					const data = await res.json();
					if (data.status === 'running') {
						if (pillEl) pillEl.textContent = 'READY — LOADING APP';
						if (descEl) descEl.textContent = 'Server is online! Redirecting...';
						window.location.replace(window.location.href);
						return;
					}
				}
			} catch {}
			setTimeout(checkStatus, 500);
		}
		setTimeout(checkStatus, 400);
	</script>
</body>
</html>`;
}

export async function startLazyAppsSupervisor(options: LazySupervisorOptions): Promise<void> {
	const { domain, isCustomDomain, idleTimeoutSeconds = 60 } = options;
	const idleTimeoutMs = idleTimeoutSeconds > 0 ? idleTimeoutSeconds * 1000 : 0;

	const managedApps: ManagedApp[] = SUITE_APPS.map((def) => ({
		...def,
		state: 'sleeping',
		child: null,
		lastActiveAt: 0,
		bootStartedAt: 0,
		activeRequestsCount: 0,
		pendingQueue: [],
		activeSockets: new Set(),
		server: null,
		readinessTimer: null,
		logger: terminal.child({ scope: `${def.label}:${def.port}` }),
	}));

	const markAppReady = (app: ManagedApp) => {
		if (app.state === 'running') return;
		if (app.readinessTimer) {
			clearInterval(app.readinessTimer);
			app.readinessTimer = null;
		}
		app.state = 'running';
		app.lastActiveAt = Date.now();
		const bootSec = ((Date.now() - app.bootStartedAt) / 1000).toFixed(1);
		app.logger.log(`\x1b[32m✔ Online and ready in ${bootSec}s\x1b[0m (idle timeout: ${idleTimeoutSeconds > 0 ? `${idleTimeoutSeconds}s` : 'off'})`);

		const queue = app.pendingQueue.splice(0);
		for (const resume of queue) {
			try {
				resume();
			} catch {}
		}
	};

	const stopApp = (app: ManagedApp, reason: string) => {
		if (app.readinessTimer) {
			clearInterval(app.readinessTimer);
			app.readinessTimer = null;
		}
		const child = app.child;
		app.child = null;
		app.state = 'sleeping';
		app.activeRequestsCount = 0;

		for (const sock of app.activeSockets) {
			try {
				sock.destroy();
			} catch {}
		}
		app.activeSockets.clear();

		if (child?.pid) {
			app.logger.warn(`💤 ${reason} — spinning down Next.js (PID ${child.pid}) to free RAM.`);
			killProcessTree(child.pid);
		}
	};

	const wakeApp = (app: ManagedApp, triggerUrl?: string) => {
		app.lastActiveAt = Date.now();
		if (app.state === 'running' || app.state === 'booting') return;

		app.state = 'booting';
		app.bootStartedAt = Date.now();
		const displayUrl = getAppDisplayUrl(app, domain, isCustomDomain);
		app.logger.log(`⚡ Request received for \x1b[1m${displayUrl}${triggerUrl && triggerUrl !== '/' ? triggerUrl : ''}\x1b[0m — waking Next.js dev server...`);

		const appCwd = path.join(process.cwd(), app.dir);
		const lockFile = path.join(appCwd, '.next', 'dev', 'lock');
		try {
			if (fs.existsSync(lockFile)) {
				fs.unlinkSync(lockFile);
			}
		} catch {}

		const child = spawn(`npx next dev -p ${app.internalPort} -H 127.0.0.1`, {
			cwd: appCwd,
			shell: true,
			stdio: ['ignore', 'pipe', 'pipe'],
			env: {
				...process.env,
				PORT: String(app.internalPort),
				FORCE_COLOR: '1',
			},
		});

		app.child = child;

		const handleLine = (_raw: string, plain: string) => {
			if (plain.includes('Ready in') || plain.includes('✓ Ready')) {
				probePortReady(app.internalPort).then((ok) => {
					if (ok && app.child === child) markAppReady(app);
				});
			}
		};

		pipeStreamToTerminal(child.stdout, app.logger, false, handleLine);
		pipeStreamToTerminal(child.stderr, app.logger, true, handleLine);

		app.readinessTimer = setInterval(async () => {
			if (app.child !== child || app.state !== 'booting') return;
			const ready = await probePortReady(app.internalPort);
			if (ready && app.child === child) {
				markAppReady(app);
			}
		}, 300);

		child.once('exit', (code) => {
			if (app.child === child) {
				if (app.readinessTimer) {
					clearInterval(app.readinessTimer);
					app.readinessTimer = null;
				}
				app.child = null;
				app.state = 'sleeping';
				if (code !== 0 && code !== null) {
					app.logger.warn(`Process exited (code ${code}). Returned to sleeping state.`);
				}
			}
		});
	};

	const proxyHttpRequest = (app: ManagedApp, req: http.IncomingMessage, res: http.ServerResponse, bufferedBody?: Buffer) => {
		app.lastActiveAt = Date.now();
		app.activeRequestsCount++;

		let decremented = false;
		const done = () => {
			if (!decremented) {
				decremented = true;
				app.activeRequestsCount = Math.max(0, app.activeRequestsCount - 1);
				app.lastActiveAt = Date.now();
			}
		};

		res.once('close', done);
		res.once('finish', done);

		const headers: http.OutgoingHttpHeaders = { ...req.headers };
		if (req.headers.host) {
			headers['host'] = req.headers.host;
			if (!headers['x-forwarded-host']) {
				headers['x-forwarded-host'] = req.headers.host;
			}
		}
		if (!headers['x-forwarded-proto']) {
			headers['x-forwarded-proto'] = isCustomDomain ? 'https' : 'http';
		}

		const proxyReq = http.request(
			{
				hostname: '127.0.0.1',
				port: app.internalPort,
				method: req.method,
				path: req.url,
				headers,
			},
			(proxyRes) => {
				res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
				proxyRes.pipe(res);
			}
		);

		proxyReq.on('socket', (sock) => {
			app.activeSockets.add(sock);
			sock.once('close', () => app.activeSockets.delete(sock));
		});

		proxyReq.on('error', (err) => {
			done();
			if (!res.headersSent) {
				res.writeHead(502, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: `Upstream ${app.label} unavailable`, details: err.message }));
			} else {
				res.end();
			}
		});

		if (bufferedBody !== undefined) {
			if (bufferedBody.length > 0) {
				proxyReq.write(bufferedBody);
			}
			proxyReq.end();
		} else {
			req.pipe(proxyReq);
		}
	};

	await Promise.all(
		managedApps.map(
			(app) =>
				new Promise<void>((resolve) => {
					const server = http.createServer((req, res) => {
						const url = req.url || '/';
						const pathname = url.split('?')[0];

						// 1. Readiness status endpoint for the splash screen
						if (pathname === '/__suite_status') {
							if (url.includes('wake=1') && app.state === 'sleeping') {
								wakeApp(app, url);
							}
							if (app.state === 'booting') {
								app.lastActiveAt = Date.now();
							}
							res.writeHead(200, {
								'Content-Type': 'application/json',
								'Cache-Control': 'no-store, no-cache, must-revalidate',
							});
							res.end(
								JSON.stringify({
									status: app.state,
									id: app.id,
									label: app.label,
									port: app.port,
									elapsedMs: app.bootStartedAt ? Date.now() - app.bootStartedAt : 0,
								})
							);
							return;
						}

						// 2. Serve /api/version and /api/changelog directly without waking sleeping apps or resetting the idle timer
						// (Prevents background health/version monitors in services/app and apps/api from waking all 12 apps every 60s)
						if (req.method === 'GET' && pathname === '/api/version') {
							if (serveStaticAppVersion(app, res)) return;
						}
						if (req.method === 'GET' && pathname === '/api/changelog') {
							if (serveStaticAppChangelog(app, url, res)) return;
						}

						// 3. Ignore stray background favicon requests while sleeping so bookmark/tab checks don't wake the app
						if (app.state === 'sleeping' && pathname === '/favicon.ico') {
							res.writeHead(204);
							res.end();
							return;
						}

						// 4. If app is already running, proxy immediately and reset idle timer
						if (app.state === 'running') {
							proxyHttpRequest(app, req, res);
							return;
						}

						// 5. App is sleeping or booting -> trigger wake
						wakeApp(app, url);

						// 6. Browser page navigation -> serve instant Glassmorphic Splash HTML
						if (isBrowserDocumentNavigation(req, app)) {
							const displayUrl = getAppDisplayUrl(app, domain, isCustomDomain);
							const html = renderSplashHtml(app, displayUrl, idleTimeoutSeconds, req);
							res.writeHead(200, {
								'Content-Type': 'text/html; charset=utf-8',
								'Cache-Control': 'no-store, no-cache, must-revalidate',
							});
							res.end(html);
							return;
						}

						// 7. Non-HTML / API / fetch / asset request -> buffer request body and hold until Next.js is ready
						const chunks: Buffer[] = [];
						let bodyReady = false;
						let aborted = false;

						req.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
						req.on('end', () => {
							bodyReady = true;
							if (app.state === 'running' && !aborted) {
								const idx = app.pendingQueue.indexOf(flushHeldRequest);
								if (idx !== -1) app.pendingQueue.splice(idx, 1);
								flushHeldRequest();
							}
						});

						// Listen on `res` close (not `req` close, as GET requests close `req` immediately upon receiving headers)
						res.on('close', () => {
							if (!res.writableEnded) {
								aborted = true;
								const idx = app.pendingQueue.indexOf(flushHeldRequest);
								if (idx !== -1) app.pendingQueue.splice(idx, 1);
							}
						});

						function flushHeldRequest() {
							if (aborted || res.writableEnded) return;
							if (!bodyReady) {
								req.once('end', () => {
									if (!aborted && !res.writableEnded) {
										proxyHttpRequest(app, req, res, Buffer.concat(chunks));
									}
								});
								return;
							}
							proxyHttpRequest(app, req, res, Buffer.concat(chunks));
						}

						app.pendingQueue.push(flushHeldRequest);
					});

					// Forward WebSocket upgrades (Next.js HMR `/_next/webpack-hmr`) when running
					server.on('upgrade', (req, clientSocket, head) => {
						if (app.state !== 'running') {
							// Do not wake a sleeping app from background HMR reconnect attempts
							clientSocket.destroy();
							return;
						}

						const upstreamSocket = net.connect(app.internalPort, '127.0.0.1', () => {
							const reqLines = [`${req.method || 'GET'} ${req.url || '/'} HTTP/${req.httpVersion}`];
							for (let i = 0; i < req.rawHeaders.length; i += 2) {
								reqLines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
							}
							reqLines.push('', '');
							upstreamSocket.write(reqLines.join('\r\n'));
							if (head && head.length > 0) {
								upstreamSocket.write(head);
							}
							clientSocket.pipe(upstreamSocket).pipe(clientSocket);
						});

						app.activeSockets.add(upstreamSocket);
						upstreamSocket.once('close', () => app.activeSockets.delete(upstreamSocket));
						upstreamSocket.on('error', () => clientSocket.destroy());
						clientSocket.on('error', () => upstreamSocket.destroy());
					});

					server.on('error', (err: NodeJS.ErrnoException) => {
						if (err.code === 'EADDRINUSE') {
							app.logger.warn(`Port ${app.port} is already in use. Skipping on-demand listener.`);
						} else {
							app.logger.error(`Listener error on port ${app.port}: ${err.message}`);
						}
						resolve();
					});

					server.listen(app.port, '0.0.0.0', () => {
						app.server = server;
						resolve();
					});
				})
		)
	);

	// Periodic inactivity sweep (every 5 seconds)
	if (idleTimeoutMs > 0) {
		setInterval(() => {
			const now = Date.now();
			for (const app of managedApps) {
				if (app.state === 'running' && app.activeRequestsCount === 0 && now - app.lastActiveAt >= idleTimeoutMs) {
					stopApp(app, `Idle for ${idleTimeoutSeconds}s with no requests`);
				}
			}
		}, 5000);
	}

	const cleanupAll = () => {
		for (const app of managedApps) {
			if (app.child?.pid) {
				killProcessTree(app.child.pid);
				app.child = null;
			}
			try {
				app.server?.close();
			} catch {}
		}
	};

	process.once('SIGINT', () => {
		cleanupAll();
		process.exit(0);
	});
	process.once('SIGTERM', () => {
		cleanupAll();
		process.exit(0);
	});
	process.once('exit', cleanupAll);
}
