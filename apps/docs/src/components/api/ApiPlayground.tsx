/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Button, Input, Selector, CodeBlock } from '@xernerx/ui';
import { Play, Terminal, Activity, Copy, Check, Clock, Trash2 } from 'lucide-react';

const PRESET_PATHS: Record<string, string[]> = {
	v1: ['/api/version', '/v1/leaderboard', '/v1/status/badge.svg', '/v1/bots/1059956767103668244/profile', '/v1/bots/1059956767103668244/stats', '/v1/bots/1059956767103668244/commands'],
	core: [
		'/core/faq/categories',
		'/core/faq/bots/registration',
		'/core/bots/1059956767103668244',
		'/core/users/482513687417061376',
		'/core/guilds/1059955754800001054/discord/channels',
		'/info/roadmap',
		'/info/issues',
		'/info/suggestions',
	],
	secure: ['/secure/core/versions', '/secure/core/audit?limit=10', '/secure/core', '/secure/store/catalog', '/secure/store/coupons'],
};

interface PlaygroundHistoryItem {
	id: string;
	method: string;
	path: string;
	status: number;
	latency: number;
	timestamp: number;
}

const HISTORY_STORAGE_KEY = 'xernerx_docs_playground_history_v1';

export function ApiPlayground({ version, initialMethod, initialPath }: { version: string; initialMethod?: string; initialPath?: string }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const presets = PRESET_PATHS[version] || PRESET_PATHS.v1;

	const [method, setMethod] = useState(initialMethod || 'GET');
	const [path, setPath] = useState(initialPath || presets[0]);

	useEffect(() => {
		if (initialMethod) setMethod(initialMethod);
		if (initialPath) setPath(initialPath);
	}, [initialMethod, initialPath]);

	const [token, setToken] = useState('');
	const [body, setBody] = useState('{\n  \n}');
	const [loading, setLoading] = useState(false);
	const [copiedCurl, setCopiedCurl] = useState(false);
	const [history, setHistory] = useState<PlaygroundHistoryItem[]>([]);
	const [response, setResponse] = useState<{
		status: number;
		statusText: string;
		latency: number;
		body: string;
	} | null>(null);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		try {
			const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) setHistory(parsed.slice(0, 12));
			}
		} catch {}
	}, []);

	const saveHistoryEntry = (entry: PlaygroundHistoryItem) => {
		setHistory((prev) => {
			const filtered = prev.filter((item) => !(item.method === entry.method && item.path === entry.path));
			const next = [entry, ...filtered].slice(0, 12);
			try {
				localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
			} catch {}
			return next;
		});
	};

	const clearHistory = () => {
		setHistory([]);
		try {
			localStorage.removeItem(HISTORY_STORAGE_KEY);
		} catch {}
	};

	const handleCopyCurl = async () => {
		const cleanPath = path.startsWith('/') ? path : `/${path}`;
		const targetUrl = getEnvUrl(`https://api.xernerx.com${cleanPath}`);
		const parts = [`curl -X ${method} "${targetUrl}"`, `-H "Accept: application/json"`];
		if (token.trim()) {
			const bearer = token.trim().startsWith('Bearer ') ? token.trim() : `Bearer ${token.trim()}`;
			parts.push(`-H "Authorization: ${bearer}"`);
		}
		if (method !== 'GET' && method !== 'DELETE' && body.trim() && body.trim() !== '{\n  \n}') {
			parts.push(`-H "Content-Type: application/json"`);
			parts.push(`-d '${body.trim().replace(/'/g, "'\\''")}'`);
		}
		const curlString = parts.join(' \\\n  ');
		try {
			await navigator.clipboard.writeText(curlString);
			setCopiedCurl(true);
			toast({ type: 'success', title: t('docs.api.playground.curlCopied') });
			setTimeout(() => setCopiedCurl(false), 2000);
		} catch {}
	};

	const handleSend = async () => {
		setLoading(true);
		const start = performance.now();
		const cleanPath = path.startsWith('/') ? path : `/${path}`;
		try {
			const targetUrl = getEnvUrl(`https://api.xernerx.com${cleanPath}`);
			const headers: Record<string, string> = {
				Accept: 'application/json',
			};
			if (token.trim()) {
				headers.Authorization = token.trim().startsWith('Bearer ') ? token.trim() : `Bearer ${token.trim()}`;
			}
			if (method !== 'GET' && method !== 'DELETE') {
				headers['Content-Type'] = 'application/json';
			}

			const res = await fetch(targetUrl, {
				method,
				headers,
				credentials: 'include',
				body: method !== 'GET' && method !== 'DELETE' && body.trim() ? body : undefined,
			});

			const latency = Math.round(performance.now() - start);
			const rawText = await res.text();
			let formatted = rawText;
			try {
				formatted = JSON.stringify(JSON.parse(rawText), null, 2);
			} catch {}

			setResponse({
				status: res.status,
				statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
				latency,
				body: formatted || '// Empty response body',
			});

			saveHistoryEntry({
				id: `${Date.now()}`,
				method,
				path: cleanPath,
				status: res.status,
				latency,
				timestamp: Date.now(),
			});
		} catch (err: any) {
			const latency = Math.round(performance.now() - start);
			setResponse({
				status: 0,
				statusText: 'Network / CORS Error',
				latency,
				body: JSON.stringify({ error: err.message || 'Request failed' }, null, 2),
			});
			saveHistoryEntry({
				id: `${Date.now()}`,
				method,
				path: cleanPath,
				status: 0,
				latency,
				timestamp: Date.now(),
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<section id="playground" className="space-y-6 scroll-mt-24">
			<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
				<Terminal className="text-(--accent)" size={24} />
				{t('docs.api.playground.title')}
			</h2>

			<div className="bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<p className="text-sm text-(--text-muted)">{t('docs.api.playground.description')}</p>

				{/* Preset Quick Pills */}
				<div className="flex flex-wrap items-center gap-1.5">
					<span className="text-xs font-semibold text-(--text-muted) mr-1">{t('docs.api.playground.presets')}:</span>
					{presets.map((p) => (
						<button
							key={p}
							type="button"
							onClick={() => {
								setMethod('GET');
								setPath(p);
							}}
							className={`px-3 py-1 rounded-full text-xs font-mono border transition-all cursor-pointer ${
								path === p
									? 'bg-(--accent)/15 text-(--accent) border-(--accent)/30 shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_20%,transparent)]'
									: 'bg-(--background)/60 text-(--text-muted) border-(--border)/10 hover:text-(--text) hover:border-(--accent)/30'
							}`}
						>
							{p}
						</button>
					))}
				</div>

				{/* Recent Request History Pills */}
				{history.length > 0 && (
					<div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-(--border)/10">
						<span className="inline-flex items-center gap-1 text-xs font-semibold text-(--text-muted) mr-1">
							<Clock size={12} className="text-(--accent)" />
							{t('docs.api.playground.recentHistory')}:
						</span>
						{history.map((item) => (
							<button
								key={item.id}
								type="button"
								onClick={() => {
									setMethod(item.method);
									setPath(item.path);
								}}
								className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-(--background)/50 hover:bg-(--background) border border-(--border)/10 hover:border-(--accent)/30 text-(--text-muted) hover:text-(--text) transition-all cursor-pointer"
							>
								<span className="font-bold text-(--accent)">{item.method}</span>
								<span>{item.path}</span>
								{item.status > 0 && <span className={item.status >= 200 && item.status < 300 ? 'text-(--accent-green)' : 'text-(--accent-red)'}>{item.status}</span>}
							</button>
						))}
						<button
							type="button"
							onClick={clearHistory}
							title={t('docs.api.playground.clearHistory')}
							className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-(--text-muted) hover:text-(--accent-red) transition-colors cursor-pointer"
						>
							<Trash2 size={11} />
						</button>
					</div>
				)}

				{/* Request Bar */}
				<div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
					<div className="w-full md:w-36 shrink-0">
						<Selector
							value={method}
							onChange={(val: string) => setMethod(val)}
							options={[
								{ value: 'GET', label: 'GET' },
								{ value: 'POST', label: 'POST' },
								{ value: 'PATCH', label: 'PATCH' },
								{ value: 'PUT', label: 'PUT' },
								{ value: 'DELETE', label: 'DELETE' },
							]}
						/>
					</div>
					<div className="flex-1">
						<Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/v1/bots/{id}" />
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<Button variant="secondary" onClick={handleCopyCurl} className="flex items-center gap-1.5 shrink-0">
							{copiedCurl ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} />}
							<span>{t('docs.api.playground.copyCurl')}</span>
						</Button>
						<Button onClick={handleSend} disabled={loading} className="flex items-center gap-2 shrink-0">
							<Play size={15} />
							<span>{loading ? t('docs.api.playground.sending') : t('docs.api.playground.send')}</span>
						</Button>
					</div>
				</div>

				{/* Optional Bearer Token & JSON Body */}
				<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text)">{t('docs.api.playground.bearerToken')}</label>
						<Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="xnx_live_... (optional)" />
					</div>

					{method !== 'GET' && method !== 'DELETE' && (
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text)">{t('docs.api.playground.jsonBody')}</label>
							<Input variant="textarea" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
						</div>
					)}
				</div>

				{/* Response Viewer */}
				{response && (
					<div className="mt-2 flex flex-col gap-2">
						<div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-(--background)/60 border border-(--border)/10 text-xs font-mono">
							<div className="flex items-center gap-2">
								<span
									className={`px-2.5 py-0.5 rounded-full font-bold border ${
										response.status >= 200 && response.status < 300
											? 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/25'
											: response.status >= 400 || response.status === 0
												? 'bg-(--accent-red)/15 text-(--accent-red) border-(--accent-red)/25'
												: 'bg-(--accent-orange)/15 text-(--accent-orange) border-(--accent-orange)/25'
									}`}
								>
									{response.status || 'ERR'} {response.statusText}
								</span>
							</div>
							<span className="inline-flex items-center gap-1 text-(--text-muted)">
								<Activity size={12} className="text-(--accent)" />
								{response.latency} ms
							</span>
						</div>

						<CodeBlock
							tabs={[
								{
									label: 'Response JSON',
									language: 'json',
									code: response.body,
								},
							]}
						/>
					</div>
				)}
			</div>
		</section>
	);
}
