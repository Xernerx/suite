/** @format */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Cloud, ExternalLink, GitBranch, Globe, Layers, Play, RefreshCw, Rocket, Server } from 'lucide-react';
import { Badge, Button, Input } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { HostingVercelDeployments, type VercelDeploymentItem } from './HostingVercelDeployments';

interface SuiteEdgeApp {
	id: string;
	name: string;
	domain: string;
	canaryDomain: string;
	devPort: number;
	prodVersion: string | null;
	canaryVersion: string | null;
	devVersion: string | null;
	prodLatencyMs: number | null;
	canaryLatencyMs: number | null;
	devLatencyMs: number | null;
	project: {
		id: string;
		name: string;
		framework: string;
		nodeVersion: string;
		updatedAt: number | null;
		repo: string | null;
		productionUrl: string | null;
		latestState: string | null;
	} | null;
	latestDeployment: VercelDeploymentItem | null;
}

interface HostingVercelPanelProps {
	userId?: string;
	reloadTrigger?: number;
	onTokenUpdated?: () => void;
}

export default function HostingVercelPanel({ userId, reloadTrigger = 0, onTokenUpdated }: HostingVercelPanelProps) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();

	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [connected, setConnected] = useState(false);
	const [vercelUser, setVercelUser] = useState<{ username?: string; email?: string; name?: string } | null>(null);
	const [connectionMeta, setConnectionMeta] = useState<{ username: string; teamId: string; hasToken: boolean } | null>(null);
	const [suiteApps, setSuiteApps] = useState<SuiteEdgeApp[]>([]);
	const [deployments, setDeployments] = useState<VercelDeploymentItem[]>([]);
	const [activeTab, setActiveTab] = useState<'apps' | 'deployments'>('apps');
	const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'issues'>('all');
	const [searchQuery, setSearchQuery] = useState('');
	const [redeployingId, setRedeployingId] = useState<string | null>(null);

	const fetchVercelStatus = useCallback(
		async (forceRefresh = false) => {
			if (!isReady || !userId) return;
			if (forceRefresh) setRefreshing(true);
			else setLoading(true);

			try {
				const qs = new URLSearchParams({ userId });
				if (forceRefresh) qs.set('refresh', 'true');
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/hosting/vercel?${qs.toString()}`), {
					credentials: 'include',
					cache: 'no-store',
				});
				const data = await res.json().catch(() => null);
				if (res.ok && data?.ok) {
					setConnected(Boolean(data.connected));
					setVercelUser(data.vercelUser || null);
					setConnectionMeta(data.connection || null);
					if (Array.isArray(data.suiteApps)) setSuiteApps(data.suiteApps);
					if (Array.isArray(data.deployments)) setDeployments(data.deployments);
				}
			} catch {
				// Ignore transient network errors
			} finally {
				setLoading(false);
				setRefreshing(false);
			}
		},
		[getEnvUrl, isReady, userId]
	);

	useEffect(() => {
		fetchVercelStatus(reloadTrigger > 0);
	}, [fetchVercelStatus, reloadTrigger]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		if (params.get('connected') === 'vercel') {
			toast({ type: 'success', title: t('account.connections.oauthSuccess', { provider: 'VERCEL' }) });
			params.delete('connected');
			window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
			onTokenUpdated?.();
			fetchVercelStatus(true);
		}
	}, [fetchVercelStatus, onTokenUpdated, t, toast]);

	const handleStartOAuth = () => {
		const returnTo = typeof window !== 'undefined' ? `${window.location.origin}/?node=vercel` : 'https://hosting.xernerx.com/?node=vercel';
		window.location.assign(`${getEnvUrl('https://account.xernerx.com')}/api/connections/vercel?returnTo=${encodeURIComponent(returnTo)}`);
	};

	const handleRedeploy = async (deploymentId: string, name: string, target: string) => {
		if (!userId || !deploymentId) return;
		setRedeployingId(deploymentId);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/hosting/vercel'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					userId,
					action: 'redeploy',
					deploymentId,
					name,
					target,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok || !data.ok) {
				toast({ type: 'error', title: data.error || t('hosting.vercel.redeployFailed') });
				return;
			}
			toast({ type: 'success', title: t('hosting.vercel.redeployTriggered', { name }) });
			await fetchVercelStatus(true);
		} catch {
			toast({ type: 'error', title: t('hosting.vercel.redeployFailed') });
		} finally {
			setRedeployingId(null);
		}
	};

	const prodOnlineCount = useMemo(() => suiteApps.filter((a) => Boolean(a.prodVersion)).length, [suiteApps]);
	const canaryOnlineCount = useMemo(() => suiteApps.filter((a) => Boolean(a.canaryVersion)).length, [suiteApps]);
	const avgProdLatency = useMemo(() => {
		const valid = suiteApps.map((a) => a.prodLatencyMs).filter((ms): ms is number => typeof ms === 'number' && ms > 0);
		if (valid.length === 0) return null;
		return Math.round(valid.reduce((acc, v) => acc + v, 0) / valid.length);
	}, [suiteApps]);

	const filteredApps = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return suiteApps.filter((app) => {
			if (statusFilter === 'online' && !app.prodVersion) return false;
			if (statusFilter === 'issues' && app.prodVersion && app.canaryVersion) return false;
			if (!q) return true;
			return app.name.toLowerCase().includes(q) || app.id.toLowerCase().includes(q) || app.domain.toLowerCase().includes(q) || (app.prodVersion && app.prodVersion.toLowerCase().includes(q));
		});
	}, [suiteApps, statusFilter, searchQuery]);

	const filteredDeployments = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return deployments.filter((d) => {
			if (statusFilter === 'online' && d.state !== 'READY') return false;
			if (statusFilter === 'issues' && d.state === 'READY') return false;
			if (!q) return true;
			return (
				d.name.toLowerCase().includes(q) ||
				(d.branch && d.branch.toLowerCase().includes(q)) ||
				(d.commitMessage && d.commitMessage.toLowerCase().includes(q)) ||
				(d.commitSha && d.commitSha.toLowerCase().includes(q))
			);
		});
	}, [deployments, statusFilter, searchQuery]);

	const vercelTeamUrl = 'https://vercel.com/xernerx';
	const userOauthLinked = Boolean(connectionMeta?.hasToken);

	return (
		<div className="flex flex-col flex-1 w-full h-full overflow-y-auto" style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}>
			{/* Top Summary KPI Strip */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 'calc(var(--ui-gap) * 0.6)' }}>
				<div className="flex items-center justify-between rounded-2xl bg-(--background)/60 border border-(--border)/10 p-3.5">
					<div className="flex flex-col gap-0.5">
						<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.vercel.kpiProduction')}</span>
						<span className="text-xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{prodOnlineCount} / {suiteApps.length || 12}
						</span>
						<span className="text-[11px] text-(--text-muted)">{avgProdLatency ? `${avgProdLatency}ms avg edge latency` : t('hosting.vercel.probingEdge')}</span>
					</div>
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/30">
						<Globe size={18} />
					</div>
				</div>

				<div className="flex items-center justify-between rounded-2xl bg-(--background)/60 border border-(--border)/10 p-3.5">
					<div className="flex flex-col gap-0.5">
						<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.vercel.kpiCanary')}</span>
						<span className="text-xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{canaryOnlineCount} / {suiteApps.length || 12}
						</span>
						<span className="text-[11px] text-(--text-muted)">*.canary.xernerx.com</span>
					</div>
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						<Layers size={18} />
					</div>
				</div>

				<div className="flex items-center justify-between rounded-2xl bg-(--background)/60 border border-(--border)/10 p-3.5">
					<div className="flex flex-col gap-0.5">
						<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.vercel.kpiDeployments')}</span>
						<span className="text-xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{connected ? deployments.length : '—'}
						</span>
						<span className="text-[11px] text-(--text-muted) truncate max-w-44">Xernerx Studios (xernerx)</span>
					</div>
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						<Rocket size={18} />
					</div>
				</div>

				<div className="flex items-center justify-between rounded-2xl bg-(--background)/60 border border-(--border)/10 p-3.5">
					<div className="flex flex-col gap-0.5 min-w-0">
						<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.vercel.kpiUserOauth')}</span>
						<div className="flex items-center gap-1.5">
							<span className={`h-2 w-2 rounded-full ${userOauthLinked ? 'bg-(--accent-green)' : 'bg-(--accent-orange)'}`} />
							<span className="text-sm font-extrabold text-(--text) truncate">
								{userOauthLinked ? `@${connectionMeta?.username || vercelUser?.username || 'vercel'}` : t('hosting.vercel.notLinked')}
							</span>
						</div>
						<button type="button" onClick={handleStartOAuth} className="text-left text-[11px] font-bold text-(--accent) hover:underline cursor-pointer">
							{userOauthLinked ? t('account.connections.vercel.reconnectOauth') : t('account.connections.vercel.oauthButton')}
						</button>
					</div>
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shrink-0">
						<Cloud size={18} />
					</div>
				</div>
			</div>

			{/* Filter & Search Bar */}
			<div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--background)/60 border border-(--border)/10 p-2.5">
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center gap-1 rounded-xl bg-(--foreground)/40 border border-(--border)/10 p-1">
						<button
							type="button"
							onClick={() => setActiveTab('apps')}
							className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
								activeTab === 'apps' ? 'bg-(--accent) text-(--text)' : 'text-(--text-muted) hover:text-(--text)'
							}`}
						>
							<Server size={12} />
							<span>
								{t('hosting.vercel.tabSuiteApps')} ({suiteApps.length || 12})
							</span>
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('deployments')}
							className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
								activeTab === 'deployments' ? 'bg-(--accent) text-(--text)' : 'text-(--text-muted) hover:text-(--text)'
							}`}
						>
							<Rocket size={12} />
							<span>
								{t('hosting.vercel.tabDeployments')} {connected ? `(${deployments.length})` : ''}
							</span>
						</button>
					</div>

					<div className="flex items-center gap-1 rounded-xl bg-(--foreground)/40 border border-(--border)/10 p-1">
						{(['all', 'online', 'issues'] as const).map((f) => (
							<button
								key={f}
								type="button"
								onClick={() => setStatusFilter(f)}
								className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
									statusFilter === f ? 'bg-(--accent)/20 text-(--accent) border border-(--accent)/30' : 'text-(--text-muted) hover:text-(--text)'
								}`}
							>
								{t(`hosting.vercel.filter_${f}`)}
							</button>
						))}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial justify-end">
					<div className="w-full sm:w-64">
						<Input variant="search" shortcut={true} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('hosting.vercel.searchPlaceholder')} />
					</div>
					<Button variant="secondary" size="sm" onClick={() => fetchVercelStatus(true)} loading={refreshing} className="flex items-center gap-1.5">
						<RefreshCw size={13} />
						<span className="hidden sm:inline">{t('hosting.vercel.refresh')}</span>
					</Button>
					{!userOauthLinked && (
						<Button variant="primary" size="sm" onClick={handleStartOAuth} className="flex items-center gap-1.5">
							<Cloud size={13} />
							<span className="hidden sm:inline">{t('account.connections.vercel.oauthButton')}</span>
						</Button>
					)}
					<a
						href={vercelTeamUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 rounded-2xl bg-(--accent)/15 hover:bg-(--accent)/25 border border-(--accent)/30 px-3 py-1.5 text-xs font-bold text-(--accent) transition-colors"
					>
						<ExternalLink size={13} />
						<span className="hidden sm:inline">vercel.com/xernerx</span>
					</a>
				</div>
			</div>

			{/* Main Content Area */}
			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: 'calc(var(--ui-gap) * 0.6)' }}>
					{Array.from({ length: 6 }).map((_, idx) => (
						<div key={idx} className="h-40 rounded-2xl bg-(--background)/50 border border-(--border)/10 animate-pulse p-4" />
					))}
				</div>
			) : activeTab === 'apps' ? (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: 'calc(var(--ui-gap) * 0.6)' }}>
					{filteredApps.map((app) => {
						const prodOnline = Boolean(app.prodVersion);
						const canaryOnline = Boolean(app.canaryVersion);
						const projectUrl = app.project?.name ? `${vercelTeamUrl}/${app.project.name}` : vercelTeamUrl;

						return (
							<div
								key={app.id}
								className="flex flex-col justify-between rounded-2xl bg-(--background)/60 border border-(--border)/10 p-4 hover:border-(--accent)/30 transition-all"
								style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}
							>
								<div className="flex items-start justify-between gap-2">
									<div className="flex items-center gap-2.5 min-w-0">
										<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 font-mono text-xs font-extrabold shrink-0">
											{app.id.slice(0, 3).toUpperCase()}
										</div>
										<div className="min-w-0">
											<div className="flex items-center gap-1.5">
												<span className="text-sm font-extrabold text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
													{app.name}
												</span>
												<span className="rounded-full bg-(--foreground)/60 border border-(--border)/10 px-2 py-0.5 font-mono text-[10px] text-(--text-muted)">
													:{app.devPort}
												</span>
											</div>
											<span className="font-mono text-[11px] text-(--text-muted) truncate block">{app.domain}</span>
										</div>
									</div>

									<div className="flex items-center gap-1 shrink-0">
										{app.latestDeployment && (
											<Button
												variant="secondary"
												size="sm"
												loading={redeployingId === app.latestDeployment.id}
												onClick={() => handleRedeploy(app.latestDeployment!.id, app.latestDeployment!.name, 'production')}
												title={t('hosting.vercel.redeployTooltip')}
												className="px-2 py-1 text-[11px]"
											>
												<Play size={11} className="text-(--accent)" />
											</Button>
										)}
										<a
											href={projectUrl}
											target="_blank"
											rel="noopener noreferrer"
											title={t('hosting.vercel.openInVercel')}
											className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-(--foreground)/50 hover:bg-(--accent)/20 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 transition-colors"
										>
											<ExternalLink size={12} />
										</a>
									</div>
								</div>

								{/* Production & Canary Rows */}
								<div className="flex flex-col gap-1.5 rounded-xl bg-(--foreground)/35 border border-(--border)/10 p-2.5 text-xs">
									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-1.5 min-w-0">
											<span className={`h-2 w-2 rounded-full ${prodOnline ? 'bg-(--accent-green)' : 'bg-(--accent-red)'} shrink-0`} />
											<a href={`https://${app.domain}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-(--text) hover:text-(--accent) truncate">
												{t('hosting.vercel.productionLabel')}
											</a>
										</div>
										<div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
											{app.prodLatencyMs !== null && <span className="text-(--text-muted)">{app.prodLatencyMs}ms</span>}
											<span
												className={`rounded-full px-2 py-0.5 font-bold ${
													prodOnline
														? 'bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/25'
														: 'bg-(--accent-red)/15 text-(--accent-red) border border-(--accent-red)/25'
												}`}
											>
												{app.prodVersion ? `v${app.prodVersion}` : t('hosting.vercel.offline')}
											</span>
										</div>
									</div>

									<div className="flex items-center justify-between gap-2 pt-1.5 border-t border-(--border)/10">
										<div className="flex items-center gap-1.5 min-w-0">
											<span className={`h-2 w-2 rounded-full ${canaryOnline ? 'bg-(--accent-green)' : 'bg-(--accent-orange)'} shrink-0`} />
											<a
												href={`https://${app.canaryDomain}`}
												target="_blank"
												rel="noopener noreferrer"
												className="font-semibold text-(--text-muted) hover:text-(--accent) truncate"
											>
												{t('hosting.vercel.canaryLabel')}
											</a>
										</div>
										<div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
											{app.canaryLatencyMs !== null && <span className="text-(--text-muted)">{app.canaryLatencyMs}ms</span>}
											<span
												className={`rounded-full px-2 py-0.5 font-bold ${
													canaryOnline
														? 'bg-(--accent)/15 text-(--accent) border border-(--accent)/25'
														: 'bg-(--accent-orange)/15 text-(--accent-orange) border border-(--accent-orange)/25'
												}`}
											>
												{app.canaryVersion ? `v${app.canaryVersion}` : t('hosting.vercel.ssoOrOffline')}
											</span>
										</div>
									</div>
								</div>

								{app.latestDeployment && (
									<div className="flex items-center justify-between gap-2 text-[11px] text-(--text-muted) font-mono pt-0.5">
										<span className="inline-flex items-center gap-1 truncate">
											<GitBranch size={11} className="text-(--accent) shrink-0" />
											<span className="truncate">{app.latestDeployment.branch}</span>
											{app.latestDeployment.commitSha && <span>• {app.latestDeployment.commitSha}</span>}
										</span>
										<Badge variant={app.latestDeployment.state === 'READY' ? 'success' : 'accent'} size="sm">
											{app.latestDeployment.state}
										</Badge>
									</div>
								)}
							</div>
						);
					})}
				</div>
			) : (
				<HostingVercelDeployments connected={connected} deployments={filteredDeployments} redeployingId={redeployingId} onRedeploy={handleRedeploy} onStartOAuth={handleStartOAuth} />
			)}
		</div>
	);
}
