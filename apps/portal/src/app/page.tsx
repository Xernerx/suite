/** @format */
'use client';

import { Bot, Compass, LayoutDashboard, Plus, User, Trophy } from 'lucide-react';
import { Confirm, Tabs } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useSidebar, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import { Loading } from '@xernerx/feedback';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import PersonalWorkspace from '@/components/portal/PersonalWorkspace';
import OrgWorkspaceHeader from '@/components/portal/OrgWorkspaceHeader';
import OrgInfoTab from '@/components/portal/OrgInfoTab';
import OrgMembersTab from '@/components/portal/OrgMembersTab';
import OrgRolesTab from '@/components/portal/OrgRolesTab';
import OrgBotsTab from '@/components/portal/OrgBotsTab';
import OrgServersTab from '@/components/portal/OrgServersTab';
import OrgLinksTab from '@/components/portal/OrgLinksTab';
import OrgSettingsTab from '@/components/portal/OrgSettingsTab';
import CreateOrgModal from '@/components/portal/CreateOrgModal';
import PortalSeoSection from '@/components/portal/PortalSeoSection';

type Organization = {
	_id: string;
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

export default function PortalPage() {
	const { data: session, status } = useSession();
	const { getEnvUrl, isReady: envReady } = useEnvironment();
	const { t } = useDictionary();
	const { setNavItems, clearNavItems, show, setView } = useSidebar();
	const { toast, remind } = useToast();
	const router = useRouter();

	const [organizations, setOrganizations] = useState<Organization[]>([]);
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

		const populateDiscordBots = async (botList: any[]) => {
			return Promise.all(
				botList.map(async (bot: any) => {
					if (bot.discord) return bot;
					try {
						const discordRes = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${bot.id}/discord`));
						if (discordRes.ok) {
							bot.discord = await discordRes.json();
						}
					} catch (e) {
						console.error(`Failed to fetch discord user for bot ${bot.id}`, e);
					}
					return bot;
				})
			);
		};

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

					const params = new URLSearchParams(window.location.search);
					const orgParam = params.get('org');
					const tabParam = params.get('tab');
					const validTabs = ['info', 'members', 'roles', 'bots', 'servers', 'links', 'settings'];
					if (tabParam && validTabs.includes(tabParam)) {
						setActiveTab(tabParam);
					}

					let matched = false;
					if (orgParam && orgParam !== 'personal') {
						const targetOrg = userOrgs.find((o: any) => o._id === orgParam);
						if (targetOrg) {
							setSelectedOrg(targetOrg);
							setView(`org-${targetOrg._id}`);
							matched = true;
						}
					}

					if (!matched) {
						setSelectedOrg('personal');
						setView('org-personal');
					}
				}
			} catch (error) {
				console.error('Failed to fetch organizations:', error);
			} finally {
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

				const populatedBots = await populateDiscordBots(Array.from(botMap.values()));
				setBots(populatedBots);
			} catch (error) {
				console.error('Failed to fetch bots:', error);
			}
		};

		const fetchGuilds = async () => {
			const sessionData = session as any;
			if (!sessionData?.user?.id) return;
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${sessionData.user.id}/discord/guilds`));
				if (res.ok) {
					const data = await res.json();
					setGuilds(
						data.filter((guild: any) => {
							const perms = BigInt(guild.permissions || 0);
							return (perms & BigInt(0x8)) === BigInt(0x8) || (perms & BigInt(0x20)) === BigInt(0x20);
						})
					);
				}
			} catch (error) {
				console.error('Failed to fetch guilds:', error);
			}
		};

		fetchPortalData();
		fetchGuilds();

		return () => clearNavItems();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [(session as any)?.user?.id, status, getEnvUrl, envReady]);

	useEffect(() => {
		if (!envReady || !session) return;

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
					setView('org-personal');
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
					setView(`org-${org._id}`);
					router.replace(`/?org=${org._id}&tab=${activeTab}`, { scroll: false });
				},
				category: t('app.portal.categories.organizations'),
				icon: org.iconUrl
					? () => <Image src={getEnvUrl(org.iconUrl as string)} alt={org.name} width={20} height={20} unoptimized className="w-5 h-5 rounded-xl object-cover" />
					: () => <div className="w-5 h-5 rounded-xl bg-(--foreground) flex items-center justify-center text-[10px]">{org.name.charAt(0)}</div>,
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
				const avatarHash = bot.discord?.avatar || bot.avatar;
				dynamicItems.push({
					label: bot.discord?.username || bot.name || bot.id,
					href: `/bots/${bot.id}`,
					category: t('common.nav.categories.bots'),
					icon: avatarHash
						? () => (
								<Image
									src={`https://cdn.discordapp.com/avatars/${bot.id}/${avatarHash}.png?size=64`}
									alt={bot.name || bot.id}
									width={20}
									height={20}
									unoptimized
									className="w-5 h-5 rounded-xl object-cover"
								/>
							)
						: (Bot as any),
				});
			});
		}

		setNavItems([...staticItems, ...dynamicItems]);
	}, [envReady, session, organizations, bots, t, getEnvUrl, activeTab]);

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
					setOriginalOrgConfig(JSON.parse(JSON.stringify(data)));

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
						if (guildsRes.ok) {
							fetchedOrgGuilds = await guildsRes.json();
						}
						if (membersRes.ok) {
							fetchedMembers = await membersRes.json();
						}
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
							if (uploadData.url) {
								finalConfig[field] = uploadData.url;
							}
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
						setOriginalOrgConfig(JSON.parse(JSON.stringify(merged)));
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
				setOrgConfig(JSON.parse(JSON.stringify(originalOrgConfig)));
				setPendingUploads({});
			};

			remind(true, handleSave, handleReset, saving);
		} else {
			remind(false);
		}
	}, [isDirty, saving, orgConfig, originalOrgConfig, selectedOrg, getEnvUrl, remind, toast, t]);

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
					<PersonalWorkspace session={session} bots={bots} organizations={organizations} />
				) : selectedOrg ? (
					<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
						<OrgWorkspaceHeader organization={selectedOrg} />
						{configLoading ? (
							<div className="flex flex-col w-full h-full text-center items-center justify-center py-20 text-(--text-muted)">
								<Loading variant="default" />
							</div>
						) : orgConfig ? (
							<div className="flex flex-col w-full gap-8 mt-4">
								<Tabs
									activeTab={activeTab}
									onChange={(tab) => {
										setActiveTab(tab);
										router.replace(`/?org=${selectedOrg._id}&tab=${tab}`, { scroll: false });
									}}
									tabs={['info', 'members', 'roles', 'bots', 'servers', 'links', 'settings'].map((id) => ({ id, label: t(`app.portal.tabs.${id}`) }))}
								/>
								{activeTab === 'info' && (
									<OrgInfoTab orgConfig={orgConfig} setOrgConfig={setOrgConfig} pendingUploads={pendingUploads} handleUpload={handleUpload} uploadingMedia={uploadingMedia} />
								)}
								{activeTab === 'members' && (
									<OrgMembersTab
										session={session}
										selectedOrg={selectedOrg}
										orgConfig={orgConfig}
										setOrgConfig={setOrgConfig}
										setOriginalOrgConfig={setOriginalOrgConfig}
										memberProfiles={memberProfiles}
										pendingInvites={pendingInvites}
										orgMembers={orgMembers}
										setOrgMembers={setOrgMembers}
									/>
								)}
								{activeTab === 'roles' && <OrgRolesTab orgConfig={orgConfig} setOrgConfig={setOrgConfig} />}
								{activeTab === 'bots' && <OrgBotsTab bots={bots} selectedOrg={selectedOrg} orgGuilds={orgGuilds} />}
								{activeTab === 'servers' && <OrgServersTab orgConfig={orgConfig} setOrgConfig={setOrgConfig} orgGuilds={orgGuilds} />}
								{activeTab === 'links' && <OrgLinksTab orgConfig={orgConfig} setOrgConfig={setOrgConfig} />}
								{activeTab === 'settings' && (
									<OrgSettingsTab
										orgConfig={orgConfig}
										setOrgConfig={setOrgConfig}
										onVanityUnlocked={() => {
											setOrgConfig((prev: any) => (prev ? { ...prev, vanityUnlocked: true } : prev));
											setOriginalOrgConfig((prev: any) => (prev ? { ...prev, vanityUnlocked: true } : prev));
										}}
										setIsConfirmDeleteOpen={setIsConfirmDeleteOpen}
										orgBots={bots.filter((b) => b.organization === selectedOrg._id)}
										orgGuilds={orgGuilds}
									/>
								)}
							</div>
						) : null}
					</div>
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
