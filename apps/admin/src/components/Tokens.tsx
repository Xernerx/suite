// Force recompile
/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button, Confirm, Input, Modal, Selector, Toggle } from '@xernerx/ui';
import { ChevronDown, Copy, Key, Plus, Search, Settings2, Trash2, User as UserIcon, X } from 'lucide-react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Loading } from '@xernerx/feedback';
interface Token {
	_id: string;
	id: string;
	name: string;
	owners?: string[];
	status: 'active' | 'inactive' | 'suspended' | 'pending';
	permissions?: {
		secure?: boolean;
	};
	botId?: string;
	createdAt?: string;
	updatedAt?: string;
}
function BotProfilePreview({ botId, getEnvUrl, onClear }: { botId: string; getEnvUrl: (url: string) => string; onClear: () => void }) {
	const [profile, setProfile] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const { t } = useDictionary();
	useEffect(() => {
		if (!botId || botId.length < 15) {
			setProfile(null);
			return;
		}
		let isMounted = true;
		setLoading(true);
		fetch(getEnvUrl(`https://api.xernerx.com/core/users/${botId}/discord`))
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (isMounted) {
					if (data && data.id) {
						setProfile(data);
					} else {
						setProfile(null);
					}
					setLoading(false);
				}
			})
			.catch(() => {
				if (isMounted) {
					setProfile(null);
					setLoading(false);
				}
			});
		return () => {
			isMounted = false;
		};
	}, [botId, getEnvUrl]);
	if (!botId || botId.length < 15) return null;
	if (loading) {
		return (
			<div className="flex items-center gap-1.5 rounded-xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md pl-2 pr-1.5 py-1 text-xs text-(--text) shadow-sm">
				<Loading variant="small" />
				<span className="font-medium truncate max-w-[120px]">{t('admin.tokens.card.botApplication')}</span>
				<button
					type="button"
					onClick={onClear}
					className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-red-500/10 text-(--text-muted) hover:text-red-500 transition-colors"
				>
					<X size={10} />
				</button>
			</div>
		);
	}
	if (!profile) {
		return (
			<div className="flex items-center gap-1.5 rounded-xl border border-red-500/10 bg-red-500/5 backdrop-blur-md pl-2 pr-1.5 py-1 text-xs text-red-500 shadow-sm">
				<span className="font-medium truncate max-w-[120px]">{t('admin.tokens.card.apiConnection')}</span>
				<button type="button" onClick={onClear} className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-red-500/10 text-red-500 hover:text-red-500 transition-colors">
					<X size={10} />
				</button>
			</div>
		);
	}
	const avatarUrl = profile.avatarUrl || (profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=64` : null);
	const name = profile.global_name || profile.username || t('admin.tokens.unknownBot');
	return (
		<div className="flex items-center gap-1.5 rounded-xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md pl-2 pr-1.5 py-1 text-xs text-(--text) shadow-sm">
			{avatarUrl ? (
				<img src={avatarUrl} alt={name} className="h-4 w-4 rounded-full object-cover shrink-0" />
			) : (
				<div className="flex h-4 w-4 items-center justify-center rounded-full bg-(--foreground) shrink-0">
					<span className="text-[8px] font-bold text-(--text-muted)">{name.charAt(0)}</span>
				</div>
			)}
			<span className="font-medium truncate max-w-[120px]">{name}</span>
			<button
				type="button"
				onClick={onClear}
				className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-red-500/10 text-(--text-muted) hover:text-red-500 transition-colors"
			>
				<X size={10} />
			</button>
		</div>
	);
}
interface UserOption {
	id: string;
	name?: string;
	global_name?: string;
	username?: string;
	avatar?: string;
}

/**
 * Custom Searchable Multi-User Selector component.
 * Fetches users from `secure/users`, missing Discord profiles from `core/users/[id]/discord`,
 * filters in JS, and outputs an array of selected user IDs.
 */
function AsyncUserMultiSelector({ values, onChange, getEnvUrl, placeholder }: { values: string[]; onChange: (vals: string[]) => void; getEnvUrl: (url: string) => string; placeholder?: string }) {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [users, setUsers] = useState<UserOption[]>([]);
	const [loading, setLoading] = useState(false);
	const { t } = useDictionary();
	const ref = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const fetchedIds = useRef(new Set<string>());

	// Fetch all known secure users ONCE
	useEffect(() => {
		let isMounted = true;
		const fetchUsers = async () => {
			setLoading(true);
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/users'), {
					credentials: 'include',
				});
				if (res.ok) {
					const data = await res.json();
					if (isMounted) {
						setUsers((prev) => {
							const map = new Map(prev.map((u) => [u.id, u]));
							data.forEach((u: UserOption) => {
								if (!map.has(u.id)) map.set(u.id, u);
							});
							return Array.from(map.values());
						});
					}
				}
			} catch (err) {
				console.error('Failed to fetch users:', err);
			} finally {
				if (isMounted) setLoading(false);
			}
		};
		fetchUsers();
		return () => {
			isMounted = false;
		};
	}, [getEnvUrl]);

	// Fetch full Discord profile for selected values if missing
	useEffect(() => {
		values.forEach((val) => {
			if (val && !users.find((u) => u.id === val) && !fetchedIds.current.has(val)) {
				fetchedIds.current.add(val);
				fetch(getEnvUrl(`https://api.xernerx.com/core/users/${val}/discord`), {
					credentials: 'include',
				})
					.then((res) => (res.ok ? res.json() : null))
					.then((data) => {
						if (data && data.id) {
							setUsers((prev) => {
								if (prev.some((u) => u.id === data.id)) {
									return prev.map((u) =>
										u.id === data.id
											? {
													...u,
													...data,
												}
											: u
									);
								}
								return [...prev, data];
							});
						}
					})
					.catch(() => {});
			}
		});
	}, [values, users, getEnvUrl]);

	// Fetch full Discord profile dynamically if the user types a valid Discord ID
	useEffect(() => {
		if (/^\d{17,20}$/.test(query) && !fetchedIds.current.has(query)) {
			fetchedIds.current.add(query);
			fetch(getEnvUrl(`https://api.xernerx.com/core/users/${query}/discord`), {
				credentials: 'include',
			})
				.then((res) => (res.ok ? res.json() : null))
				.then((data) => {
					if (data && data.id) {
						setUsers((prev) => {
							if (prev.some((u) => u.id === data.id)) {
								return prev.map((u) =>
									u.id === data.id
										? {
												...u,
												...data,
											}
										: u
								);
							}
							return [...prev, data];
						});
					}
				})
				.catch(() => {});
		}
	}, [query, getEnvUrl]);

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
	const filteredUsers = useMemo(() => {
		const q = query.toLowerCase();
		return users
			.filter(
				(u) =>
					!values.includes(u.id) &&
					(u.id?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q) || u.global_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q))
			)
			.slice(0, 30);
	}, [users, query, values]);
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
						const u = users.find((u) => u.id === id);
						return (
							<div
								key={id}
								className="flex items-center gap-1.5 rounded-xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md pl-2 pr-1.5 py-1 text-xs text-(--text) shadow-sm"
							>
								{u?.avatar ? (
									<img src={`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`} alt="" className="h-4 w-4 rounded-full object-cover shrink-0" />
								) : (
									<UserIcon size={12} className="text-(--text-muted) shrink-0" />
								)}
								<span className="font-medium truncate max-w-[120px]">{u ? u.global_name || u.name || u.username || u.id : id}</span>
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
					className="flex w-full items-center justify-between rounded-xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm text-(--text) shadow-sm transition-all hover:border-(--accent)/50 focus:border-(--accent) focus:outline-none"
					style={{
						padding: 'calc(var(--ui-gap) * 0.75)',
						gap: 'var(--ui-gap)',
					}}
				>
					<span className="text-(--text-muted) font-medium">{placeholder || t('admin.tokens.ownersPlaceholder')}</span>
					<ChevronDown className={`h-4 w-4 text-(--text-muted) transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
				</button>

				<AnimatePresence>
					{isOpen && (
						<motion.div
							initial={{
								opacity: 0,
								y: -4,
							}}
							animate={{
								opacity: 1,
								y: 0,
							}}
							exit={{
								opacity: 0,
								y: -4,
							}}
							transition={{
								duration: 0.15,
								ease: 'easeOut',
							}}
							className="absolute left-0 top-[calc(100%+8px)] z-999 w-full overflow-hidden rounded-xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-2xl"
							style={{
								padding: 'calc(var(--ui-gap) * 0.25)',
								display: 'flex',
								flexDirection: 'column',
								gap: 'calc(var(--ui-gap) * 0.25)',
							}}
						>
							{/* Search Filter Input */}
							<div
								className="relative w-full"
								style={{
									padding: 'calc(var(--ui-gap) * 0.25)',
								}}
							>
								<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
								<input
									ref={inputRef}
									type="text"
									placeholder={t('admin.tokens.ownersPlaceholder')}
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="w-full rounded-xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md text-xs text-(--text) focus:outline-none focus:ring-1 focus:ring-(--accent)"
									style={{
										padding: 'calc(var(--ui-gap) * 0.4) calc(var(--ui-gap) * 0.5) calc(var(--ui-gap) * 0.4) calc(var(--ui-gap) * 2)',
									}}
									onClick={(e) => e.stopPropagation()}
								/>
							</div>

							{/* Options List */}
							<div
								className="overflow-y-auto max-h-52 flex flex-col"
								style={{
									gap: 'calc(var(--ui-gap) * 0.25)',
								}}
							>
								{loading && users.length === 0 ? (
									<div className="py-6 flex justify-center">
										<Loading />
									</div>
								) : filteredUsers.length === 0 ? (
									<div className="py-4 text-center text-xs text-(--text-muted)">{t('admin.tokens.empty.title')}</div>
								) : (
									filteredUsers.map((u) => (
										<button
											type="button"
											key={u.id}
											onClick={() => handleSelect(u.id)}
											className="flex w-full items-center justify-between rounded-xl text-sm transition-colors text-(--text) hover:bg-(--border)/5"
											style={{
												padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)',
											}}
										>
											<div className="flex items-center gap-2 truncate">
												{u.avatar ? (
													<img src={`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
												) : (
													<UserIcon size={16} className="text-(--text-muted) shrink-0" />
												)}
												<span className="font-medium truncate">{u.global_name || u.name || u.username || u.id}</span>
											</div>
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
function TokenCard({
	token,
	getEnvUrl,
	onTokenDeleted,
	onTokenUpdated,
}: {
	token: Token;
	getEnvUrl: (url: string) => string;
	onTokenDeleted: (id: string) => void;
	onTokenUpdated: (updated: Token) => void;
}) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [fullToken, setFullToken] = useState<Token | null>(null);
	const [saving, setSaving] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Editable form states
	const [name, setName] = useState(token.name || '');
	const [status, setStatus] = useState<Token['status']>(token.status || 'active');
	const [botId, setBotId] = useState('');
	const [selectedOwners, setSelectedOwners] = useState<string[]>(token.owners || []);
	const [secure, setSecure] = useState(false);
	const isDirty = useMemo(() => {
		if (!fullToken) return false;
		const sortedSelectedOwners = [...selectedOwners].sort();
		const sortedOriginalOwners = [...(fullToken.owners || [])].sort();
		const ownersChanged = JSON.stringify(sortedSelectedOwners) !== JSON.stringify(sortedOriginalOwners);
		return name !== (fullToken.name || '') || status !== (fullToken.status || 'active') || botId !== (fullToken.botId || '') || ownersChanged || secure !== !!fullToken.permissions?.secure;
	}, [fullToken, name, status, botId, selectedOwners, secure]);
	const handleToggleExpand = async () => {
		setIsModalOpen(true);
		if (!fullToken && !loadingDetails) {
			setLoadingDetails(true);
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/tokens/${token.id}`), {
					credentials: 'include',
				});
				if (res.ok) {
					const data: Token = await res.json();
					setFullToken(data);
					setName(data.name || '');
					setStatus(data.status || 'active');
					setBotId(data.botId || '');
					setSelectedOwners(data.owners || []);
					setSecure(!!data.permissions?.secure);
				}
			} catch (err) {
				console.error('Failed to fetch token details:', err);
			} finally {
				setLoadingDetails(false);
			}
		}
	};
	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const submitter = (e.nativeEvent as SubmitEvent).submitter;
		if (submitter && submitter.getAttribute('type') !== 'submit') return;
		setSaving(true);
		try {
			const payload = {
				name,
				status,
				botId: botId || undefined,
				owners: selectedOwners,
				permissions: {
					secure,
				},
			};
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/tokens/${token.id}`), {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(payload),
			});
			if (res.ok) {
				const updated = await res.json();
				const manuallyUpdatedToken: Token = {
					...(fullToken as Token),
					...updated,
					name,
					status,
					botId: botId || undefined,
					owners: selectedOwners,
					permissions: {
						secure,
					},
				};
				setFullToken(manuallyUpdatedToken);
				onTokenUpdated(manuallyUpdatedToken);
				toast({
					title: t('admin.tokens.tokenUpdated'),
					type: 'success',
				});
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || 'Unknown error');
			}
		} catch (err: any) {
			toast({
				type: 'error',
				title: 'Failed to update token',
				description: err.message,
			});
		} finally {
			setSaving(false);
		}
	};
	const handleDelete = async () => {
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/tokens/${token.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				onTokenDeleted(token.id);
				setIsModalOpen(false);
				toast({
					type: 'success',
					title: t('admin.tokens.tokenDeleted'),
				});
				window.location.reload();
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || 'Unknown error');
			}
		} catch (err: any) {
			toast({
				type: 'error',
				title: 'Failed to delete token',
				description: err.message,
			});
		} finally {
			setDeleting(false);
			setConfirmDeleteOpen(false);
		}
	};
	const statusColors = {
		active: 'bg-emerald-500/10 text-emerald-500',
		inactive: 'bg-zinc-500/10 text-zinc-400',
		suspended: 'bg-red-500/10 text-red-500',
		pending: 'bg-amber-500/10 text-amber-500',
	};
	return (
		<>
			<motion.div
				layout
				initial={{
					opacity: 0,
					y: 10,
				}}
				animate={{
					opacity: 1,
					y: 0,
				}}
				exit={{
					opacity: 0,
					scale: 0.95,
				}}
				onClick={handleToggleExpand}
				className="flex items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-(--accent)/30 group relative"
				style={{
					padding: 'calc(var(--ui-gap) * 0.75)',
				}}
			>
				<div className="absolute inset-0 bg-gradient-to-br from-transparent to-(--border)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

				<div
					className="flex items-center relative z-10"
					style={{
						gap: 'calc(var(--ui-gap) * 0.75)',
					}}
				>
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/10 shrink-0 text-(--accent) shadow-inner transition-colors duration-300 group-hover:bg-(--accent)/20">
						<Key size={24} />
					</div>
					<div className="flex flex-col overflow-hidden">
						<h2 className="font-bold text-base text-(--text) truncate group-hover:text-(--accent) transition-colors">{token.name || t('admin.tokens.empty.title')}</h2>
						<div className="flex items-center gap-2 mt-0.5">
							<span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[token.status] || statusColors.active}`}>
								{t(`admin.tokens.statusOptions.${token.status}`) || token.status}
							</span>
						</div>
						<span className="text-[10px] text-(--text-muted)/60 font-mono mt-1 truncate">
							{t('admin.tokens.card.idPrefix')}
							{token.id}
						</span>
					</div>
				</div>

				<div className="flex items-center justify-center w-8 h-8 rounded-full bg-(--border)/10 opacity-0 group-hover:opacity-100 transition-all text-(--text) relative z-10 shrink-0 mr-2">
					<Settings2 size={16} />
				</div>
			</motion.div>

			<Modal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				title={t('admin.tokens.manage.modalTitle')}
				description={`Manage settings for ${token.name || t('admin.tokens.empty.title')}`}
				maxWidth="max-w-2xl"
			>
				<div
					className="flex flex-col overflow-visible"
					style={{
						padding: 'var(--ui-gap)',
						gap: 'var(--ui-gap)',
					}}
				>
					{loadingDetails ? (
						<div className="flex justify-center py-6">
							<Loading />
						</div>
					) : (
						<form
							onSubmit={handleUpdate}
							className="flex flex-col overflow-visible"
							style={{
								gap: 'calc(var(--ui-gap) * 1.5)',
							}}
						>
							<div
								className="grid grid-cols-1 md:grid-cols-2"
								style={{
									gap: 'var(--ui-gap)',
								}}
							>
								<div
									className="flex flex-col"
									style={{
										gap: 'calc(var(--ui-gap) * 0.4)',
									}}
								>
									<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.manage.nameLabel')}</label>
									<input
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										className="w-full rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
										style={{
											padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
										}}
										required
									/>
								</div>

								<div
									className="flex flex-col"
									style={{
										gap: 'calc(var(--ui-gap) * 0.4)',
									}}
								>
									<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.edit.status')}</label>
									<Selector
										value={status}
										options={[
											{
												label: t('admin.tokens.statusOptions.active'),
												value: 'active',
											},
											{
												label: t('admin.tokens.statusOptions.inactive'),
												value: 'inactive',
											},
											{
												label: t('admin.tokens.statusOptions.suspended'),
												value: 'suspended',
											},
											{
												label: t('admin.tokens.statusOptions.pending'),
												value: 'pending',
											},
										]}
										onChange={(val: string) => setStatus(val as Token['status'])}
									/>
								</div>
							</div>

							<div
								className="grid grid-cols-1 md:grid-cols-2"
								style={{
									gap: 'var(--ui-gap)',
								}}
							>
								<div
									className="flex flex-col"
									style={{
										gap: 'calc(var(--ui-gap) * 0.4)',
									}}
								>
									<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.edit.botId')}</label>
									<div className="flex flex-col gap-2 w-full">
										{botId && botId.length >= 15 && (
											<div className="flex flex-wrap gap-2">
												<BotProfilePreview botId={botId} getEnvUrl={getEnvUrl} onClear={() => setBotId('')} />
											</div>
										)}
										<div className="relative w-full">
											<input
												type="text"
												value={botId}
												onChange={(e) => setBotId(e.target.value)}
												placeholder={t('admin.tokens.edit.botIdPlaceholder')}
												className="w-full rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
												style={{
													padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
												}}
											/>
										</div>
									</div>
								</div>

								<div
									className="flex flex-col overflow-visible"
									style={{
										gap: 'calc(var(--ui-gap) * 0.4)',
									}}
								>
									<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.manage.ownersLabel')}</label>
									<AsyncUserMultiSelector values={selectedOwners} onChange={setSelectedOwners} getEnvUrl={getEnvUrl} />
								</div>
							</div>

							<div className="flex items-center justify-between p-3 rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md shadow-sm">
								<div className="flex flex-col">
									<span className="text-xs font-medium text-(--text)">{t('admin.tokens.edit.isXernerx')}</span>
									<span className="text-[11px] text-(--text-muted)">{t('admin.tokens.edit.allowFetching')}</span>
								</div>
								<Toggle checked={secure} onChange={(e) => setSecure(e.target.checked)} size="sm" />
							</div>

							<div className="flex items-center justify-between pt-4 border-t border-(--border)/10 mt-auto">
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => setConfirmDeleteOpen(true)}
										className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-colors"
									>
										<Trash2 size={14} />
										{t('admin.tokens.manage.revokeTitle')}
									</button>
									<button
										type="button"
										onClick={() => {
											navigator.clipboard.writeText(token.id);
											toast({
												title: t('admin.tokens.tokenIdCopied'),
												type: 'success',
											});
										}}
										className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-(--background)/50 hover:bg-(--border)/10 text-(--text-muted) text-xs font-mono font-medium transition-colors"
									>
										<Copy size={12} />
										{(token.id || '').substring(0, 8)}...
									</button>
								</div>
								<Button type="submit" disabled={saving || !isDirty}>
									{saving ? t('admin.roles.saving') : t('admin.tokens.manage.saveButton')}
								</Button>
							</div>
						</form>
					)}
				</div>
			</Modal>

			<Confirm
				open={confirmDeleteOpen}
				onOpenChange={setConfirmDeleteOpen}
				title={t('admin.tokens.manage.revokeTitle')}
				description={t('admin.tokens.manage.deleteConfirm')}
				confirmText={t('admin.roles.confirmDelete')}
				cancelText={t('admin.roles.cancel')}
				onConfirm={handleDelete}
				loading={deleting}
			/>
		</>
	);
}
export default function Tokens() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [tokens, setTokens] = useState<Token[]>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Modal state for creation
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newName, setNewName] = useState('');
	const [newStatus, setNewStatus] = useState<Token['status']>('active');
	const [newBotId, setNewBotId] = useState('');
	const [newSelectedOwners, setNewSelectedOwners] = useState<string[]>([]);
	const [newSecure, setNewSecure] = useState(false);
	const [creating, setCreating] = useState(false);
	useEffect(() => {
		const fetchTokens = async () => {
			setLoading(true);
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/tokens?admin=true'), {
					credentials: 'include',
				});
				if (!res.ok) throw new Error('Failed to fetch tokens');
				const data = await res.json();
				setTokens(data);
			} catch (err: any) {
				setError(
					err.message ||
						t('admin.tokens.toast.loadError', {
							error: err.message,
						})
				);
			} finally {
				setLoading(false);
			}
		};
		fetchTokens();
	}, [getEnvUrl, t]);
	const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const submitter = (e.nativeEvent as SubmitEvent).submitter;
		if (submitter && submitter.getAttribute('type') !== 'submit') return;
		if (!newName) return;
		setCreating(true);
		const newId = crypto.randomUUID();
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/tokens/${newId}`), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					userId: newSelectedOwners[0] || 'admin',
					name: newName,
					status: newStatus,
					botId: newBotId || undefined,
					owners: newSelectedOwners,
					permissions: {
						secure: newSecure,
					},
				}),
			});
			if (res.ok) {
				const created = await res.json();
				setTokens((prev) => [...prev, created]);
				setIsCreateOpen(false);
				setNewName('');
				setNewStatus('active');
				setNewBotId('');
				setNewSelectedOwners([]);
				setNewSecure(false);
				toast({
					type: 'success',
					title: 'Token created successfully',
				});
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || 'Unknown error');
			}
		} catch (err: any) {
			console.error('Failed to create token:', err);
			toast({
				type: 'error',
				title: 'Failed to create token',
				description: err.message,
			});
		} finally {
			setCreating(false);
		}
	};
	const handleTokenDeleted = (deletedId: string) => {
		setTokens((prev) => prev.filter((t) => t._id !== deletedId));
	};
	const handleTokenUpdated = (updatedToken: Token) => {
		setTokens((prev) => prev.map((t) => (t._id === updatedToken._id ? updatedToken : t)));
	};
	const filteredTokens = useMemo(() => {
		return tokens.filter((t) => t.name?.toLowerCase().includes(search.toLowerCase()) || t.id?.toLowerCase().includes(search.toLowerCase()));
	}, [tokens, search]);
	if (loading) return <Loading />;
	if (error)
		return (
			<div className="p-6 text-red-500">
				{t('admin.tokens.edit.failedToFetchToken', {
					error,
				})}
			</div>
		);
	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{/* Header & New Token Button */}
			<div
				className="flex flex-col sm:flex-row items-center justify-between"
				style={{
					gap: 'var(--ui-gap)',
				}}
			>
				<div className="flex flex-col">
					<h1
						className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm"
						style={{
							fontFamily: `var(--font-fredoka)`,
						}}
					>
						{t('admin.tokens.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.tokens.description')}</p>
				</div>
				<Button
					variant="primary"
					onClick={() => {
						setNewName('');
						setNewStatus('active');
						setNewBotId('');
						setNewSelectedOwners([]);
						setNewSecure(false);
						setIsCreateOpen(true);
					}}
					style={{
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<Plus size={16} />
					<span>{t('admin.tokens.generateButton')}</span>
				</Button>
			</div>

			{/* Controls Bar: Search */}
			<div className="relative w-full">
				<Input variant="search" shortcut={true} placeholder={t('admin.tokens.empty.description')} value={search} onChange={(e) => setSearch(e.target.value)} />
			</div>

			{/* Tokens Grid (3 Columns) */}
			{filteredTokens.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
					<p className="text-sm text-(--text-muted)">{t('admin.tokens.empty.title')}</p>
				</div>
			) : (
				<motion.div
					layout
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-visible"
					style={{
						gap: 'var(--ui-gap)',
					}}
				>
					<AnimatePresence>
						{filteredTokens.map((token) => (
							<TokenCard key={token.id} token={token} getEnvUrl={getEnvUrl} onTokenDeleted={handleTokenDeleted} onTokenUpdated={handleTokenUpdated} />
						))}
					</AnimatePresence>
				</motion.div>
			)}

			{/* Create Modal */}
			<Modal open={isCreateOpen} onOpenChange={setIsCreateOpen} title={t('admin.tokens.create.modalTitle')} description={t('admin.tokens.description')}>
				<form
					onSubmit={handleCreate}
					className="flex flex-col overflow-visible"
					style={{
						gap: 'var(--ui-gap)',
					}}
				>
					<div
						className="flex flex-col"
						style={{
							gap: 'calc(var(--ui-gap) * 0.4)',
						}}
					>
						<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.create.nameLabel')}</label>
						<input
							type="text"
							placeholder={t('admin.tokens.create.namePlaceholder')}
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							className="w-full rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
							style={{
								padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
							}}
							required
						/>
					</div>
					<div
						className="flex flex-col"
						style={{
							gap: 'calc(var(--ui-gap) * 0.4)',
						}}
					>
						<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.edit.status')}</label>
						<Selector
							value={newStatus}
							options={[
								{
									label: t('admin.tokens.statusOptions.active'),
									value: 'active',
								},
								{
									label: t('admin.tokens.statusOptions.inactive'),
									value: 'inactive',
								},
								{
									label: t('admin.tokens.statusOptions.suspended'),
									value: 'suspended',
								},
								{
									label: t('admin.tokens.statusOptions.pending'),
									value: 'pending',
								},
							]}
							onChange={(val: string) => setNewStatus(val as Token['status'])}
						/>
					</div>
					<div
						className="flex flex-col"
						style={{
							gap: 'calc(var(--ui-gap) * 0.4)',
						}}
					>
						<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.edit.botId')}</label>
						<div className="flex flex-col gap-2 w-full">
							{newBotId && newBotId.length >= 15 && (
								<div className="flex flex-wrap gap-2">
									<BotProfilePreview botId={newBotId} getEnvUrl={getEnvUrl} onClear={() => setNewBotId('')} />
								</div>
							)}
							<div className="relative w-full">
								<input
									type="text"
									placeholder={t('admin.tokens.edit.botIdPlaceholder')}
									value={newBotId}
									onChange={(e) => setNewBotId(e.target.value)}
									className="w-full rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
									style={{
										padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
									}}
								/>
							</div>
						</div>
					</div>
					<div
						className="flex flex-col overflow-visible"
						style={{
							gap: 'calc(var(--ui-gap) * 0.4)',
						}}
					>
						<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.manage.ownersLabel')}</label>
						<AsyncUserMultiSelector values={newSelectedOwners} onChange={setNewSelectedOwners} getEnvUrl={getEnvUrl} />
					</div>
					<div className="flex items-center justify-between pt-1">
						<div className="flex flex-col">
							<span className="text-xs font-medium text-(--text)">{t('admin.tokens.edit.isXernerx')}</span>
							<span className="text-[11px] text-(--text-muted)">{t('admin.tokens.edit.allowFetching')}</span>
						</div>
						<Toggle checked={newSecure} onChange={(e) => setNewSecure(e.target.checked)} size="sm" />
					</div>
					<div className="flex justify-end gap-3 pt-2">
						<Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
							{t('admin.tokens.create.cancelButton')}
						</Button>
						<Button type="submit" variant="primary" disabled={creating}>
							{creating ? t('admin.roles.creating') : t('admin.tokens.create.submitButton')}
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
