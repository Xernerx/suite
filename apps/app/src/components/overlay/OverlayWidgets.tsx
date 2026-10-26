/** @format */
'use client';

import { useEffect, useState } from 'react';
import { Activity, Bot, Camera, Clock, ExternalLink, Flame, Gift, RefreshCw, Send, Sparkles, Webhook } from 'lucide-react';
import { Badge, Button, Input } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import { OverlayBotRunnerCard } from './OverlayBotRunnerCard';

function formatCountdown(targetDate: Date): string {
	const diffMs = Math.max(0, targetDate.getTime() - Date.now());
	const totalSeconds = Math.floor(diffMs / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	if (hours > 0) {
		return `${hours}h ${String(minutes).padStart(2, '0')}m`;
	}
	return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

export function OverlayDailyGiftPill() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { user, mutate, loading: userLoading } = useUser();

	const [claiming, setClaiming] = useState(false);
	const [localGiftIn, setLocalGiftIn] = useState<string | null>(null);
	const [localStreak, setLocalStreak] = useState<number | null>(null);
	const [countdownText, setCountdownText] = useState<string>('');

	const hasLoadedCredits = !userLoading && Boolean(user?.credits);
	const rawGiftIn = localGiftIn ?? (hasLoadedCredits ? user?.credits?.giftIn : null) ?? null;
	const streak = localStreak ?? (hasLoadedCredits ? user?.credits?.streak : 0) ?? 0;

	const giftTarget = rawGiftIn ? new Date(rawGiftIn) : null;
	const isCooldown = Boolean(giftTarget && giftTarget.getTime() > Date.now());
	const canClaimGift = hasLoadedCredits && (giftTarget !== null ? giftTarget.getTime() <= Date.now() : streak === 0);

	useEffect(() => {
		if (!giftTarget || giftTarget.getTime() <= Date.now()) {
			setCountdownText('');
			return;
		}
		const updateTimer = () => {
			if (giftTarget.getTime() <= Date.now()) {
				setCountdownText('');
			} else {
				setCountdownText(formatCountdown(giftTarget));
			}
		};
		updateTimer();
		const timer = setInterval(updateTimer, 1000);
		return () => clearInterval(timer);
	}, [rawGiftIn]);

	const handleClaimGift = async () => {
		if (!user?.id || claiming) return;
		setClaiming(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/${user.id}/gift`), {
				method: 'POST',
				credentials: 'include',
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				if (data.nextAvailable) {
					setLocalGiftIn(data.nextAvailable);
				}
				throw new Error(data.error || t('app.overlay.gift.claimFailed'));
			}
			if (data.credits?.giftIn) {
				setLocalGiftIn(data.credits.giftIn);
			} else {
				setLocalGiftIn(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
			}
			if (typeof data.streak === 'number') {
				setLocalStreak(data.streak);
			}
			await mutate();
			toast({
				type: 'success',
				title: t('app.overlay.gift.claimedToast', {
					reward: data.rewardEarned ?? data.reward ?? 100,
					streak: data.streak ?? streak + 1,
				}),
			});
		} catch (err: any) {
			toast({
				type: 'error',
				title: err.message || t('app.overlay.gift.claimFailed'),
			});
		} finally {
			setClaiming(false);
		}
	};

	return (
		<div
			className="flex items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/35 backdrop-blur-md shadow-sm"
			style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)', gap: 'var(--ui-gap)' }}
		>
			<div className="flex items-center gap-2.5 min-w-0">
				<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
					<Gift size={16} />
				</div>
				<div className="flex flex-col min-w-0">
					<div className="flex items-center gap-1.5">
						<span className="text-xs font-extrabold text-(--text) truncate">{t('app.overlay.gift.title')}</span>
						<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 px-2 py-0.5 text-[10px] font-extrabold text-(--accent)">
							<Flame size={10} />
							{t('app.overlay.gift.streakBadge', { count: streak })}
						</span>
					</div>
					<span className="text-[11px] text-(--text-muted) truncate">
						{!hasLoadedCredits || (isCooldown && countdownText) ? t('app.overlay.gift.cooldownDesc', { time: countdownText || '--:--' }) : t('app.overlay.gift.readyDesc')}
					</span>
				</div>
			</div>

			{!canClaimGift ? (
				<span className="inline-flex items-center gap-1.5 rounded-full bg-(--background)/60 border border-(--border)/10 px-3 py-1.5 text-xs font-mono font-bold text-(--text-muted) shrink-0">
					<Clock size={12} className="text-(--accent)" />
					{countdownText || '--:--'}
				</span>
			) : (
				<Button variant="primary" size="sm" onClick={handleClaimGift} loading={claiming} disabled={!user?.id || !canClaimGift} className="rounded-full shrink-0">
					{!claiming && <Sparkles size={13} />}
					<span>{t('app.overlay.gift.claimButton')}</span>
				</Button>
			)}
		</div>
	);
}

interface OverlayBotsTickerProps {
	bots: any[];
	onSelectBot: (botId: string) => void;
}

export function OverlayBotsTicker({ bots, onSelectBot }: OverlayBotsTickerProps) {
	const { t } = useDictionary();

	if (!bots || bots.length === 0) return null;

	return (
		<div
			className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/35 backdrop-blur-md shadow-sm"
			style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.5)' }}
		>
			<div className="flex items-center justify-between">
				<span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-(--text-muted)">
					<Bot size={13} className="text-(--accent)" />
					{t('app.overlay.ticker.title')}
				</span>
				<span className="text-[10px] font-mono font-bold text-(--accent)">{t('app.overlay.ticker.countBadge', { count: bots.length })}</span>
			</div>

			<div className="flex flex-wrap items-center gap-1.5">
				{bots.slice(0, 6).map((bot) => {
					const guildCount = bot.stats?.guildCount ?? bot.guilds ?? 0;
					const isBotOnline = bot.status ? bot.status === 'online' : Boolean(bot.stats || guildCount >= 0);

					return (
						<button
							key={bot.id}
							type="button"
							onClick={() => onSelectBot(bot.id)}
							className="inline-flex items-center gap-2 rounded-full border border-(--border)/10 bg-(--background)/60 hover:bg-(--background) hover:border-(--accent)/30 px-2.5 py-1 text-xs transition-all cursor-pointer"
						>
							<span className={`h-2 w-2 rounded-full shrink-0 ${isBotOnline ? 'bg-(--accent-green) animate-pulse' : 'bg-(--accent-orange)'}`} />
							<span className="font-bold text-(--text) truncate max-w-28">{bot.username || bot.name}</span>
							<span className="rounded-full bg-(--accent)/15 border border-(--accent)/30 px-1.5 py-0.2 text-[10px] font-mono font-bold text-(--accent)">{guildCount}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

interface OverlayBotWebhookInspectorProps {
	bots: any[];
	onNavigateMain: (path: string) => void;
}

export function OverlayBotWebhookInspector({ bots, onNavigateMain }: OverlayBotWebhookInspectorProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [relayUrl, setRelayUrl] = useState('http://localhost:3000/webhook');
	const [pinging, setPinging] = useState(false);
	const [deliveries, setDeliveries] = useState<any[]>([]);
	const [captureSources, setCaptureSources] = useState<Array<{ id: string; name: string; type: 'screen' | 'window'; thumbnailDataUrl: string }>>([]);
	const [showSourcePicker, setShowSourcePicker] = useState(false);
	const [snipping, setSnipping] = useState(false);

	const loadSources = async () => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (!bridge?.listCaptureSources) return;
		const list = await bridge.listCaptureSources();
		if (Array.isArray(list)) setCaptureSources(list);
	};

	const handleInstantSnip = async (sourceId?: string) => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (!bridge?.captureSourceToCdn) return;
		setSnipping(true);
		try {
			const res = await bridge.captureSourceToCdn(sourceId);
			if (res?.ok) {
				setShowSourcePicker(false);
				toast({
					type: 'success',
					title: t('app.overlay.snip.capturedToast'),
				});
			}
		} finally {
			setSnipping(false);
		}
	};

	useEffect(() => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (!bridge) return;

		bridge
			.getWebhookHistory?.()
			?.then?.((list: any[]) => {
				if (Array.isArray(list)) setDeliveries(list);
			})
			?.catch?.(() => {});

		const unsub = bridge.onWebhookDelivery?.((entry: any) => {
			if (!entry) return;
			setDeliveries((prev) => [entry, ...prev.filter((d) => d.id !== entry.id)].slice(0, 15));
		});

		return () => {
			unsub?.();
		};
	}, []);

	const handlePingRelay = async () => {
		const target = relayUrl.trim();
		if (!target) return;
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (!bridge?.relayLocalWebhook) return;
		setPinging(true);
		try {
			const res = await bridge.relayLocalWebhook({
				url: target,
				botId: bots[0]?.id || 'xernerx-overlay-test',
				events: ['vote', 'stats'],
			});
			if (res?.ok) {
				toast({
					type: 'success',
					title: `${res.status} ${res.statusText || 'OK'} (${res.latencyMs}ms)`,
				});
			} else {
				toast({
					type: 'error',
					title: res?.error || `${res?.status || 'ERR'} (${res?.latencyMs || 0}ms)`,
				});
			}
		} finally {
			setPinging(false);
		}
	};

	return (
		<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
			<OverlayBotRunnerCard bots={bots} compact />

			{/* Instant Snip-to-CDN & Offline Developer Vault Quick Actions */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/35 backdrop-blur-md p-3.5" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex flex-col">
						<span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-(--text)">
							<Camera size={13} className="text-(--accent)" />
							{t('app.overlay.snip.title')}
						</span>
						<span className="text-[11px] text-(--text-muted)">{t('app.overlay.snip.subtitle')}</span>
					</div>
					<div className="flex flex-wrap items-center gap-1.5">
						<Button variant="primary" size="sm" onClick={() => handleInstantSnip()} loading={snipping}>
							<Camera size={12} />
							<span>{t('app.overlay.snip.snapScreenBtn')}</span>
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={async () => {
								const next = !showSourcePicker;
								setShowSourcePicker(next);
								if (next) await loadSources();
							}}
						>
							<span>{t('app.overlay.snip.pickWindowBtn')}</span>
						</Button>
					</div>
				</div>

				{showSourcePicker && (
					<div className="flex flex-col gap-2 pt-2 border-t border-(--border)/10">
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t('app.overlay.snip.selectSourceLabel')}</span>
							<button type="button" onClick={loadSources} className="inline-flex items-center gap-1 text-[10px] font-bold text-(--accent) hover:underline cursor-pointer">
								<RefreshCw size={10} />
								<span>{t('app.overlay.snip.refreshSources')}</span>
							</button>
						</div>
						<div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
							{captureSources.map((src) => (
								<button
									key={src.id}
									type="button"
									onClick={() => handleInstantSnip(src.id)}
									className="group flex flex-col rounded-2xl border border-(--border)/10 bg-(--background)/60 hover:border-(--accent)/40 p-1.5 text-left transition-all cursor-pointer overflow-hidden"
								>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={src.thumbnailDataUrl} alt={src.name} className="h-20 w-full object-cover rounded-xl mb-1" />
									<span className="text-[10px] font-bold text-(--text) group-hover:text-(--accent) truncate w-full px-1">{src.name}</span>
								</button>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Live Bot Telemetry */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/35 backdrop-blur-md p-3.5" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				<div className="flex items-center justify-between">
					<span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-(--text)">
						<Activity size={13} className="text-(--accent)" />
						{t('app.overlay.inspector.botHealthTitle')}
					</span>
					<button
						type="button"
						onClick={() => onNavigateMain(getEnvUrl('https://portal.xernerx.com'))}
						className="inline-flex items-center gap-1 text-[11px] font-bold text-(--accent) hover:underline cursor-pointer"
					>
						<span>{t('app.overlay.inspector.openPortal')}</span>
						<ExternalLink size={11} />
					</button>
				</div>

				{bots.length === 0 ? (
					<p className="text-xs text-(--text-muted) py-2">{t('app.overlay.inspector.noBots')}</p>
				) : (
					<div className="flex flex-col gap-1.5">
						{bots.slice(0, 4).map((bot) => {
							const guildCount = bot.stats?.guildCount ?? bot.guilds ?? 0;
							const userCount = bot.stats?.userCount ?? bot.users ?? 0;
							return (
								<button
									key={bot.id}
									type="button"
									onClick={() => onNavigateMain(getEnvUrl(`https://portal.xernerx.com/bots/${bot.id}`))}
									className="flex items-center justify-between rounded-2xl bg-(--background)/60 hover:bg-(--background) border border-(--border)/10 px-3 py-2 text-left transition-colors cursor-pointer"
								>
									<div className="flex items-center gap-2 min-w-0">
										<span className="h-2 w-2 rounded-full bg-(--accent-green) shrink-0" />
										<span className="text-xs font-bold text-(--text) truncate">{bot.username || bot.name}</span>
									</div>
									<div className="flex items-center gap-1.5 shrink-0">
										<Badge variant="accent" size="sm">
											{guildCount} srv
										</Badge>
										{userCount > 0 && (
											<Badge variant="muted" size="sm">
												{userCount.toLocaleString()} usr
											</Badge>
										)}
									</div>
								</button>
							);
						})}
					</div>
				)}
			</div>

			{/* Localhost Webhook Relay */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/35 backdrop-blur-md p-3.5" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				<div className="flex flex-col">
					<span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-(--text)">
						<Webhook size={13} className="text-(--accent)" />
						{t('app.overlay.inspector.relayTitle')}
					</span>
					<span className="text-[11px] text-(--text-muted)">{t('app.overlay.inspector.relaySubtitle')}</span>
				</div>

				<div className="flex items-center gap-2">
					<div className="flex-1 min-w-0">
						<Input value={relayUrl} onChange={(e) => setRelayUrl(e.target.value)} placeholder={t('app.overlay.inspector.urlPlaceholder')} />
					</div>
					<Button variant="primary" size="sm" onClick={handlePingRelay} loading={pinging} className="shrink-0">
						{!pinging && <Send size={12} />}
						<span>{pinging ? t('app.overlay.inspector.pinging') : t('app.overlay.inspector.pingButton')}</span>
					</Button>
				</div>

				<div className="flex flex-col gap-1.5 mt-1">
					<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t('app.overlay.inspector.recentDeliveries')}</span>
					{deliveries.length === 0 ? (
						<p className="text-[11px] text-(--text-muted) py-1">{t('app.overlay.inspector.noDeliveries')}</p>
					) : (
						deliveries.slice(0, 5).map((d) => (
							<div key={d.id} className="flex flex-col rounded-2xl bg-(--background)/60 border border-(--border)/10 px-2.5 py-2 gap-1">
								<div className="flex items-center justify-between gap-2">
									<span className="text-[11px] font-mono text-(--text) truncate">{d.url}</span>
									<div className="flex items-center gap-1.5 shrink-0">
										<span
											className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${
												d.ok ? 'bg-(--accent-green)/15 text-(--accent-green)' : 'bg-(--accent-red)/15 text-(--accent-red)'
											}`}
										>
											{d.status || 'ERR'}
										</span>
										<span className="text-[10px] font-mono text-(--accent)">{d.latencyMs}ms</span>
									</div>
								</div>
								{d.bodyPreview && <p className="text-[10px] font-mono text-(--text-muted) truncate">{d.bodyPreview}</p>}
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
