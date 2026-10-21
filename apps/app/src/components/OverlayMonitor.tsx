/** @format */
'use client';

import { Activity, Bell, Bot, Compass, ExternalLink, LayoutDashboard, RefreshCw, Server, TerminalSquare, Trophy } from 'lucide-react';
import { Badge, Button, Tabs } from '@xernerx/ui';
import { useDictionary, useEnvironment, useNotifications, useSidebar } from '@xernerx/providers';
import { useCallback, useEffect, useState } from 'react';

export function OverlayMonitor() {
	const { t } = useDictionary();
	const { hide } = useSidebar();
	const { getEnvUrl, isReady } = useEnvironment();
	const { notifications, unreadCount, markAsRead, refresh } = useNotifications();

	const [activeTab, setActiveTab] = useState<'feed' | 'servers' | 'quick'>('feed');
	const [pingMs, setPingMs] = useState<number | null>(null);
	const [online, setOnline] = useState<boolean>(true);
	const [topBots, setTopBots] = useState<any[]>([]);
	const [topServers, setTopServers] = useState<any[]>([]);
	const [loadingData, setLoadingData] = useState(false);

	useEffect(() => {
		hide();
	}, [hide]);

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
			const [botsRes, serversRes] = await Promise.all([
				fetch(getEnvUrl('https://api.xernerx.com/secure/bots?category=biggest&limit=4')),
				fetch(getEnvUrl('https://api.xernerx.com/secure/guilds?category=biggest&limit=4')),
			]);
			if (botsRes.ok) setTopBots(await botsRes.json());
			if (serversRes.ok) setTopServers(await serversRes.json());
		} catch {}
		setLoadingData(false);
	}, [getEnvUrl, isReady]);

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
				className="flex items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/40 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
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

			<Tabs
				activeTab={activeTab}
				onChange={(id) => setActiveTab(id as any)}
				tabs={[
					{ id: 'feed', label: `${t('app.overlay.tabs.feed')}${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
					{ id: 'servers', label: t('app.overlay.tabs.servers') },
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
									{!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-(--accent)" />}
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
