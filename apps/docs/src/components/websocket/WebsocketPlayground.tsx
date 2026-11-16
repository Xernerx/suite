/** @format */
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Code2, Copy, Key, Play, RotateCcw, Sparkles, Terminal, Zap } from 'lucide-react';
import { Button, Input, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { buildSimulatedResponse, PRESET_ACTIONS, type PresetAction, type WebsocketDispatchHistoryItem } from './websocketPlaygroundPresets';
import { WebsocketPlaygroundResponsePanel } from './WebsocketPlaygroundResponsePanel';

export function WebsocketPlayground() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [service, setService] = useState<string>('virtue');
	const [method, setMethod] = useState<string>('GET');
	const [action, setAction] = useState<string>('guilds');
	const [token, setToken] = useState<string>('');
	const [bodyText, setBodyText] = useState<string>(JSON.stringify({ id: '102938475612345678' }, null, 2));

	const [dispatching, setDispatching] = useState(false);
	const [lastMode, setLastMode] = useState<'live' | 'simulated' | null>(null);
	const [latencyMs, setLatencyMs] = useState<number | null>(null);
	const [responseJson, setResponseJson] = useState<string>('');
	const [lastRequestJson, setLastRequestJson] = useState<string>('');
	const [history, setHistory] = useState<WebsocketDispatchHistoryItem[]>([]);

	const handleFormatJson = () => {
		try {
			const parsed = bodyText.trim() ? JSON.parse(bodyText) : {};
			setBodyText(JSON.stringify(parsed, null, 2));
		} catch {
			toast({ type: 'error', title: t('docs.websocket.playground.invalidJson') });
		}
	};

	const handleCopyWscat = () => {
		let parsed: Record<string, any> = {};
		try {
			parsed = bodyText.trim() ? JSON.parse(bodyText) : {};
		} catch {
			toast({ type: 'error', title: t('docs.websocket.playground.invalidJson') });
			return;
		}
		const frame = JSON.stringify({ id: 'rpc-cli', service, method, action: action.trim() || undefined, body: parsed });
		const cmd = `npx wscat -c wss://ws.xernerx.com -x '${frame.replace(/'/g, "'\\''")}'`;
		navigator.clipboard.writeText(cmd);
		toast({ type: 'success', title: t('docs.websocket.playground.wscatCopied') });
	};

	const handleSelectPreset = (preset: PresetAction) => {
		setService(preset.service);
		setMethod(preset.method);
		setAction(preset.action);
		setBodyText(JSON.stringify(preset.body, null, 2));
	};

	const handleDispatch = async (forceSimulate = false) => {
		let parsedBody: Record<string, any> = {};
		try {
			parsedBody = bodyText.trim() ? JSON.parse(bodyText) : {};
		} catch {
			toast({
				type: 'error',
				title: t('docs.websocket.playground.invalidJson'),
			});
			return;
		}

		setDispatching(true);
		const reqId = `rpc-${Math.random().toString(36).slice(2, 8)}`;
		const rpcFrame = {
			id: reqId,
			service,
			method,
			action: action.trim() || undefined,
			body: parsedBody,
		};
		setLastRequestJson(JSON.stringify(rpcFrame, null, 2));

		const start = performance.now();

		if (!forceSimulate && typeof window !== 'undefined' && 'WebSocket' in window) {
			try {
				const rawWsBase = getEnvUrl('https://ws.xernerx.com').replace(/^http/, 'ws');
				const liveResult = await new Promise<any>((resolve, reject) => {
					const ws = new WebSocket(rawWsBase);
					const timeout = setTimeout(() => {
						ws.close();
						reject(new Error('WS timeout'));
					}, 2200);

					ws.onopen = () => {
						if (token.trim()) {
							ws.send(
								JSON.stringify({
									id: `auth-${reqId}`,
									service: 'auth',
									body: { token: token.trim().replace(/^Bearer\s+/i, '') },
								})
							);
						}
						ws.send(JSON.stringify(rpcFrame));
					};

					ws.onmessage = (event) => {
						try {
							const data = JSON.parse(String(event.data));
							if (data.id === `auth-${reqId}` && data.success === true) {
								return;
							}
							clearTimeout(timeout);
							ws.close();
							resolve(data);
						} catch (e) {
							clearTimeout(timeout);
							ws.close();
							reject(e);
						}
					};

					ws.onerror = () => {
						clearTimeout(timeout);
						ws.close();
						reject(new Error('WS connection failed'));
					};
				});

				const elapsed = Math.max(1, Math.round(performance.now() - start));
				const formattedRes = JSON.stringify(liveResult, null, 2);
				setLatencyMs(elapsed);
				setLastMode('live');
				setResponseJson(formattedRes);
				setHistory((prev) => [{ id: reqId, service, method, action: action.trim(), bodyText, responseJson: formattedRes, latencyMs: elapsed, mode: 'live' as const }, ...prev].slice(0, 5));
				setDispatching(false);
				return;
			} catch {
				// Fall back cleanly to simulated preview if local WS daemon isn't running
			}
		}

		await new Promise((r) => setTimeout(r, 120));
		const simulated = buildSimulatedResponse(reqId, service, method, action.trim(), parsedBody);
		const elapsed = Math.max(1, Math.round(performance.now() - start));
		const formattedSim = JSON.stringify(simulated, null, 2);
		setLatencyMs(elapsed);
		setLastMode('simulated');
		setResponseJson(formattedSim);
		setHistory((prev) => [{ id: reqId, service, method, action: action.trim(), bodyText, responseJson: formattedSim, latencyMs: elapsed, mode: 'simulated' as const }, ...prev].slice(0, 5));
		setDispatching(false);
	};

	const previewRequestFrame = (() => {
		try {
			return JSON.stringify(
				{
					id: 'rpc-preview',
					service,
					method,
					action: action.trim() || undefined,
					body: bodyText.trim() ? JSON.parse(bodyText) : {},
				},
				null,
				2
			);
		} catch {
			return bodyText;
		}
	})();

	return (
		<motion.section
			id="playground"
			initial={{ opacity: 1, y: 0 }}
			animate={{ opacity: 1, y: 0 }}
			className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden scroll-mt-28"
			style={{ padding: 'var(--ui-gap)' }}
		>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-(--border)/10">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						<Terminal size={20} />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('docs.websocket.playground.title')}
							</h2>
							<span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
								{t('docs.websocket.playground.badge')}
							</span>
						</div>
						<p className="text-xs text-(--text-muted) mt-0.5">{t('docs.websocket.playground.subtitle')}</p>
					</div>
				</div>

				{latencyMs !== null && (
					<div className="flex items-center gap-2 self-start sm:self-auto">
						<span
							className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
								lastMode === 'live' ? 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30' : 'bg-(--accent)/15 text-(--accent) border border-(--accent)/30'
							}`}
						>
							<CheckCircle2 size={12} />
							{lastMode === 'live' ? t('docs.websocket.playground.modeLive') : t('docs.websocket.playground.modeSimulated')}
						</span>
						<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-(--background)/60 text-(--text) border border-(--border)/10">
							<Clock size={12} className="text-(--accent)" />
							{latencyMs}ms
						</span>
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				{/* Left Column: RPC Controls */}
				<div className="lg:col-span-6 flex flex-col gap-4">
					{/* Preset Action Pills */}
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('docs.websocket.playground.presetsLabel')}</span>
						<div className="flex flex-wrap items-center gap-1.5">
							{PRESET_ACTIONS.map((preset) => {
								const isSelected = service === preset.service && method === preset.method && action === preset.action;
								return (
									<button
										key={preset.id}
										type="button"
										onClick={() => handleSelectPreset(preset)}
										className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer ${
											isSelected
												? 'bg-(--accent) text-white border-(--accent) shadow-sm'
												: 'bg-(--background)/60 text-(--text-muted) border-(--border)/10 hover:text-(--text) hover:border-(--accent)/30'
										}`}
									>
										<Zap size={11} />
										<span>{preset.label}</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Service & Method Selectors */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text-muted)">{t('docs.websocket.playground.serviceLabel')}</label>
							<Selector
								items={true}
								value={service}
								onChange={setService}
								options={[
									{ value: 'virtue', label: 'virtue' },
									{ value: 'xernerx', label: 'xernerx' },
								]}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text-muted)">{t('docs.websocket.playground.methodLabel')}</label>
							<Selector
								items={true}
								value={method}
								onChange={setMethod}
								options={[
									{ value: 'GET', label: 'GET' },
									{ value: 'POST', label: 'POST' },
									{ value: 'PATCH', label: 'PATCH' },
									{ value: 'DELETE', label: 'DELETE' },
								]}
							/>
						</div>
					</div>

					{/* Action & Optional Bearer Token Inputs */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text-muted)">{t('docs.websocket.playground.actionLabel')}</label>
							<Input value={action} onChange={(e) => setAction(e.target.value)} placeholder={t('docs.websocket.playground.actionPlaceholder')} />
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-bold text-(--text-muted) flex items-center gap-1">
								<Key size={12} className="text-(--accent)" />
								<span>{t('docs.websocket.playground.tokenLabel')}</span>
							</label>
							<Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder={t('docs.websocket.playground.tokenPlaceholder')} />
						</div>
					</div>

					{/* JSON Body Textarea */}
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between gap-2">
							<label className="text-xs font-bold text-(--text-muted)">{t('docs.websocket.playground.bodyLabel')}</label>
							<button
								type="button"
								onClick={handleFormatJson}
								className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-(--background)/60 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 transition-colors cursor-pointer"
							>
								<Code2 size={10} />
								<span>{t('docs.websocket.playground.formatJson')}</span>
							</button>
						</div>
						<Input variant="textarea" rows={5} value={bodyText} onChange={(e) => setBodyText(e.target.value)} className="font-mono text-xs" placeholder="{}" />
					</div>

					{/* Dispatch Buttons */}
					<div className="flex flex-wrap items-center gap-2.5 pt-1">
						<Button variant="primary" onClick={() => handleDispatch(false)} loading={dispatching}>
							{!dispatching && <Play size={14} />}
							<span>{t('docs.websocket.playground.sendButton')}</span>
						</Button>

						<Button variant="secondary" onClick={() => handleDispatch(true)} disabled={dispatching}>
							<Sparkles size={14} className="text-(--accent)" />
							<span>{t('docs.websocket.playground.simulateButton')}</span>
						</Button>

						<Button variant="secondary" size="sm" onClick={handleCopyWscat}>
							<Copy size={13} className="text-(--accent)" />
							<span>{t('docs.websocket.playground.copyWscat')}</span>
						</Button>

						{responseJson && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setResponseJson('');
									setLatencyMs(null);
									setLastMode(null);
								}}
							>
								<RotateCcw size={13} />
								<span>{t('docs.websocket.playground.clearButton')}</span>
							</Button>
						)}
					</div>
				</div>

				{/* Right Column: Live Frame & Formatted JSON Response */}
				<WebsocketPlaygroundResponsePanel
					service={service}
					method={method}
					action={action}
					latencyMs={latencyMs}
					responseJson={responseJson}
					lastRequestJson={lastRequestJson}
					previewRequestFrame={previewRequestFrame}
					history={history}
					onSelectHistoryItem={(h) => {
						setService(h.service);
						setMethod(h.method);
						setAction(h.action);
						setBodyText(h.bodyText);
						setResponseJson(h.responseJson);
						setLatencyMs(h.latencyMs);
						setLastMode(h.mode);
					}}
				/>
			</div>
		</motion.section>
	);
}
