/** @format */
'use client';

import { Bot, Compass, LayoutDashboard, Plus, Trophy, User } from 'lucide-react';
import { Confirm } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useSidebar, useToast } from '@xernerx/providers';
import { Suspense, useEffect, useState } from 'react';
import { Loading } from '@xernerx/feedback';
import { useRouter, useSearchParams } from 'next/navigation';

import PersonalWorkspace from '@/components/portal/PersonalWorkspace';
import OrgWorkspaceView from '@/components/portal/OrgWorkspaceView';
import CreateOrgModal from '@/components/portal/CreateOrgModal';
import PortalSeoSection from '@/components/portal/PortalSeoSection';
import { PortalSafeAvatar } from '@/components/portal/PortalSafeAvatar';
import { filterManagedDiscordGuilds, populateBotsWithFreshDiscord, resolveBotAvatarUrl, syncSidebarOrgView, VALID_ORG_TABS } from '@/lib/portalHelpers';

type Organization = {
	_id: string;
	vanitySlug?: string;
	name: string;
	icon: string | null;
	iconUrl: string | null;
	owner: string;
	description: string | null;
	verified: boolean;
	privacy: string;
	members?: string[];
	bannerUrl?: string | null;
};

function PortalPageContent() {
	const { data: session, status } = useSession();
	const { getEnvUrl, isReady: envReady } = useEnvironment();
	const { t } = useDictionary();
	const { setNavItems, clearNavItems, show, setView } = useSidebar();
	const { toast, remind } = useToast();
	const router = useRouter();
	const searchParams = useSearchParams();

	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [orgsLoaded, setOrgsLoaded] = useState(false);
	const [bots, setBots] = useState<any[]>([]);
	const [guilds, setGuilds] = useState<any[]>([]);
	const [orgGuilds, setOrgGuilds] = useState<any[]>([]);

	const [selectedOrg, setSelectedOrg] = useState<Organization | 'personal' | null>(null);
	const [orgConfig, setOrgConfig] = useState<any>(null);
	const [originalOrgConfig, setOriginalOrgConfig] = useState<any>(null);
	const [memberProfiles, setMemberProfiles] = useState<Record<string, any>>({});
	const [pendingInvites, setPendingInvites] = useState<any[]>([]);
	const [orgMembers, setOrgMembers] = useState<any[]>([]);
	const [configLoading, setConfigLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [loading, setLoading] = useState(true);

	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
	const [activeTab, setActiveTab] = useState('info');
	const [pendingUploads, setPendingUploads] = useState<Record<string, File>>({});
	const [uploadingMedia] = useState<string | null>(null);

	const isDirty = JSON.stringify(orgConfig) !== JSON.stringify(originalOrgConfig) || Object.keys(pendingUploads).length > 0;
	const orgQueryParam = searchParams.get('org');
	const tabQueryParam = searchParams.get('tab');

	useEffect(() => {
		if (tabQueryParam && (VALID_ORG_TABS as readonly string[]).includes(tabQueryParam) && tabQueryParam !== activeTab) {
			setActiveTab(tabQueryParam);
		}
	}, [tabQueryParam]);

	useEffect(() => {
		if (!orgsLoaded) return;
		if (orgQueryParam && orgQueryParam !== 'personal') {
			const matchedOrg = organizations.find((o) => String(o._id) === orgQueryParam || (o.vanitySlug && o.vanitySlug === orgQueryParam));
			if (matchedOrg) {
				setSelectedOrg(matchedOrg);
				return;
			}
		}
		setSelectedOrg('personal');
	}, [orgQueryParam, organizations, orgsLoaded]);

	useEffect(() => {
		if (!envReady || status === 'loading') return;

		if (status === 'unauthenticated') {
			const isCrawler = typeof navigator !== 'undefined' && /bot|crawler|spider|lighthouse|headless|curl|php/i.test(navigator.userAgent);
			if (!isCrawler) {
				window.location.href = `${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(window.location.href)}`;
			} else {
				setLoading(false);
			}
			return;
		}

		show();

		const fetchPortalData = async () => {
			const sessionData = session as any;
			if (!sessionData?.user?.id) {
				setLoading(false);
				return;
			}

			let userOrgs: Organization[] = [];
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations?user=${sessionData.user.id}`), {
					credentials: 'include',
				});
				if (res.ok) {
					const data = await res.json();
					userOrgs = Array.isArray(data) ? data : [];
					setOrganizations(userOrgs);
				}
			} catch (error) {
				console.error('Failed to fetch organizations:', error);
			} finally {
				setOrgsLoaded(true);
				setLoading(false);
			}

			try {
				const [ownerRes, ...orgBotResponses] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?owner=${sessionData.user.id}`), { credentials: 'include' }),
					...userOrgs.map((org) => fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?organization=${org._id}`), { credentials: 'include' })),
				]);

				const botMap = new Map<string, any>();
				for (const botRes of [ownerRes, ...orgBotResponses]) {
					if (botRes.ok) {
						const botList = await botRes.json();
						if (Array.isArray(botList)) {
							botList.forEach((b: any) => b?.id && botMap.set(b.id, b));
						}
					}
				}

				const populatedBots = await populateBotsWithFreshDiscord(Array.from(botMap.values()), getEnvUrl);
				setBots(populatedBots);
			} catch (error) {
				console.error('Failed to fetch bots:', error);
			}
		};

		fetchPortalData();
		return () => clearNavItems();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [(session as any)?.user?.id, status, getEnvUrl, envReady]);

	useEffect(() => {
		const sessionData = session as any;
		if (!envReady || status !== 'authenticated' || !sessionData?.user?.id) return;
		let active = true;

		const fetchGuilds = async () => {
			try {
				const headers: Record<string, string> = {};
				if (sessionData.accessToken) {
					headers.Authorization = `Bearer ${sessionData.accessToken}`;
				}
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${sessionData.user.id}/discord/guilds`), {
					headers,
					credentials: 'include',
				});
				if (res.ok && active) {
					const data = await res.json();
					setGuilds(filterManagedDiscordGuilds(data));
				}
			} catch (error) {
				console.error('Failed to fetch guilds:', error);
			}
		};

		fetchGuilds();
		return () => {
			active = false;
		};
	}, [(session as any)?.user?.id, (session as any)?.accessToken, status, getEnvUrl, envReady]);

	useEffect(() => {
		if (!envReady || !session || !orgsLoaded) return;

		const staticItems = [
			{ label: t('app.portal.nav.explore'), href: getEnvUrl('https://app.xernerx.com'), icon: Compass as any, category: t('app.portal.categories.navigation') },
			{ label: t('app.leaderboard.title'), href: getEnvUrl('https://app.xernerx.com/leaderboard'), icon: Trophy as any, category: t('app.portal.categories.navigation') },
			{ label: t('app.portal.nav.dashboard'), href: getEnvUrl('https://app.xernerx.com/dashboard'), icon: LayoutDashboard as any, category: t('app.portal.categories.navigation') },
		];

		const dynamicItems: any[] = [
			{
				label: t('app.portal.nav.personal'),
				onClick: () => {
					setSelectedOrg('personal');
					syncSidebarOrgView(setView, 'org-personal');
					router.replace('/?org=personal', { scroll: false });
				},
				category: t('app.portal.categories.organizations'),
				icon: User as any,
				view: 'org-personal',
			},
			...organizations.map((org: any) => ({
				label: org.name,
				onClick: () => {
					setSelectedOrg(org);
					syncSidebarOrgView(setView, `org-${org._id}`);
					router.replace(`/?org=${org._id}&tab=${activeTab}`, { scroll: false });
				},
				category: t('app.portal.categories.organizations'),
				icon: () => (
					<PortalSafeAvatar
						src={org.iconUrl ? getEnvUrl(org.iconUrl as string) : null}
						alt={org.name}
						fallbackKind="initial"
						initial={org.name}
						className="w-5 h-5 rounded-xl object-cover shrink-0"
						fallbackClassName="w-5 h-5 rounded-xl bg-(--foreground) flex items-center justify-center text-[10px] font-bold shrink-0"
					/>
				),
				view: `org-${org._id}`,
			})),
			{
				label: t('app.portal.nav.newOrganization'),
				onClick: () => setCreateModalOpen(true),
				category: t('app.portal.categories.organizations'),
				icon: Plus as any,
				view: 'org-new',
			},
		];

		if (bots.length > 0) {
			bots.forEach((bot) => {
				const avatarUrl = resolveBotAvatarUrl(bot, 64);
				const botLabel = bot.discord?.global_name || bot.discord?.username || bot.name || bot.id;
				dynamicItems.push({
					label: botLabel,
					href: `/bots/${bot.id}`,
					category: t('common.nav.categories.bots'),
					icon: avatarUrl
						? () => (
								<PortalSafeAvatar
									src={avatarUrl}
									alt={botLabel}
									fallbackKind="bot"
									className="w-5 h-5 rounded-xl object-cover shrink-0"
									fallbackClassName="w-5 h-5 rounded-xl bg-(--foreground) flex items-center justify-center shrink-0"
									iconClassName="w-3.5 h-3.5 text-(--text-muted)"
								/>
							)
						: (Bot as any),
				});
			});
		}

		setNavItems([...staticItems, ...dynamicItems]);

		const targetView = selectedOrg && selectedOrg !== 'personal' ? `org-${selectedOrg._id}` : 'org-personal';
		syncSidebarOrgView(setView, targetView);
		const raf = window.requestAnimationFrame(() => {
			syncSidebarOrgView(setView, targetView);
		});
		return () => window.cancelAnimationFrame(raf);
	}, [envReady, session, orgsLoaded, organizations, bots, selectedOrg, t, getEnvUrl, activeTab, router, setNavItems, setView]);

	useEffect(() => {
		if (!selectedOrg || selectedOrg === 'personal') {
			setOrgConfig(null);
			setOriginalOrgConfig(null);
			return;
		}

		const fetchConfig = async () => {
			setConfigLoading(true);
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${selectedOrg._id}`), { credentials: 'include' });
				if (res.ok) {
					const data = await res.json();
					setOrgConfig(data);
					setOriginalOrgConfig(structuredClone(data));

					let pendingUsers: any[] = [];
					let fetchedOrgGuilds: any[] = [];
					let fetchedMembers: any[] = [];
					try {
						const [appsRes, guildsRes, membersRes] = await Promise.all([
							fetch(getEnvUrl(`https://api.xernerx.com/secure/dispatch?senderId=${selectedOrg._id}&category=invite&type=organization_invite&status=pending`), { credentials: 'include' }),
							fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds?organization=${selectedOrg._id}`), { credentials: 'include' }),
							fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${selectedOrg._id}/members`), { credentials: 'include' }),
						]);
						if (appsRes.ok) {
							const appsData = await appsRes.json();
							pendingUsers = appsData.map((app: any) => ({ ...app, userId: app.targetId }));
						}
						if (guildsRes.ok) fetchedOrgGuilds = await guildsRes.json();
						if (membersRes.ok) fetchedMembers = await membersRes.json();
					} catch {}
					setPendingInvites(pendingUsers);
					setOrgGuilds(fetchedOrgGuilds);
					setOrgMembers(fetchedMembers);

					const allMembers = [selectedOrg.owner, ...(data.members || []), ...pendingUsers.map((app) => app.userId)];
					const profiles: Record<string, any> = {};
					await Promise.all(
						allMembers.map(async (id) => {
							try {
								const profileRes = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${id}/discord`));
								if (profileRes.ok) profiles[id] = await profileRes.json();
							} catch {}
						})
					);
					setMemberProfiles(profiles);
				}
			} catch (error) {
				console.error('Failed to fetch organization config', error);
			} finally {
				setConfigLoading(false);
			}
		};
		fetchConfig();
	}, [selectedOrg, getEnvUrl]);

	useEffect(() => {
		if (isDirty) {
			const handleSave = async () => {
				setSaving(true);
				try {
					const finalConfig = { ...orgConfig };
					if (!finalConfig.vanityUnlocked && !finalConfig.verified) {
						delete finalConfig.vanitySlug;
						delete finalConfig.vanityUnlocked;
					}
					for (const field of ['iconUrl', 'bannerUrl'] as const) {
						if (pendingUploads[field]) {
							const formData = new FormData();
							formData.append('file', pendingUploads[field]);
							formData.append('privacy', 'public');
							const uploadRes = await fetch(getEnvUrl(`https://cdn.xernerx.com/upload/${(session?.user as any)?.id}`), {
								method: 'POST',
								body: formData,
								credentials: 'include',
							});
							const uploadData = await uploadRes.json();
							if (uploadData.url) finalConfig[field] = uploadData.url;
						}
					}

					const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${(selectedOrg as any)._id}`), {
						method: 'PATCH',
						credentials: 'include',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(finalConfig),
					});
					if (res.ok) {
						const updated = await res.json().catch(() => null);
						const merged = updated ? { ...finalConfig, ...updated } : finalConfig;
						setOrgConfig(merged);
						setOriginalOrgConfig(structuredClone(merged));
						setPendingUploads({});
						toast({ title: t('common.toast.savedSuccess'), type: 'success' });
						remind(false);
					} else {
						const errData = await res.json().catch(() => ({}));
						toast({ title: t('common.toast.saveFailed'), description: errData.error, type: 'error' });
					}
				} catch {
					toast({ title: t('common.toast.saveError'), type: 'error' });
				} finally {
					setSaving(false);
				}
			};

			const handleReset = () => {
				setOrgConfig(structuredClone(originalOrgConfig));
				setPendingUploads({});
			};

			remind(true, handleSave, handleReset, saving);
		} else {
			remind(false);
		}
	}, [isDirty, saving, orgConfig, originalOrgConfig, selectedOrg, getEnvUrl, remind, toast, t, pendingUploads, session]);

	const handleDeleteOrg = async () => {
		if (!selectedOrg || selectedOrg === 'personal') return;
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${selectedOrg._id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) window.location.reload();
			else toast({ title: t('app.portal.toast.deleteFailed'), type: 'error' });
		} catch {
			toast({ title: t('app.portal.toast.deleteError'), type: 'error' });
		} finally {
			setDeleting(false);
		}
	};

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'iconUrl' | 'bannerUrl') => {
		const file = e.target.files?.[0];
		if (file) setPendingUploads((prev) => ({ ...prev, [field]: file }));
	};

	return (
		<>
			<div className="flex flex-col max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)', fontSize: 'var(--text-scale, 14px)' }}>
				{loading ? (
					<div className="flex-1 flex flex-col items-center justify-center text-center py-20 gap-3 text-(--text-muted)">
						<h1 className="sr-only">{t('app.portal.seo.h1')}</h1>
						<p className="sr-only">{t('app.portal.seo.lead')}</p>
						<Loading variant="default" />
					</div>
				) : selectedOrg === 'personal' ? (
					<PersonalWorkspace session={session} bots={bots} organizations={organizations} guilds={guilds} onCreateOrg={() => setCreateModalOpen(true)} />
				) : selectedOrg ? (
					<OrgWorkspaceView
						session={session}
						selectedOrg={selectedOrg}
						configLoading={configLoading}
						orgConfig={orgConfig}
						setOrgConfig={setOrgConfig}
						setOriginalOrgConfig={setOriginalOrgConfig}
						activeTab={activeTab}
						onTabChange={(tab) => {
							setActiveTab(tab);
							router.replace(`/?org=${selectedOrg._id}&tab=${tab}`, { scroll: false });
						}}
						pendingUploads={pendingUploads}
						handleUpload={handleUpload}
						uploadingMedia={uploadingMedia}
						memberProfiles={memberProfiles}
						pendingInvites={pendingInvites}
						orgMembers={orgMembers}
						setOrgMembers={setOrgMembers}
						bots={bots}
						setBots={setBots}
						orgGuilds={orgGuilds}
						setOrgGuilds={setOrgGuilds}
						managedGuilds={guilds}
						setIsConfirmDeleteOpen={setIsConfirmDeleteOpen}
					/>
				) : null}
			</div>

			<PortalSeoSection />
			<CreateOrgModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

			<Confirm
				open={isConfirmDeleteOpen}
				onOpenChange={setIsConfirmDeleteOpen}
				title={t('app.portal.modals.delete.title')}
				description={t('app.portal.modals.delete.desc')}
				confirmText={t('app.portal.modals.delete.confirm')}
				cancelText={t('app.portal.modals.delete.cancel')}
				confirmKeyword={selectedOrg && selectedOrg !== 'personal' ? selectedOrg.name : 'DELETE'}
				onConfirm={handleDeleteOrg}
				loading={deleting}
			/>
		</>
	);
}

export default function PortalPage() {
	return (
		<Suspense
			fallback={
				<div className="flex-1 flex flex-col items-center justify-center py-20 text-(--text-muted)">
					<Loading variant="default" />
				</div>
			}
		>
			<PortalPageContent />
		</Suspense>
	);
}
