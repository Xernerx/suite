/** @format */

export {};

declare global {
	// eslint-disable-next-line no-var
	var __xernerxNetHookInstalled: boolean | undefined;
}

const API_LOG_PREFIX = '__XERNERX_API_LOG__:';

function shouldCaptureUrl(rawUrl: string): boolean {
	if (!rawUrl || typeof rawUrl !== 'string') return false;
	const lower = rawUrl.toLowerCase();
	if (lower.includes('discord.com/api') || lower.includes('discordapp.com')) return false;
	return (
		lower.includes('xernerx') ||
		lower.includes('/v1/') ||
		lower.includes('/v2/') ||
		lower.includes('/core/') ||
		lower.includes('/secure/') ||
		lower.includes('localhost') ||
		lower.includes('127.0.0.1') ||
		/:400[0-8]\b/.test(lower)
	);
}

function emitApiLog(entry: Record<string, unknown>): void {
	try {
		process.stdout.write(`${API_LOG_PREFIX}${JSON.stringify(entry)}\n`);
	} catch {}
}

function parseUrlMeta(rawUrl: string): { path: string; malformed: boolean } {
	try {
		const u = new URL(rawUrl, 'http://localhost');
		const fullPath = (u.pathname || '/') + (u.search || '');
		const malformed = /(?:\/|=)(?:undefined|null|nan)(?:\/|$|\?|&)/i.test(fullPath);
		return { path: fullPath, malformed };
	} catch {
		const malformed = /(?:\/|=)(?:undefined|null|nan)(?:\/|$|\?|&)/i.test(String(rawUrl));
		return { path: String(rawUrl), malformed };
	}
}

if (!globalThis.__xernerxNetHookInstalled && typeof globalThis.fetch === 'function') {
	globalThis.__xernerxNetHookInstalled = true;
	const origFetch = globalThis.fetch;

	globalThis.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
		let urlStr = '';
		let method = init?.method || 'GET';
		try {
			if (typeof input === 'string') urlStr = input;
			else if (input instanceof URL) urlStr = input.toString();
			else if (input && typeof (input as Request).url === 'string') {
				urlStr = (input as Request).url;
				if ((input as Request).method && !init?.method) method = (input as Request).method;
			}
		} catch {}

		if (!shouldCaptureUrl(urlStr)) {
			return origFetch(input, init);
		}

		const start = Date.now();
		const meta = parseUrlMeta(urlStr);
		const id = `req-${start.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

		try {
			const res = await origFetch(input, init);
			const latencyMs = Math.max(1, Date.now() - start);
			let detail = '';
			if (!res.ok) {
				try {
					const cloned = res.clone();
					const text = await cloned.text();
					try {
						const parsed = JSON.parse(text) as { error?: string; message?: string };
						detail = parsed.error || parsed.message || text.slice(0, 140);
					} catch {
						detail = text.slice(0, 140);
					}
				} catch {}
			}
			emitApiLog({
				id,
				method: String(method || 'GET').toUpperCase(),
				url: urlStr,
				path: meta.path,
				status: res.status,
				statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
				ok: res.ok,
				latencyMs,
				malformed: meta.malformed,
				detail: detail || undefined,
				timestamp: new Date().toISOString(),
			});
			return res;
		} catch (err: unknown) {
			const latencyMs = Math.max(1, Date.now() - start);
			const message = err instanceof Error ? err.message : 'Connection failed';
			emitApiLog({
				id,
				method: String(method || 'GET').toUpperCase(),
				url: urlStr,
				path: meta.path,
				status: 0,
				statusText: 'Network Error',
				ok: false,
				latencyMs,
				malformed: meta.malformed,
				detail: String(message).slice(0, 140),
				timestamp: new Date().toISOString(),
			});
			throw err;
		}
	};
}
