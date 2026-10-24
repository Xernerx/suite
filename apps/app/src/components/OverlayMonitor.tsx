/** @format */
'use client';

import { Activity, Bell, Bot, Compass, ExternalLink, Eye, Ghost, LayoutDashboard, RefreshCw, Server, TerminalSquare, Trophy } from 'lucide-react';
import { Badge, Button, Tabs } from '@xernerx/ui';
import { useDictionary, useEnvironment, useNotifications, useSidebar, useUser } from '@xernerx/providers';
import { useCallback, useEffect, useState } from 'react';
import { OverlayBotWebhookInspector, OverlayBotsTicker, OverlayDailyGiftPill } from '@/components/overlay/OverlayWidgets';

export function OverlayMonitor() {
	const { t } = useDictionary();
	const { hide } = useSidebar();
	const { getEnvUrl, isReady } = useEnvironment();
	const { notifications, unreadCount, markAsRead, refresh } = useNotifications();
	const { user } = useUser();

	const [activeTab, setActiveTab] = useState<'feed' | 'servers' | 'inspector' | 'quick'>('feed');
	const [pingMs, setPingMs] = useState<number | null>(null);
	const [online, setOnline] = useState<boolean>(true);
	const [topBots, setTopBots] = useState<any[]>([]);
	const [ownedBots, setOwnedBots] = useState<any[]>([]);
	const [topServers, setTopServers] = useState<any[]>([]);
	const [loadingData, setLoadingData] = useState(false);
	const [isElectron, setIsElectron] = useState(false);
	const [ghostMode, setGhostMode] = useState(false);
	const [opacity, setOpacity] = useState(1);

	useEffect(() => {
		hide();
	}, [hide]);

	useEffect(() => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (!bridge) return;
		setIsElectron(true);

		bridge
			.getOverlayState?.()
			?.then?.((st: any) => {
				if (st) {
					setGhostMode(Boolean(st.ghostMode));
					setOpacity(typeof st.opacity === 'number' ? st.opacity : 1);
				}
			})
			?.catch?.(() => {});

		const unsub = bridge.onOverlayStateChange?.((st: any) => {
			if (st) {
				setGhostMode(Boolean(st.ghostMode));
				setOpacity(typeof st.opacity === 'number' ? st.opacity : 1);
			}
		});
		return () => {
			unsub?.();
		};
	}, []);

	const handleToggleGhostMode = async () => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (!bridge?.setOverlayGhostMode) return;
		const next = !ghostMode;
		setGhostMode(next);
		await bridge.setOverlayGhostMode(next);
	};

	const handleSetOpacity = async (val: number) => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		setOpacity(val);
		await bridge?.setOverlayOpacity?.(val);
	};

	const measureTelemetry = useCallback(async () => {
		if (!isReady) return;
		const start = performance.now();
		try {
			const res = await fetch('/api/version', { cache: 'no-store' });
			const elapsed = Math.round(performance.now() - start);
			setOnline(res.ok);
			setPingMs(elapsed);
		} catch {
			setOnline(false);
			setPingMs(null);
		}
	}, [isReady]);

	const fetchQuickEntities = useCallback(async () => {
		if (!isReady) return;
		setLoadingData(true);
		try {
			const requests: Promise<Response>[] = [
				fetch(getEnvUrl('https://api.xernerx.com/secure/bots?category=biggest&limit=4')),
				fetch(getEnvUrl('https://api.xernerx.com/secure/guilds?category=biggest&limit=4')),
			];
			if (user?.id) {
				requests.push(fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?owner=${user.id}`), { credentials: 'include' }));
			}
			const [botsRes, serversRes, ownedRes] = await Promise.all(requests);
			if (botsRes?.ok) setTopBots(await botsRes.json());
			if (serversRes?.ok) setTopServers(await serversRes.json());
			if (ownedRes?.ok) {
				const ownedData = await ownedRes.json();
				if (Array.isArray(ownedData)) setOwnedBots(ownedData);
			}
		} catch {}
		setLoadingData(false);
	}, [getEnvUrl, isReady, user]);

	useEffect(() => {
		measureTelemetry();
		fetchQuickEntities();
		const timer = setInterval(measureTelemetry, 10000);
		return () => clearInterval(timer);
	}, [measureTelemetry, fetchQuickEntities]);

	const navigateInMain = (path: string) => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (bridge?.navigateMain) {
			bridge.navigateMain(path);
		} else if (typeof window !== 'undefined') {
			window.location.assign(path);
		}
	};

	return (
		<div className="flex flex-col w-full max-w-md mx-auto" style={{ gap: 'var(--ui-gap)' }}>
			{/* Telemetry Status Card */}
			<div
				className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/40 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
			>
				<div className="flex items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex items-center gap-3 min-w-0">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
							<Activity size={18} />
						</div>
						<div className="flex flex-col min-w-0">
							<h1 className="text-sm font-extrabold text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.overlay.title')}
							</h1>
							<div className="flex items-center gap-2 text-[11px] text-(--text-muted)">
								<span className={`h-2 w-2 rounded-full ${online ? 'bg-(--accent-green)' : 'bg-(--accent-orange)'}`} />
								<span>{online ? t('app.overlay.statusOnline') : t('app.overlay.statusOffline')}</span>
								{pingMs !== null && <span className="font-mono text-(--accent)">• {pingMs}ms</span>}
							</div>
						</div>
					</div>

					<Button
						variant="secondary"
						size="sm"
						onClick={() => {
							measureTelemetry();
							refresh();
							fetchQuickEntities();
						}}
						className="shrink-0"
					>
						<RefreshCw size={13} className={loadingData ? 'animate-spin' : ''} />
					</Button>
				</div>

				{isElectron && (
					<div
						onMouseEnter={() => (window as any).electron?.setOverlayInteractiveHover?.(true)}
						onMouseLeave={() => (window as any).electron?.setOverlayInteractiveHover?.(false)}
						className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--background)/60 border border-(--border)/10 px-3 py-2"
					>
						<button
							type="button"
							onClick={handleToggleGhostMode}
							className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
								ghostMode ? 'bg-(--accent)/20 border-(--accent)/40 text-(--accent)' : 'bg-(--foreground)/50 border-(--border)/15 text-(--text-muted) hover:text-(--text)'
							}`}
						>
							<Ghost size={12} />
							<span>{ghostMode ? t('app.overlay.ghostActive') : t('app.overlay.ghostToggle')}</span>
							<kbd className="font-mono text-[9px] opacity-75">Alt+Shift+O</kbd>
						</button>

						<div className="flex items-center gap-1">
							<Eye size={12} className="text-(--text-muted) mr-0.5" />
							{[1, 0.85, 0.7, 0.5].map((lvl) => (
								<button
									key={lvl}
									type="button"
									onClick={() => handleSetOpacity(lvl)}
									className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold transition-colors cursor-pointer ${
										Math.abs(opacity - lvl) < 0.05 ? 'bg-(--accent) text-(--text)' : 'bg-(--foreground)/40 text-(--text-muted) hover:text-(--text)'
									}`}
								>
									{Math.round(lvl * 100)}%
								</button>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Quick Daily Gift Claim Pill */}
			<OverlayDailyGiftPill />

			{/* Owned Bots Live Status Ticker */}
			<OverlayBotsTicker
				bots={ownedBots.length > 0 ? ownedBots : topBots}
				onSelectBot={(botId) => navigateInMain(ownedBots.some((b) => b.id === botId) ? `/portal/bots/${botId}` : `/bots/${botId}`)}
			/>

			<Tabs
				activeTab={activeTab}
				onChange={(id) => setActiveTab(id as any)}
				tabs={[
					{ id: 'feed', label: `${t('app.overlay.tabs.feed')}${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
					{ id: 'servers', label: t('app.overlay.tabs.servers') },
					{ id: 'inspector', label: t('app.overlay.tabs.inspector') },
					{ id: 'quick', label: t('app.overlay.tabs.quick') },
				]}
			/>

			{activeTab === 'feed' && (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					{notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 p-8 text-center">
							<Bell size={22} className="text-(--text-muted) mb-2 opacity-60" />
							<p className="text-xs text-(--text-muted)">{t('app.overlay.emptyFeed')}</p>
						</div>
					) : (
						notifications.slice(0, 8).map((n) => (
							<div
								key={n.id}
								onClick={() => {
									markAsRead(n.id);
									if (n.link) navigateInMain(n.link);
								}}
								className={`flex flex-col rounded-2xl border transition-colors cursor-pointer p-3 gap-1 ${
									!n.read ? 'border-(--accent)/30 bg-(--accent)/10' : 'border-(--border)/10 bg-(--foreground)/30 hover:bg-(--foreground)/50'
								}`}
							>
								<div className="flex items-center justify-between gap-2">
									<span className="text-xs font-bold text-(--text) truncate">{n.title}</span>
									<div className="flex items-center gap-1.5 shrink-0">
										{n.createdAt && (
											<span className="text-[10px] font-medium text-(--text-muted)/80">
												{new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
											</span>
										)}
										{!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-(--accent)" />}
									</div>
								</div>
								{n.message && <p className="text-[11px] text-(--text-muted) line-clamp-2">{n.message}</p>}
							</div>
						))
					)}
				</div>
			)}

			{activeTab === 'servers' && (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					{topBots.map((bot) => (
						<button
							key={`bot-${bot.id}`}
							type="button"
							onClick={() => navigateInMain(`/bots/${bot.id}`)}
							className="flex items-center justify-between rounded-2xl border border-(--border)/10 bg-(--foreground)/30 hover:bg-(--foreground)/50 p-3 text-left transition-colors cursor-pointer"
						>
							<div className="flex items-center gap-2.5 min-w-0">
								<Bot size={16} className="text-(--accent) shrink-0" />
								<span className="text-xs font-bold text-(--text) truncate">{bot.username || bot.name}</span>
							</div>
							<Badge variant="accent" size="sm">
								{bot.guilds || 0}
							</Badge>
						</button>
					))}
					{topServers.map((srv) => (
						<button
							key={`srv-${srv.id}`}
							type="button"
							onClick={() => navigateInMain(`/servers/${srv.id}`)}
							className="flex items-center justify-between rounded-2xl border border-(--border)/10 bg-(--foreground)/30 hover:bg-(--foreground)/50 p-3 text-left transition-colors cursor-pointer"
						>
							<div className="flex items-center gap-2.5 min-w-0">
								<Server size={16} className="text-(--accent) shrink-0" />
								<span className="text-xs font-bold text-(--text) truncate">{srv.name}</span>
							</div>
							<Badge variant="muted" size="sm">
								{srv.memberCount || 0}
							</Badge>
						</button>
					))}
				</div>
			)}

			{activeTab === 'inspector' && <OverlayBotWebhookInspector bots={ownedBots.length > 0 ? ownedBots : topBots} onNavigateMain={navigateInMain} />}

			{activeTab === 'quick' && (
				<div className="grid grid-cols-1" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					{[
						{ label: t('app.home.text6'), path: '/dashboard', icon: LayoutDashboard },
						{ label: t('app.home.text7'), path: '/portal', icon: TerminalSquare },
						{ label: t('app.dashboard.nav.explore'), path: '/', icon: Compass },
						{ label: t('app.leaderboard.title'), path: '/leaderboard', icon: Trophy },
					].map((item) => {
						const Icon = item.icon;
						return (
							<button
								key={item.path}
								type="button"
								onClick={() => navigateInMain(item.path)}
								className="flex items-center justify-between rounded-2xl border border-(--border)/10 bg-(--foreground)/30 hover:bg-(--foreground)/60 hover:border-(--accent)/30 p-3.5 transition-all cursor-pointer"
							>
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--accent)/15 text-(--accent)">
										<Icon size={15} />
									</div>
									<span className="text-xs font-bold text-(--text)">{item.label}</span>
								</div>
								<ExternalLink size={13} className="text-(--text-muted)" />
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
