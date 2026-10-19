/** @format */
'use client';

import { useDictionary } from '@xernerx/providers';
import { Activity, ExternalLink, FileText, Gauge, Globe, RefreshCw, Search, Server } from 'lucide-react';

export interface SuiteAppVersionInfo {
	id: string;
	name: string;
	domain: string;
	localVersion: string | null;
	devVersion: string | null;
	canaryVersion: string | null;
	prodVersion: string | null;
	devLatencyMs: number | null;
	canaryLatencyMs: number | null;
	prodLatencyMs: number | null;
	versions: string[];
}

export interface LighthouseScoreData {
	seo: number;
	perf: number;
	a11y: number;
	bp: number;
	prevSeo?: number;
	prevPerf?: number;
	prevA11y?: number;
	prevBp?: number;
	updatedAt: number;
}

export type EnvFilterMode = 'all' | 'prod' | 'canary' | 'dev';

interface OverviewSubdomainCardProps {
	app: SuiteAppVersionInfo;
	isDev: boolean;
	envFilter: EnvFilterMode;
	getEnvUrl: (url: string) => string;
	liveVersions: Record<string, string | null>;
	pings: Record<string, number | null>;
	pingingKeys: Record<string, boolean>;
	lighthouseScores: Record<string, LighthouseScoreData>;
	lighthouseLoading: Record<string, boolean>;
	onPing: (key: string, versionEndpointUrl: string) => void;
	onRunLighthouse: (key: string, targetUrl: string) => void;
	onOpenChangelog: (appName: string, envLabel: string, siteOriginUrl: string) => void;
}

export default function OverviewSubdomainCard({
	app,
	isDev,
	envFilter,
	getEnvUrl,
	liveVersions,
	pings,
	pingingKeys,
	lighthouseScores,
	lighthouseLoading,
	onPing,
	onRunLighthouse,
	onOpenChangelog,
}: OverviewSubdomainCardProps) {
	const { t } = useDictionary();

	const isGateway = app.id === 'api' || app.id === 'cdn';
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

	const allEnvBoxes = [
		{
			envType: 'prod' as const,
			key: `${app.id}-prod`,
			label: t('admin.dashboard.overview.prodVersion'),
			textColor: 'text-green-400',
			dotColor: 'bg-green-500',
			host: prodHost,
			publicUrl: prodUrl,
			siteHref: prodUrl,
			versionEndpoint: `${prodUrl}api/version`,
			displayVersion: resolvedProdVer ? `v${resolvedProdVer}` : '—',
			hasVersion: Boolean(resolvedProdVer),
			pingMs: pings[`${app.id}-prod`] ?? app.prodLatencyMs ?? null,
		},
		{
			envType: 'canary' as const,
			key: `${app.id}-canary`,
			label: t('admin.dashboard.overview.canaryVersion'),
			textColor: 'text-amber-400',
			dotColor: 'bg-amber-500',
			host: canaryHost,
			publicUrl: canaryUrl,
			siteHref: canaryUrl,
			versionEndpoint: `${canaryUrl}api/version`,
			displayVersion: resolvedCanaryVer ? `v${resolvedCanaryVer}` : '—',
			hasVersion: Boolean(resolvedCanaryVer),
			pingMs: pings[`${app.id}-canary`] ?? app.canaryLatencyMs ?? null,
		},
		...(isDev
			? [
					{
						envType: 'dev' as const,
						key: `${app.id}-dev`,
						label: t('admin.dashboard.overview.devVersion'),
						textColor: 'text-sky-400',
						dotColor: 'bg-sky-500',
						host: devHost,
						publicUrl: devUrl,
						siteHref: devReachableUrl,
						versionEndpoint: `${devReachableUrl.replace(/\/$/, '')}/api/version`,
						displayVersion: resolvedDevVer ? `v${resolvedDevVer}` : '—',
						hasVersion: Boolean(resolvedDevVer),
						pingMs: pings[`${app.id}-dev`] ?? app.devLatencyMs ?? null,
					},
				]
			: []),
	];

	const envBoxes = envFilter === 'all' ? allEnvBoxes : allEnvBoxes.filter((b) => b.envType === envFilter);

	return (
		<div className="p-5 rounded-2xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm flex flex-col justify-between gap-4 transition-colors hover:border-(--accent)/30">
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
						{isGateway && (
							<span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
								{t('admin.dashboard.overview.serviceGateway')}
							</span>
						)}
					</div>
					<a href={prodUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-(--text-muted) hover:text-(--accent) transition-colors mt-0.5">
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

			{/* Environment Badges Stacked Vertically */}
			<div className="flex flex-col gap-3">
				{envBoxes.map((env) => {
					const encodedUrl = encodeURIComponent(env.publicUrl);
					const isPinging = Boolean(pingingKeys[env.key]);
					const lhData = lighthouseScores[env.key];
					const isLhLoading = Boolean(lighthouseLoading[env.key]);

					return (
						<div key={env.key} className="p-3 rounded-xl bg-(--background)/50 border border-(--border)/10 flex flex-col items-center justify-between gap-2.5">
							{/* Top Row: Clickable Env Name + Clickable Version (Changelog Modal) */}
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

								<button
									type="button"
									onClick={() => onOpenChangelog(app.name, env.label, env.siteHref)}
									title={t('admin.dashboard.overview.viewChangelogTooltip')}
									className="font-mono font-semibold text-(--text) hover:text-(--accent) transition-colors inline-flex items-center gap-1 cursor-pointer"
								>
									<span>{env.displayVersion}</span>
									<FileText size={11} className="text-(--text-muted)" />
								</button>
							</div>

							{isGateway ? (
								/* Service Gateway Status Banner (API / CDN) */
								<div className="w-full px-3 py-3 rounded-lg bg-(--foreground)/30 border border-(--border)/10 flex items-center justify-between gap-2">
									<div className="flex items-center gap-2">
										<Server size={15} className={env.hasVersion ? 'text-green-400' : 'text-(--text-muted)'} />
										<div className="flex flex-col">
											<span className={`text-xs font-bold ${env.hasVersion ? 'text-green-400' : 'text-(--text-muted)'}`}>
												{env.hasVersion ? t('admin.dashboard.overview.gatewayOnline') : t('admin.dashboard.overview.gatewayOffline')}
											</span>
											<span className="text-[10px] text-(--text-muted)">{t('admin.dashboard.overview.gatewayDesc')}</span>
										</div>
									</div>
								</div>
							) : (
								<>
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
														{ label: t('admin.dashboard.overview.lighthouseCategories.seo'), score: lhData.seo, prev: lhData.prevSeo },
														{ label: t('admin.dashboard.overview.lighthouseCategories.perf'), score: lhData.perf, prev: lhData.prevPerf },
														{ label: t('admin.dashboard.overview.lighthouseCategories.a11y'), score: lhData.a11y, prev: lhData.prevA11y },
														{ label: t('admin.dashboard.overview.lighthouseCategories.bp'), score: lhData.bp, prev: lhData.prevBp },
													] as const
												).map((cat) => {
													const delta = typeof cat.prev === 'number' ? cat.score - cat.prev : 0;
													const deltaStr = delta > 0 ? ` (+${delta})` : delta < 0 ? ` (${delta})` : '';
													return (
														<div
															key={cat.label}
															className="flex items-center gap-1"
															title={`${cat.label}: ${cat.score}/100${deltaStr}\n${new Date(lhData.updatedAt).toLocaleString()}`}
														>
															<span className="text-[10px] text-(--text-muted)">{cat.label}</span>
															<span
																className={`w-6 h-6 rounded-full border text-[10px] font-mono font-bold inline-flex items-center justify-center ${getLighthouseScoreStyle(cat.score)}`}
															>
																{cat.score}
															</span>
														</div>
													);
												})}
												<button
													type="button"
													onClick={() => onRunLighthouse(env.key, env.publicUrl)}
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
												onClick={() => onRunLighthouse(env.key, env.publicUrl)}
												disabled={isLhLoading}
												className="text-[11px] font-semibold text-(--accent) hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
											>
												<RefreshCw size={11} className={isLhLoading ? 'animate-spin' : ''} />
												<span>{isLhLoading ? t('admin.dashboard.overview.lighthouseScanning') : t('admin.dashboard.overview.lighthouseScan')}</span>
											</button>
										)}
									</div>
								</>
							)}

							{/* Footer: Ping & SEO Audit Shortcuts */}
							<div className="w-full flex items-center justify-between gap-2 text-[11px] text-(--text-muted) pt-1 border-t border-(--border)/10">
								<button
									type="button"
									onClick={() => onPing(env.key, env.versionEndpoint)}
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

								{!isGateway && (
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
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
