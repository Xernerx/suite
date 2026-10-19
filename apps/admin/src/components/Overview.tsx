/** @format */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Button } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { Activity, ExternalLink, Gauge, Globe, RefreshCw, Search } from 'lucide-react';
import OverviewSummaryCards, { FALLBACK_APPS, LIGHTHOUSE_STORAGE_KEY, type LighthouseScoreData, type SuiteAppVersionInfo } from './OverviewSummaryCards';

export default function Overview() {
	const { getEnvUrl, isDev } = useEnvironment();
	const { t } = useDictionary();
	const { toast } = useToast();

	const [apps, setApps] = useState<SuiteAppVersionInfo[]>(FALLBACK_APPS);
	const [issues, setIssues] = useState<any[]>([]);
	const [metrics, setMetrics] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const [pings, setPings] = useState<Record<string, number | null>>({});
	const [pingingKeys, setPingingKeys] = useState<Record<string, boolean>>({});
	const [liveVersions, setLiveVersions] = useState<Record<string, string | null>>({});

	const [lighthouseScores, setLighthouseScores] = useState<Record<string, LighthouseScoreData>>({});
	const [lighthouseLoading, setLighthouseLoading] = useState<Record<string, boolean>>({});

	useEffect(() => {
		try {
			const cached = localStorage.getItem(LIGHTHOUSE_STORAGE_KEY);
			if (cached) setLighthouseScores(JSON.parse(cached));
		} catch {}
	}, []);

	const runLighthouseAudit = useCallback(
		async (key: string, targetUrl: string) => {
			setLighthouseLoading((prev) => ({ ...prev, [key]: true }));
			try {
				const endpoint = getEnvUrl(`https://api.xernerx.com/secure/core/lighthouse?url=${encodeURIComponent(targetUrl)}`);
				const res = await fetch(endpoint, { credentials: 'include', cache: 'no-store' });
				const payload = await res.json().catch(() => null);
				if (!res.ok || !payload?.data) {
					throw new Error(payload?.error || 'Audit unavailable for this URL');
				}
				const entry: LighthouseScoreData = {
					seo: payload.data.seo,
					perf: payload.data.perf,
					a11y: payload.data.a11y,
					bp: payload.data.bp,
					updatedAt: payload.data.updatedAt || Date.now(),
				};
				setLighthouseScores((prev) => {
					const next = { ...prev, [key]: entry };
					try {
						localStorage.setItem(LIGHTHOUSE_STORAGE_KEY, JSON.stringify(next));
					} catch {}
					return next;
				});
			} catch (err: any) {
				toast({ type: 'error', title: t('common.toast.error'), description: err.message });
			} finally {
				setLighthouseLoading((prev) => ({ ...prev, [key]: false }));
			}
		},
		[getEnvUrl, toast, t]
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
			const [versionsRes, issuesRes, metricsRes] = await Promise.all([
				fetch(getEnvUrl(`https://api.xernerx.com/secure/core/versions${forceRefresh ? '?refresh=true' : ''}`), { credentials: 'include', cache: 'no-store' })
					.then((r) => (r.ok ? r.json() : null))
					.catch(() => null),
				fetch(getEnvUrl('https://api.xernerx.com/secure/core/issues'), { credentials: 'include' })
					.then((r) => (r.ok ? r.json() : null))
					.catch(() => null),
				fetch(getEnvUrl('https://api.xernerx.com/info/issues/metrics'))
					.then((r) => (r.ok ? r.json() : null))
					.catch(() => null),
			]);

			const resolvedApps = Array.isArray(versionsRes?.data) && versionsRes.data.length > 0 ? versionsRes.data : FALLBACK_APPS;
			setApps(resolvedApps);

			if (Array.isArray(issuesRes?.data)) {
				setIssues(issuesRes.data);
			}
			if (metricsRes?.data) {
				setMetrics(metricsRes.data);
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

	const syncedCount = apps.filter((a) => {
		const pVer = liveVersions[`${a.id}-prod`] || a.prodVersion;
		const cVer = liveVersions[`${a.id}-canary`] || a.canaryVersion;
		return pVer && cVer && pVer === cVer;
	}).length;
	const canaryAheadCount = apps.filter((a) => {
		const pVer = liveVersions[`${a.id}-prod`] || a.prodVersion;
		const cVer = liveVersions[`${a.id}-canary`] || a.canaryVersion;
		return cVer && (!pVer || cVer !== pVer);
	}).length;

	const getPingColor = (ms: number | null) => {
		if (ms === null) return 'text-(--text-muted)';
		if (ms < 200) return 'text-green-400';
		if (ms < 500) return 'text-amber-400';
		return 'text-red-400';
	};

	const getLighthouseScoreStyle = (score: number) => {
		if (score >= 90) return 'border-green-500/50 bg-green-500/10 text-green-400';
		if (score >= 50) return 'border-amber-500/50 bg-amber-500/10 text-amber-400';
		return 'border-red-500/50 bg-red-500/10 text-red-400';
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div className="flex flex-wrap justify-between items-center gap-4">
				<div>
					<h2 className="text-2xl font-bold text-(--text)">{t('admin.dashboard.overview.title')}</h2>
					<p className="text-sm text-(--text-muted) mt-0.5">{t('admin.dashboard.overview.subtitle')}</p>
				</div>
				<Button onClick={() => fetchOverviewData(true)} disabled={refreshing} className="inline-flex items-center gap-2">
					<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
					<span>{refreshing ? t('admin.dashboard.overview.refreshing') : t('admin.dashboard.overview.refresh')}</span>
				</Button>
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
				<div>
					<h3 className="text-xl font-bold text-(--text) flex items-center gap-2">
						<Activity size={20} className="text-(--accent)" />
						<span>{t('admin.dashboard.overview.seoSectionTitle')}</span>
					</h3>
					<p className="text-xs text-(--text-muted) mt-0.5">{t('admin.dashboard.overview.seoSectionSubtitle')}</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{apps.map((app) => {
						const prodHost = app.id === 'www' ? 'www.xernerx.com' : `${app.id}.xernerx.com`;
						const canaryHost = `${app.id}.canary.xernerx.com`;
						const devHost = `${app.id}.dev.xernerx.com`;

						const prodUrl = `https://${prodHost}/`;
						const canaryUrl = `https://${canaryHost}/`;
						const devUrl = `https://${devHost}/`;
						const devReachableUrl = getEnvUrl(prodUrl);

						const resolvedProdVer = liveVersions[`${app.id}-prod`] || app.prodVersion || null;
						const resolvedCanaryVer = liveVersions[`${app.id}-canary`] || app.canaryVersion || null;
						const resolvedDevVer = liveVersions[`${app.id}-dev`] || app.devVersion || null;
						const isSynced = Boolean(resolvedProdVer && resolvedCanaryVer && resolvedProdVer === resolvedCanaryVer);

						const envBoxes = [
							{
								key: `${app.id}-prod`,
								label: t('admin.dashboard.overview.prodVersion'),
								textColor: 'text-green-400',
								dotColor: 'bg-green-500',
								host: prodHost,
								publicUrl: prodUrl,
								siteHref: prodUrl,
								versionEndpoint: `${prodUrl}api/version`,
								displayVersion: resolvedProdVer ? `v${resolvedProdVer}` : '—',
								pingMs: pings[`${app.id}-prod`] ?? app.prodLatencyMs ?? null,
							},
							{
								key: `${app.id}-canary`,
								label: t('admin.dashboard.overview.canaryVersion'),
								textColor: 'text-amber-400',
								dotColor: 'bg-amber-500',
								host: canaryHost,
								publicUrl: canaryUrl,
								siteHref: canaryUrl,
								versionEndpoint: `${canaryUrl}api/version`,
								displayVersion: resolvedCanaryVer ? `v${resolvedCanaryVer}` : '—',
								pingMs: pings[`${app.id}-canary`] ?? app.canaryLatencyMs ?? null,
							},
							...(isDev
								? [
										{
											key: `${app.id}-dev`,
											label: t('admin.dashboard.overview.devVersion'),
											textColor: 'text-sky-400',
											dotColor: 'bg-sky-500',
											host: devHost,
											publicUrl: devUrl,
											siteHref: devReachableUrl,
											versionEndpoint: `${devReachableUrl.replace(/\/$/, '')}/api/version`,
											displayVersion: resolvedDevVer ? `v${resolvedDevVer}` : '—',
											pingMs: pings[`${app.id}-dev`] ?? app.devLatencyMs ?? null,
										},
									]
								: []),
						];

						return (
							<div
								key={app.id}
								className="p-5 rounded-2xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm flex flex-col justify-between gap-4 transition-colors hover:border-(--accent)/30"
							>
								{/* Card Header */}
								<div className="flex items-start justify-between gap-2">
									<div>
										<div className="flex items-center gap-2">
											<a
												href={prodUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="font-bold text-lg text-(--text) hover:text-(--accent) transition-colors inline-flex items-center gap-1.5"
											>
												<span>{app.name}</span>
												<ExternalLink size={13} className="text-(--text-muted)" />
											</a>
											<span className="text-xs font-mono px-2 py-0.5 rounded bg-(--background)/60 text-(--text-muted) border border-(--border)/10">{app.id}</span>
										</div>
										<a
											href={prodUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-xs text-(--text-muted) hover:text-(--accent) transition-colors mt-0.5"
										>
											<Globe size={12} />
											<span>{prodHost}</span>
										</a>
									</div>

									<span
										className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-md border ${
											isSynced ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
										}`}
									>
										{isSynced ? t('admin.dashboard.overview.syncedBadge') : t('admin.dashboard.overview.canaryAheadBadge')}
									</span>
								</div>

								{/* Production, Canary, and (when in Dev) Dev Badges Stacked Vertically */}
								<div className="flex flex-col gap-3">
									{envBoxes.map((env) => {
										const encodedUrl = encodeURIComponent(env.publicUrl);
										const isPinging = Boolean(pingingKeys[env.key]);
										const lhData = lighthouseScores[env.key];
										const isLhLoading = Boolean(lighthouseLoading[env.key]);

										return (
											<div key={env.key} className="p-3 rounded-xl bg-(--background)/50 border border-(--border)/10 flex flex-col items-center justify-between gap-2.5">
												{/* Top Row: Clickable Env Name + Version */}
												<div className="w-full flex items-center justify-between text-xs">
													<a
														href={env.siteHref}
														target="_blank"
														rel="noopener noreferrer"
														className={`font-bold uppercase ${env.textColor} hover:opacity-80 transition-opacity inline-flex items-center gap-1.5`}
													>
														<span className={`w-2 h-2 rounded-full ${env.dotColor}`}></span>
														<span>{env.label}</span>
														<ExternalLink size={11} />
													</a>
													<span className="font-mono font-semibold text-(--text)">{env.displayVersion}</span>
												</div>

												{/* Seobility Score Widget */}
												<a
													href={`https://www.seobility.net/en/seocheck/check?url=${encodedUrl}`}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center justify-center p-2 rounded-lg bg-(--foreground)/40 hover:bg-(--foreground)/70 transition-colors w-full"
													title={`${t('admin.dashboard.overview.seobilityCheck')} (${env.host})`}
												>
													<img
														src={`https://app.seobility.net/widget/widget.png?url=${encodedUrl}`}
														alt={`Seobility Score for ${env.host}`}
														className="h-16 w-auto object-contain"
														loading="lazy"
													/>
												</a>

												{/* Chrome Lighthouse Score Gauges / Audit Trigger */}
												<div className="w-full px-2.5 py-2 rounded-lg bg-(--foreground)/30 border border-(--border)/10 flex items-center justify-between gap-2">
													<div className="flex items-center gap-1.5 text-[11px] font-semibold text-(--text-muted)">
														<Gauge size={13} className="text-(--accent)" />
														<span>{t('admin.dashboard.overview.lighthouseCheck')}</span>
													</div>

													{lhData ? (
														<div className="flex items-center gap-2">
															{(
																[
																	{ label: t('admin.dashboard.overview.lighthouseCategories.seo'), score: lhData.seo },
																	{ label: t('admin.dashboard.overview.lighthouseCategories.perf'), score: lhData.perf },
																	{ label: t('admin.dashboard.overview.lighthouseCategories.a11y'), score: lhData.a11y },
																	{ label: t('admin.dashboard.overview.lighthouseCategories.bp'), score: lhData.bp },
																] as const
															).map((cat) => (
																<div key={cat.label} className="flex items-center gap-1" title={`${cat.label}: ${cat.score}/100`}>
																	<span className="text-[10px] text-(--text-muted)">{cat.label}</span>
																	<span
																		className={`w-6 h-6 rounded-full border text-[10px] font-mono font-bold inline-flex items-center justify-center ${getLighthouseScoreStyle(cat.score)}`}
																	>
																		{cat.score}
																	</span>
																</div>
															))}
															<button
																type="button"
																onClick={() => runLighthouseAudit(env.key, env.publicUrl)}
																disabled={isLhLoading}
																title={t('admin.dashboard.overview.lighthouseRescan')}
																className="p-1 text-(--text-muted) hover:text-(--text) transition-colors cursor-pointer disabled:opacity-50"
															>
																<RefreshCw size={11} className={isLhLoading ? 'animate-spin' : ''} />
															</button>
														</div>
													) : (
														<button
															type="button"
															onClick={() => runLighthouseAudit(env.key, env.publicUrl)}
															disabled={isLhLoading}
															className="text-[11px] font-semibold text-(--accent) hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
														>
															<RefreshCw size={11} className={isLhLoading ? 'animate-spin' : ''} />
															<span>{isLhLoading ? t('admin.dashboard.overview.lighthouseScanning') : t('admin.dashboard.overview.lighthouseScan')}</span>
														</button>
													)}
												</div>

												{/* Footer: Ping & SEO Audit Shortcuts */}
												<div className="w-full flex items-center justify-between gap-2 text-[11px] text-(--text-muted) pt-1 border-t border-(--border)/10">
													<button
														type="button"
														onClick={() => measureSitePing(env.key, env.versionEndpoint)}
														title={t('admin.dashboard.overview.repingTooltip')}
														className={`inline-flex items-center gap-1 font-mono cursor-pointer hover:opacity-80 transition-opacity ${getPingColor(env.pingMs)}`}
													>
														<Activity size={11} className={isPinging ? 'animate-pulse' : ''} />
														<span>
															{isPinging
																? t('admin.dashboard.overview.pinging')
																: env.pingMs !== null
																	? t('admin.dashboard.overview.ping', { ms: env.pingMs })
																	: t('admin.dashboard.overview.pingOffline')}
														</span>
													</button>

													<div className="flex items-center gap-3">
														<a
															href={`https://pagespeed.web.dev/analysis?url=${encodedUrl}`}
															target="_blank"
															rel="noopener noreferrer"
															className="inline-flex items-center gap-1 hover:text-(--text) transition-colors"
														>
															<Gauge size={11} />
															<span>{t('admin.dashboard.overview.lighthouseCheck')}</span>
														</a>
														<a
															href={`https://www.seobility.net/en/seocheck/check?url=${encodedUrl}`}
															target="_blank"
															rel="noopener noreferrer"
															className="inline-flex items-center gap-1 hover:text-(--text) transition-colors"
														>
															<Search size={11} />
															<span>{t('admin.dashboard.overview.seobilityCheck')}</span>
														</a>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
