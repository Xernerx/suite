/** @format */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { Button, Input } from '@xernerx/ui';
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Clock, ExternalLink, Bug, Server, Globe } from 'lucide-react';
import Link from 'next/link';

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
	{ id: 'account', labelKey: 'info.status.services.account', host: 'account.xernerx.com', port: 4003 },
	{ id: 'api', labelKey: 'info.status.services.api', host: 'api.xernerx.com', port: 4001 },
	{ id: 'cdn', labelKey: 'info.status.services.cdn', host: 'cdn.xernerx.com', port: 4002 },
	{ id: 'docs', labelKey: 'info.status.services.docs', host: 'docs.xernerx.com', port: 4005 },
	{ id: 'info', labelKey: 'info.status.services.info', host: 'info.xernerx.com', port: 4007 },
	{ id: 'store', labelKey: 'info.status.services.store', host: 'store.xernerx.com', port: 4008 },
	{ id: 'admin', labelKey: 'info.status.services.admin', host: 'admin.xernerx.com', port: 4006 },
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
	const [verifiedIssues, setVerifiedIssues] = useState<any[]>([]);
	const [refreshing, setRefreshing] = useState(false);
	const [lastChecked, setLastChecked] = useState<Date | null>(null);
	const [search, setSearch] = useState('');

	useEffect(() => {
		hide();
	}, [hide]);

	const checkAllServices = useCallback(async () => {
		if (!isReady) return;
		setRefreshing(true);

		try {
			const [versionsRes, issuesRes] = await Promise.all([
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/versions')).catch(() => null),
				fetch(getEnvUrl('https://api.xernerx.com/info/issues')).catch(() => null),
			]);

			const versionsData = versionsRes && versionsRes.ok ? await versionsRes.json().catch(() => null) : null;
			const issuesData = issuesRes && issuesRes.ok ? await issuesRes.json().catch(() => null) : null;

			if (Array.isArray(issuesData?.data)) {
				setVerifiedIssues(issuesData.data.filter((issue: any) => issue.status !== 'resolved' && issue.status !== 'closed').slice(0, 6));
			}

			const updated = await Promise.all(
				SUITE_SERVICES.map(async (svc) => {
					const targetUrl = getEnvUrl(`https://${svc.host}/api/version`);
					const start = performance.now();
					let ping: number | null = null;
					let version: string | null = null;
					let isUp = false;

					try {
						const controller = new AbortController();
						const timeout = setTimeout(() => controller.abort(), 5000);
						const res = await fetch(targetUrl, { signal: controller.signal, cache: 'no-store' });
						clearTimeout(timeout);
						if (res.ok) {
							ping = Math.round(performance.now() - start);
							const data = await res.json().catch(() => ({}));
							version = data?.version || null;
							isUp = true;
						}
					} catch {}

					// Fallback to backend version matrix if direct browser CORS check didn't resolve
					if (!isUp && versionsData?.apps?.[svc.id]) {
						const appMatrix = versionsData.apps[svc.id];
						const activeEnv = appMatrix.production?.online ? appMatrix.production : appMatrix.canary?.online ? appMatrix.canary : appMatrix.dev;
						if (activeEnv?.online) {
							isUp = true;
							version = activeEnv.version || null;
							ping = activeEnv.ping ?? null;
						}
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

			setServices(updated);
			setLastChecked(new Date());
		} finally {
			setRefreshing(false);
		}
	}, [isReady, getEnvUrl]);

	useEffect(() => {
		if (isReady) {
			checkAllServices();
		}
	}, [isReady, checkAllServices]);

	const operationalCount = services.filter((s) => s.status === 'operational').length;
	const downCount = services.filter((s) => s.status === 'down').length;
	const isChecking = services.some((s) => s.status === 'checking');

	const filteredServices = services.filter((s) => {
		if (!search.trim()) return true;
		const q = search.toLowerCase();
		return t(s.labelKey).toLowerCase().includes(q) || s.host.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
	});

	const avgPing = (() => {
		const valid = services.filter((s) => typeof s.ping === 'number').map((s) => s.ping as number);
		if (valid.length === 0) return null;
		return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
	})();

	return (
		<div className="flex flex-col max-w-6xl mx-auto w-full p-6 md:p-10 gap-8">
			{/* Hero Banner */}
			<div
				className={`flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 rounded-3xl border backdrop-blur-md shadow-lg transition-all ${
					isChecking
						? 'bg-(--foreground)/40 border-(--border)/15'
						: downCount === 0
							? 'bg-emerald-500/10 border-emerald-500/25'
							: downCount < services.length / 2
								? 'bg-amber-500/10 border-amber-500/25'
								: 'bg-red-500/10 border-red-500/25'
				}`}
			>
				<div className="flex items-center gap-4">
					<div
						className={`flex h-14 w-14 items-center justify-center rounded-2xl border shrink-0 ${
							isChecking
								? 'bg-(--background)/60 border-(--border)/10 text-(--accent)'
								: downCount === 0
									? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
									: downCount < services.length / 2
										? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
										: 'bg-red-500/20 border-red-500/30 text-red-400'
						}`}
					>
						{isChecking ? (
							<Activity size={28} className="animate-pulse" />
						) : downCount === 0 ? (
							<CheckCircle2 size={28} />
						) : downCount < services.length / 2 ? (
							<AlertTriangle size={28} />
						) : (
							<XCircle size={28} />
						)}
					</div>
					<div>
						<h1 className="text-2xl md:text-3xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{isChecking
								? t('info.status.banner.checking')
								: downCount === 0
									? t('info.status.banner.allOperational')
									: t('info.status.banner.partialOutage', { count: operationalCount, total: services.length })}
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
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-(--background)/60 border border-(--border)/10">
									<Activity size={11} className="text-(--accent)" />
									{avgPing} ms avg
								</span>
							)}
						</p>
					</div>
				</div>

				<Button variant="secondary" onClick={checkAllServices} disabled={refreshing} className="flex items-center gap-2 shrink-0">
					<RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
					{t('info.status.refresh')}
				</Button>
			</div>

			{/* Search & Controls */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<h2 className="text-xl font-bold text-(--text) flex items-center gap-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
					<Server size={20} className="text-(--accent)" />
					{t('info.status.servicesHeading')}
				</h2>
				<div className="w-full sm:w-72">
					<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('info.status.searchPlaceholder')} />
				</div>
			</div>

			{/* Services Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredServices.map((svc) => (
					<div key={svc.id} className="flex flex-col justify-between gap-4 p-5 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 hover:border-(--border)/25 transition-all">
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
										? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
										: svc.status === 'degraded'
											? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
											: svc.status === 'checking'
												? 'bg-(--background)/60 text-(--text-muted) border-(--border)/10'
												: 'bg-red-500/10 text-red-400 border-red-500/20'
								}`}
							>
								<span
									className={`h-2 w-2 rounded-full ${
										svc.status === 'operational'
											? 'bg-emerald-400'
											: svc.status === 'degraded'
												? 'bg-amber-400'
												: svc.status === 'checking'
													? 'bg-(--text-muted) animate-pulse'
													: 'bg-red-400'
									}`}
								/>
								{t(`info.status.states.${svc.status}`)}
							</span>
						</div>

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

			{/* Active Verified Issues Section */}
			<div className="flex flex-col gap-4 mt-4">
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
					<div className="p-6 rounded-2xl border border-(--border)/10 bg-(--foreground)/20 text-center text-sm text-(--text-muted)">{t('info.status.noActiveIncidents')}</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{verifiedIssues.map((issue: any) => (
							<Link
								key={issue.id || issue._id}
								href={`/issues?q=${encodeURIComponent(issue.title || '')}`}
								className="flex flex-col gap-1.5 p-4 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 hover:border-(--accent)/40 transition-all"
							>
								<div className="flex items-center justify-between gap-2">
									<span className="font-bold text-sm text-(--text) truncate">{issue.title}</span>
									<span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/20 shrink-0">
										{issue.status || 'open'}
									</span>
								</div>
								{issue.description && <p className="text-xs text-(--text-muted) line-clamp-2">{issue.description}</p>}
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
