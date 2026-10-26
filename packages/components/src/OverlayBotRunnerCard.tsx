/** @format */
'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Code2, FolderOpen, Globe, Play, RotateCw, Send, Square, Terminal, Trash2 } from 'lucide-react';
import { Badge, Button, Input, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';

export interface LocalBotApiRequestLog {
	id: string;
	method: string;
	url: string;
	path: string;
	status: number;
	statusText: string;
	ok: boolean;
	latencyMs: number;
	malformed: boolean;
	detail?: string;
	timestamp: string;
}

export interface LocalBotRunnerState {
	botId: string;
	name: string;
	cwd: string;
	command: string;
	running: boolean;
	pid: number | null;
	startedAt: number | null;
	lastExitCode: number | null;
	logs: string[];
	apiLogs?: LocalBotApiRequestLog[];
}

export interface OverlayBotRunnerCardProps {
	bots?: any[];
	fixedBot?: { id: string; name: string };
	compact?: boolean;
}

export function OverlayBotRunnerCard({ bots = [], fixedBot, compact = false }: OverlayBotRunnerCardProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [isElectron, setIsElectron] = useState(false);
	const [runners, setRunners] = useState<LocalBotRunnerState[]>([]);
	const [selectedBotId, setSelectedBotId] = useState<string>(fixedBot?.id || bots[0]?.id || 'local-bot');
	const [commandInput, setCommandInput] = useState('pnpm dev');
	const [probePath, setProbePath] = useState('');
	const [viewMode, setViewMode] = useState<'api' | 'terminal'>('api');
	const [busy, setBusy] = useState(false);
	const [probing, setProbing] = useState(false);

	useEffect(() => {
		if (fixedBot?.id) {
			setSelectedBotId(fixedBot.id);
		} else if (bots.length > 0 && (!selectedBotId || selectedBotId === 'local-bot')) {
			setSelectedBotId(bots[0].id);
		}
	}, [fixedBot?.id, bots, selectedBotId]);

	const activeBotId = fixedBot?.id || selectedBotId || 'local-bot';

	useEffect(() => {
		if (!probePath) {
			const sampleId = activeBotId && activeBotId !== 'local-bot' ? activeBotId : '482513687417061376';
			setProbePath(`/v1/bots/${sampleId}/profile`);
		}
	}, [activeBotId, probePath]);

	useEffect(() => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (!bridge?.getBotRunners) return;
		setIsElectron(true);

		bridge
			.getBotRunners()
			.then((list: LocalBotRunnerState[]) => {
				if (Array.isArray(list)) setRunners(list);
			})
			.catch(() => {});

		const unsub = bridge.onBotRunnersChange?.((list: LocalBotRunnerState[]) => {
			if (Array.isArray(list)) setRunners(list);
		});

		return () => {
			unsub?.();
		};
	}, []);

	const activeBotName =
		fixedBot?.name || bots.find((b) => b.id === activeBotId)?.username || bots.find((b) => b.id === activeBotId)?.name || runners.find((r) => r.botId === activeBotId)?.name || 'Local Bot';

	const currentRunner = runners.find((r) => r.botId === activeBotId) || null;
	const apiLogs = currentRunner?.apiLogs || [];
	const terminalLogs = currentRunner?.logs || [];

	useEffect(() => {
		if (currentRunner?.command) {
			setCommandInput(currentRunner.command);
		}
	}, [currentRunner?.botId, currentRunner?.command]);

	if (!isElectron) return null;

	const handleLinkDirectory = async () => {
		const bridge = (window as any).electron;
		if (!bridge?.selectBotRunnerDirectory) return;
		const folder = await bridge.selectBotRunnerDirectory();
		if (!folder) return;
		const nextStates = await bridge.configureBotRunner({
			botId: activeBotId,
			name: activeBotName,
			cwd: folder,
			command: commandInput.trim() || 'pnpm dev',
		});
		if (Array.isArray(nextStates)) setRunners(nextStates);
		toast({ type: 'success', title: t('app.overlay.runner.folderLinked') });
	};

	const handleSaveCommand = async () => {
		const bridge = (window as any).electron;
		if (!bridge?.configureBotRunner || !currentRunner?.cwd) return;
		const nextStates = await bridge.configureBotRunner({
			botId: activeBotId,
			name: activeBotName,
			cwd: currentRunner.cwd,
			command: commandInput.trim() || 'pnpm dev',
		});
		if (Array.isArray(nextStates)) setRunners(nextStates);
	};

	const handleStart = async () => {
		const bridge = (window as any).electron;
		if (!bridge?.startBotRunner || !currentRunner?.cwd) return;
		setBusy(true);
		try {
			await handleSaveCommand();
			const res = await bridge.startBotRunner(activeBotId);
			if (res?.states) setRunners(res.states);
			if (!res?.ok && res?.error) {
				toast({ type: 'error', title: res.error });
			}
		} finally {
			setBusy(false);
		}
	};

	const handleStop = async () => {
		const bridge = (window as any).electron;
		if (!bridge?.stopBotRunner) return;
		setBusy(true);
		try {
			const nextStates = await bridge.stopBotRunner(activeBotId);
			if (Array.isArray(nextStates)) setRunners(nextStates);
		} finally {
			setBusy(false);
		}
	};

	const handleRestart = async () => {
		const bridge = (window as any).electron;
		if (!bridge?.restartBotRunner) return;
		setBusy(true);
		try {
			await handleSaveCommand();
			const res = await bridge.restartBotRunner(activeBotId);
			if (res?.states) setRunners(res.states);
		} finally {
			setBusy(false);
		}
	};

	const handleUnlink = async () => {
		const bridge = (window as any).electron;
		if (!bridge?.configureBotRunner) return;
		const nextStates = await bridge.configureBotRunner({
			botId: activeBotId,
			remove: true,
		});
		if (Array.isArray(nextStates)) setRunners(nextStates);
	};

	const handleOpenTarget = async (target: 'vscode' | 'cursor' | 'terminal' | 'explorer') => {
		const bridge = (window as any).electron;
		if (!bridge?.openBotRunnerTarget || !currentRunner?.cwd) return;
		const res = await bridge.openBotRunnerTarget({
			cwd: currentRunner.cwd,
			target,
		});
		if (!res?.ok && res?.error) {
			toast({ type: 'error', title: res.error });
		}
	};

	const handleProbeApi = async (overridePath?: string) => {
		const bridge = (window as any).electron;
		if (!bridge?.probeBotRunnerApi) return;
		const rawTarget = (overridePath ?? probePath).trim();
		if (!rawTarget) return;
		if (overridePath) setProbePath(overridePath);

		const fullUrl = /^https?:\/\//i.test(rawTarget) ? rawTarget : getEnvUrl(`https://api.xernerx.com${rawTarget.startsWith('/') ? rawTarget : '/' + rawTarget}`);

		setProbing(true);
		try {
			const res = await bridge.probeBotRunnerApi({
				botId: activeBotId,
				url: fullUrl,
				method: 'GET',
			});
			if (res?.states) setRunners(res.states);
			setViewMode('api');
		} finally {
			setProbing(false);
		}
	};

	const botOptions =
		bots.length > 0
			? bots.map((b) => ({
					value: String(b.id),
					label: String(b.username || b.name || b.id),
				}))
			: [{ value: 'local-bot', label: t('app.overlay.runner.defaultBotLabel') }];

	const crashed = Boolean(currentRunner && !currentRunner.running && typeof currentRunner.lastExitCode === 'number' && currentRunner.lastExitCode !== 0);

	return (
		<div
			className={`flex flex-col border border-(--border)/10 bg-(--foreground)/35 backdrop-blur-md shadow-sm ${compact ? 'rounded-3xl p-3.5' : 'rounded-3xl p-6'}`}
			style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}
		>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-(--text)">
						<Terminal size={14} className="text-(--accent)" />
						{t('app.overlay.runner.title')}
					</span>
					{currentRunner?.running ? (
						<Badge variant="success" size="sm">
							{t('app.overlay.runner.statusRunning', { pid: currentRunner.pid || '-' })}
						</Badge>
					) : crashed ? (
						<Badge variant="danger" size="sm">
							{t('app.overlay.runner.statusCrashed', { code: currentRunner?.lastExitCode ?? 1 })}
						</Badge>
					) : (
						<Badge variant="muted" size="sm">
							{t('app.overlay.runner.statusStopped')}
						</Badge>
					)}
				</div>

				<div className="flex items-center gap-1.5">
					<Button variant="secondary" size="sm" onClick={handleLinkDirectory} className="flex items-center gap-1">
						<FolderOpen size={12} />
						<span>{currentRunner?.cwd ? t('app.overlay.runner.changeFolder') : t('app.overlay.runner.linkFolder')}</span>
					</Button>
					{currentRunner?.cwd && (
						<Button variant="ghost" size="sm" onClick={handleUnlink} className="text-(--text-muted) hover:text-(--accent-red)">
							<Trash2 size={12} />
						</Button>
					)}
				</div>
			</div>

			<p className="text-[11px] text-(--text-muted)">{t('app.overlay.runner.subtitle')}</p>

			{!fixedBot && bots.length > 1 && <Selector value={activeBotId} options={botOptions} onChange={(val) => setSelectedBotId(val)} items={false} />}

			{currentRunner?.cwd && (
				<div className="flex flex-col gap-2">
					<div className="flex flex-wrap items-center justify-between gap-1.5 rounded-xl bg-(--background)/60 border border-(--border)/10 px-2.5 py-1.5">
						<span className="font-mono text-[11px] text-(--text-muted) truncate max-w-full">{currentRunner.cwd}</span>
						<div className="flex flex-wrap items-center gap-1">
							<button
								type="button"
								onClick={() => handleOpenTarget('vscode')}
								className="inline-flex items-center gap-1 rounded-full bg-(--foreground)/60 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/30 px-2 py-0.5 text-[10px] font-bold text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
							>
								<Code2 size={10} />
								<span>{t('app.overlay.runner.openVscode')}</span>
							</button>
							<button
								type="button"
								onClick={() => handleOpenTarget('cursor')}
								className="inline-flex items-center gap-1 rounded-full bg-(--foreground)/60 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/30 px-2 py-0.5 text-[10px] font-bold text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
							>
								<Code2 size={10} />
								<span>{t('app.overlay.runner.openCursor')}</span>
							</button>
							<button
								type="button"
								onClick={() => handleOpenTarget('terminal')}
								className="inline-flex items-center gap-1 rounded-full bg-(--foreground)/60 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/30 px-2 py-0.5 text-[10px] font-bold text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
							>
								<Terminal size={10} />
								<span>{t('app.overlay.runner.openTerminal')}</span>
							</button>
							<button
								type="button"
								onClick={() => handleOpenTarget('explorer')}
								className="inline-flex items-center gap-1 rounded-full bg-(--foreground)/60 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/30 px-2 py-0.5 text-[10px] font-bold text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
							>
								<FolderOpen size={10} />
								<span>{t('app.overlay.runner.openExplorer')}</span>
							</button>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<div className="flex-1 min-w-0">
							<Input value={commandInput} onChange={(e) => setCommandInput(e.target.value)} onBlur={handleSaveCommand} placeholder="pnpm dev" />
						</div>
						{!currentRunner.running ? (
							<Button variant="primary" size="sm" onClick={handleStart} loading={busy} className="shrink-0">
								<Play size={12} />
								<span>{t('app.overlay.runner.startBtn')}</span>
							</Button>
						) : (
							<>
								<Button variant="secondary" size="sm" onClick={handleRestart} loading={busy} className="shrink-0">
									<RotateCw size={12} />
								</Button>
								<Button variant="danger" size="sm" onClick={handleStop} loading={busy} className="shrink-0">
									<Square size={12} />
									<span>{t('app.overlay.runner.stopBtn')}</span>
								</Button>
							</>
						)}
					</div>
				</div>
			)}

			{/* Outbound API Request Probe & Live Interceptor Feed */}
			<div className="flex flex-col gap-2 pt-1 border-t border-(--border)/10">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							onClick={() => setViewMode('api')}
							className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
								viewMode === 'api' ? 'bg-(--accent) text-(--text)' : 'bg-(--background)/60 text-(--text-muted) hover:text-(--text)'
							}`}
						>
							<Globe size={11} />
							<span>{t('app.overlay.runner.apiTab', { count: apiLogs.length })}</span>
						</button>
						<button
							type="button"
							onClick={() => setViewMode('terminal')}
							className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
								viewMode === 'terminal' ? 'bg-(--accent) text-(--text)' : 'bg-(--background)/60 text-(--text-muted) hover:text-(--text)'
							}`}
						>
							<Terminal size={11} />
							<span>{t('app.overlay.runner.terminalTab', { count: terminalLogs.length })}</span>
						</button>
					</div>

					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => handleProbeApi(`/v1/bots/${activeBotId && activeBotId !== 'local-bot' ? activeBotId : '482513687417061376'}/profile`)}
							className="rounded-full bg-(--background)/60 hover:bg-(--accent)/15 border border-(--border)/10 px-2 py-0.5 font-mono text-[9px] text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
						>
							/v1/bots/:id
						</button>
						<button
							type="button"
							onClick={() => handleProbeApi('/v1/bots/undefined/profile')}
							className="rounded-full bg-(--background)/60 hover:bg-(--accent-red)/15 border border-(--border)/10 px-2 py-0.5 font-mono text-[9px] text-(--text-muted) hover:text-(--accent-red) transition-colors cursor-pointer"
						>
							/undefined (404)
						</button>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<div className="flex-1 min-w-0">
						<Input
							value={probePath}
							onChange={(e) => setProbePath(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									handleProbeApi();
								}
							}}
							placeholder="/v1/bots/482513687417061376/profile"
						/>
					</div>
					<Button variant="secondary" size="sm" onClick={() => handleProbeApi()} loading={probing} className="shrink-0">
						{!probing && <Send size={12} />}
						<span>{t('app.overlay.runner.testEndpointBtn')}</span>
					</Button>
				</div>

				{viewMode === 'api' ? (
					apiLogs.length === 0 ? (
						<p className="text-[11px] text-(--text-muted) py-1">{t('app.overlay.runner.noApiLogs')}</p>
					) : (
						<div className="max-h-44 overflow-y-auto flex flex-col gap-1.5">
							{apiLogs.slice(0, 15).map((req) => (
								<div
									key={req.id}
									className={`flex flex-col rounded-2xl border px-2.5 py-2 gap-1 ${
										req.ok ? 'bg-(--background)/60 border-(--border)/10' : 'bg-(--accent-red)/5 border-(--accent-red)/25'
									}`}
								>
									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-1.5 min-w-0">
											<span className="rounded-md bg-(--accent)/15 border border-(--accent)/30 px-1.5 py-0.5 font-mono text-[9px] font-extrabold text-(--accent) shrink-0">
												{req.method}
											</span>
											<span className="font-mono text-[11px] font-bold text-(--text) truncate">{req.path}</span>
										</div>
										<div className="flex items-center gap-1.5 shrink-0">
											{req.malformed && (
												<span className="inline-flex items-center gap-0.5 rounded-full bg-(--accent-orange)/15 border border-(--accent-orange)/30 px-1.5 py-0.5 text-[9px] font-extrabold text-(--accent-orange)">
													<AlertTriangle size={9} />
													{t('app.overlay.runner.malformedBadge')}
												</span>
											)}
											<span
												className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-extrabold ${
													req.ok ? 'bg-(--accent-green)/15 text-(--accent-green)' : 'bg-(--accent-red)/15 text-(--accent-red)'
												}`}
											>
												{req.status ? `${req.status} ${req.statusText}` : req.statusText}
											</span>
											<span className="font-mono text-[10px] text-(--accent)">{req.latencyMs}ms</span>
										</div>
									</div>
									{req.detail && <p className="font-mono text-[10px] text-(--text-muted) truncate">{req.detail}</p>}
								</div>
							))}
						</div>
					)
				) : terminalLogs.length === 0 ? (
					<p className="text-[11px] text-(--text-muted) py-1">{t('app.overlay.runner.noTerminalLogs')}</p>
				) : (
					<div className="max-h-40 overflow-y-auto rounded-2xl bg-(--background)/80 border border-(--border)/10 p-2.5 font-mono text-[10px] leading-relaxed text-(--text-muted) flex flex-col gap-0.5">
						{terminalLogs.slice(-25).map((line, idx) => (
							<div key={idx} className={line.includes('[stderr]') || line.includes('exited with code') ? 'text-(--accent-orange) break-all' : 'break-all'}>
								{line}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default OverlayBotRunnerCard;
