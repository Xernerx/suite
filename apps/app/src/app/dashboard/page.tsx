/** @format */
'use client';

import { Compass, Server, ExternalLink, Copy, Check, Trophy, Rocket } from 'lucide-react';
import { Confirm, Tabs, Button } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useSidebar, useToast, useUser } from '@xernerx/providers';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { Loading } from '@xernerx/feedback';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import General from '@/components/dashboard/General';
import Statistics from '@/components/dashboard/Statistics';
import Links from '@/components/dashboard/Links';
import VirtueGeneral from '@/components/dashboard/virtue/General';
import Settings from '@/components/dashboard/Settings';
import SpotlightBoostModal from '@/components/SpotlightBoostModal';
import { AppSeoSection } from '@/components/AppSeoSection';

const VALID_DASHBOARD_TABS = ['info', 'stats', 'links', 'virtue', 'settings'];

type Guild = { id: string; name: string; icon: string | null; iconUrl: string | null; banner: string | null; bannerUrl: string | null; permissions: string; features: string[] };

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
	const [deleting, setDeleting] = useState(false);
	const [deleteGuildConfirmOpen, setDeleteGuildConfirmOpen] = useState(false);
	const [boostModalOpen, setBoostModalOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [rateLimited, setRateLimited] = useState(false);
	const [copiedId, setCopiedId] = useState(false);
	const initialTab = searchParams.get('tab');
	const [activeTab, setActiveTab] = useState(initialTab && VALID_DASHBOARD_TABS.includes(initialTab) ? initialTab : 'info');
	const { remind, toast } = useToast();

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

	const handleCopyGuildId = () => {
		if (!selectedGuild?.id) return;
		navigator.clipboard.writeText(selectedGuild.id);
		setCopiedId(true);
		toast({ title: t('app.servers.idCopied'), type: 'success' });
		setTimeout(() => setCopiedId(false), 2000);
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
		}, 400); // 400ms duration for undraw animation
	};

	useEffect(() => {
		if (!isReady || status === 'loading') return;

		if (status === 'unauthenticated') {
			window.location.href = `${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(window.location.href)}`;
			return;
		}

		show();

		const staticItems = [
			{ label: t('app.dashboard.nav.explore'), href: '/', icon: Compass as any, category: t('app.dashboard.categories.navigation') },
			{ label: t('app.leaderboard.title'), href: '/leaderboard', icon: Trophy as any, category: t('app.dashboard.categories.navigation') },
		];

		// Populate static items immediately so they aren't blocked by the fetch or StrictMode
		setNavItems(staticItems);

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
				setNavItems([
					...staticItems,
					...managedGuilds.map((g) => ({
						label: g.name,
						onClick: () => setSelectedGuild(g),
						category: t('app.dashboard.categories.servers'),
						icon: g.iconUrl
							? () => <Image src={g.iconUrl!} alt={g.name} width={20} height={20} unoptimized className="w-5 h-5 rounded-full object-cover" />
							: () => <div className="w-5 h-5 rounded-full bg-(--foreground) flex items-center justify-center text-[10px]">{g.name.charAt(0)}</div>,
						view: `server-${g.id}`,
					})),
				]);

				if (managedGuilds.length > 0) {
					const params = new URLSearchParams(window.location.search);
					const tabParam = params.get('tab');
					const requestedGuildId =
						params.get('guild') ||
						(params.get('view')?.startsWith('server-') ? params.get('view')!.replace('server-', '') : null) ||
						(tabParam?.startsWith('server-') ? tabParam.replace('server-', '') : null);
					const initialGuild = (requestedGuildId ? managedGuilds.find((g) => g.id === requestedGuildId) : null) || managedGuilds[0];
					setSelectedGuild(initialGuild);
					setView(`server-${initialGuild.id}`);
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
			if (matched) setSelectedGuild(matched);
		}
	}, [view, guilds, selectedGuild?.id]);

	const [organizations, setOrganizations] = useState<any[]>([]);

	useEffect(() => {
		if (!selectedGuild) {
			setGuildConfig(null);
			setOriginalGuildConfig(null);
			return;
		}

		const fetchConfig = async () => {
			setConfigLoading(true);
			try {
				const [guildRes, orgsRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${selectedGuild.id}`), { credentials: 'include' }),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations?user=${(session as any).user.id}`), { credentials: 'include' }),
				]);

				if (guildRes.ok) {
					const data = await guildRes.json();
					setGuildConfig(data);
					setOriginalGuildConfig(JSON.parse(JSON.stringify(data)));
				}

				if (orgsRes.ok) {
					setOrganizations(await orgsRes.json());
				}
			} catch (error) {
				console.error('Failed to fetch guild config', error);
			} finally {
				setConfigLoading(false);
			}
		};

		fetchConfig();
	}, [selectedGuild, session, getEnvUrl, isReady]);

	const handleSaveConfig = async () => {
		if (!selectedGuild || !guildConfig) return;

		setSaving(true);
		try {
			const sessionData = session as any;
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${selectedGuild.id}`), {
				method: 'PATCH',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
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
					vanitySlug: guildConfig.vanitySlug,
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

	const isDirty = useMemo(() => {
		if (!guildConfig || !originalGuildConfig) return false;
		return JSON.stringify(guildConfig) !== JSON.stringify(originalGuildConfig);
	}, [guildConfig, originalGuildConfig]);

	useEffect(() => {
		if (activeTab === 'virtue') return;
		remind(isDirty, handleSaveConfig, () => setGuildConfig(JSON.parse(JSON.stringify(originalGuildConfig))), saving);
		return () => remind(false);
	}, [activeTab, isDirty, saving, originalGuildConfig, remind, guildConfig, selectedGuild]);

	const handleDeleteGuild = () => {
		if (!selectedGuild) return;
		setDeleteGuildConfirmOpen(true);
	};

	const confirmDeleteGuild = async () => {
		if (!selectedGuild) return;
		setDeleteGuildConfirmOpen(false);
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${selectedGuild.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});

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
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div
			className="flex flex-col max-w-(--page-width) mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{loading ? (
				<div className="flex flex-col items-center justify-center text-center py-12 gap-3">
					<h1 className="sr-only">{t('app.seo.dashboard.h1')}</h1>
					<p className="sr-only">{t('app.seo.dashboard.guideIntro')}</p>
					<Loading message={t('app.dashboard.loadingServers')} />
				</div>
			) : selectedGuild ? (
				<>
					<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
						{/* Guild Summary Card (Page Header) */}
						<div
							className="relative flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden"
							style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
						>
							{/* Optional Banner Background */}
							{(selectedGuild as any).bannerUrl && (
								<div
									className="absolute inset-0 z-0 opacity-20"
									style={{
										backgroundImage: `url(${(selectedGuild as any).bannerUrl})`,
										backgroundSize: 'cover',
										backgroundPosition: 'center',
									}}
								/>
							)}
							<div className="relative z-10 flex items-center" style={{ gap: 'var(--ui-gap)' }}>
								{selectedGuild.iconUrl ? (
									<Image
										src={selectedGuild.iconUrl}
										alt={selectedGuild.name}
										width={80}
										height={80}
										unoptimized
										className="h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0 shadow-lg"
									/>
								) : (
									<div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--background)/50 shrink-0 shadow-lg border border-(--border)/10">
										<Server className="w-8 h-8 text-(--text-muted)" />
									</div>
								)}
								<div className="flex flex-col gap-1.5">
									<span className="text-3xl font-extrabold text-(--text) drop-shadow-md tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
										{selectedGuild.name}
									</span>
									<button
										type="button"
										onClick={handleCopyGuildId}
										className="inline-flex items-center gap-1.5 w-fit text-xs font-mono text-(--text-muted) hover:text-(--text) bg-(--background)/60 hover:bg-(--background) px-2.5 py-1 rounded-lg border border-(--border)/10 transition-colors cursor-pointer"
									>
										<span>
											{t('app.dashboard.text1')}
											{selectedGuild.id}
										</span>
										{copiedId ? <Check className="w-3.5 h-3.5 text-(--accent-green)" /> : <Copy className="w-3.5 h-3.5" />}
									</button>
								</div>
							</div>
							<div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0">
								<Button variant="primary" onClick={() => setBoostModalOpen(true)} className="gap-2">
									<Rocket className="w-4 h-4" />
									{t('app.boost.boostServerBtn')}
								</Button>
								<Link href={`/servers/${guildConfig?.vanitySlug || selectedGuild.id}`}>
									<Button variant="secondary" className="gap-2">
										<ExternalLink className="w-4 h-4" />
										{t('app.portal.workspace.viewPublicProfile')}
									</Button>
								</Link>
							</div>
						</div>

						{configLoading ? (
							<div className="flex flex-col w-full h-full text-center items-center justify-center py-20 text-(--text-muted)">
								<Loading variant="default" />
							</div>
						) : guildConfig ? (
							<div className="flex flex-col w-full" style={{ gap: 'var(--ui-gap)' }}>
								<Tabs
									activeTab={activeTab}
									onChange={handleTabChange}
									tabs={[
										{ id: 'info', label: t('app.dashboard.tabs.info') },
										{ id: 'stats', label: t('app.dashboard.tabs.stats') },
										{ id: 'links', label: t('app.dashboard.tabs.links') },
										{ id: 'virtue', label: t('app.dashboard.tabs.virtue') },
										{ id: 'settings', label: t('app.dashboard.tabs.settings') },
									]}
								/>

								{activeTab === 'info' && <General guildConfig={guildConfig} setGuildConfig={setGuildConfig} />}

								{activeTab === 'stats' && (
									<Statistics
										guildConfig={guildConfig}
										timeframe={timeframe}
										setTimeframe={setTimeframe}
										activeMetric={activeMetric}
										handleMetricSwitch={handleMetricSwitch}
										isUndrawing={isUndrawing}
									/>
								)}

								{activeTab === 'links' && <Links guildConfig={guildConfig} setGuildConfig={setGuildConfig} />}

								{activeTab === 'virtue' && selectedGuild && <VirtueGeneral id={selectedGuild.id} managedGuilds={guilds} />}

								{activeTab === 'settings' && (
									<Settings
										guildConfig={guildConfig}
										setGuildConfig={setGuildConfig}
										onVanityUnlocked={() => {
											setGuildConfig((prev: any) => (prev ? { ...prev, vanityUnlocked: true } : prev));
											setOriginalGuildConfig((prev: any) => (prev ? { ...prev, vanityUnlocked: true } : prev));
										}}
										organizations={organizations}
										handleDeleteGuild={handleDeleteGuild}
									/>
								)}
							</div>
						) : null}
					</div>
				</>
			) : rateLimited ? (
				<div className="flex flex-col items-center justify-center text-center">
					<div className="w-20 h-20 bg-(--accent)/10 rounded-full flex items-center justify-center mb-6">
						<Server className="w-10 h-10 text-(--accent)" />
					</div>
					<h1 className="text-3xl font-extrabold tracking-tight text-(--text) drop-shadow-sm mb-4" style={{ fontFamily: `var(--font-fredoka)` }}>
						{t('app.dashboard.text21')}
					</h1>
					<p className="text-sm text-(--text-muted) max-w-md">{t('app.dashboard.text22')}</p>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center text-center">
					<div className="w-20 h-20 bg-(--accent)/10 rounded-full flex items-center justify-center mb-6">
						<Server className="w-10 h-10 text-(--accent)" />
					</div>
					<h1 className="text-3xl font-extrabold tracking-tight text-(--text) drop-shadow-sm mb-4" style={{ fontFamily: `var(--font-fredoka)` }}>
						{t('app.dashboard.text23')}
					</h1>
					<p className="text-sm text-(--text-muted) max-w-md">{t('app.dashboard.text24')}</p>
					<a
						href="https://discord.com/new"
						target="_blank"
						rel="noopener noreferrer"
						className="mt-6 px-6 py-3 rounded-xl bg-(--accent) hover:bg-(--hover-accent) text-white font-medium transition-colors shadow-sm"
					>
						{t('app.dashboard.text25')}
					</a>
				</div>
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
