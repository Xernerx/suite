/** @format */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { Button, Input, Modal, CodeBlock } from '@xernerx/ui';
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Clock, ExternalLink, Bug, Server, Globe, Code2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { StatusBotsSection, type MainOrgBotStatus } from './StatusBotsSection';
import { Status24hBar, type StatusBucketPoint } from './Status24hBar';

interface ServiceStatus {
	id: string;
	labelKey: string;
	host: string;
	port: number;
	status: 'operational' | 'degraded' | 'down' | 'checking';
	version: string | null;
	ping: number | null;
}

const SUITE_SERVICES: Array<{ id: string; labelKey: string; host: string; port: number }> = [
	{ id: 'www', labelKey: 'info.status.services.www', host: 'xernerx.com', port: 4000 },
	{ id: 'app', labelKey: 'info.status.services.app', host: 'app.xernerx.com', port: 4004 },
	{ id: 'portal', labelKey: 'info.status.services.portal', host: 'portal.xernerx.com', port: 4009 },
	{ id: 'account', labelKey: 'info.status.services.account', host: 'account.xernerx.com', port: 4003 },
	{ id: 'api', labelKey: 'info.status.services.api', host: 'api.xernerx.com', port: 4001 },
	{ id: 'cdn', labelKey: 'info.status.services.cdn', host: 'cdn.xernerx.com', port: 4002 },
	{ id: 'docs', labelKey: 'info.status.services.docs', host: 'docs.xernerx.com', port: 4005 },
	{ id: 'info', labelKey: 'info.status.services.info', host: 'info.xernerx.com', port: 4007 },
	{ id: 'store', labelKey: 'info.status.services.store', host: 'store.xernerx.com', port: 4008 },
	{ id: 'admin', labelKey: 'info.status.services.admin', host: 'admin.xernerx.com', port: 4006 },
	{ id: 'hosting', labelKey: 'info.status.services.hosting', host: 'hosting.xernerx.com', port: 4010 },
	{ id: 'haste', labelKey: 'info.status.services.haste', host: 'haste.xernerx.com', port: 4011 },
];

export default function StatusClient() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { hide } = useSidebar();

	const [services, setServices] = useState<ServiceStatus[]>(
		SUITE_SERVICES.map((s) => ({
			...s,
			status: 'checking',
			version: null,
			ping: null,
		}))
	);
	const [bots, setBots] = useState<MainOrgBotStatus[]>([]);
	const [serviceHistory, setServiceHistory] = useState<Record<string, StatusBucketPoint[]>>({});
	const [botHistory, setBotHistory] = useState<Record<string, StatusBucketPoint[]>>({});
	const [verifiedIssues, setVerifiedIssues] = useState<any[]>([]);
	const [refreshing, setRefreshing] = useState(false);
	const [lastChecked, setLastChecked] = useState<Date | null>(null);
	const [search, setSearch] = useState('');
	const [badgeModalOpen, setBadgeModalOpen] = useState(false);

	useEffect(() => {
		hide();
	}, [hide]);

	const checkAllServices = useCallback(
		async (forceRefresh = false) => {
			if (!isReady) return;
			setRefreshing(true);

			try {
				const historyUrl = forceRefresh ? 'https://api.xernerx.com/info/status/history?refresh=true' : 'https://api.xernerx.com/info/status/history';
				const [versionsRes, issuesRes, botsRes, historyRes] = await Promise.all([
					fetch(getEnvUrl('https://api.xernerx.com/secure/core/versions'), { credentials: 'include' }).catch(() => null),
					fetch(getEnvUrl('https://api.xernerx.com/info/issues')).catch(() => null),
					fetch(getEnvUrl('https://api.xernerx.com/info/status/bots'), { cache: 'no-store' }).catch(() => null),
					fetch(getEnvUrl(historyUrl), { cache: 'no-store' }).catch(() => null),
				]);

				const versionsData = versionsRes && versionsRes.ok ? await versionsRes.json().catch(() => null) : null;
				const issuesData = issuesRes && issuesRes.ok ? await issuesRes.json().catch(() => null) : null;
				const botsData = botsRes && botsRes.ok ? await botsRes.json().catch(() => null) : null;
				const historyData = historyRes && historyRes.ok ? await historyRes.json().catch(() => null) : null;

				if (historyData?.bots) setBotHistory(historyData.bots);

				if (Array.isArray(issuesData?.data)) {
					setVerifiedIssues(issuesData.data.filter((issue: any) => issue.status !== 'resolved' && issue.status !== 'closed').slice(0, 6));
				}

				if (Array.isArray(botsData?.bots)) {
					setBots(botsData.bots);
				}

				const updated = await Promise.all(
					SUITE_SERVICES.map(async (svc) => {
						const liveSvc = historyData?.liveServices?.[svc.id];
						const mapSvc = versionsData?.map?.[svc.id];

						let ping: number | null = liveSvc?.ping ?? mapSvc?.devLatencyMs ?? mapSvc?.prodLatencyMs ?? mapSvc?.canaryLatencyMs ?? null;
						let version: string | null = liveSvc?.version ?? mapSvc?.localVersion ?? mapSvc?.devVersion ?? mapSvc?.prodVersion ?? mapSvc?.canaryVersion ?? null;
						let isUp = Boolean(version || liveSvc?.status === 'operational' || liveSvc?.status === 'degraded');

						if (!isUp) {
							const probeHost = svc.id === 'www' ? 'www.xernerx.com' : svc.host;
							const targetUrl = getEnvUrl(`https://${probeHost}/api/version`);
							const start = performance.now();
							try {
								const controller = new AbortController();
								const timeout = setTimeout(() => controller.abort(), 5000);
								const res = await fetch(targetUrl, { signal: controller.signal, cache: 'no-store' });
								clearTimeout(timeout);
								if (res.ok) {
									ping = Math.round(performance.now() - start);
									const data = await res.json().catch(() => ({}));
									version = data?.version || null;
									isUp = Boolean(version);
								}
							} catch {}
						}

						const status: ServiceStatus['status'] = !isUp ? 'down' : ping && ping > 1200 ? 'degraded' : 'operational';

						return {
							...svc,
							status,
							version,
							ping,
						};
					})
				);

				if (historyData?.services) {
					const nextHistory: Record<string, StatusBucketPoint[]> = { ...historyData.services };
					const referenceSeries: StatusBucketPoint[] | undefined = nextHistory.api || nextHistory.app || Object.values(nextHistory)[0];
					if (Array.isArray(referenceSeries) && referenceSeries.length > 0) {
						for (const svc of updated) {
							if (svc.status === 'down') continue;
							const existing = nextHistory[svc.id];
							const nonEmptyCount = Array.isArray(existing) ? existing.filter((pt) => pt.status && pt.status !== 'empty').length : 0;
							if (!Array.isArray(existing) || nonEmptyCount < 2) {
								nextHistory[svc.id] = referenceSeries.map((refPt, idx) => {
									const cur = existing?.[idx];
									if (cur && cur.status && cur.status !== 'empty') return cur;
									if (refPt.status && refPt.status !== 'empty' && refPt.status !== 'down') {
										return {
											timestamp: refPt.timestamp,
											status: idx === referenceSeries.length - 1 ? svc.status : 'operational',
											ping: svc.ping ?? refPt.ping,
										};
									}
									return { timestamp: refPt.timestamp, status: 'empty', ping: null };
								});
							}
						}
					}
					setServiceHistory(nextHistory);
				}

				fetch(getEnvUrl('https://api.xernerx.com/info/status/history'), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						services: updated.map((s) => ({ id: s.id, status: s.status, ping: s.ping })),
					}),
				}).catch(() => null);

				setServices(updated);
				setLastChecked(new Date());
			} finally {
				setRefreshing(false);
			}
		},
		[isReady, getEnvUrl]
	);

	useEffect(() => {
		if (isReady) {
			checkAllServices();
		}
	}, [isReady, checkAllServices]);

	const botsOnlineCount = bots.filter((b) => b.status !== 'offline').length;
	const botsOfflineCount = bots.filter((b) => b.status === 'offline').length;
	const totalMonitoredCount = services.length + bots.length;
	const operationalCount = services.filter((s) => s.status === 'operational').length + botsOnlineCount;
	const downCount = services.filter((s) => s.status === 'down').length + botsOfflineCount;
	const isChecking = services.some((s) => s.status === 'checking');

	const filteredServices = services.filter((s) => {
		if (!search.trim()) return true;
		const q = search.toLowerCase();
		return t(s.labelKey).toLowerCase().includes(q) || s.host.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
	});

	const filteredBots = bots.filter((b) => {
		if (!search.trim()) return true;
		const q = search.toLowerCase();
		return b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || (b.activity || '').toLowerCase().includes(q) || b.status.toLowerCase().includes(q);
	});

	const avgPing = (() => {
		const valid = services.filter((s) => typeof s.ping === 'number').map((s) => s.ping as number);
		if (valid.length === 0) return null;
		return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
	})();

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full p-6 md:p-10" style={{ gap: 'var(--ui-gap)', fontSize: 'var(--text-scale, 14px)' }}>
			{/* Hero Banner */}
			<div
				className={`flex flex-col md:flex-row md:items-center justify-between rounded-3xl border backdrop-blur-md shadow-sm transition-all ${
					isChecking
						? 'bg-(--foreground)/35 border-(--border)/15'
						: downCount === 0
							? 'bg-(--accent-green)/10 border-(--accent-green)/25'
							: downCount < totalMonitoredCount / 2
								? 'bg-(--accent-orange)/10 border-(--accent-orange)/25'
								: 'bg-(--accent-red)/10 border-(--accent-red)/25'
				}`}
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex items-center gap-4">
					<div
						className={`flex h-14 w-14 items-center justify-center rounded-2xl border shrink-0 ${
							isChecking
								? 'bg-(--background)/60 border-(--border)/10 text-(--accent)'
								: downCount === 0
									? 'bg-(--accent-green)/20 border-(--accent-green)/30 text-(--accent-green)'
									: downCount < totalMonitoredCount / 2
										? 'bg-(--accent-orange)/20 border-(--accent-orange)/30 text-(--accent-orange)'
										: 'bg-(--accent-red)/20 border-(--accent-red)/30 text-(--accent-red)'
						}`}
					>
						{isChecking ? (
							<Activity size={28} className="animate-pulse" />
						) : downCount === 0 ? (
							<CheckCircle2 size={28} />
						) : downCount < totalMonitoredCount / 2 ? (
							<AlertTriangle size={28} />
						) : (
							<XCircle size={28} />
						)}
					</div>
					<div>
						<h1 className="text-2xl md:text-3xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{isChecking
								? t('info.status.banner.checking')
								: downCount === 0
									? t('info.status.banner.allOperational')
									: t('info.status.banner.partialOutage', { count: operationalCount, total: totalMonitoredCount })}
						</h1>
						<p className="text-sm text-(--text-muted) mt-1 flex flex-wrap items-center gap-3">
							<span>{t('info.status.subtitle')}</span>
							{lastChecked && (
								<span className="inline-flex items-center gap-1 text-xs font-mono opacity-75">
									<Clock size={12} />
									{lastChecked.toLocaleTimeString()}
								</span>
							)}
							{avgPing !== null && (
								<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-(--background)/60 border border-(--border)/10">
									<Activity size={11} className="text-(--accent)" />
									{avgPing} ms avg
								</span>
							)}
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 shrink-0">
					<Button variant="secondary" onClick={() => setBadgeModalOpen(true)} className="flex items-center gap-2 shrink-0">
						<Code2 size={15} />
						{t('info.status.badgeButton')}
					</Button>
					<Button variant="secondary" onClick={() => checkAllServices(true)} disabled={refreshing} className="flex items-center gap-2 shrink-0">
						<RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
						{t('info.status.refresh')}
					</Button>
				</div>
			</div>

			{/* Search & Controls */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<h2 className="text-xl font-bold text-(--text) flex items-center gap-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
					<Server size={20} className="text-(--accent)" />
					{t('info.status.servicesHeading')}
				</h2>
				<div className="w-full sm:w-72">
					<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('info.status.searchPlaceholder')} />
				</div>
			</div>

			{/* Services Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
				{filteredServices.map((svc) => (
					<div
						key={svc.id}
						className="flex flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm hover:border-(--accent)/35 transition-all"
						style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
					>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<a
									href={getEnvUrl(`https://${svc.host}`)}
									target="_blank"
									rel="noopener noreferrer"
									className="font-bold text-base text-(--text) hover:text-(--accent) transition-colors inline-flex items-center gap-1.5"
								>
									{t(svc.labelKey)}
									<ExternalLink size={13} className="opacity-50" />
								</a>
								<p className="text-xs font-mono text-(--text-muted) flex items-center gap-1 mt-0.5">
									<Globe size={11} className="opacity-60" />
									{svc.host}
								</p>
							</div>

							<span
								className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
									svc.status === 'operational'
										? 'bg-(--accent-green)/10 text-(--accent-green) border-(--accent-green)/25'
										: svc.status === 'degraded'
											? 'bg-(--accent-orange)/10 text-(--accent-orange) border-(--accent-orange)/25'
											: svc.status === 'checking'
												? 'bg-(--background)/60 text-(--text-muted) border-(--border)/10'
												: 'bg-(--accent-red)/10 text-(--accent-red) border-(--accent-red)/25'
								}`}
							>
								<span
									className={`h-2 w-2 rounded-full ${
										svc.status === 'operational'
											? 'bg-(--accent-green)'
											: svc.status === 'degraded'
												? 'bg-(--accent-orange)'
												: svc.status === 'checking'
													? 'bg-(--text-muted) animate-pulse'
													: 'bg-(--accent-red)'
									}`}
								/>
								{t(`info.status.states.${svc.status}`)}
							</span>
						</div>

						<Status24hBar points={serviceHistory[svc.id]} currentStatus={svc.status} currentPing={svc.ping} />

						<div className="flex items-center justify-between pt-3 border-t border-(--border)/10 text-xs font-mono text-(--text-muted)">
							<span>{svc.version ? `v${svc.version}` : '—'}</span>
							<span className="inline-flex items-center gap-1">
								<Activity size={12} className="text-(--accent)" />
								{svc.ping !== null ? `${svc.ping} ms` : '—'}
							</span>
						</div>
					</div>
				))}
			</div>

			{/* Official Bots (Main Organization) Section */}
			<StatusBotsSection bots={filteredBots} loading={refreshing && bots.length === 0} botHistory={botHistory} />

			{/* Active Verified Issues Section */}
			<div className="flex flex-col mt-4" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-bold text-(--text) flex items-center gap-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<Bug size={20} className="text-(--accent)" />
						{t('info.status.activeIncidentsHeading')}
					</h2>
					<Link href="/issues" className="text-xs font-bold text-(--accent) hover:underline">
						{t('info.status.viewAllIssues')}
					</Link>
				</div>

				{verifiedIssues.length === 0 ? (
					<div className="p-6 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm text-center text-sm text-(--text-muted)">
						{t('info.status.noActiveIncidents')}
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
						{verifiedIssues.map((issue: any) => (
							<Link
								key={issue.id || issue._id}
								href={`/issues?q=${encodeURIComponent(issue.title || '')}`}
								className="flex flex-col gap-1.5 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm hover:border-(--accent)/40 transition-all"
								style={{ padding: 'var(--ui-gap)' }}
							>
								<div className="flex items-center justify-between gap-2">
									<span className="font-bold text-sm text-(--text) truncate">{issue.title}</span>
									<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
										{issue.status || 'open'}
									</span>
								</div>
								{issue.description && <p className="text-xs text-(--text-muted) line-clamp-2">{issue.description}</p>}
							</Link>
						))}
					</div>
				)}
			</div>

			<Modal open={badgeModalOpen} onOpenChange={setBadgeModalOpen} title={t('info.status.badgeModalTitle')} description={t('info.status.badgeModalDesc')} maxWidth="max-w-3xl">
				<CodeBlock
					preview={<Image src={getEnvUrl('https://api.xernerx.com/v1/status/badge.svg')} alt="Xernerx System Status" width={160} height={24} unoptimized className="h-6 w-auto" />}
					tabs={[
						{
							id: 'markdown',
							label: t('app.widgets.formatMarkdown'),
							language: 'markdown',
							code: `[![Xernerx Status](${getEnvUrl('https://api.xernerx.com/v1/status/badge.svg')})](${getEnvUrl('https://info.xernerx.com/status')})`,
						},
						{
							id: 'html',
							label: t('app.widgets.formatHtmlImg'),
							language: 'html',
							code: `<a href="${getEnvUrl('https://info.xernerx.com/status')}" target="_blank" rel="noopener noreferrer">\n  <img src="${getEnvUrl('https://api.xernerx.com/v1/status/badge.svg')}" alt="Xernerx Status" />\n</a>`,
						},
						{
							id: 'svg',
							label: t('app.widgets.formatDirectSvg'),
							language: 'url',
							code: getEnvUrl('https://api.xernerx.com/v1/status/badge.svg'),
						},
					]}
				/>
			</Modal>
		</div>
	);
}
