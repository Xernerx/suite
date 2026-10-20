/** @format */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, ArrowRight, Gauge, RefreshCw } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Button } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { FALLBACK_APPS, type SuiteAppVersionInfo } from './OverviewSummaryCards';
import { HomeOverviewSections } from './overview/HomeOverviewSections';
import { buildHomeOverviewCards } from './overview/buildHomeOverviewCards';

export interface AdminPermissionsMap {
	canUsers: boolean;
	canRoles: boolean;
	canApplicationsReview: boolean;
	canApplicationsManage: boolean;
	canTokens: boolean;
	canTranslations: boolean;
	canSettings: boolean;
	canInvites: boolean;
	canAnnouncements: boolean;
	canMedia: boolean;
	canManageRoadmap: boolean;
	canManageSuggestions: boolean;
	canManageIssues: boolean;
	canManageStore: boolean;
	isServerSet: boolean;
	adminServerId: string | null;
}

export default function HomeOverview({ permissions, onNavigate }: { permissions: AdminPermissionsMap; onNavigate: (view: string, query?: string) => void }) {
	const { t, locales: localesData } = useDictionary() as any;
	const { getEnvUrl } = useEnvironment();

	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const [apps, setApps] = useState<SuiteAppVersionInfo[]>(FALLBACK_APPS);
	const [pings, setPings] = useState<Record<string, number | null>>({});
	const [liveVersions, setLiveVersions] = useState<Record<string, string | null>>({});
	const [auditLogs, setAuditLogs] = useState<any[]>([]);

	// Permission-gated domain states
	const [issues, setIssues] = useState<any[]>([]);
	const [applications, setApplications] = useState<any[]>([]);
	const [appConfigs, setAppConfigs] = useState<Record<string, string>>({});
	const [suggestions, setSuggestions] = useState<any[]>([]);
	const [roadmap, setRoadmap] = useState<any[]>([]);
	const [users, setUsers] = useState<any[]>([]);
	const [roles, setRoles] = useState<any[]>([]);
	const [tokens, setTokens] = useState<any[]>([]);
	const [storeItems, setStoreItems] = useState<any[]>([]);
	const [storeCategories, setStoreCategories] = useState<any[]>([]);
	const [invites, setInvites] = useState<any[]>([]);
	const [announcements, setAnnouncements] = useState<any[]>([]);
	const [mediaList, setMediaList] = useState<any[]>([]);

	const pingService = useCallback(async (appId: string, host: string) => {
		const start = Date.now();
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 4500);
			const res = await fetch(`https://${host}/api/version`, { mode: 'cors', cache: 'no-store', signal: controller.signal });
			clearTimeout(timeout);
			const elapsed = Date.now() - start;
			setPings((prev) => ({ ...prev, [appId]: elapsed }));
			if (res.ok) {
				const data = await res.json().catch(() => null);
				if (data?.version) {
					setLiveVersions((prev) => ({ ...prev, [appId]: String(data.version).trim() }));
				}
			}
		} catch {
			try {
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), 4500);
				await fetch(`https://${host}/api/version`, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
				clearTimeout(timeout);
				setPings((prev) => ({ ...prev, [appId]: Date.now() - start }));
			} catch {
				setPings((prev) => ({ ...prev, [appId]: null }));
			}
		}
	}, []);

	const fetchAllData = useCallback(
		async (isManual = false) => {
			if (isManual) setRefreshing(true);
			else setLoading(true);

			try {
				const tasks: Promise<void>[] = [];

				// 1. Always fetch Suite versions & recent audit trail
				tasks.push(
					fetch(getEnvUrl(`https://api.xernerx.com/secure/core/versions${isManual ? '?refresh=true' : ''}`), { credentials: 'include', cache: 'no-store' })
						.then((r) => (r.ok ? r.json() : null))
						.then((d) => {
							const list: SuiteAppVersionInfo[] = Array.isArray(d?.data) && d.data.length > 0 ? d.data : FALLBACK_APPS;
							setApps(list);
							list.forEach((a) => {
								const host = a.id === 'www' ? 'www.xernerx.com' : `${a.id}.xernerx.com`;
								pingService(a.id, host);
							});
						})
						.catch(() => {})
				);

				tasks.push(
					fetch(getEnvUrl('https://api.xernerx.com/secure/core/audit?limit=5'), { credentials: 'include' })
						.then((r) => (r.ok ? r.json() : null))
						.then((d) => {
							const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
							setAuditLogs(list.slice(0, 5));
						})
						.catch(() => {})
				);

				// 2. Permission-gated fetches
				if (permissions.canManageIssues) {
					tasks.push(
						fetch(getEnvUrl('https://api.xernerx.com/secure/core/issues'), { credentials: 'include' })
							.then((r) => (r.ok ? r.json() : null))
							.then((d) => setIssues(Array.isArray(d?.data) ? d.data : []))
							.catch(() => {})
					);
				}

				if (permissions.canApplicationsReview && permissions.isServerSet) {
					tasks.push(
						Promise.all([
							fetch(getEnvUrl('https://api.xernerx.com/secure/dispatch/applications/reviews'), { credentials: 'include', cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
							fetch(getEnvUrl('https://api.xernerx.com/secure/dispatch/applications'), { credentials: 'include', cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
						])
							.then(([appsData, configsData]) => {
								setApplications(Array.isArray(appsData) ? appsData : []);
								const map: Record<string, string> = {};
								if (Array.isArray(configsData)) {
									configsData.forEach((c: any) => {
										if (c?.id) map[c.id] = c.name || c.id;
									});
								}
								setAppConfigs(map);
							})
							.catch(() => {})
					);
				}

				if (permissions.canManageSuggestions) {
					tasks.push(
						fetch(getEnvUrl('https://api.xernerx.com/secure/core/suggestions'), { credentials: 'include' })
							.then((r) => (r.ok ? r.json() : null))
							.then((d) => setSuggestions(Array.isArray(d?.data) ? d.data : []))
							.catch(() => {})
					);
				}

				if (permissions.canManageRoadmap) {
					tasks.push(
						fetch(getEnvUrl('https://api.xernerx.com/secure/core/roadmap'), { credentials: 'include' })
							.then((r) => (r.ok ? r.json() : null))
							.then((d) => setRoadmap(Array.isArray(d?.data) ? d.data : []))
							.catch(() => {})
					);
				}

				if (permissions.canUsers && permissions.isServerSet) {
					tasks.push(
						fetch(getEnvUrl('https://api.xernerx.com/secure/users'), { credentials: 'include' })
							.then((r) => (r.ok ? r.json() : []))
							.then((d) => setUsers(Array.isArray(d) ? d : []))
							.catch(() => {})
					);
				}

				if (permissions.canRoles && permissions.isServerSet) {
					tasks.push(
						fetch(getEnvUrl('https://api.xernerx.com/secure/core'), { credentials: 'include' })
							.then((r) => (r.ok ? r.json() : []))
							.then((d) => setRoles(Array.isArray(d) ? d : []))
							.catch(() => {})
					);
				}

				if (permissions.canTokens && permissions.isServerSet) {
					tasks.push(
						fetch(getEnvUrl('https://api.xernerx.com/secure/tokens?admin=true'), { credentials: 'include' })
							.then((r) => (r.ok ? r.json() : []))
							.then((d) => setTokens(Array.isArray(d) ? d : []))
							.catch(() => {})
					);
				}

				if (permissions.canManageStore) {
					tasks.push(
						Promise.all([
							fetch(getEnvUrl('https://api.xernerx.com/secure/store/items'), { credentials: 'include' }).then((r) => (r.ok ? r.json() : [])),
							fetch(getEnvUrl('https://api.xernerx.com/secure/store/categories'), { credentials: 'include' }).then((r) => (r.ok ? r.json() : [])),
						])
							.then(([itemsData, catsData]) => {
								setStoreItems(Array.isArray(itemsData) ? itemsData : []);
								setStoreCategories(Array.isArray(catsData) ? catsData : []);
							})
							.catch(() => {})
					);
				}

				if (permissions.canInvites) {
					tasks.push(
						fetch(getEnvUrl('https://api.xernerx.com/secure/invites'), { credentials: 'include' })
							.then((r) => (r.ok ? r.json() : null))
							.then((d) => setInvites(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []))
							.catch(() => {})
					);
				}

				if (permissions.canAnnouncements) {
					tasks.push(
						fetch(getEnvUrl('https://api.xernerx.com/secure/announcements'), { credentials: 'include' })
							.then((r) => (r.ok ? r.json() : null))
							.then((d) => setAnnouncements(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []))
							.catch(() => {})
					);
				}

				if (permissions.canMedia) {
					tasks.push(
						fetch(getEnvUrl('https://cdn.xernerx.com/api/media?admin=true'), { credentials: 'include' })
							.then((r) => (r.ok ? r.json() : []))
							.then((d) => setMediaList(Array.isArray(d) ? d : []))
							.catch(() => {})
					);
				}

				await Promise.all(tasks);
			} finally {
				setLoading(false);
				setRefreshing(false);
			}
		},
		[getEnvUrl, permissions, pingService]
	);

	useEffect(() => {
		fetchAllData(false);
	}, [fetchAllData]);

	if (loading) return <Loading />;

	// Compute Status Overview metrics
	const onlineAppsCount = apps.filter((a) => pings[a.id] !== null).length;
	const syncedAppsCount = apps.filter((a) => {
		const pVer = liveVersions[a.id] || a.prodVersion;
		return Boolean(pVer && a.canaryVersion && pVer === a.canaryVersion);
	}).length;
	const canaryAheadCount = apps.length - syncedAppsCount;

	// Compute Urgent Items & Module Cards based on permissions
	const { urgentItems, moduleCards } = buildHomeOverviewCards({
		permissions,
		t,
		localesData,
		issues,
		applications,
		appConfigs,
		suggestions,
		roadmap,
		users,
		roles,
		tokens,
		storeItems,
		storeCategories,
		mediaList,
		invites,
		announcements,
	});

	return (
		<div className="flex flex-col gap-8">
			{/* Top Header */}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-(--text) tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('admin.dashboard.home.title')}
					</h1>
					<p className="text-sm text-(--text-muted) mt-1">{t('admin.dashboard.home.subtitle')}</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="secondary" onClick={() => onNavigate('seo')} className="inline-flex items-center gap-2">
						<Gauge size={15} className="text-(--accent)" />
						<span>{t('admin.dashboard.home.openSeo')}</span>
					</Button>
					<Button onClick={() => fetchAllData(true)} disabled={refreshing} className="inline-flex items-center gap-2">
						<RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
						<span>{refreshing ? t('admin.dashboard.home.refreshing') : t('admin.dashboard.home.refresh')}</span>
					</Button>
				</div>
			</div>

			{/* Quick Ecosystem Service Status Strip */}
			<div className="p-6 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm flex flex-col gap-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
							<Activity size={20} />
						</div>
						<div>
							<h2 className="text-base font-bold text-(--text)">{t('admin.dashboard.home.statusTitle')}</h2>
							<p className="text-xs text-(--text-muted)">
								{t('admin.dashboard.home.statusSubtitle', {
									online: onlineAppsCount,
									total: apps.length,
									synced: syncedAppsCount,
									ahead: canaryAheadCount,
								})}
							</p>
						</div>
					</div>
					<button type="button" onClick={() => onNavigate('seo')} className="inline-flex items-center gap-1.5 text-xs font-bold text-(--accent) hover:underline cursor-pointer">
						<span>{t('admin.dashboard.home.openSeo')}</span>
						<ArrowRight size={14} />
					</button>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
					{apps.map((app) => {
						const ping = pings[app.id];
						const isUp = ping !== null;
						const pVer = liveVersions[app.id] || app.prodVersion;
						const isSynced = Boolean(pVer && app.canaryVersion && pVer === app.canaryVersion);

						return (
							<button
								key={app.id}
								type="button"
								onClick={() => onNavigate('seo')}
								className="flex flex-col justify-between gap-2 p-3 rounded-2xl border border-(--border)/10 bg-(--background)/60 hover:border-(--accent)/40 text-left transition-all cursor-pointer"
							>
								<div className="flex items-center justify-between gap-1.5">
									<span className="text-xs font-bold text-(--text) truncate uppercase">{app.id}</span>
									<span className={`h-2 w-2 rounded-full shrink-0 ${!isUp ? 'bg-red-400' : ping && ping > 1200 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
								</div>
								<div className="flex flex-col gap-0.5">
									<span className="text-[11px] font-mono text-(--text-muted)">{pVer ? `v${pVer}` : '—'}</span>
									<span className={`text-[10px] font-semibold ${isSynced ? 'text-emerald-400' : 'text-amber-400'}`}>
										{ping !== undefined && ping !== null ? `${ping}ms` : isSynced ? t('admin.dashboard.overview.syncedBadge') : t('admin.dashboard.overview.canaryAheadBadge')}
									</span>
								</div>
							</button>
						);
					})}
				</div>
			</div>

			<HomeOverviewSections urgentItems={urgentItems} moduleCards={moduleCards} auditLogs={auditLogs} onNavigate={onNavigate} />
		</div>
	);
}
