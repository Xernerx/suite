/** @format */
'use client';

import { useState } from 'react';
import { Users, User, Trash2, Copy, Check } from 'lucide-react';
import { Button, Confirm, Input, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import Link from 'next/link';
import InviteMemberModal from '@/components/portal/InviteMemberModal';

interface OrgMembersTabProps {
	session: any;
	selectedOrg: any;
	orgConfig: any;
	setOrgConfig: (config: any) => void;
	setOriginalOrgConfig: (config: any) => void;
	memberProfiles: Record<string, any>;
	pendingInvites: any[];
	orgMembers: any[];
	setOrgMembers: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function OrgMembersTab({ session, selectedOrg, orgConfig, setOrgConfig, setOriginalOrgConfig, memberProfiles, pendingInvites, orgMembers, setOrgMembers }: OrgMembersTabProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [inviteUserId, setInviteUserId] = useState('');
	const [fetchingUser, setFetchingUser] = useState(false);
	const [inviteUserObj, setInviteUserObj] = useState<any>(null);
	const [inviteModalOpen, setInviteModalOpen] = useState(false);
	const [invitingMember, setInvitingMember] = useState(false);
	const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const handleCopyMemberId = (id: string) => {
		navigator.clipboard.writeText(id);
		setCopiedId(id);
		toast({ title: t('app.users.idCopied'), type: 'success' });
		setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
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
				toast({ title: t('app.portal.members.toast.invalidUser'), type: 'error' });
			}
		} catch (error) {
			toast({ title: t('app.portal.members.toast.invalidUser'), type: 'error' });
		} finally {
			setFetchingUser(false);
		}
	};

	const confirmInviteMember = async () => {
		if (!selectedOrg || selectedOrg === 'personal' || !inviteUserObj) return;
		setInvitingMember(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/dispatch`), {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					targetId: inviteUserObj.id,
					senderId: selectedOrg._id,
					category: 'invite',
					type: 'organization_invite',
					status: 'pending',
					data: {
						organizationId: selectedOrg._id,
						organizationName: selectedOrg.name,
					},
				}),
			});
			if (res.ok) {
				setInviteUserId('');
				setInviteModalOpen(false);
				toast({ title: t('app.portal.members.toast.inviteSent'), type: 'success' });
			} else {
				const data = await res.json();
				toast({ title: data.error || t('app.portal.members.toast.inviteFailed'), type: 'error' });
			}
		} catch (error) {
			toast({ title: t('app.portal.members.toast.inviteError'), type: 'error' });
		} finally {
			setInvitingMember(false);
		}
	};

	const handleUpdateMemberRoles = async (userId: string, roles: string[]) => {
		if (!selectedOrg || selectedOrg === 'personal') return;
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${selectedOrg._id}/members`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, roles }),
			});
			if (res.ok) {
				const updatedMember = await res.json();
				setOrgMembers((prev) => {
					const existing = prev.find((m) => m.userId === userId);
					if (existing) {
						return prev.map((m) => (m.userId === userId ? updatedMember : m));
					}
					return [...prev, updatedMember];
				});
				toast({ title: t('app.portal.members.toast.rolesUpdated'), type: 'success' });
			} else {
				toast({ title: t('app.portal.members.toast.rolesUpdateFailed'), type: 'error' });
			}
		} catch (error) {
			toast({ title: t('app.portal.members.toast.rolesUpdateError'), type: 'error' });
		}
	};

	const handleRemoveMember = async () => {
		if (!memberToRemove || !selectedOrg || selectedOrg === 'personal') return;
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${selectedOrg._id}`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'remove_member', targetId: memberToRemove }),
			});
			if (res.ok) {
				const updatedOrg = await res.json();
				setOrgConfig(updatedOrg);
				setOriginalOrgConfig(updatedOrg);
				toast({ title: t('app.portal.members.toast.memberRemoved'), type: 'success' });
			} else {
				toast({ title: t('app.portal.members.toast.memberRemoveFailed'), type: 'error' });
			}
		} catch (error) {
			toast({ title: t('app.portal.members.toast.memberRemoveError'), type: 'error' });
		} finally {
			setMemberToRemove(null);
		}
	};

	const renderMemberActions = (userId: string) => {
		if (!selectedOrg || selectedOrg === 'personal') return null;

		const isOwner = (session?.user as any)?.id === selectedOrg.owner;
		if (!isOwner) return null;

		const memberObj = orgMembers.find((m) => m.userId === userId);
		const userRole = memberObj?.roles?.[0] || '';

		const roleOptions = [{ value: '', label: t('app.portal.members.noRole') }, ...(orgConfig?.roles || []).map((r: any) => ({ value: r.id, label: r.name }))];

		return (
			<div className="flex flex-wrap items-center justify-end gap-2 shrink-0 ml-4">
				<div className="w-40">
					<Selector
						value={userRole}
						onChange={(val) => {
							handleUpdateMemberRoles(userId, val ? [val] : []);
						}}
						options={roleOptions}
					/>
				</div>
				{userId !== selectedOrg.owner && (
					<Button variant="danger" size="icon" onClick={() => setMemberToRemove(userId)}>
						<Trash2 size={16} />
					</Button>
				)}
			</div>
		);
	};

	return (
		<>
			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
				<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
					<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
						<Users className="w-4 h-4" />
					</div>
					{t('app.portal.members.header')}
				</div>
				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-2">
						<label className="text-sm font-bold text-(--text)">{t('app.portal.members.currentMembers')}</label>
						<div className="flex flex-col gap-2 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
							<div className="flex items-center justify-between text-sm">
								<div className="flex items-center gap-2 flex-wrap">
									<Link href={`/users/${selectedOrg.owner}`} className="flex items-center gap-2 hover:text-(--accent) transition-colors">
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
										<span className="font-medium">
											{memberProfiles[selectedOrg.owner]?.global_name || memberProfiles[selectedOrg.owner]?.username || t('app.portal.members.unknownUser')}
										</span>
									</Link>
									<button
										type="button"
										onClick={() => handleCopyMemberId(selectedOrg.owner)}
										className="inline-flex items-center gap-1 text-(--text-muted) hover:text-(--text) text-[10px] font-mono bg-(--background)/50 hover:bg-(--background) px-1.5 py-0.5 rounded border border-(--border)/10 transition-colors cursor-pointer"
									>
										<span>{selectedOrg.owner}</span>
										{copiedId === selectedOrg.owner ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
									</button>
									<span className="text-(--accent) text-[10px] font-bold uppercase tracking-widest bg-(--accent)/10 px-2 py-0.5 rounded-full border border-(--accent)/20">
										{t('app.portal.members.owner')}
									</span>
								</div>
								{renderMemberActions(selectedOrg.owner)}
							</div>
							{orgConfig?.members?.length > 0 ? (
								orgConfig.members.map((memberId: string) => (
									<div key={memberId} className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-(--border)/5">
										<div className="flex items-center gap-2 flex-wrap">
											<Link href={`/users/${memberId}`} className="flex items-center gap-2 hover:text-(--accent) transition-colors">
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
												<span className="font-medium">
													{memberProfiles[memberId]?.global_name || memberProfiles[memberId]?.username || t('app.portal.members.unknownUser')}
												</span>
											</Link>
											<button
												type="button"
												onClick={() => handleCopyMemberId(memberId)}
												className="inline-flex items-center gap-1 text-(--text-muted) hover:text-(--text) text-[10px] font-mono bg-(--background)/50 hover:bg-(--background) px-1.5 py-0.5 rounded border border-(--border)/10 transition-colors cursor-pointer"
											>
												<span>{memberId}</span>
												{copiedId === memberId ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
											</button>
										</div>
										{renderMemberActions(memberId)}
									</div>
								))
							) : (
								<span className="text-xs text-(--text-muted) mt-2 pt-2 border-t border-(--border)/5">{t('app.portal.members.noMembers')}</span>
							)}
						</div>
					</div>
					{pendingInvites.length > 0 && (
						<div className="flex flex-col gap-2 pt-2 border-t border-(--border)/10">
							<label className="text-sm font-bold text-(--text)">{t('app.portal.members.pendingInvitations')}</label>
							<div className="flex flex-col gap-2 p-4 bg-(--background)/50 rounded-2xl border border-(--border)/10">
								{pendingInvites.map((app) => {
									const profile = memberProfiles[app.userId];
									return (
										<div key={app.id} className="flex items-center justify-between text-sm mt-2 first:mt-0 pt-2 first:pt-0 border-t first:border-t-0 border-(--border)/5">
											<div className="flex items-center gap-2 flex-wrap">
												<Link href={`/users/${app.userId}`} className="flex items-center gap-2 hover:text-(--accent) transition-colors">
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
													<span className="font-medium">{profile?.global_name || profile?.username || t('app.portal.members.unknownUser')}</span>
												</Link>
												<button
													type="button"
													onClick={() => handleCopyMemberId(app.userId)}
													className="inline-flex items-center gap-1 text-(--text-muted) hover:text-(--text) text-[10px] font-mono bg-(--background)/50 hover:bg-(--background) px-1.5 py-0.5 rounded border border-(--border)/10 transition-colors cursor-pointer"
												>
													<span>{app.userId}</span>
													{copiedId === app.userId ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
												</button>
											</div>
											<div className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 uppercase tracking-widest shadow-sm">
												{t('app.portal.members.pending')}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}
					<div className="flex flex-col gap-2 pt-2 border-t border-(--border)/10">
						<label className="text-sm font-bold text-(--text)">{t('app.portal.members.inviteMember')}</label>
						<div className="flex items-center gap-2">
							<Input
								value={inviteUserId}
								onChange={(e) => setInviteUserId(e.target.value)}
								placeholder={t('app.portal.members.invitePlaceholder')}
								className="flex-1 bg-(--background)/50 border-(--border)/10"
							/>
							<Button variant="primary" onClick={handlePreviewUser} loading={fetchingUser} disabled={!inviteUserId.trim()}>
								{t('app.portal.members.inviteButton')}
							</Button>
						</div>
						<span className="text-xs text-(--text-muted) mt-1">{t('app.portal.members.inviteHelp')}</span>
					</div>
				</div>
			</div>

			<InviteMemberModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} inviteUserObj={inviteUserObj} confirmInviteMember={confirmInviteMember} invitingMember={invitingMember} />

			<Confirm
				open={Boolean(memberToRemove)}
				onOpenChange={(open) => !open && setMemberToRemove(null)}
				title={t('app.portal.members.removeModal.title')}
				description={t('app.portal.members.removeModal.description')}
				confirmKeyword={memberToRemove ? memberProfiles[memberToRemove]?.global_name || memberProfiles[memberToRemove]?.username || memberToRemove : undefined}
				confirmText={t('app.portal.members.removeModal.confirm')}
				cancelText={t('app.portal.members.removeModal.cancel')}
				variant="danger"
				onConfirm={handleRemoveMember}
			/>
		</>
	);
}
