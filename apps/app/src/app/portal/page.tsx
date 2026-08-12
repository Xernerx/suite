/** @format */
'use client';

import { Bot, Building2, Check, Compass, LayoutDashboard, Plus, Save, Settings, User, Users, Server, Link2, Shield, AlertTriangle, Trash2 } from 'lucide-react';
import { Button, Input, Modal, Selector, Tabs, Confirm } from '@xernerx/ui';
import { BotRow } from '@xernerx/components';
import { useDictionary, useEnvironment, useSession, useSidebar, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import { CircleFlag } from 'react-circle-flags';

import Image from 'next/image';
import Link from 'next/link';
import { Loading } from '@xernerx/feedback';
import { useRouter } from 'next/navigation';

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

const getFlagCode = (localeCode: string) => {
	switch (localeCode) {
		case 'en-GB':
			return 'uk';
		case 'en-US':
			return 'us';
		default:
			return localeCode;
	}
};

export default function PortalPage() {
	const { data: session } = useSession();
	const { getEnvUrl, isReady: envReady } = useEnvironment();
	const { t, locales } = useDictionary();
	const { setNavItems, clearNavItems, show, setView } = useSidebar();
	const { toast, remind } = useToast();
	const router = useRouter();

	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [bots, setBots] = useState<any[]>([]);
	const [guilds, setGuilds] = useState<any[]>([]);

	const [selectedOrg, setSelectedOrg] = useState<Organization | 'personal' | null>(null);
	const [orgConfig, setOrgConfig] = useState<any>(null);
	const [originalOrgConfig, setOriginalOrgConfig] = useState<any>(null);
	const [memberProfiles, setMemberProfiles] = useState<Record<string, any>>({});
	const [pendingInvites, setPendingInvites] = useState<any[]>([]);
	const [configLoading, setConfigLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [loading, setLoading] = useState(true);

	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [newOrgName, setNewOrgName] = useState('');
	const [newOrgDescription, setNewOrgDescription] = useState('');
	const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
	const [creatingOrg, setCreatingOrg] = useState(false);

	const [inviteUserId, setInviteUserId] = useState('');
	const [invitingMember, setInvitingMember] = useState(false);
	const [activeTab, setActiveTab] = useState('info');
	const [inviteUserObj, setInviteUserObj] = useState<any>(null);
	const [inviteModalOpen, setInviteModalOpen] = useState(false);
	const [fetchingUser, setFetchingUser] = useState(false);

	const isDirty = JSON.stringify(orgConfig) !== JSON.stringify(originalOrgConfig);
	useEffect(() => {
		if (!envReady || !session) return;
		show();

		const staticItems = [
			{ label: 'Explore', href: '/', icon: Compass as any, category: 'Navigation' },
			{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard as any, category: 'Navigation' },
		];

		setNavItems(staticItems);

		const fetchOrganizations = async () => {
			const sessionData = session as any;
			if (!sessionData?.user?.id) {
				setLoading(false);
				return;
			}

			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations?user=${sessionData.user.id}`), {
					credentials: 'include',
				});
				if (res.ok) {
					const data = await res.json();
					setOrganizations(data);
					setNavItems([
						...staticItems,
						{
							label: 'Personal',
							onClick: () => {
								setSelectedOrg('personal');
								setView('org-personal');
							},
							category: 'Organizations',
							icon: User as any,
							view: 'org-personal',
						},
						...data.map((org: any) => ({
							label: org.name,
							onClick: () => {
								setSelectedOrg(org);
								setView(`org-${org._id}`);
							},
							category: 'Organizations',
							icon: org.iconUrl
								? () => <img src={org.iconUrl} alt={org.name} className="w-5 h-5 rounded-md object-cover" />
								: () => <div className="w-5 h-5 rounded-md bg-(--foreground) flex items-center justify-center text-[10px]">{(org.name || 'O').charAt(0)}</div>,
							view: `org-${org._id}`,
						})),
						{
							label: 'New Organization',
							onClick: () => setCreateModalOpen(true),
							category: 'Organizations',
							icon: Plus as any,
							view: 'org-new',
						},
					]);
					setSelectedOrg('personal');
					setView('org-personal');
				}
			} catch (error) {
				console.error('Failed to fetch organizations:', error);
			} finally {
				setLoading(false);
			}
		};

		const fetchBots = async () => {
			const sessionData = session as any;
			if (!sessionData?.user?.id) return;
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots?owner=${sessionData.user.id}`), { credentials: 'include' });
				if (res.ok) setBots(await res.json());
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
					const managedGuilds = data.filter((guild: any) => {
						const perms = BigInt(guild.permissions || 0);
						const hasAdmin = (perms & BigInt(0x8)) === BigInt(0x8);
						const hasManageServer = (perms & BigInt(0x20)) === BigInt(0x20);
						return hasAdmin || hasManageServer;
					});
					setGuilds(managedGuilds);
				}
			} catch (error) {
				console.error('Failed to fetch guilds:', error);
			}
		};

		fetchOrganizations();
		fetchBots();
		fetchGuilds();

		return () => clearNavItems();
	}, [session, getEnvUrl, envReady]);

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
					setOriginalOrgConfig(data);

					let pendingUsers: any[] = [];
					try {
						const appsRes = await fetch(getEnvUrl(`https://api.xernerx.com/secure/content/applications?organizationId=${selectedOrg._id}`), { credentials: 'include' });
						if (appsRes.ok) {
							const appsData = await appsRes.json();
							pendingUsers = appsData.filter((app: any) => app.type === 'organization_invite' && app.status === 'pending');
						}
					} catch (e) {}
					setPendingInvites(pendingUsers);

					const allMembers = [selectedOrg.owner, ...(data.members || []), ...pendingUsers.map((app) => app.userId)];
					const profiles: Record<string, any> = {};
					await Promise.all(
						allMembers.map(async (id) => {
							try {
								const profileRes = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${id}/discord`));
								if (profileRes.ok) profiles[id] = await profileRes.json();
							} catch (e) {}
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
					const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${(selectedOrg as any)._id}`), {
						method: 'PATCH',
						credentials: 'include',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(orgConfig),
					});
					if (res.ok) {
						setOriginalOrgConfig(orgConfig);
						toast({ title: 'Saved successfully!', type: 'success' });
						remind(false);
					} else toast({ title: 'Failed to save', type: 'error' });
				} catch (e) {
					toast({ title: 'Error saving', type: 'error' });
				} finally {
					setSaving(false);
				}
			};

			const handleReset = () => {
				setOrgConfig(originalOrgConfig);
			};

			remind(true, handleSave, handleReset, saving);
		} else {
			remind(false);
		}
	}, [isDirty, saving, orgConfig, originalOrgConfig, selectedOrg, getEnvUrl, remind, toast]);

	const handleCreateOrg = async () => {
		if (!newOrgName.trim()) return;
		setCreatingOrg(true);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/organizations'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newOrgName.trim(), description: newOrgDescription.trim() || undefined }),
				credentials: 'include',
			});
			if (res.ok) window.location.reload();
			else toast({ title: 'Failed to create organization', type: 'error' });
		} catch (error) {
			toast({ title: 'Error creating organization', type: 'error' });
		} finally {
			setCreatingOrg(false);
		}
	};

	const handlePreviewUser = async () => {
		if (!inviteUserId.trim()) return;
		setFetchingUser(true);
		try {
			const [discordRes, dbRes] = await Promise.all([
				fetch(getEnvUrl(`https://api.xernerx.com/core/users/${inviteUserId.trim()}/discord`)),
				fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${inviteUserId.trim()}`), { credentials: 'include' }).catch(() => null),
			]);

			if (discordRes.ok) {
				const discordUser = await discordRes.json();
				let dbUser: any = {};
				let fullRoles: any[] = [];
				if (dbRes && dbRes.ok) {
					dbUser = await dbRes.json();

					if (dbUser.roles && Array.isArray(dbUser.roles)) {
						const rolePromises = dbUser.roles.map(async (roleItem: any) => {
							const roleId = typeof roleItem === 'string' ? roleItem : roleItem.id;
							if (!roleId) return null;
							try {
								const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/roles/${roleId}`), { credentials: 'include' });
								if (res.ok) return await res.json();
							} catch (e) {}
							return null;
						});
						const fetched = await Promise.all(rolePromises);
						fullRoles = fetched.filter(Boolean);
					}
				}
				setInviteUserObj({ ...discordUser, dbData: dbUser, fullRoles });
				setInviteModalOpen(true);
			} else {
				toast({ title: 'Not a valid user.', type: 'error' });
			}
		} catch (error) {
			toast({ title: 'Not a valid user.', type: 'error' });
		} finally {
			setFetchingUser(false);
		}
	};

	const confirmInviteMember = async () => {
		if (!selectedOrg || selectedOrg === 'personal' || !inviteUserObj) return;
		setInvitingMember(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/content/applications`), {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: inviteUserObj.id,
					type: 'organization_invite',
					metadata: { organizationId: selectedOrg._id, organizationName: selectedOrg.name },
				}),
			});
			if (res.ok) {
				setInviteUserId('');
				setInviteModalOpen(false);
				toast({ title: 'Invite sent successfully!', type: 'success' });
			} else {
				const data = await res.json();
				toast({ title: data.error || 'Failed to send invite.', type: 'error' });
			}
		} catch (error) {
			toast({ title: 'An error occurred while sending the invite.', type: 'error' });
		} finally {
			setInvitingMember(false);
		}
	};

	const handleDeleteOrg = async () => {
		if (!selectedOrg || selectedOrg === 'personal') return;
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${selectedOrg._id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) window.location.reload();
			else toast({ title: 'Failed to delete organization', type: 'error' });
		} catch (error) {
			toast({ title: 'Error deleting organization', type: 'error' });
		} finally {
			setDeleting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center py-20 text-(--text-muted)">
				<Loading variant="default" />
			</div>
		);
	}

	return (
		<>
			<div
				className="flex flex-col max-w-7xl mx-auto w-full"
				style={{
					padding: 'var(--ui-gap)',
					gap: 'var(--ui-gap)',
					fontSize: 'var(--text-scale, 14px)',
				}}
			>
				{selectedOrg === 'personal' ? (
					<>
						<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
							<div className="relative flex items-center rounded-[2rem] border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden p-8">
								<div className="relative z-10 flex items-center w-full gap-4">
									{session?.user?.image ? (
										<img src={session.user.image} alt="Avatar" className="h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0 shadow-lg" />
									) : (
										<div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--background)/50 shrink-0 shadow-lg border border-(--border)/10">
											<User className="w-8 h-8 text-(--text-muted)" />
										</div>
									)}
									<div className="flex flex-col gap-1">
										<span className="text-3xl font-extrabold text-(--text) drop-shadow-md tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{session?.user?.name || 'Personal'}
										</span>
										<span className="text-sm font-medium text-(--text-muted)">My Workspace</span>
									</div>
								</div>
							</div>

							<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
								<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
									<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
										<Bot className="w-4 h-4" />
									</div>
									Personal Bots
								</div>
								<div className="flex flex-col items-center justify-center w-full">
									{bots.filter((b) => !b.organization || !organizations.some((org) => org._id === b.organization)).length > 0 ? (
										<div className="flex flex-col w-full bg-(--foreground)/30 border border-(--border)/10 rounded-3xl overflow-hidden shadow-sm">
											{bots
												.filter((b) => !b.organization || !organizations.some((org) => org._id === b.organization))
												.map((bot) => (
													<BotRow key={bot.id} bot={bot} hrefPrefix="/portal/bots" />
												))}
										</div>
									) : (
										<div className="flex flex-col items-center justify-center p-8 bg-(--background)/50 rounded-2xl border border-(--border)/10 border-dashed w-full">
											<Bot className="w-8 h-8 text-(--text-muted) opacity-50 mb-3" />
											<p className="text-sm text-(--text-muted) mb-4">No personal bots registered yet.</p>
											<div className="text-xs text-(--text-muted) bg-(--background) border border-(--border)/20 px-4 py-2 rounded-lg">
												Bots are automatically registered when they interact with the API.
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</>
				) : selectedOrg ? (
					<>
						<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
							<div className="relative flex items-center rounded-[2rem] border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden p-8">
								{selectedOrg.bannerUrl && (
									<div
										className="absolute inset-0 z-0 opacity-20"
										style={{ backgroundImage: `url(${selectedOrg.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
									/>
								)}
								<div className="relative z-10 flex items-center w-full gap-4">
									{selectedOrg.iconUrl ? (
										<img src={selectedOrg.iconUrl} alt={selectedOrg.name} className="h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0 shadow-lg" />
									) : (
										<div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--background)/50 shrink-0 shadow-lg border border-(--border)/10">
											<Building2 className="w-8 h-8 text-(--text-muted)" />
										</div>
									)}
									<div className="flex flex-col gap-1">
										<span className="text-3xl font-extrabold text-(--text) drop-shadow-md tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{selectedOrg.name}
										</span>
										<span className="text-sm font-medium text-(--text-muted)">ID: {selectedOrg._id}</span>
									</div>
								</div>
							</div>

							{configLoading ? (
								<div className="flex flex-col w-full h-full text-center items-center justify-center py-20 text-(--text-muted)">
									<Loading variant="default" />
								</div>
							) : orgConfig ? (
								<div className="flex flex-col w-full gap-8 mt-4">
									<Tabs
										activeTab={activeTab}
										onChange={setActiveTab}
										tabs={[
											{ id: 'info', label: 'Info' },
											{ id: 'members', label: 'Members' },
											{ id: 'bots', label: 'Bots' },
											{ id: 'servers', label: 'Servers' },
											{ id: 'links', label: 'Links' },
											{ id: 'settings', label: 'Settings' },
										]}
									/>

									{activeTab === 'info' && (
										<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
											<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
												<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
													<Building2 className="w-4 h-4" />
												</div>
												Organization Profile
											</div>
											<div className="flex flex-col gap-5">
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">Name</label>
													<Input value={orgConfig.name || ''} onChange={(e) => setOrgConfig({ ...orgConfig, name: e.target.value })} placeholder="Organization Name" />
												</div>
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">Description</label>
													<Input
														value={orgConfig.description || ''}
														onChange={(e) => setOrgConfig({ ...orgConfig, description: e.target.value })}
														placeholder="Short description..."
													/>
												</div>
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">Extended Info</label>
													<textarea
														value={orgConfig.info || ''}
														onChange={(e) => setOrgConfig({ ...orgConfig, info: e.target.value })}
														placeholder="Detailed markdown description about this organization..."
														className="w-full min-h-[120px] rounded-xl border border-(--border)/10 bg-(--foreground)/30 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent)"
													/>
												</div>
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">Locale</label>
													<Selector
														value={orgConfig.locale || ''}
														onChange={(val) => setOrgConfig({ ...orgConfig, locale: val })}
														options={[
															{ label: 'Default', value: '' },
															...(locales?.map((lang: any) => {
																const countryCode = getFlagCode(lang.code);
																return {
																	value: lang.code,
																	label: (
																		<div className="flex items-center gap-2.5">
																			<CircleFlag countryCode={countryCode} className="h-4 w-4 shrink-0" />
																			<span className="font-medium">{lang.label}</span>
																		</div>
																	),
																	badge: (
																		<span
																			className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full ${
																				lang.coverage === 100 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
																			}`}
																		>
																			{lang.coverage}%
																		</span>
																	),
																};
															}) || []),
														]}
													/>
												</div>
											</div>
										</div>
									)}

									{activeTab === 'members' && (
										<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
											<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
												<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
													<Users className="w-4 h-4" />
												</div>
												Organization Members
											</div>
											<div className="flex flex-col gap-6">
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">Current Members</label>
													<div className="flex flex-col gap-2 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
														<div className="flex items-center justify-between text-sm">
															<div className="flex items-center gap-2">
																{memberProfiles[selectedOrg.owner]?.avatar ? (
																	<img
																		src={`https://cdn.discordapp.com/avatars/${selectedOrg.owner}/${memberProfiles[selectedOrg.owner].avatar}.png`}
																		alt="Avatar"
																		className="w-6 h-6 rounded-full object-cover shadow-sm border border-(--border)/10"
																	/>
																) : (
																	<div className="w-6 h-6 rounded-full bg-(--accent)/10 flex items-center justify-center border border-(--accent)/20 shadow-sm">
																		<User className="w-3 h-3 text-(--accent)" />
																	</div>
																)}
																<span className="text-(--text) font-medium flex items-center gap-2">
																	{memberProfiles[selectedOrg.owner]?.global_name || memberProfiles[selectedOrg.owner]?.username || 'Unknown User'}
																	<span className="text-(--text-muted) text-[10px] font-mono bg-(--background)/50 px-1.5 py-0.5 rounded border border-(--border)/10">
																		{selectedOrg.owner}
																	</span>
																	<span className="text-(--accent) text-[10px] font-bold uppercase tracking-widest bg-(--accent)/10 px-2 py-0.5 rounded-full ml-1 border border-(--accent)/20">
																		Owner
																	</span>
																</span>
															</div>
														</div>
														{orgConfig?.members?.length > 0 ? (
															orgConfig.members.map((memberId: string) => (
																<div key={memberId} className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-(--border)/5">
																	<div className="flex items-center gap-2">
																		{memberProfiles[memberId]?.avatar ? (
																			<img
																				src={`https://cdn.discordapp.com/avatars/${memberId}/${memberProfiles[memberId].avatar}.png`}
																				alt="Avatar"
																				className="w-6 h-6 rounded-full object-cover shadow-sm border border-(--border)/10"
																			/>
																		) : (
																			<div className="w-6 h-6 rounded-full bg-(--foreground)/50 flex items-center justify-center border border-(--border)/10 shadow-sm">
																				<User className="w-3 h-3 text-(--text-muted)" />
																			</div>
																		)}
																		<span className="text-(--text) font-medium flex items-center gap-2">
																			{memberProfiles[memberId]?.global_name || memberProfiles[memberId]?.username || 'Unknown User'}
																			<span className="text-(--text-muted) text-[10px] font-mono bg-(--background)/50 px-1.5 py-0.5 rounded border border-(--border)/10">
																				{memberId}
																			</span>
																		</span>
																	</div>
																</div>
															))
														) : (
															<span className="text-xs text-(--text-muted) mt-2 pt-2 border-t border-(--border)/5">No other members yet.</span>
														)}
													</div>
												</div>
												{pendingInvites.length > 0 && (
													<div className="flex flex-col gap-2 pt-2 border-t border-(--border)/10">
														<label className="text-sm font-bold text-(--text)">Pending Invitations</label>
														<div className="flex flex-col gap-2 p-4 bg-(--background)/50 rounded-2xl border border-(--border)/10">
															{pendingInvites.map((app) => {
																const profile = memberProfiles[app.userId];
																return (
																	<div
																		key={app.id}
																		className="flex items-center justify-between text-sm mt-2 first:mt-0 pt-2 first:pt-0 border-t first:border-t-0 border-(--border)/5"
																	>
																		<div className="flex items-center gap-2">
																			{profile?.avatar ? (
																				<img
																					src={`https://cdn.discordapp.com/avatars/${app.userId}/${profile.avatar}.png`}
																					className="w-6 h-6 rounded-full object-cover shadow-sm border border-(--border)/10"
																				/>
																			) : (
																				<div className="w-6 h-6 rounded-full bg-(--foreground)/30 flex items-center justify-center border border-(--border)/10 shadow-sm text-(--text-muted)">
																					<User className="w-3 h-3 text-(--text-muted)" />
																				</div>
																			)}
																			<span className="text-(--text) font-medium flex items-center gap-2">
																				{profile?.global_name || profile?.username || 'Unknown User'}
																				<span className="text-(--text-muted) text-[10px] font-mono bg-(--background)/50 px-1.5 py-0.5 rounded border border-(--border)/10">
																					{app.userId}
																				</span>
																			</span>
																		</div>
																		<div className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 uppercase tracking-widest shadow-sm">
																			Pending
																		</div>
																	</div>
																);
															})}
														</div>
													</div>
												)}
												<div className="flex flex-col gap-2 pt-2 border-t border-(--border)/10">
													<label className="text-sm font-bold text-(--text)">Invite Member</label>
													<div className="flex items-center gap-2">
														<Input
															value={inviteUserId}
															onChange={(e) => setInviteUserId(e.target.value)}
															placeholder="Discord User ID (e.g. 1234567890)"
															className="flex-1 bg-(--background)/50 border-(--border)/10"
														/>
														<Button variant="primary" onClick={handlePreviewUser} loading={fetchingUser} disabled={!inviteUserId.trim()}>
															Invite
														</Button>
													</div>
													<span className="text-xs text-(--text-muted) mt-1">They will receive an invitation to join this organization.</span>
												</div>
											</div>
										</div>
									)}

									{activeTab === 'bots' && (
										<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
											<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
												<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
													<Bot className="w-4 h-4" />
												</div>
												Organization Bots
											</div>
											<div className="flex flex-col items-center justify-center w-full">
												{bots.filter((b) => b.organization === selectedOrg._id).length > 0 ? (
													<div className="flex flex-col w-full bg-(--foreground)/30 border border-(--border)/10 rounded-3xl overflow-hidden shadow-sm">
														{bots
															.filter((b) => b.organization === selectedOrg._id)
															.map((bot) => (
																<BotRow key={bot.id} bot={bot} hrefPrefix="/portal/bots" />
															))}
													</div>
												) : (
													<div className="flex flex-col items-center justify-center p-8 bg-(--background)/50 rounded-2xl border border-(--border)/10 border-dashed w-full">
														<Bot className="w-8 h-8 text-(--text-muted) opacity-50 mb-3" />
														<p className="text-sm text-(--text-muted) mb-4">No bots registered to this organization.</p>
													</div>
												)}
											</div>
										</div>
									)}

									{activeTab === 'servers' && (
										<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
											<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
												<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
													<Server className="w-4 h-4" />
												</div>
												Organization Server
											</div>
											<div className="flex flex-col gap-6">
												<p className="text-sm text-(--text-muted)">Select a Discord server to link with this organization.</p>
												<div className="flex flex-col gap-2">
													{guilds.length > 0 ? (
														<Selector
															value={orgConfig?.guild || ''}
															onChange={(val) => setOrgConfig({ ...orgConfig, guild: val })}
															options={[
																{ label: 'None', value: '' },
																...guilds.map((guild) => ({
																	value: guild.id,
																	label: (
																		<div className="flex items-center gap-3">
																			{guild.icon ? (
																				<img
																					src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
																					alt={guild.name}
																					className="w-5 h-5 rounded-full object-cover shadow-sm border border-(--border)/10"
																				/>
																			) : (
																				<div className="w-5 h-5 rounded-full bg-(--foreground)/50 flex items-center justify-center text-(--text-muted) font-bold text-[10px] shadow-sm border border-(--border)/10">
																					{guild.name.charAt(0)}
																				</div>
																			)}
																			<span className="font-medium">{guild.name}</span>
																		</div>
																	),
																})),
															]}
														/>
													) : (
														<div className="flex flex-col items-center justify-center py-10 text-(--text-muted) bg-(--background)/50 rounded-2xl border border-(--border)/10 border-dashed">
															<Server className="w-8 h-8 mb-4 opacity-30" />
															<p className="text-sm">No managed Discord servers found.</p>
														</div>
													)}
												</div>
											</div>
										</div>
									)}

									{activeTab === 'links' && (
										<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
											<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
												<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
													<Link2 className="w-4 h-4" />
												</div>
												Organization Links
											</div>
											<div className="flex flex-col gap-5">
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">Website URL</label>
													<Input
														value={orgConfig.links?.website || ''}
														onChange={(e) => setOrgConfig({ ...orgConfig, links: { ...orgConfig.links, website: e.target.value } })}
														placeholder="https://..."
													/>
												</div>
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">Discord Invite URL</label>
													<Input
														value={orgConfig.links?.invite || ''}
														onChange={(e) => setOrgConfig({ ...orgConfig, links: { ...orgConfig.links, invite: e.target.value } })}
														placeholder="https://discord.gg/..."
													/>
												</div>
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">Support Server URL</label>
													<Input
														value={orgConfig.links?.support || ''}
														onChange={(e) => setOrgConfig({ ...orgConfig, links: { ...orgConfig.links, support: e.target.value } })}
														placeholder="https://discord.gg/..."
													/>
												</div>
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">GitHub Repository</label>
													<Input
														value={orgConfig.links?.github || ''}
														onChange={(e) => setOrgConfig({ ...orgConfig, links: { ...orgConfig.links, github: e.target.value } })}
														placeholder="https://github.com/..."
													/>
												</div>
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">Privacy Policy URL</label>
													<Input
														value={orgConfig.links?.privacy || ''}
														onChange={(e) => setOrgConfig({ ...orgConfig, links: { ...orgConfig.links, privacy: e.target.value } })}
														placeholder="https://..."
													/>
												</div>
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">Terms of Service URL</label>
													<Input
														value={orgConfig.links?.terms || ''}
														onChange={(e) => setOrgConfig({ ...orgConfig, links: { ...orgConfig.links, terms: e.target.value } })}
														placeholder="https://..."
													/>
												</div>
											</div>
										</div>
									)}

									{activeTab === 'settings' && (
										<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
											<div
												className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
												style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
											>
												<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
													<div className="flex items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
														<Shield size={18} />
														<h3>Privacy Setting</h3>
													</div>
													<div className="flex items-center gap-1 text-xs text-(--text-muted)">Determines who can discover and interact with this organization.</div>
												</div>
												<div className="w-full sm:w-48 shrink-0">
													<Selector
														value={orgConfig.privacy || 'private'}
														onChange={(val) => setOrgConfig({ ...orgConfig, privacy: val })}
														options={[
															{ label: 'Public', value: 'public' },
															{ label: 'Limited', value: 'limited' },
															{ label: 'Private', value: 'private' },
														]}
													/>
												</div>
											</div>
											{/* Reset Data Card */}
											<div
												className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
												style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
											>
												<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
													<div className="flex items-center text-(--accent-orange) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
														<AlertTriangle size={18} />
														<h3>Reset Data</h3>
													</div>
													<p className="text-xs text-(--accent-orange)/80">
														Reset all organization settings and configurations back to default without deleting the organization itself.
													</p>
												</div>
												<button
													onClick={() => setOrgConfig({ ...orgConfig, description: '', info: '', locale: '', links: {} })}
													className="flex items-center justify-center rounded-xl bg-(--accent-orange) text-sm font-medium text-white transition-colors hover:bg-(--accent-orange)/80 shrink-0 shadow-sm"
													style={{
														padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
														gap: 'calc(var(--ui-gap) * 0.5)',
													}}
												>
													<Trash2 size={16} />
													<span>Reset Data</span>
												</button>
											</div>

											{/* Delete Organization Card */}
											<div
												className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-red)/20 bg-(--accent-red)/5 shadow-sm"
												style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
											>
												<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
													<div className="flex items-center text-(--accent-red) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
														<AlertTriangle size={18} />
														<h3>Delete Organization</h3>
													</div>
													<p className="text-xs text-(--accent-red)/80">Permanently delete this organization and all of its associated data from Xernerx.</p>
												</div>
												<button
													onClick={() => setIsConfirmDeleteOpen(true)}
													className="flex items-center justify-center rounded-xl bg-(--accent-red) text-sm font-medium text-white transition-colors hover:bg-(--accent-red)/80 shrink-0 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
													style={{
														padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
														gap: 'calc(var(--ui-gap) * 0.5)',
													}}
												>
													<Trash2 size={16} />
													<span>Delete Organization</span>
												</button>
											</div>
										</div>
									)}
								</div>
							) : null}
						</div>
					</>
				) : null}
			</div>

			<Modal open={createModalOpen} onOpenChange={setCreateModalOpen} title="Create Organization" description="Set up a new organization to group your bots, members, and settings.">
				<div className="flex flex-col gap-4 py-4">
					<div className="flex flex-col gap-2">
						<label className="text-sm font-bold text-(--text)">Organization Name</label>
						<Input value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} placeholder="e.g. Acme Corp" autoFocus />
					</div>
					<div className="flex flex-col gap-2">
						<label className="text-sm font-bold text-(--text)">Description (Optional)</label>
						<Input value={newOrgDescription} onChange={(e) => setNewOrgDescription(e.target.value)} placeholder="What is this organization for?" />
					</div>
				</div>
				<div className="flex justify-end gap-2">
					<Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
						Cancel
					</Button>
					<Button variant="primary" onClick={handleCreateOrg} loading={creatingOrg} disabled={!newOrgName.trim() || creatingOrg}>
						Create Organization
					</Button>
				</div>
			</Modal>

			<Modal open={inviteModalOpen} onOpenChange={setInviteModalOpen} title="Confirm Invite" description="Is this the person you want to invite?">
				{inviteUserObj && (
					<div className="flex flex-col items-center justify-center gap-4 bg-(--background)/50 p-6 rounded-3xl border border-(--border)/10">
						<div className="flex flex-col gap-2 p-4 bg-(--background)/50 rounded-2xl border border-(--border)/10">
							<div className="flex items-center gap-4">
								{inviteUserObj.avatarUrl ? (
									<img src={inviteUserObj.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full shadow-sm" />
								) : (
									<div className="w-12 h-12 bg-(--border)/10 rounded-full flex items-center justify-center">
										<User className="text-(--text-muted) w-6 h-6" />
									</div>
								)}
								<div className="flex flex-col">
									<span className="font-bold text-(--text) text-lg">{inviteUserObj.global_name || inviteUserObj.username}</span>
									<span className="text-sm text-(--text-muted)">@{inviteUserObj.username}</span>
								</div>
							</div>

							{inviteUserObj.fullRoles && inviteUserObj.fullRoles.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-(--border)/5">
									{inviteUserObj.fullRoles.map((role: any) => (
										<span
											key={role._id || role.id}
											className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-(--accent)/10 text-(--accent) uppercase border border-(--accent)/20"
										>
											{role.name}
										</span>
									))}
								</div>
							)}
						</div>
					</div>
				)}
				<div className="flex justify-end gap-2 mt-4 pt-4 border-t border-(--border)/10">
					<Button variant="ghost" onClick={() => setInviteModalOpen(false)} disabled={invitingMember}>
						Cancel
					</Button>
					<Button variant="primary" onClick={confirmInviteMember} loading={invitingMember}>
						Confirm Invite
					</Button>
				</div>
			</Modal>

			<Confirm
				open={isConfirmDeleteOpen}
				onOpenChange={setIsConfirmDeleteOpen}
				title="Delete Organization"
				description="Are you absolutely sure you want to delete this organization and all its data? This action cannot be undone."
				confirmText="Delete Organization"
				onConfirm={handleDeleteOrg}
				loading={deleting}
			/>
		</>
	);
}
