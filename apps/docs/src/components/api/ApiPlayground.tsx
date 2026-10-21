/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Button, Input, Selector, CodeBlock } from '@xernerx/ui';
import { Play, Terminal, Activity } from 'lucide-react';

const PRESET_PATHS: Record<string, string[]> = {
	v1: ['/api/version', '/v1/leaderboard', '/v1/status/badge.svg', '/v1/bots/1059956767103668244/profile', '/v1/bots/1059956767103668244/stats', '/v1/bots/1059956767103668244/commands'],
	core: ['/core/faq/categories', '/core/faq/bots/registration', '/core/bots/1059956767103668244', '/core/users/482513687417061376', '/info/roadmap', '/info/issues', '/info/suggestions'],
	secure: ['/secure/core/versions', '/secure/core/audit?limit=10', '/secure/core', '/secure/store/catalog'],
};

export function ApiPlayground({ version, initialMethod, initialPath }: { version: string; initialMethod?: string; initialPath?: string }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

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
	const [response, setResponse] = useState<{
		status: number;
		statusText: string;
		latency: number;
		body: string;
	} | null>(null);

	const handleSend = async () => {
		setLoading(true);
		const start = performance.now();
		try {
			const cleanPath = path.startsWith('/') ? path : `/${path}`;
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
		} catch (err: any) {
			const latency = Math.round(performance.now() - start);
			setResponse({
				status: 0,
				statusText: 'Network / CORS Error',
				latency,
				body: JSON.stringify({ error: err.message || 'Request failed' }, null, 2),
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
					<Button onClick={handleSend} disabled={loading} className="flex items-center gap-2 shrink-0">
						<Play size={15} />
						<span>{loading ? t('docs.api.playground.sending') : t('docs.api.playground.send')}</span>
					</Button>
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
