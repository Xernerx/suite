/** @format */
'use client';

import { Confirm, Tabs } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useSidebar, useToast, useUser } from '@xernerx/providers';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { Loading } from '@xernerx/feedback';
import { useRouter, useSearchParams } from 'next/navigation';

import General from '@/components/dashboard/General';
import Statistics from '@/components/dashboard/Statistics';
import Links from '@/components/dashboard/Links';
import VirtueGeneral from '@/components/dashboard/virtue/General';
import ApplicationsGeneral from '@/components/dashboard/applications/General';
import Settings from '@/components/dashboard/Settings';
import DashboardBotTour from '@/components/dashboard/DashboardBotTour';
import {
	VALID_DASHBOARD_TABS,
	TOUR_DEMO_GUILD,
	TOUR_DEMO_GUILD_CONFIG,
	buildDashboardNavItems,
	DashboardGuildHeader,
	DashboardLoadingSkeleton,
	DashboardEmptyState,
	type Guild,
} from '@/components/dashboard/DashboardGuildHeader';
import SpotlightBoostModal from '@/components/SpotlightBoostModal';
import { AppSeoSection } from '@/components/AppSeoSection';

function DashboardContent() {
	const { data: session, status } = useSession();
	const { mutate: mutateUser } = useUser();
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const { view, setNavItems, clearNavItems, show, setView } = useSidebar();
	const router = useRouter();
	const searchParams = useSearchParams();

	const [guilds, setGuilds] = useState<Guild[]>([]);
	const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
	const [guildConfig, setGuildConfig] = useState<any>(null);
	const [originalGuildConfig, setOriginalGuildConfig] = useState<any>(null);
	const [configLoading, setConfigLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleteGuildConfirmOpen, setDeleteGuildConfirmOpen] = useState(false);
	const [boostModalOpen, setBoostModalOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [rateLimited, setRateLimited] = useState(false);
	const initialTab = searchParams.get('tab');
	const botTourName = searchParams.get('xrx_bot_tour');
	const isTourDashboard = searchParams.get('xrx_tour') === 'dashboard' || Boolean(botTourName);
	const [activeTab, setActiveTab] = useState(initialTab && VALID_DASHBOARD_TABS.includes(initialTab) ? initialTab : 'info');
	const [mountedBotTabs, setMountedBotTabs] = useState<{ guildId: string; virtue: boolean; applications: boolean }>({
		guildId: '',
		virtue: false,
		applications: false,
	});
	const { remind, toast } = useToast();
	const useTourDemo = isTourDashboard && !loading && guilds.length === 0 && !selectedGuild;
	const effectiveGuild = selectedGuild || (useTourDemo ? TOUR_DEMO_GUILD : null);
	const effectiveGuildConfig = guildConfig || (useTourDemo ? TOUR_DEMO_GUILD_CONFIG : null);

	useEffect(() => {
		const gid = effectiveGuild?.id || '';
		setMountedBotTabs((prev) => {
			const sameGuild = prev.guildId === gid;
			const nextVirtue = (sameGuild && prev.virtue) || activeTab === 'virtue';
			const nextApps = (sameGuild && prev.applications) || activeTab === 'applications';
			if (sameGuild && prev.virtue === nextVirtue && prev.applications === nextApps) return prev;
			return { guildId: gid, virtue: nextVirtue, applications: nextApps };
		});
	}, [effectiveGuild?.id, activeTab]);

	const handleFinishBotTour = () => {
		const params = new URLSearchParams(searchParams.toString());
		params.delete('xrx_bot_tour');
		const qs = params.toString();
		router.replace(`/dashboard${qs ? `?${qs}` : ''}`, { scroll: false });
	};

	useEffect(() => {
		const tabParam = searchParams.get('tab');
		if (tabParam && VALID_DASHBOARD_TABS.includes(tabParam) && tabParam !== activeTab) {
			setActiveTab(tabParam);
		}
	}, [searchParams]);

	const handleTabChange = (nextTab: string) => {
		setActiveTab(nextTab);
		const params = new URLSearchParams(searchParams.toString());
		params.set('tab', nextTab);
		router.replace(`/dashboard?${params.toString()}`, { scroll: false });
	};

	const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '3m' | '6m' | '1y' | 'all'>('24h');
	const [activeMetric, setActiveMetric] = useState<'members' | 'messages' | 'bots' | 'boosts'>('members');
	const [isUndrawing, setIsUndrawing] = useState(false);

	const handleMetricSwitch = (metricId: any) => {
		if (metricId === activeMetric || isUndrawing) return;
		setIsUndrawing(true);
		setTimeout(() => {
			setActiveMetric(metricId);
			setIsUndrawing(false);
		}, 400);
	};

	useEffect(() => {
		if (!isReady || status === 'loading') return;

		if (status === 'unauthenticated') {
			window.location.href = `${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(window.location.href)}`;
			return;
		}

		show();
		setNavItems(buildDashboardNavItems(t, []));

		const fetchGuilds = async () => {
			const sessionData = session as any;
			if (!sessionData?.accessToken || !sessionData?.user?.id) {
				setLoading(false);
				return;
			}

			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${sessionData.user.id}/discord/guilds`), {
					headers: {
						Authorization: `Bearer ${sessionData.accessToken}`,
					},
				});

				if (!res.ok) {
					if (res.status === 429) {
						setRateLimited(true);
						return;
					}
					const errorText = await res.text().catch(() => 'No text');
					throw new Error(`Failed to fetch guilds: ${res.status} ${res.statusText} - ${errorText}`);
				}

				const data: Guild[] = await res.json();
				const managedGuilds = data.filter((guild) => {
					const perms = BigInt(guild.permissions || 0);
					return (perms & BigInt(0x8)) === BigInt(0x8) || (perms & BigInt(0x20)) === BigInt(0x20);
				});

				setGuilds(managedGuilds);
				setNavItems(
					buildDashboardNavItems(t, managedGuilds, (g) => {
						if (selectedGuild?.id !== g.id) {
							setGuildConfig(null);
							setOriginalGuildConfig(null);
							setConfigLoading(true);
							remind(false);
						}
						setSelectedGuild(g);
						setView(`server-${g.id}`);
						const params = new URLSearchParams(window.location.search);
						params.set('guild', g.id);
						router.replace(`/dashboard?${params.toString()}`, { scroll: false });
					})
				);

				if (managedGuilds.length > 0) {
					const params = new URLSearchParams(window.location.search);
					const tabParam = params.get('tab');
					const requestedGuildId =
						params.get('guild') ||
						(params.get('view')?.startsWith('server-') ? params.get('view')!.replace('server-', '') : null) ||
						(tabParam?.startsWith('server-') ? tabParam.replace('server-', '') : null);
					const initialGuild = (requestedGuildId ? managedGuilds.find((g) => g.id === requestedGuildId) : null) || managedGuilds[0];
					setGuildConfig(null);
					setOriginalGuildConfig(null);
					setConfigLoading(true);
					setSelectedGuild(initialGuild);
					setView(`server-${initialGuild.id}`);
					if (params.get('guild') !== initialGuild.id) {
						params.set('guild', initialGuild.id);
						router.replace(`/dashboard?${params.toString()}`, { scroll: false });
					}
				}
			} catch (error) {
				console.error('Failed to fetch guilds:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchGuilds();

		return () => {
			clearNavItems();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [(session as any)?.user?.id, (session as any)?.accessToken, status, isReady, getEnvUrl]);

	useEffect(() => {
		if (!view || !view.startsWith('server-') || guilds.length === 0) return;
		const guildId = view.replace('server-', '');
		if (selectedGuild?.id !== guildId) {
			const matched = guilds.find((g) => g.id === guildId);
			if (matched) {
				setGuildConfig(null);
				setOriginalGuildConfig(null);
				setConfigLoading(true);
				remind(false);
				setSelectedGuild(matched);
				const params = new URLSearchParams(window.location.search);
				if (params.get('guild') !== matched.id) {
					params.set('guild', matched.id);
					router.replace(`/dashboard?${params.toString()}`, { scroll: false });
				}
			}
		}
	}, [view, guilds, selectedGuild?.id, router, remind]);

	const [organizations, setOrganizations] = useState<any[]>([]);

	useEffect(() => {
		if (!selectedGuild?.id) {
			setGuildConfig(null);
			setOriginalGuildConfig(null);
			setConfigLoading(false);
			return;
		}

		let cancelled = false;
		setGuildConfig(null);
		setOriginalGuildConfig(null);
		setConfigLoading(true);

		const targetGuildId = selectedGuild.id;
		const fetchConfig = async () => {
			try {
				const [guildRes, orgsRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${targetGuildId}`), { credentials: 'include' }),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations?user=${(session as any).user.id}`), { credentials: 'include' }),
				]);
				if (cancelled) return;

				if (guildRes.ok) {
					const data = await guildRes.json();
					if (cancelled) return;
					setGuildConfig(data);
					setOriginalGuildConfig(JSON.parse(JSON.stringify(data)));
				}

				if (orgsRes.ok) {
					const orgList = await orgsRes.json();
					if (!cancelled) setOrganizations(orgList);
				}
			} catch (error) {
				console.error('Failed to fetch guild config', error);
			} finally {
				if (!cancelled) setConfigLoading(false);
			}
		};

		fetchConfig();
		return () => {
			cancelled = true;
		};
	}, [selectedGuild?.id, (session as any)?.user?.id, getEnvUrl, isReady]);

	const handleSaveConfig = async () => {
		if (!selectedGuild || !guildConfig) return;

		setSaving(true);
		try {
			const sessionData = session as any;
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${selectedGuild.id}`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: selectedGuild.name,
					icon: selectedGuild.icon,
					banner: selectedGuild.banner,
					description: guildConfig.description,
					info: guildConfig.info,
					owner: sessionData?.user?.id,
					organization: guildConfig.organization,
					privacy: guildConfig.privacy,
					widgets: Boolean(guildConfig.widgets),
					locale: guildConfig.locale,
					links: guildConfig.links,
					...(guildConfig.vanityUnlocked || guildConfig.verified ? { vanitySlug: guildConfig.vanitySlug } : {}),
					tags: Array.isArray(guildConfig.tags) ? guildConfig.tags : [],
				}),
			});
			if (res.ok) {
				const updated = await res.json();
				const merged = { ...guildConfig, ...updated };
				setOriginalGuildConfig(JSON.parse(JSON.stringify(merged)));
				setGuildConfig(merged);
				mutateUser().catch(() => null);
				toast({ title: t('common.toast.savedSuccess'), type: 'success' });
				remind(false);
			} else {
				const errData = await res.json().catch(() => ({}));
				toast({ title: t('common.toast.saveFailed'), description: errData.error, type: 'error' });
			}
		} catch (error) {
			console.error('Failed to save config', error);
			toast({ title: t('common.toast.saveError'), type: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const isDirty = useMemo(() => Boolean(guildConfig && originalGuildConfig && JSON.stringify(guildConfig) !== JSON.stringify(originalGuildConfig)), [guildConfig, originalGuildConfig]);

	useEffect(() => {
		if (activeTab === 'virtue' || activeTab === 'applications') return;
		remind(isDirty, handleSaveConfig, () => setGuildConfig(JSON.parse(JSON.stringify(originalGuildConfig))), saving);
		return () => remind(false);
	}, [activeTab, isDirty, saving, originalGuildConfig, remind, guildConfig, selectedGuild]);

	const handleDeleteGuild = () => {
		if (selectedGuild) setDeleteGuildConfirmOpen(true);
	};

	const confirmDeleteGuild = async () => {
		if (!selectedGuild) return;
		setDeleteGuildConfirmOpen(false);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${selectedGuild.id}`), { method: 'DELETE', credentials: 'include' });
			if (res.ok) {
				setSelectedGuild(null);
				setGuildConfig(null);
				toast({ title: t('app.dashboard.deleteSuccess'), type: 'success' });
			} else {
				toast({ title: t('app.dashboard.deleteFailed'), type: 'error' });
			}
		} catch (error) {
			console.error('Failed to delete guild', error);
			toast({ title: t('app.dashboard.deleteFailed'), type: 'error' });
		}
	};

	return (
		<div
			className={`flex flex-col max-w-(--page-width) mx-auto w-full ${botTourName ? 'pb-48' : ''}`}
			style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)', fontSize: 'var(--text-scale, 14px)' }}
		>
			{loading ? (
				<DashboardLoadingSkeleton />
			) : effectiveGuild ? (
				<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<DashboardGuildHeader
						effectiveGuild={effectiveGuild}
						copyableGuildId={selectedGuild?.id}
						vanitySlug={effectiveGuildConfig?.vanitySlug}
						onOpenBoost={() => setBoostModalOpen(true)}
					/>

					<div className="flex flex-col w-full" style={{ gap: 'var(--ui-gap)' }}>
						<div data-tour="dash-tabs" className="rounded-2xl transition-all duration-300">
							<Tabs
								activeTab={activeTab}
								onChange={handleTabChange}
								tabs={[
									{ id: 'info', label: t('app.dashboard.tabs.info') },
									{ id: 'stats', label: t('app.dashboard.tabs.stats') },
									{ id: 'links', label: t('app.dashboard.tabs.links') },
									{ id: 'virtue', label: t('app.dashboard.tabs.virtue') },
									{ id: 'applications', label: t('app.dashboard.tabs.applications') },
									{ id: 'settings', label: t('app.dashboard.tabs.settings') },
								]}
							/>
						</div>

						<div data-tour="dash-config" className="flex flex-col rounded-3xl transition-all duration-300" style={{ gap: 'var(--ui-gap)' }}>
							{activeTab !== 'virtue' && activeTab !== 'applications' && ((configLoading && !useTourDemo) || !effectiveGuildConfig) ? (
								<div className="flex items-center justify-center py-16 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm">
									<Loading variant="small" />
								</div>
							) : effectiveGuildConfig ? (
								<>
									{activeTab === 'info' && <General key={effectiveGuild.id} guildConfig={effectiveGuildConfig} setGuildConfig={setGuildConfig} />}
									{activeTab === 'stats' && (
										<Statistics
											key={effectiveGuild.id}
											guildConfig={effectiveGuildConfig}
											timeframe={timeframe}
											setTimeframe={setTimeframe}
											activeMetric={activeMetric}
											handleMetricSwitch={handleMetricSwitch}
											isUndrawing={isUndrawing}
										/>
									)}
									{activeTab === 'links' && <Links key={effectiveGuild.id} guildConfig={effectiveGuildConfig} setGuildConfig={setGuildConfig} />}
									{activeTab === 'settings' && (
										<Settings
											key={effectiveGuild.id}
											guildConfig={effectiveGuildConfig}
											setGuildConfig={setGuildConfig}
											onVanityUnlocked={() => {
												setGuildConfig((prev: any) => (prev ? { ...prev, vanityUnlocked: true } : prev));
												setOriginalGuildConfig((prev: any) => (prev ? { ...prev, vanityUnlocked: true } : prev));
											}}
											organizations={organizations}
											handleDeleteGuild={handleDeleteGuild}
										/>
									)}
								</>
							) : null}

							{effectiveGuild && ((mountedBotTabs.guildId === effectiveGuild.id && mountedBotTabs.virtue) || activeTab === 'virtue') && (
								<div className={activeTab === 'virtue' ? 'flex flex-col' : 'hidden'} style={{ gap: 'var(--ui-gap)' }}>
									<VirtueGeneral key={`virtue-${effectiveGuild.id}`} id={effectiveGuild.id} managedGuilds={guilds} isActive={activeTab === 'virtue'} />
								</div>
							)}

							{effectiveGuild && ((mountedBotTabs.guildId === effectiveGuild.id && mountedBotTabs.applications) || activeTab === 'applications') && (
								<div className={activeTab === 'applications' ? 'flex flex-col' : 'hidden'} style={{ gap: 'var(--ui-gap)' }}>
									<ApplicationsGeneral key={`apps-${effectiveGuild.id}`} id={effectiveGuild.id} isActive={activeTab === 'applications'} />
								</div>
							)}
						</div>
					</div>
				</div>
			) : (
				<DashboardEmptyState rateLimited={rateLimited} />
			)}

			{selectedGuild && (
				<SpotlightBoostModal
					isOpen={boostModalOpen}
					onClose={() => setBoostModalOpen(false)}
					targetType="server"
					targetId={selectedGuild.id}
					targetName={selectedGuild.name}
					currentBoostedUntil={guildConfig?.boostedUntil}
					onBoostSuccess={(boostedUntil) => {
						setGuildConfig((prev: any) => (prev ? { ...prev, boostedUntil } : prev));
						setOriginalGuildConfig((prev: any) => (prev ? { ...prev, boostedUntil } : prev));
						mutateUser().catch(() => null);
					}}
				/>
			)}

			<Confirm
				open={deleteGuildConfirmOpen}
				onOpenChange={setDeleteGuildConfirmOpen}
				title={selectedGuild?.name || ''}
				description={t('app.dashboard.deleteConfirmDesc')}
				variant="danger"
				confirmKeyword={selectedGuild?.name || 'DELETE'}
				onConfirm={confirmDeleteGuild}
			/>

			{botTourName && <DashboardBotTour botName={botTourName} onFinish={handleFinishBotTour} />}
		</div>
	);
}

export default function DashboardPage() {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col w-full">
			<Suspense
				fallback={
					<div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-3 max-w-(--page-width) mx-auto">
						<Loading message={t('app.dashboard.loadingServers')} />
					</div>
				}
			>
				<DashboardContent />
			</Suspense>

			<AppSeoSection page="dashboard" />
		</div>
	);
}
