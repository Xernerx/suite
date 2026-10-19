/** @format */
'use client';

import { useState } from 'react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Button, Input, Selector, CodeBlock } from '@xernerx/ui';
import { Play, Terminal, Clock, Activity } from 'lucide-react';

const PRESET_PATHS: Record<string, string[]> = {
	v1: ['/api/version', '/v1/bots/1059956767103668244', '/v1/bots/1059956767103668244/stats', '/v1/bots/1059956767103668244/commands'],
	core: ['/api/version', '/info/roadmap', '/info/issues', '/info/suggestions'],
	secure: ['/secure/core/versions', '/secure/core/audit?limit=10', '/secure/core'],
};

export function ApiPlayground({ version }: { version: string }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	const presets = PRESET_PATHS[version] || PRESET_PATHS.v1;

	const [method, setMethod] = useState('GET');
	const [path, setPath] = useState(presets[0]);
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
			<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2 border-b border-(--border)/10 pb-4">
				<Terminal className="text-(--accent)" size={24} />
				{t('docs.api.playground.title')}
			</h2>

			<div className="bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-6 flex flex-col gap-4">
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
							className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
								path === p ? 'bg-(--accent)/15 text-(--accent) border-(--accent)/30' : 'bg-(--background)/60 text-(--text-muted) border-(--border)/10 hover:text-(--text)'
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
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
						<div className="flex items-center justify-between px-3 py-2 rounded-xl bg-(--background)/60 border border-(--border)/10 text-xs font-mono">
							<div className="flex items-center gap-2">
								<span
									className={`px-2 py-0.5 rounded font-bold ${
										response.status >= 200 && response.status < 300
											? 'bg-emerald-500/15 text-emerald-400'
											: response.status >= 400 || response.status === 0
												? 'bg-red-500/15 text-red-400'
												: 'bg-amber-500/15 text-amber-400'
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
