/** @format */
'use client';

import { AlertTriangle, ArrowUpDown, Check, ChevronDown, Copy, Eye, EyeOff, Key, Loader2, Plus, Save, Search, Settings2, Trash2, User as UserIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Confirm, Selector, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useToast } from '@xernerx/providers';
import { useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import { Loading } from '@xernerx/feedback';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Role {
	id: string; // Random UUID
	name?: string;
	role?: string; // Discord Role ID
	sync?: boolean; // Whether to sync name from Discord
	permissions?: any;
}

interface DiscordProfile {
	username: string;
	globalName?: string;
	discriminator?: string;
	banner?: string;
	avatar?: string;
	avatarUrl?: string;
}

interface FullUser {
	id: string;
	roles?: string[];
	name: string;
	icon: string;
	email?: string;
	description?: string;
	info?: string;
	birthday?: string;
	gender?: string;
	pronouns?: string;
	timezone?: string;
	privacy?: string;
	verified?: boolean;
	locale?: string;
	staffSubscription?: boolean;
	stripeCustomerId?: string;
}

interface UserSummary {
	id: string;
	roles?: string[];
	name: string;
	icon: string;
	discord?: DiscordProfile | null;
	stripeCustomerId?: string;
}

// -----------------------------------------------------------------------------
// Helper to normalize roles from user objects strictly using `roles` array
// -----------------------------------------------------------------------------

function getNormalizedRoles(obj: { roles?: string[] } | null | undefined): string[] {
	if (!obj || !Array.isArray(obj.roles)) return [];
	return obj.roles;
}

// -----------------------------------------------------------------------------
// Custom Multi-Role Selector Component
// -----------------------------------------------------------------------------

function RoleMultiSelector({ values, onChange, roles, placeholder }: { values: string[]; onChange: (vals: string[]) => void; roles: Role[]; placeholder?: string }) {
	const { t } = useDictionary();
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const ref = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Close on click outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				setIsOpen(false);
				setQuery('');
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Focus input when opened
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 50);
		} else {
			setQuery('');
		}
	}, [isOpen]);

	// Filter, exclude already selected, and limit to 30
	const filteredRoles = useMemo(() => {
		const q = query.toLowerCase();
		return roles.filter((r) => !values.includes(r.id) && (r.name?.toLowerCase().includes(q) || r.role?.toLowerCase().includes(q))).slice(0, 30);
	}, [roles, query, values]);

	const handleRemove = (idToRemove: string) => {
		onChange(values.filter((id) => id !== idToRemove));
	};

	const handleSelect = (idToAdd: string) => {
		if (!values.includes(idToAdd)) {
			onChange([...values, idToAdd]);
		}
		setIsOpen(false);
		setQuery('');
	};

	return (
		<div className="flex flex-col gap-2 w-full" ref={ref}>
			{/* Selected Pills */}
			{values.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{values.map((id) => {
						const r = roles.find((role) => role.id === id);
						return (
							<div key={id} className="flex items-center gap-1.5 rounded-xl border border-(--border)/10 bg-(--background) pl-2.5 pr-1.5 py-1 text-xs text-(--text) shadow-sm">
								<span className="font-medium truncate max-w-[150px]">{r ? r.name || t('admin.roles.unnamedRole') : id}</span>
								<button
									type="button"
									onClick={() => handleRemove(id)}
									className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-red-500/10 text-(--text-muted) hover:text-red-500 transition-colors"
								>
									<X size={10} />
								</button>
							</div>
						);
					})}
				</div>
			)}

			<div className="relative w-full">
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="flex w-full items-center justify-between rounded-2xl border border-(--border)/10 bg-(--foreground) text-sm text-(--text) shadow-sm transition-all hover:border-(--border)/40 focus:border-(--accent) focus:outline-none"
					style={{ padding: 'calc(var(--ui-gap) * 0.75)', gap: 'var(--ui-gap)' }}
				>
					<span className="text-(--text-muted) font-medium">{placeholder || t('admin.users.addRolePlaceholder')}</span>
					<ChevronDown className={`h-4 w-4 text-(--text-muted) transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
				</button>

				<AnimatePresence>
					{isOpen && (
						<motion.div
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -4 }}
							transition={{ duration: 0.15, ease: 'easeOut' }}
							className="absolute left-0 top-[calc(100%+8px)] z-999 w-full overflow-hidden rounded-2xl border border-(--border)/10 bg-(--foreground) shadow-2xl"
							style={{ padding: 'calc(var(--ui-gap) * 0.25)', display: 'flex', flexDirection: 'column', gap: 'calc(var(--ui-gap) * 0.25)' }}
						>
							{/* Search Filter Input */}
							<div className="relative w-full" style={{ padding: 'calc(var(--ui-gap) * 0.25)' }}>
								<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
								<input
									ref={inputRef}
									type="text"
									placeholder={t('admin.users.searchRolesPlaceholder')}
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="w-full rounded-xl border border-(--border)/10 bg-(--background) text-xs text-(--text) focus:outline-none focus:ring-1 focus:ring-(--accent)"
									style={{ padding: 'calc(var(--ui-gap) * 0.4) calc(var(--ui-gap) * 0.5) calc(var(--ui-gap) * 0.4) calc(var(--ui-gap) * 2)' }}
									onClick={(e) => e.stopPropagation()}
								/>
							</div>

							{/* Options List */}
							<div className="overflow-y-auto max-h-52 flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
								{filteredRoles.length === 0 ? (
									<div className="py-4 text-center text-xs text-(--text-muted)">{t('admin.users.noMatchingRoles')}</div>
								) : (
									filteredRoles.map((r) => (
										<button
											type="button"
											key={r.id}
											onClick={() => handleSelect(r.id)}
											className="flex w-full items-center justify-between rounded-xl text-sm transition-colors text-(--text) hover:bg-(--border)/5 text-left"
											style={{ padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)' }}
										>
											<span className="font-medium truncate">{r.name || t('admin.roles.unnamedRole')}</span>
										</button>
									))
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}

// -----------------------------------------------------------------------------
// UserCard Component
// -----------------------------------------------------------------------------

function UserCard({
	user,
	roles,
	getEnvUrl,
	onUserDeleted,
	onUserUpdated,
}: {
	user: UserSummary;
	roles: Role[];
	getEnvUrl: (url: string) => string;
	onUserDeleted: (id: string) => void;
	onUserUpdated: (updated: FullUser) => void;
}) {
	const { toast } = useToast();
	const { t } = useDictionary();
	const [isExpanded, setIsExpanded] = useState(false);
	const [discord, setDiscord] = useState<DiscordProfile | null>(user.discord || null);
	const [fullUser, setFullUser] = useState<FullUser | null>(null);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

	// Editable form states
	const [name, setName] = useState(user.name || '');
	const initialRoles = getNormalizedRoles(user);
	const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(initialRoles);
	const [stripeCustomerId, setStripeCustomerId] = useState(user.stripeCustomerId || '');
	const [description, setDescription] = useState('');
	const [privacy, setPrivacy] = useState('private');
	const [staffSubscription, setStaffSubscription] = useState(false);
	const [subLoading, setSubLoading] = useState(false);

	// Fetch Discord profile if missing
	useEffect(() => {
		if (!user.id || user.discord) return;
		fetch(getEnvUrl(`https://api.xernerx.com/core/users/${user.id}/discord`))
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data) setDiscord(data);
			})
			.catch(() => {});
	}, [user.id, user.discord, getEnvUrl]);

	const handleToggleExpand = async () => {
		const nextState = !isExpanded;
		setIsExpanded(nextState);

		if (nextState && !fullUser) {
			setLoadingDetails(true);
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
					credentials: 'include',
				});
				if (res.ok) {
					const data: FullUser = await res.json();
					setFullUser(data);
					setName(data.name || '');
					setSelectedRoleIds(getNormalizedRoles(data));
					setStripeCustomerId(data.stripeCustomerId || '');
					setDescription(data.description || '');
					setPrivacy(data.privacy || 'private');
					setStaffSubscription(!!data.staffSubscription);
				}
			} catch (err) {
				console.error('Failed to fetch user details:', err);
			} finally {
				setLoadingDetails(false);
			}
		}
	};

	const handleStaffSubscriptionToggle = async (checked: boolean) => {
		setSubLoading(true);
		try {
			const endpoint = checked ? `secure/store/${user.id}/product` : `secure/store/${user.id}/cancel`;
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/${endpoint}`), {
				method: 'POST',
				credentials: 'include',
			});

			if (res.ok) {
				setStaffSubscription(checked);
				toast({
					title: checked ? t('admin.users.toast.staffApplied') : t('admin.users.toast.staffCanceled'),
					type: 'success',
				});
			} else {
				throw new Error('Failed to update subscription status');
			}
		} catch (err) {
			console.error(err);
			toast({
				title: t('admin.users.toast.staffError'),
				type: 'error',
			});
		} finally {
			setSubLoading(false);
		}
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			// 1. Update general user profile info including roles array and stripeCustomerId
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					name,
					roles: selectedRoleIds,
					stripeCustomerId: stripeCustomerId.trim() || null,
					description,
					privacy,
					staffSubscription,
				}),
			});

			if (!res.ok) {
				const errJson = await res.json().catch(() => ({}));
				throw new Error(errJson.error || 'Failed to update user profile');
			}

			const updated = await res.json();

			// 2. Direct Discord Role Sync: Loop through all available system roles.
			// If the role ID is in selectedRoleIds -> POST (Add).
			// If the role ID is NOT in selectedRoleIds -> DELETE (Remove).
			for (const r of roles) {
				const discordRoleId = r.role || r.id;
				if (!discordRoleId) continue;

				const isAssigned = selectedRoleIds.includes(r.id);

				if (isAssigned) {
					await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}/discord/roles`), {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ roleId: discordRoleId }),
					}).catch((err) => console.error('Failed to assign Discord role:', err));
				} else {
					await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}/discord/roles`), {
						method: 'DELETE',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ roleId: discordRoleId }),
					}).catch((err) => console.error('Failed to remove Discord role:', err));
				}
			}

			setFullUser(updated);
			onUserUpdated(updated);
			toast({ title: t('admin.users.toast.updateSuccess'), type: 'success' });
		} catch (err: any) {
			console.error(err);
			toast({ title: err.message || t('admin.users.toast.updateError'), type: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				onUserDeleted(user.id);
				toast({ title: t('admin.users.toast.deleteSuccess'), type: 'success' });
			}
		} catch (err) {
			console.error(err);
			toast({ title: t('admin.users.toast.deleteError'), type: 'error' });
		} finally {
			setDeleting(false);
			setConfirmDeleteOpen(false);
		}
	};

	const avatarUrl =
		discord?.avatarUrl || (discord?.avatar && user.id ? `https://cdn.discordapp.com/avatars/${user.id}/${discord.avatar}.${discord.avatar.startsWith('a_') ? 'gif' : 'png'}` : null) || user.icon;

	const displayName = discord?.globalName || discord?.username || user.name || t('auth.account.fallbackName');

	// Fallback to fullUser if summary doesn't contain roles yet
	const activeRolesList = getNormalizedRoles(fullUser || user);
	const activeRoles = roles.filter((r) => activeRolesList.includes(r.id));

	return (
		<>
			<motion.div
				layout
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95 }}
				className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm overflow-visible transition-all duration-200"
			>
				{/* Main Header / Summary Card */}
				<div
					onClick={handleToggleExpand}
					className="flex items-center justify-between cursor-pointer hover:bg-(--border)/5 transition-colors"
					style={{ padding: 'calc(var(--ui-gap) * 0.75)' }}
				>
					<div className="flex items-center" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
						{avatarUrl ? (
							<Image
								src={avatarUrl}
								alt={displayName}
								width={56}
								height={56}
								className="h-14 w-14 rounded-full border border-(--border)/10 object-cover shrink-0"
								unoptimized
								draggable={false}
							/>
						) : (
							<div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--border)/15 shrink-0 text-(--text)">
								<UserIcon size={24} className="text-(--text-muted)" />
							</div>
						)}
						<div className="flex flex-col overflow-hidden">
							<h2 className="font-bold text-base text-(--text) truncate">{displayName}</h2>
							<div className="flex flex-wrap items-center gap-1.5 mt-0.5">
								{activeRoles.length > 0 ? (
									activeRoles.map((r) => (
										<span key={r.id} className="text-xs px-2 py-0.5 rounded-full bg-(--accent)/10 text-(--accent) font-medium truncate">
											{r.name}
										</span>
									))
								) : (
									<span className="text-xs px-2 py-0.5 rounded-full bg-(--border)/10 text-(--text-muted) font-medium truncate">{t('admin.users.noRoles')}</span>
								)}
								{discord?.username && <span className="text-xs text-(--text-muted) truncate">@{discord.username}</span>}
							</div>
							<span className="text-[10px] text-(--text-muted)/60 font-mono mt-1">ID: {user.id}</span>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
							<ChevronDown size={18} className="text-(--text-muted)" />
						</motion.div>
					</div>
				</div>

				{/* Expanded Content: Profile Management Form */}
				<AnimatePresence>
					{isExpanded && (
						<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}>
							<div className="border-t border-(--border)/10 bg-(--background)/50 flex flex-col overflow-visible" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
								{loadingDetails ? (
									<div className="flex justify-center py-6">
										<Loading />
									</div>
								) : (
									<form onSubmit={handleUpdate} className="flex flex-col overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
										<h3 className="text-sm font-bold text-(--text)">{t('admin.users.manageUser')}</h3>

										<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
											<label className="block text-xs font-medium text-(--text)">{t('admin.users.displayNameLabel')}</label>
											<input
												type="text"
												value={name}
												onChange={(e) => setName(e.target.value)}
												className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
												style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
											/>
										</div>

										<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
											<label className="block text-xs font-medium text-(--text)">{t('admin.users.rolesLabel')}</label>
											<RoleMultiSelector values={selectedRoleIds} onChange={setSelectedRoleIds} roles={roles} placeholder={t('admin.users.addRolePlaceholder')} />
										</div>

										<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
											<label className="block text-xs font-medium text-(--text)">{t('admin.users.stripeCustomerIdLabel')}</label>
											<input
												type="text"
												value={stripeCustomerId}
												onChange={(e) => setStripeCustomerId(e.target.value)}
												placeholder={t('admin.users.stripeCustomerPlaceholder')}
												className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
												style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
											/>
										</div>

										<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
											<label className="block text-xs font-medium text-(--text)">{t('admin.users.descriptionLabel')}</label>
											<input
												type="text"
												value={description}
												onChange={(e) => setDescription(e.target.value)}
												className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
												style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
											/>
										</div>

										<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
											<label className="block text-xs font-medium text-(--text)">{t('admin.users.privacyLevelLabel')}</label>
											<Selector
												value={privacy}
												onChange={(val: string) => setPrivacy(val)}
												options={[
													{ label: t('auth.profile.privacy.public'), value: 'public' },
													{ label: t('auth.profile.privacy.limited'), value: 'limited' },
													{ label: t('auth.profile.privacy.private'), value: 'private' },
												]}
											/>
										</div>

										{/* Staff Subscription Toggle */}
										<div
											className={`flex items-center justify-between rounded-xl border border-(--accent)/20 bg-(--accent)/5 px-4 py-3 ${subLoading ? 'opacity-50 pointer-events-none' : ''}`}
										>
											<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
												<span className="text-sm font-semibold text-(--accent)">{t('admin.users.staffSubTitle')}</span>
												<span className="text-xs text-(--text-muted) max-w-[200px]">{t('admin.users.staffSubDesc')}</span>
											</div>
											<div className="flex items-center gap-2">
												{subLoading && <Loader2 size={14} className="animate-spin text-(--accent)" />}
												<Toggle checked={staffSubscription} onChange={(e) => handleStaffSubscriptionToggle(e.target.checked)} />
											</div>
										</div>

										{fullUser?.email && (
											<p className="text-xs text-(--text-muted)">
												<span className="font-semibold text-(--text)">{t('admin.users.emailLabel')}</span> {fullUser.email}
											</p>
										)}

										<div className="flex items-center justify-between pt-2">
											<button
												type="button"
												onClick={() => setConfirmDeleteOpen(true)}
												className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-colors"
											>
												<Trash2 size={14} />
												{t('admin.users.deleteButton')}
											</button>
											<Button type="submit" disabled={saving}>
												{saving ? t('admin.roles.saving') : t('admin.roles.saveChanges')}
											</Button>
										</div>
									</form>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>

			<Confirm
				open={confirmDeleteOpen}
				onOpenChange={setConfirmDeleteOpen}
				title={t('admin.users.deleteUserTitle')}
				description={t('admin.users.deleteUserConfirmDesc', { name: displayName, id: user.id })}
				confirmText={t('admin.roles.confirmDelete')}
				cancelText={t('admin.roles.cancel')}
				onConfirm={handleDelete}
				loading={deleting}
			/>
		</>
	);
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export default function Users() {
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const [users, setUsers] = useState<UserSummary[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [search, setSearch] = useState('');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const [usersRes, rolesRes] = await Promise.all([
					fetch(getEnvUrl(`https://api.xernerx.com/secure/users`), { credentials: 'include' }),
					fetch(getEnvUrl(`https://api.xernerx.com/secure/roles`), { credentials: 'include' }),
				]);

				if (!usersRes.ok) throw new Error('Failed to fetch users');
				if (!rolesRes.ok) throw new Error('Failed to fetch roles');

				setUsers(await usersRes.json());
				setRoles(await rolesRes.json());
			} catch (err: any) {
				setError(err.message || 'Failed to load data');
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [getEnvUrl]);

	const handleUserDeleted = (deletedId: string) => {
		setUsers((prev) => prev.filter((u) => u.id !== deletedId));
	};

	const handleUserUpdated = (updatedUser: FullUser) => {
		setUsers((prev) =>
			prev.map((u) => (u.id === updatedUser.id ? { ...u, name: updatedUser.name, roles: updatedUser.roles, stripeCustomerId: updatedUser.stripeCustomerId, icon: updatedUser.icon } : u))
		);
	};

	const filteredAndSortedUsers = useMemo(() => {
		return users
			.filter((user) => {
				const query = search.toLowerCase();
				const nameMatch = user.name?.toLowerCase().includes(query) ?? false;
				const idMatch = user.id?.toLowerCase().includes(query) ?? false;
				const discordMatch = user.discord?.username?.toLowerCase().includes(query) ?? false;
				return nameMatch || idMatch || discordMatch;
			})
			.sort((a, b) => {
				const nameA = (a.name || a.discord?.username || '').toLowerCase();
				const nameB = (b.name || b.discord?.username || '').toLowerCase();
				if (sortOrder === 'asc') {
					return nameA.localeCompare(nameB);
				} else {
					return nameB.localeCompare(nameA);
				}
			})
			.slice(0, 30);
	}, [users, search, sortOrder]);

	if (loading) return <Loading />;
	if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{/* Header */}
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h1 className="text-3xl font-black tracking-tight text-(--text)">{t('admin.users.title')}</h1>
				<p className="text-sm text-(--text-muted)">{t('admin.users.description')}</p>
			</div>

			{/* Controls Bar: Search & Sort */}
			<div className="flex flex-col sm:flex-row items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="relative flex-1 w-full">
					<Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted)" />
					<input
						type="text"
						placeholder={t('admin.users.searchPlaceholder')}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full rounded-2xl border border-(--border)/10 bg-(--foreground) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
						style={{ padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap) calc(var(--ui-gap) * 0.6) calc(var(--ui-gap) * 2.5)' }}
					/>
				</div>
				<button
					onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
					className="flex items-center justify-center gap-2 rounded-2xl border border-(--border)/10 bg-(--foreground) text-sm font-medium text-(--text) hover:bg-(--border)/5 transition-colors shrink-0 w-full sm:w-auto"
					style={{ padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)' }}
				>
					<ArrowUpDown size={16} />
					<span>
						{t('admin.users.sortLabel')} {sortOrder === 'asc' ? 'A - Z' : 'Z - A'}
					</span>
				</button>
			</div>

			{/* User Grid (3 Columns) */}
			{filteredAndSortedUsers.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
					<p className="text-sm text-(--text-muted)">{t('admin.users.noUsersFound')}</p>
				</div>
			) : (
				<motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
					<AnimatePresence>
						{filteredAndSortedUsers.map((user) => (
							<UserCard key={user.id} user={user} roles={roles} getEnvUrl={getEnvUrl} onUserDeleted={handleUserDeleted} onUserUpdated={handleUserUpdated} />
						))}
					</AnimatePresence>
				</motion.div>
			)}
		</div>
	);
}
