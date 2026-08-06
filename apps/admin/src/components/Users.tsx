/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpDown, ChevronDown, Plus, Search, Shield, Trash2, User as UserIcon } from 'lucide-react';
import { Button, Confirm, Modal, Selector, Toggle } from '@xernerx/ui';
import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import { Loading } from '@xernerx/feedback';
import { useEnvironment } from '@xernerx/providers';

interface Role {
	id: string; // Random UUID
	name?: string;
	role?: string; // Discord Role ID
	sync?: boolean; // Whether to sync name from Discord
	permissions?: any;
}

interface DiscordRole {
	id: string;
	name: string;
	color: number;
	position: number;
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
	role: string;
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
}

interface UserSummary {
	id: string;
	role: string;
	name: string;
	icon: string;
	discord?: DiscordProfile | null;
}

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
	const [isExpanded, setIsExpanded] = useState(false);
	const [discord, setDiscord] = useState<DiscordProfile | null>(user.discord || null);
	const [fullUser, setFullUser] = useState<FullUser | null>(null);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

	// Editable form states
	const [name, setName] = useState(user.name || '');
	const [roleId, setRoleId] = useState(user.role || '');
	const [description, setDescription] = useState('');
	const [privacy, setPrivacy] = useState('private');

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
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`));
				if (res.ok) {
					const data: FullUser = await res.json();
					setFullUser(data);
					setName(data.name || '');
					setRoleId(data.role || '');
					setDescription(data.description || '');
					setPrivacy(data.privacy || 'private');
				}
			} catch (err) {
				console.error('Failed to fetch user details:', err);
			} finally {
				setLoadingDetails(false);
			}
		}
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, role: roleId, description, privacy }),
			});
			if (res.ok) {
				const updated = await res.json();
				onUserUpdated(updated);
			}
		} catch (err) {
			console.error(err);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
				method: 'DELETE',
			});
			if (res.ok) {
				onUserDeleted(user.id);
			}
		} catch (err) {
			console.error(err);
		} finally {
			setDeleting(false);
			setConfirmDeleteOpen(false);
		}
	};

	const avatarUrl =
		discord?.avatarUrl || (discord?.avatar && user.id ? `https://cdn.discordapp.com/avatars/${user.id}/${discord.avatar}.${discord.avatar.startsWith('a_') ? 'gif' : 'png'}` : null) || user.icon;

	const displayName = discord?.globalName || discord?.username || user.name || 'Unnamed User';

	const assignedRole = roles.find((r) => r.id === user.role);

	const roleOptions = [
		{ value: '', label: 'None' },
		...roles.map((r) => ({
			value: r.id,
			label: r.name || 'Unnamed Role',
		})),
	];

	return (
		<>
			<motion.div
				layout
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95 }}
				className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm overflow-hidden transition-all duration-200"
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
							<div className="flex items-center gap-2 mt-0.5">
								<span className="text-xs px-2 py-0.5 rounded-full bg-(--accent)/10 text-(--accent) font-medium truncate">{assignedRole?.name || user.role || 'No Role'}</span>
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
							<div className="border-t border-(--border)/10 bg-(--background)/50 flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
								{loadingDetails ? (
									<div className="flex justify-center py-6">
										<Loading />
									</div>
								) : (
									<form onSubmit={handleUpdate} className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
										<h3 className="text-sm font-bold text-(--text)">Manage Xernerx User</h3>

										<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
											<label className="block text-xs font-medium text-(--text)">Display Name</label>
											<input
												type="text"
												value={name}
												onChange={(e) => setName(e.target.value)}
												className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
												style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
											/>
										</div>

										<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
											<label className="block text-xs font-medium text-(--text)">Role</label>
											<Selector value={roleId} onChange={(val: string) => setRoleId(val)} options={roleOptions} placeholder="Select role..." />
										</div>

										<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
											<label className="block text-xs font-medium text-(--text)">Description</label>
											<input
												type="text"
												value={description}
												onChange={(e) => setDescription(e.target.value)}
												className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
												style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
											/>
										</div>

										<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
											<label className="block text-xs font-medium text-(--text)">Privacy Level</label>
											<Selector
												value={privacy}
												onChange={(val: string) => setPrivacy(val)}
												options={[
													{ label: 'Public', value: 'public' },
													{ label: 'Limited', value: 'limited' },
													{ label: 'Private', value: 'private' },
												]}
											/>
										</div>

										{fullUser?.email && (
											<p className="text-xs text-(--text-muted)">
												<span className="font-semibold text-(--text)">Email:</span> {fullUser.email}
											</p>
										)}

										<div className="flex items-center justify-between pt-2">
											<button
												type="button"
												onClick={() => setConfirmDeleteOpen(true)}
												className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-colors"
											>
												<Trash2 size={14} />
												Delete User
											</button>
											<Button type="submit" disabled={saving}>
												{saving ? 'Saving...' : 'Save Changes'}
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
				title="Delete User"
				description={`Are you sure you want to delete user ${displayName} (${user.id})? This action cannot be undone.`}
				confirmText="Delete"
				cancelText="Cancel"
				onConfirm={handleDelete}
				loading={deleting}
			/>
		</>
	);
}

export default function Users() {
	const { getEnvUrl } = useEnvironment();
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
				const [usersRes, rolesRes] = await Promise.all([fetch(getEnvUrl(`https://api.xernerx.com/secure/users`)), fetch(getEnvUrl(`https://api.xernerx.com/secure/roles`))]);

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
		setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? { ...u, name: updatedUser.name, role: updatedUser.role, icon: updatedUser.icon } : u)));
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
				<h1 className="text-3xl font-black tracking-tight text-(--text)">User Management</h1>
				<p className="text-sm text-(--text-muted)">Manage platform users, view Discord integrations, and adjust roles or permissions.</p>
			</div>

			{/* Controls Bar: Search & Sort */}
			<div className="flex flex-col sm:flex-row items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="relative flex-1 w-full">
					<Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted)" />
					<input
						type="text"
						placeholder="Search by name, ID, or Discord username..."
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
					<span>Sort: {sortOrder === 'asc' ? 'A - Z' : 'Z - A'}</span>
				</button>
			</div>

			{/* User Grid (3 Columns) */}
			{filteredAndSortedUsers.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
					<p className="text-sm text-(--text-muted)">No users found matching your search.</p>
				</div>
			) : (
				<motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
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
