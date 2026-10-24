/** @format */
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, Clock, Key, Play, Radio, RotateCcw, Sparkles, Terminal, Zap } from 'lucide-react';
import { Button, CodeBlock, Input, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';

interface PresetAction {
	id: string;
	label: string;
	service: 'xernerx' | 'virtue';
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	action: string;
	body: Record<string, any>;
}

const PRESET_ACTIONS: PresetAction[] = [
	{
		id: 'ping',
		label: 'ping',
		service: 'xernerx',
		method: 'GET',
		action: 'ping',
		body: { echo: 'heartbeat' },
	},
	{
		id: 'stats',
		label: 'stats',
		service: 'xernerx',
		method: 'POST',
		action: 'bots',
		body: { id: '102938475612345678', guildCount: 420, shardCount: 2, userCount: 84500 },
	},
	{
		id: 'guilds',
		label: 'guilds',
		service: 'virtue',
		method: 'GET',
		action: 'guilds',
		body: { id: '102938475612345678' },
	},
	{
		id: 'levels',
		label: 'levels',
		service: 'xernerx',
		method: 'GET',
		action: 'levels',
		body: { ownerId: '482513687417061376' },
	},
	{
		id: 'users',
		label: 'users',
		service: 'xernerx',
		method: 'GET',
		action: 'users',
		body: { id: '482513687417061376' },
	},
	{
		id: 'credits',
		label: 'credits',
		service: 'xernerx',
		method: 'PATCH',
		action: 'credits',
		body: { ownerId: '482513687417061376', streak: 7 },
	},
];

function buildSimulatedResponse(reqId: string, service: string, method: string, action: string, parsedBody: Record<string, any>) {
	const nowIso = new Date().toISOString();

	if (action === 'ping') {
		return {
			id: reqId,
			ok: true,
			status: 200,
			service,
			action: 'ping',
			pong: true,
			echo: parsedBody.echo || 'heartbeat',
			timestamp: nowIso,
		};
	}

	if (service === 'virtue' && action === 'guilds') {
		return {
			id: reqId,
			_id: '64e0a7bc9e1234567890abcd',
			id_guild: parsedBody.id || '102938475612345678',
			mode: parsedBody.mode || 'default',
			levelUp: parsedBody.levelUp ?? true,
			levelMessage: parsedBody.levelMessage || 'GG [@mention], you advanced to level [@level]!',
			cycles: { daily: true, weekly: true, monthly: false },
			updatedAt: nowIso,
		};
	}

	if (action === 'levels' || action === 'globalLevel') {
		return {
			id: reqId,
			ownerId: parsedBody.ownerId || parsedBody.id || '482513687417061376',
			level: 24,
			xp: 18450,
			nextLevelXp: 20000,
			updatedAt: nowIso,
		};
	}

	if (action === 'credits') {
		return {
			id: reqId,
			ownerId: parsedBody.ownerId || parsedBody.id || '482513687417061376',
			balance: 4250,
			streak: parsedBody.streak ?? 7,
			updatedAt: nowIso,
		};
	}

	if (action === 'bots' || action === 'stats') {
		return {
			id: reqId,
			botId: parsedBody.id || '102938475612345678',
			guildCount: parsedBody.guildCount ?? 420,
			shardCount: parsedBody.shardCount ?? 2,
			userCount: parsedBody.userCount ?? 84500,
			syncedAt: nowIso,
		};
	}

	return {
		id: reqId,
		ok: true,
		service,
		method,
		action: action || 'default',
		data: {
			...parsedBody,
			_simulated: true,
			processedAt: nowIso,
		},
	};
}

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
							if (data.id === `auth-${reqId}` && !data.error) {
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
				setLatencyMs(elapsed);
				setLastMode('live');
				setResponseJson(JSON.stringify(liveResult, null, 2));
				setDispatching(false);
				return;
			} catch {
				// Fall back cleanly to simulated preview if local WS daemon isn't running
			}
		}

		await new Promise((r) => setTimeout(r, 120));
		const simulated = buildSimulatedResponse(reqId, service, method, action.trim(), parsedBody);
		const elapsed = Math.max(1, Math.round(performance.now() - start));
		setLatencyMs(elapsed);
		setLastMode('simulated');
		setResponseJson(JSON.stringify(simulated, null, 2));
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
						<label className="text-xs font-bold text-(--text-muted)">{t('docs.websocket.playground.bodyLabel')}</label>
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
				<div className="lg:col-span-6 flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">
								{responseJson ? t('docs.websocket.playground.responseHeading') : t('docs.websocket.playground.framePreviewHeading')}
							</span>
							<span className="inline-flex items-center gap-1 text-[11px] font-mono text-(--accent)">
								<Radio size={12} />
								wss://ws.xernerx.com
							</span>
						</div>

						<div className="rounded-2xl overflow-hidden border border-(--border)/10 bg-(--background)/50 text-sm">
							<CodeBlock
								key={responseJson ? `res-${latencyMs}` : `req-${service}-${method}-${action}`}
								tabs={
									responseJson
										? [
												{
													label: t('docs.websocket.playground.responseTab'),
													language: 'json',
													code: responseJson,
												},
												{
													label: t('docs.websocket.playground.requestTab'),
													language: 'json',
													code: lastRequestJson || previewRequestFrame,
												},
											]
										: [
												{
													label: t('docs.websocket.playground.requestTab'),
													language: 'json',
													code: previewRequestFrame,
												},
											]
								}
							/>
						</div>
					</div>

					<div className="p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10 flex items-start gap-2.5">
						<Activity size={16} className="text-(--accent) shrink-0 mt-0.5" />
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('docs.websocket.playground.helperNote')}</p>
					</div>
				</div>
			</div>
		</motion.section>
	);
}
