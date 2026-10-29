/** @format */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Button, Input, Modal, Selector } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { Activity, Gauge, Megaphone, RefreshCw } from 'lucide-react';
import OverviewSummaryCards, { FALLBACK_APPS, LIGHTHOUSE_STORAGE_KEY, MCP_SEO_STORAGE_KEY, type LighthouseScoreData, type McpSeoScoreData, type SuiteAppVersionInfo } from './OverviewSummaryCards';
import OverviewSubdomainCard, { type EnvFilterMode } from './OverviewSubdomainCard';
import SeoAnalyzerReportModal from './SeoAnalyzerReportModal';

type StatusFilterMode = 'all' | 'synced' | 'ahead';

export default function Overview() {
	const { getEnvUrl, isDev } = useEnvironment();
	const { t } = useDictionary();
	const { toast } = useToast();

	const [apps, setApps] = useState<SuiteAppVersionInfo[]>(FALLBACK_APPS);
	const [issues, setIssues] = useState<any[]>([]);
	const [metrics, setMetrics] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const [statusFilter, setStatusFilter] = useState<StatusFilterMode>('all');
	const [envFilter, setEnvFilter] = useState<EnvFilterMode>('all');

	const [pings, setPings] = useState<Record<string, number | null>>({});
	const [pingingKeys, setPingingKeys] = useState<Record<string, boolean>>({});
	const [liveVersions, setLiveVersions] = useState<Record<string, string | null>>({});

	const [lighthouseScores, setLighthouseScores] = useState<Record<string, LighthouseScoreData>>({});
	const [lighthouseLoading, setLighthouseLoading] = useState<Record<string, boolean>>({});
	const [mcpSeoScores, setMcpSeoScores] = useState<Record<string, McpSeoScoreData>>({});
	const [mcpSeoLoading, setMcpSeoLoading] = useState<Record<string, boolean>>({});
	const [batchAuditState, setBatchAuditState] = useState<{ active: boolean; current: number; total: number } | null>(null);

	const [mcpModal, setMcpModal] = useState<{
		open: boolean;
		key: string;
		appName: string;
		envLabel: string;
		targetUrl: string;
	}>({ open: false, key: '', appName: '', envLabel: '', targetUrl: '' });

	const [changelogModal, setChangelogModal] = useState<{
		open: boolean;
		title: string;
		loading: boolean;
		entries: { version: string; date?: string; content: string }[];
	}>({ open: false, title: '', loading: false, entries: [] });

	const [incidentModal, setIncidentModal] = useState(() => ({
		open: false,
		title: t('admin.dashboard.overview.incidentDefaultTitle'),
		content: t('admin.dashboard.overview.incidentDefaultContent'),
		severity: 'warning',
		submitting: false,
	}));

	useEffect(() => {
		try {
			const cached = localStorage.getItem(LIGHTHOUSE_STORAGE_KEY);
			if (cached) setLighthouseScores(JSON.parse(cached));
		} catch {}
		try {
			const cachedMcp = localStorage.getItem(MCP_SEO_STORAGE_KEY);
			if (cachedMcp) setMcpSeoScores(JSON.parse(cachedMcp));
		} catch {}
	}, []);

	const runMcpSeoAudit = useCallback(
		async (key: string, targetUrl: string, silent = false) => {
			setMcpSeoLoading((prev) => ({ ...prev, [key]: true }));
			try {
				const endpoint = getEnvUrl(`https://api.xernerx.com/secure/core/seo-analyzer?key=${encodeURIComponent(key)}&url=${encodeURIComponent(targetUrl)}`);
				const res = await fetch(endpoint, { credentials: 'include', cache: 'no-store' });
				const payload = await res.json().catch(() => null);
				if (!res.ok || !payload?.data) {
					throw new Error(payload?.error || t('admin.dashboard.overview.auditUnavailable'));
				}
				const entry: McpSeoScoreData = payload.data;
				setMcpSeoScores((prev) => {
					const next = payload.map && typeof payload.map === 'object' ? payload.map : { ...prev, [key]: entry };
					try {
						localStorage.setItem(MCP_SEO_STORAGE_KEY, JSON.stringify(next));
					} catch {}
					return next;
				});
			} catch (err: any) {
				if (!silent) {
					toast({ type: 'error', title: t('common.toast.error'), description: err.message });
				}
			} finally {
				setMcpSeoLoading((prev) => ({ ...prev, [key]: false }));
			}
		},
		[getEnvUrl, toast, t]
	);

	const runLighthouseAudit = useCallback(
		async (key: string, targetUrl: string, silent = false) => {
			setLighthouseLoading((prev) => ({ ...prev, [key]: true }));
			try {
				const endpoint = getEnvUrl(`https://api.xernerx.com/secure/core/lighthouse?key=${encodeURIComponent(key)}&url=${encodeURIComponent(targetUrl)}`);
				const res = await fetch(endpoint, { credentials: 'include', cache: 'no-store' });
				const payload = await res.json().catch(() => null);
				if (!res.ok || !payload?.data) {
					throw new Error(payload?.error || t('admin.dashboard.overview.auditUnavailable'));
				}
				const entry: LighthouseScoreData = payload.data;
				setLighthouseScores((prev) => {
					const next = payload.map && typeof payload.map === 'object' ? payload.map : { ...prev, [key]: entry };
					try {
						localStorage.setItem(LIGHTHOUSE_STORAGE_KEY, JSON.stringify(next));
					} catch {}
					return next;
				});
			} catch (err: any) {
				if (!silent) {
					toast({ type: 'error', title: t('common.toast.error'), description: err.message });
				}
			} finally {
				setLighthouseLoading((prev) => ({ ...prev, [key]: false }));
			}
		},
		[getEnvUrl, toast, t]
	);

	const runBatchAudit = async (targetEnv: 'prod' | 'canary') => {
		if (batchAuditState?.active) return;
		const htmlApps = apps.filter((a) => a.id !== 'api' && a.id !== 'cdn');
		setBatchAuditState({ active: true, current: 0, total: htmlApps.length });
		try {
			for (let i = 0; i < htmlApps.length; i++) {
				const app = htmlApps[i];
				setBatchAuditState({ active: true, current: i + 1, total: htmlApps.length });
				const host = targetEnv === 'prod' ? (app.id === 'www' ? 'www.xernerx.com' : `${app.id}.xernerx.com`) : `${app.id}.canary.xernerx.com`;
				const targetUrl = `https://${host}/`;
				await Promise.all([runLighthouseAudit(`${app.id}-${targetEnv}`, targetUrl, true), runMcpSeoAudit(`${app.id}-${targetEnv}`, targetUrl, true)]);
			}
		} finally {
			setBatchAuditState(null);
		}
	};

	const handleOpenChangelog = useCallback(
		async (appName: string, envLabel: string, siteOriginUrl: string) => {
			setChangelogModal({
				open: true,
				title: t('admin.dashboard.overview.changelogTitle', { name: appName, env: envLabel }),
				loading: true,
				entries: [],
			});
			try {
				const endpoint = getEnvUrl(`https://api.xernerx.com/secure/core/versions?changelogUrl=${encodeURIComponent(siteOriginUrl)}`);
				const res = await fetch(endpoint, { credentials: 'include', cache: 'no-store' });
				const payload = await res.json().catch(() => null);
				const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.data?.entries) ? payload.data.entries : [];
				setChangelogModal((prev) => ({ ...prev, loading: false, entries: list }));
			} catch {
				setChangelogModal((prev) => ({ ...prev, loading: false, entries: [] }));
			}
		},
		[getEnvUrl, t]
	);

	const measureSitePing = useCallback(async (key: string, versionEndpointUrl: string) => {
		setPingingKeys((prev) => ({ ...prev, [key]: true }));
		const start = Date.now();
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 5000);
			const res = await fetch(versionEndpointUrl, {
				mode: 'cors',
				cache: 'no-store',
				signal: controller.signal,
			});
			clearTimeout(timeout);
			const elapsed = Date.now() - start;
			setPings((prev) => ({ ...prev, [key]: elapsed }));
			if (res.ok) {
				const data = await res.json().catch(() => null);
				if (data?.version) {
					setLiveVersions((prev) => ({ ...prev, [key]: String(data.version).trim() }));
				}
			}
		} catch {
			const fallbackStart = Date.now();
			try {
				const fallbackController = new AbortController();
				const fallbackTimeout = setTimeout(() => fallbackController.abort(), 5000);
				await fetch(versionEndpointUrl, {
					mode: 'no-cors',
					cache: 'no-store',
					signal: fallbackController.signal,
				});
				clearTimeout(fallbackTimeout);
				const elapsed = Date.now() - fallbackStart;
				setPings((prev) => ({ ...prev, [key]: elapsed }));
			} catch {
				setPings((prev) => ({ ...prev, [key]: null }));
			}
		} finally {
			setPingingKeys((prev) => ({ ...prev, [key]: false }));
		}
	}, []);

	const measureAllPings = useCallback(
		async (appList: SuiteAppVersionInfo[]) => {
			const tasks: Promise<void>[] = [];
			for (const app of appList) {
				const prodHost = app.id === 'www' ? 'www.xernerx.com' : `${app.id}.xernerx.com`;
				const canaryHost = `${app.id}.canary.xernerx.com`;
				tasks.push(measureSitePing(`${app.id}-prod`, `https://${prodHost}/api/version`));
				tasks.push(measureSitePing(`${app.id}-canary`, `https://${canaryHost}/api/version`));
				if (isDev) {
					const devVersionUrl = getEnvUrl(`https://${prodHost}/api/version`);
					tasks.push(measureSitePing(`${app.id}-dev`, devVersionUrl));
				}
			}
			await Promise.all(tasks);
		},
		[measureSitePing, getEnvUrl, isDev]
	);

	const fetchOverviewData = async (forceRefresh = false) => {
		if (forceRefresh) setRefreshing(true);
		try {
			const [versionsRes, issuesRes, metricsRes, lhRes, mcpRes] = await Promise.all([
				fetch(getEnvUrl(`https://api.xernerx.com/secure/core/versions${forceRefresh ? '?refresh=true' : ''}`), { credentials: 'include', cache: 'no-store' })
					.then((r) => (r.ok ? r.json() : null))
					.catch(() => null),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/issues'), { credentials: 'include' })
					.then((r) => (r.ok ? r.json() : null))
					.catch(() => null),
				fetch(getEnvUrl('https://api.xernerx.com/info/issues/metrics'))
					.then((r) => (r.ok ? r.json() : null))
					.catch(() => null),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/lighthouse'), { credentials: 'include', cache: 'no-store' })
					.then((r) => (r.ok ? r.json() : null))
					.catch(() => null),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/seo-analyzer'), { credentials: 'include', cache: 'no-store' })
					.then((r) => (r.ok ? r.json() : null))
					.catch(() => null),
			]);

			const resolvedApps = Array.isArray(versionsRes?.data) && versionsRes.data.length > 0 ? versionsRes.data : FALLBACK_APPS;
			setApps(resolvedApps);

			if (Array.isArray(issuesRes?.data)) setIssues(issuesRes.data);
			if (metricsRes?.data) setMetrics(metricsRes.data);
			if (lhRes?.data && typeof lhRes.data === 'object' && Object.keys(lhRes.data).length > 0) {
				setLighthouseScores((prev) => {
					const merged = { ...prev, ...lhRes.data };
					try {
						localStorage.setItem(LIGHTHOUSE_STORAGE_KEY, JSON.stringify(merged));
					} catch {}
					return merged;
				});
			}
			if (mcpRes?.data && typeof mcpRes.data === 'object' && Object.keys(mcpRes.data).length > 0) {
				setMcpSeoScores((prev) => {
					const merged = { ...prev, ...mcpRes.data };
					try {
						localStorage.setItem(MCP_SEO_STORAGE_KEY, JSON.stringify(merged));
					} catch {}
					return merged;
				});
			}

			measureAllPings(resolvedApps);
		} catch (err: any) {
			toast({ type: 'error', title: t('common.toast.error'), description: err.message });
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		fetchOverviewData(false);
	}, [getEnvUrl, isDev]);

	if (loading) return <Loading />;

	const openIssuesCount = issues.filter((i) => i.status === 'open').length;
	const pendingReviewCount = issues.filter((i) => i.status === 'open' && !i.acknowledged).length;
	const resolvedIssuesCount = issues.filter((i) => i.status === 'resolved').length;
	const avgHours = metrics?.avgResolutionTime ? (metrics.avgResolutionTime / (1000 * 60 * 60)).toFixed(1) : null;

	const isAppSynced = (a: SuiteAppVersionInfo) => {
		const pVer = liveVersions[`${a.id}-prod`] || a.prodVersion;
		const cVer = liveVersions[`${a.id}-canary`] || a.canaryVersion;
		return Boolean(pVer && cVer && pVer === cVer);
	};

	const syncedCount = apps.filter(isAppSynced).length;
	const canaryAheadCount = apps.length - syncedCount;

	const filteredApps = apps.filter((a) => {
		if (statusFilter === 'synced') return isAppSynced(a);
		if (statusFilter === 'ahead') return !isAppSynced(a);
		return true;
	});

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div className="flex flex-wrap justify-between items-center gap-4">
				<div>
					<h2 className="text-2xl font-bold text-(--text)">{t('admin.dashboard.overview.title')}</h2>
					<p className="text-sm text-(--text-muted) mt-0.5">{t('admin.dashboard.overview.subtitle')}</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button variant="secondary" onClick={() => runBatchAudit('prod')} disabled={Boolean(batchAuditState?.active)} className="inline-flex items-center gap-2">
						<Gauge size={15} className={batchAuditState?.active ? 'animate-pulse text-(--accent)' : ''} />
						<span>
							{batchAuditState?.active
								? t('admin.dashboard.overview.auditingProgress', { current: batchAuditState.current, total: batchAuditState.total })
								: t('admin.dashboard.overview.auditAllProd')}
						</span>
					</Button>
					<Button variant="secondary" onClick={() => runBatchAudit('canary')} disabled={Boolean(batchAuditState?.active)} className="inline-flex items-center gap-2">
						<Gauge size={15} />
						<span>{t('admin.dashboard.overview.auditAllCanary')}</span>
					</Button>
					<Button variant="secondary" onClick={() => setIncidentModal((prev) => ({ ...prev, open: true }))} className="inline-flex items-center gap-2">
						<Megaphone size={15} className="text-(--accent-orange)" />
						<span>{t('admin.dashboard.overview.declareIncident')}</span>
					</Button>
					<Button onClick={() => fetchOverviewData(true)} disabled={refreshing} className="inline-flex items-center gap-2">
						<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
						<span>{refreshing ? t('admin.dashboard.overview.refreshing') : t('admin.dashboard.overview.refresh')}</span>
					</Button>
				</div>
			</div>

			{/* Top Metric Summary Cards */}
			<OverviewSummaryCards
				appsCount={apps.length}
				syncedCount={syncedCount}
				canaryAheadCount={canaryAheadCount}
				openIssuesCount={openIssuesCount}
				pendingReviewCount={pendingReviewCount}
				resolvedIssuesCount={resolvedIssuesCount}
				avgHours={avgHours}
			/>

			{/* Subdomain SEO Scores & Versions Grid */}
			<div className="flex flex-col gap-4 mt-2">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h3 className="text-xl font-bold text-(--text) flex items-center gap-2">
							<Activity size={20} className="text-(--accent)" />
							<span>{t('admin.dashboard.overview.seoSectionTitle')}</span>
						</h3>
						<p className="text-xs text-(--text-muted) mt-0.5">{t('admin.dashboard.overview.seoSectionSubtitle')}</p>
					</div>

					{/* Filter & Environment Toggle Bar */}
					<div className="flex flex-wrap items-center gap-2">
						<div className="inline-flex items-center p-1 rounded-full bg-(--foreground)/40 backdrop-blur-md border border-(--border)/10 shadow-xs text-xs">
							{(
								[
									{ id: 'all', label: t('admin.dashboard.overview.filterAll', { count: apps.length }) },
									{ id: 'synced', label: t('admin.dashboard.overview.filterSynced', { count: syncedCount }) },
									{ id: 'ahead', label: t('admin.dashboard.overview.filterCanaryAhead', { count: canaryAheadCount }) },
								] as const
							).map((tab) => (
								<button
									key={tab.id}
									type="button"
									onClick={() => setStatusFilter(tab.id)}
									className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
										statusFilter === tab.id ? 'bg-(--accent) text-white shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>

						<div className="inline-flex items-center p-1 rounded-full bg-(--foreground)/40 backdrop-blur-md border border-(--border)/10 shadow-xs text-xs">
							{(
								[
									{ id: 'all', label: t('admin.dashboard.overview.envAll') },
									{ id: 'prod', label: t('admin.dashboard.overview.envProdOnly') },
									{ id: 'canary', label: t('admin.dashboard.overview.envCanaryOnly') },
									...(isDev ? [{ id: 'dev' as const, label: t('admin.dashboard.overview.envDevOnly') }] : []),
								] as const
							).map((tab) => (
								<button
									key={tab.id}
									type="button"
									onClick={() => setEnvFilter(tab.id)}
									className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
										envFilter === tab.id ? 'bg-(--accent) text-white shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{filteredApps.map((app) => (
						<OverviewSubdomainCard
							key={app.id}
							app={app}
							isDev={isDev}
							envFilter={envFilter}
							getEnvUrl={getEnvUrl}
							liveVersions={liveVersions}
							pings={pings}
							pingingKeys={pingingKeys}
							lighthouseScores={lighthouseScores}
							lighthouseLoading={lighthouseLoading}
							mcpSeoScores={mcpSeoScores}
							mcpSeoLoading={mcpSeoLoading}
							onPing={measureSitePing}
							onRunLighthouse={runLighthouseAudit}
							onRunMcpSeo={runMcpSeoAudit}
							onOpenMcpModal={(key, appName, envLabel, targetUrl) => setMcpModal({ open: true, key, appName, envLabel, targetUrl })}
							onOpenChangelog={handleOpenChangelog}
						/>
					))}
				</div>
			</div>

			{/* My Creative Tools SEO / AEO / GEO Analyzer Report Modal */}
			<SeoAnalyzerReportModal
				open={mcpModal.open}
				onOpenChange={(open) => setMcpModal((prev) => ({ ...prev, open }))}
				appName={mcpModal.appName}
				envLabel={mcpModal.envLabel}
				targetUrl={mcpModal.targetUrl}
				data={mcpSeoScores[mcpModal.key] || null}
				loading={Boolean(mcpSeoLoading[mcpModal.key])}
				onRescan={() => {
					if (mcpModal.key && mcpModal.targetUrl) {
						runMcpSeoAudit(mcpModal.key, mcpModal.targetUrl);
					}
				}}
			/>

			{/* Changelog Preview Modal */}
			<Modal open={changelogModal.open} onOpenChange={(open) => setChangelogModal((prev) => ({ ...prev, open }))} title={changelogModal.title}>
				<div className="flex flex-col gap-3 max-h-[60dvh] overflow-y-auto pr-1">
					{changelogModal.loading ? (
						<div className="flex justify-center py-6">
							<Loading variant="small" />
						</div>
					) : changelogModal.entries.length === 0 ? (
						<p className="text-sm text-(--text-muted) py-6 text-center">{t('admin.dashboard.overview.changelogEmpty')}</p>
					) : (
						changelogModal.entries.slice(0, 10).map((entry, idx) => (
							<div key={`${entry.version}-${idx}`} className="p-3.5 rounded-xl bg-(--background)/60 border border-(--border)/10 flex flex-col gap-1.5">
								<div className="flex items-center justify-between">
									<span className="font-mono font-bold text-sm text-(--accent)">v{String(entry.version).replace(/^v/i, '')}</span>
									{entry.date && <span className="text-xs text-(--text-muted)">{entry.date}</span>}
								</div>
								<div className="text-xs text-(--text-muted) whitespace-pre-wrap leading-relaxed">{entry.content}</div>
							</div>
						))
					)}
				</div>
			</Modal>

			{/* Quick Declare Incident / Maintenance Broadcast Modal */}
			<Modal open={incidentModal.open} onOpenChange={(open) => setIncidentModal((prev) => ({ ...prev, open }))} title={t('admin.dashboard.overview.incidentModalTitle')}>
				<div className="flex flex-col gap-4">
					<p className="text-xs text-(--text-muted)">{t('admin.dashboard.overview.incidentModalDesc')}</p>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text)">{t('admin.dashboard.overview.incidentSeverity')}</label>
						<Selector
							value={incidentModal.severity}
							onChange={(val: string) => setIncidentModal((prev) => ({ ...prev, severity: val }))}
							options={[
								{ value: 'warning', label: t('admin.dashboard.overview.severityWarning') },
								{ value: 'error', label: t('admin.dashboard.overview.severityError') },
								{ value: 'info', label: t('admin.dashboard.overview.severityInfo') },
								{ value: 'success', label: t('admin.dashboard.overview.severitySuccess') },
							]}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text)">{t('admin.dashboard.overview.incidentTitleLabel')}</label>
						<Input value={incidentModal.title} onChange={(e) => setIncidentModal((prev) => ({ ...prev, title: e.target.value }))} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text)">{t('admin.dashboard.overview.incidentMessageLabel')}</label>
						<Input variant="textarea" rows={3} value={incidentModal.content} onChange={(e) => setIncidentModal((prev) => ({ ...prev, content: e.target.value }))} />
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button variant="ghost" onClick={() => setIncidentModal((prev) => ({ ...prev, open: false }))}>
							{t('common.actions.cancel')}
						</Button>
						<Button
							disabled={incidentModal.submitting || !incidentModal.title.trim()}
							onClick={async () => {
								setIncidentModal((prev) => ({ ...prev, submitting: true }));
								try {
									const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/announcements'), {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										credentials: 'include',
										body: JSON.stringify({
											broadcastOnly: true,
											title: incidentModal.title,
											content: incidentModal.content,
											severity: incidentModal.severity,
											link: getEnvUrl('https://info.xernerx.com/status'),
										}),
									});
									if (res.ok) {
										toast({ type: 'success', title: t('admin.dashboard.overview.incidentBroadcastSuccess') });
										setIncidentModal((prev) => ({ ...prev, open: false, submitting: false }));
									} else {
										throw new Error(t('admin.dashboard.overview.incidentBroadcastFailed'));
									}
								} catch (err: any) {
									toast({ type: 'error', title: err.message });
									setIncidentModal((prev) => ({ ...prev, submitting: false }));
								}
							}}
						>
							<Megaphone size={15} />
							<span>{t('admin.dashboard.overview.broadcastAlert')}</span>
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
