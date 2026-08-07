/** @format */
'use client';

import { AlertTriangle, Check, ChevronDown, Copy, Eye, EyeOff, Key, Loader2, Plus, Save, Search, Settings2, Trash2, User as UserIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useToast } from '@xernerx/providers';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Loading } from '@xernerx/feedback';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type TokenStatus = 'active' | 'inactive' | 'suspended' | 'pending';

interface TokenListInfo {
	_id: string;
	name: string;
	status: TokenStatus;
}

interface FullToken extends TokenListInfo {
	id: string;
	owners: string[];
	botId?: string;
	createdAt: string;
}

interface UserOption {
	id: string;
	name?: string;
	global_name?: string;
	username?: string;
	avatar?: string;
}

// -----------------------------------------------------------------------------
// Multi-User Selector Component
// -----------------------------------------------------------------------------

/**
 * Custom Searchable Multi-User Selector component.
 * Instead of fetching a bulk user database, it strictly fetches the specified
 * Discord ID from `core/users/[id]/discord` when entered.
 */
function AsyncUserMultiSelector({ values, onChange, getEnvUrl, placeholder }: { values: string[]; onChange: (vals: string[]) => void; getEnvUrl: (url: string) => string; placeholder?: string }) {
	const { t } = useDictionary();
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [users, setUsers] = useState<UserOption[]>([]);
	const [loading, setLoading] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const fetchedIds = useRef(new Set<string>());

	// 1. Fetch full Discord profile for selected values on mount (to render chips correctly)
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
								if (prev.some((u) => u.id === data.id)) return prev;
								return [...prev, data];
							});
						}
					})
					.catch(() => {});
			}
		});
	}, [values, users, getEnvUrl]);

	// 2. Fetch full Discord profile dynamically if the user types a valid Discord ID
	const isValidId = /^\d{17,20}$/.test(query);

	useEffect(() => {
		if (isValidId && !fetchedIds.current.has(query)) {
			setLoading(true);
			fetchedIds.current.add(query);
			fetch(getEnvUrl(`https://api.xernerx.com/core/users/${query}/discord`), {
				credentials: 'include',
			})
				.then((res) => (res.ok ? res.json() : null))
				.then((data) => {
					if (data && data.id) {
						setUsers((prev) => {
							if (prev.some((u) => u.id === data.id)) return prev;
							return [...prev, data];
						});
					}
				})
				.catch(() => {})
				.finally(() => setLoading(false));
		}
	}, [query, isValidId, getEnvUrl]);

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

	const searchedUser = users.find((u) => u.id === query);
	const canAdd = isValidId && searchedUser && !values.includes(searchedUser.id);

	return (
		<div className="flex flex-col gap-2 w-full overflow-visible" ref={ref}>
			{/* Selected Pills */}
			{values.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{values.map((id) => {
						const u = users.find((u) => u.id === id);
						return (
							<div
								key={id}
								className="flex items-center gap-1.5 rounded-xl border border-(--border)/20 bg-(--foreground) pl-2 pr-1.5 py-1.5 text-xs text-(--text) shadow-sm transition hover:border-(--accent)/50"
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
					className="flex w-full items-center justify-between rounded-xl border border-(--border)/20 bg-(--background) px-4 py-2.5 text-sm font-medium text-(--text) outline-none transition focus:border-(--accent)"
				>
					<span className="text-(--text-muted) font-medium">{placeholder || t('auth.tokens.manage.ownersPlaceholder')}</span>
					<ChevronDown className={`h-4 w-4 text-(--text-muted) transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
				</button>

				<AnimatePresence>
					{isOpen && (
						<motion.div
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -4 }}
							transition={{ duration: 0.15, ease: 'easeOut' }}
							className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-2xl border border-(--border)/10 bg-(--foreground) shadow-2xl"
							style={{ padding: 'calc(var(--ui-gap) * 0.25)', display: 'flex', flexDirection: 'column', gap: 'calc(var(--ui-gap) * 0.25)' }}
						>
							{/* Search Filter Input */}
							<div className="relative w-full" style={{ padding: 'calc(var(--ui-gap) * 0.25)' }}>
								<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
								<input
									ref={inputRef}
									type="text"
									placeholder={t('auth.tokens.manage.ownersPlaceholder')}
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="w-full rounded-xl border border-(--border)/10 bg-(--background) text-xs text-(--text) focus:outline-none focus:ring-1 focus:ring-(--accent)"
									style={{ padding: 'calc(var(--ui-gap) * 0.4) calc(var(--ui-gap) * 0.5) calc(var(--ui-gap) * 0.4) calc(var(--ui-gap) * 2)' }}
									onClick={(e) => e.stopPropagation()}
								/>
							</div>

							{/* Options List */}
							<div className="overflow-y-auto max-h-52 flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
								{!isValidId ? (
									<div className="py-4 text-center text-xs text-(--text-muted)">{t('auth.tokens.manage.invalidIdPrompt', {}, 'Enter a valid 17-20 digit Discord ID')}</div>
								) : loading ? (
									<div className="py-6 flex justify-center">
										<Loading />
									</div>
								) : canAdd ? (
									<button
										type="button"
										onClick={() => handleSelect(searchedUser.id)}
										className="flex w-full items-center justify-between rounded-xl text-sm transition-colors text-(--text) hover:bg-(--border)/5"
										style={{ padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)' }}
									>
										<div className="flex items-center gap-2 truncate">
											{searchedUser.avatar ? (
												<img
													src={`https://cdn.discordapp.com/avatars/${searchedUser.id}/${searchedUser.avatar}.png`}
													alt=""
													className="w-5 h-5 rounded-full object-cover shrink-0"
												/>
											) : (
												<UserIcon size={16} className="text-(--text-muted) shrink-0" />
											)}
											<span className="font-medium truncate">{searchedUser.global_name || searchedUser.name || searchedUser.username || searchedUser.id}</span>
										</div>
									</button>
								) : searchedUser && values.includes(searchedUser.id) ? (
									<div className="py-4 text-center text-xs text-(--text-muted)">{t('auth.tokens.manage.userAlreadyAdded', {}, 'User already added')}</div>
								) : (
									<div className="py-4 text-center text-xs text-(--text-muted)">{t('auth.tokens.manage.userNotFound', {}, 'User not found')}</div>
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
// Main Component
// -----------------------------------------------------------------------------

export default function Tokens() {
	const { data: session } = useSession();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [tokens, setTokens] = useState<TokenListInfo[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const fetchTokens = async () => {
		try {
			setIsLoading(true);

			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/tokens`, {
				credentials: 'include',
			});

			if (!res.ok) throw new Error('Failed to fetch tokens');
			const data = await res.json();
			setTokens(data);
		} catch (error) {
			toast({
				title: t('auth.tokens.toast.loadError', { error: (error as Error).message }),
				type: 'error',
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		(() => {
			fetchTokens();
		})();
	}, []);

	const statusColors = {
		active: 'text-(--accent-green) bg-(--accent-green)/10 border-(--accent-green)/20',
		inactive: 'text-(--text-muted) bg-(--border)/10 border-(--border)/20',
		suspended: 'text-(--accent-red) bg-(--accent-red)/10 border-(--accent-red)/20',
		pending: 'text-(--accent-orange) bg-(--accent-orange)/10 border-(--accent-orange)/20',
	};

	return (
		<div
			className="flex flex-col max-w-4xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{/* Header */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex items-center" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<div
						className="flex items-center justify-center rounded-2xl bg-(--accent)/10 text-(--accent) shrink-0"
						style={{
							width: 'calc(var(--ui-gap) * 2.5)',
							height: 'calc(var(--ui-gap) * 2.5)',
						}}
					>
						<Key size={24} />
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h1 className="text-3xl font-black tracking-tight text-(--text)">{t('auth.tokens.title')}</h1>
						<p className="text-sm text-(--text-muted)">{t('auth.tokens.description')}</p>
					</div>
				</div>

				<Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-(--accent) text-white hover:bg-(--accent-hover) rounded-xl px-5 py-2.5">
					<Plus size={16} />
					{t('auth.tokens.generateButton')}
				</Button>
			</div>

			{/* List */}
			{isLoading ? (
				<div className="flex h-40 items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm">
					<Loader2 className="animate-spin text-(--accent)" size={24} />
				</div>
			) : tokens.length === 0 ? (
				<div
					className="flex flex-col h-40 items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm text-center px-4"
					style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}
				>
					<AlertTriangle size={32} className="text-(--text-muted)" />
					<p className="text-sm font-medium text-(--text)">{t('auth.tokens.empty.title')}</p>
					<p className="text-xs text-(--text-muted) max-w-sm">{t('auth.tokens.empty.description')}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
					<AnimatePresence>
						{tokens.map((token, i) => (
							<motion.div
								key={token._id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: i * 0.05 }}
								onClick={() => setSelectedTokenId(token._id)}
								className="group relative flex cursor-pointer flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm transition-all hover:border-(--accent)/50 hover:shadow-md"
								style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
							>
								<div className="flex items-start justify-between">
									<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
										<h3 className="text-base font-semibold text-(--text) truncate max-w-[180px]">{token.name}</h3>
										<p className="text-xs font-mono text-(--text-muted)">...{token._id.slice(-6)}</p>
									</div>
									<span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusColors[token.status]}`}>{token.status}</span>
								</div>
								<div className="flex items-center text-xs font-medium text-(--accent) opacity-0 transition-opacity group-hover:opacity-100 mt-2">
									<Settings2 size={14} className="mr-1.5" /> {t('auth.tokens.manageSettings')}
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			)}

			{/* Modals */}
			<CreateTokenModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={fetchTokens} userId={(session?.user as any)?.id} />

			<ManageTokenModal tokenId={selectedTokenId} onClose={() => setSelectedTokenId(null)} onSuccess={fetchTokens} />
		</div>
	);
}

// -----------------------------------------------------------------------------
// Create Token Modal
// -----------------------------------------------------------------------------

function CreateTokenModal({ isOpen, onClose, onSuccess, userId }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; userId?: string }) {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [name, setName] = useState('');
	const [owners, setOwners] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (isOpen && userId && owners.length === 0) {
			setOwners([userId]);
		} else if (!isOpen) {
			setName('');
			setOwners(userId ? [userId] : []);
		}
	}, [isOpen, userId]);

	const generateTokenString = () => 'xrx_' + crypto.randomUUID().replace(/-/g, '');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		setIsSubmitting(true);
		const newTokenId = generateTokenString();

		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/tokens/${newTokenId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					name,
					status: 'pending',
					owners,
				}),
			});

			if (!res.ok) throw new Error('Failed to create token');

			toast({ title: t('auth.tokens.create.success'), type: 'success' });
			onSuccess();
			onClose();
		} catch (error) {
			toast({
				title: t('auth.tokens.create.errorTitle'),
				description: t('auth.tokens.create.errorDesc', { error: (error as Error).message }),
				type: 'error',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						className="relative w-full max-w-md flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-2xl z-10"
						style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
					>
						<h3 className="text-lg font-bold text-(--text)">{t('auth.tokens.create.modalTitle')}</h3>

						<form onSubmit={handleSubmit} className="flex flex-col overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
							<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
								<label className="text-sm font-medium text-(--text)">{t('auth.tokens.create.nameLabel')}</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder={t('auth.tokens.create.namePlaceholder')}
									className="w-full rounded-xl border border-(--border)/20 bg-(--background) px-4 py-2.5 text-sm text-(--text) outline-none transition focus:border-(--accent) focus:ring-1 focus:ring-(--accent)"
									required
									autoFocus
								/>
							</div>

							<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
								<label className="text-sm font-medium text-(--text)">{t('auth.tokens.manage.ownersLabel')}</label>
								<AsyncUserMultiSelector values={owners} onChange={setOwners} getEnvUrl={getEnvUrl} />
							</div>

							<div className="flex justify-end gap-3 mt-2">
								<Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
									{t('auth.tokens.create.cancelButton')}
								</Button>
								<Button type="submit" className="bg-(--accent) text-white hover:bg-(--accent-hover)" disabled={isSubmitting}>
									{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t('auth.tokens.create.submitButton')}
								</Button>
							</div>
						</form>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}

// -----------------------------------------------------------------------------
// Manage Token Modal
// -----------------------------------------------------------------------------

function ManageTokenModal({ tokenId, onClose, onSuccess }: { tokenId: string | null; onClose: () => void; onSuccess: () => void }) {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [token, setToken] = useState<FullToken | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const [name, setName] = useState('');
	const [owners, setOwners] = useState<string[]>([]);
	const [status, setStatus] = useState<TokenStatus>('active');
	const [isTokenVisible, setIsTokenVisible] = useState(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!tokenId) {
			setToken(null);
			setIsTokenVisible(false);
			return;
		}

		const fetchFullToken = async () => {
			setIsLoading(true);
			try {
				const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/tokens/${tokenId}`, {
					credentials: 'include',
				});
				if (!res.ok) throw new Error('Failed to fetch full token details');

				const data: FullToken = await res.json();
				setToken(data);
				setName(data.name);
				setOwners(data.owners || []);
				setStatus(data.status);
			} catch (error) {
				toast({
					title: t('auth.tokens.manage.loadError', { error: (error as Error).message }),
					type: 'error',
				});
				onClose();
			} finally {
				setIsLoading(false);
			}
		};

		fetchFullToken();
	}, [tokenId, onClose, toast, getEnvUrl, t]);

	const isDirty = token ? name !== token.name || [...owners].sort().join(',') !== [...token.owners].sort().join(',') || status !== token.status : false;

	const handleCopy = () => {
		if (!token) return;
		navigator.clipboard.writeText(token.id);
		setCopied(true);
		toast({ title: t('auth.tokens.manage.copySuccess'), type: 'success' });
		setTimeout(() => setCopied(false), 2000);
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!token) return;

		if (!isDirty) {
			onClose();
			return;
		}

		setIsSaving(true);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/tokens/${token.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ name, owners, status }),
			});

			if (!res.ok) throw new Error('Update failed');
			toast({ title: t('auth.tokens.manage.updateSuccess'), type: 'success' });
			onSuccess();
			onClose();
		} catch (error) {
			toast({ title: t('auth.tokens.manage.updateError'), type: 'error' });
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!token || !confirm(t('auth.tokens.manage.deleteConfirm'))) return;

		setIsSaving(true);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/tokens/${token.id}`, {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Deletion failed');

			toast({ title: t('auth.tokens.manage.deleteSuccess'), type: 'success' });
			onSuccess();
			onClose();
		} catch (error) {
			toast({ title: t('auth.tokens.manage.deleteError'), type: 'error' });
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<AnimatePresence>
			{tokenId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						className="relative w-full max-w-lg flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-2xl z-10"
						style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
					>
						{isLoading || !token ? (
							<div className="flex h-64 items-center justify-center">
								<Loader2 className="animate-spin text-(--accent)" size={32} />
							</div>
						) : (
							<>
								<div className="flex items-center justify-between">
									<h3 className="text-xl font-bold text-(--text)">{t('auth.tokens.manage.modalTitle')}</h3>
									<button
										onClick={handleDelete}
										className="p-2 text-(--accent-red) hover:bg-(--accent-red)/10 rounded-xl transition-colors cursor-pointer"
										title={t('auth.tokens.manage.revokeTitle')}
									>
										<Trash2 size={18} />
									</button>
								</div>

								<div className="flex flex-col rounded-2xl bg-(--background) border border-(--border)/10 p-4" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
									<label className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">{t('auth.tokens.manage.accessKeyLabel')}</label>
									<div className="flex items-center gap-2">
										<div className="flex-1 flex items-center rounded-xl bg-(--foreground) border border-(--border)/20 px-3 py-2 overflow-hidden relative">
											<code className={`text-sm font-mono truncate transition-all duration-300 ${isTokenVisible ? 'text-(--text)' : 'text-(--text-muted) blur-sm select-none'}`}>
												{token.id}
											</code>
										</div>
										<button
											type="button"
											onClick={() => setIsTokenVisible(!isTokenVisible)}
											className="p-2.5 rounded-xl bg-(--foreground) border border-(--border)/20 text-(--text-muted) hover:text-(--text) hover:border-(--accent) transition cursor-pointer"
										>
											{isTokenVisible ? <EyeOff size={16} /> : <Eye size={16} />}
										</button>
										<button type="button" onClick={handleCopy} className="p-2.5 rounded-xl bg-(--accent) text-white hover:bg-(--accent-hover) transition cursor-pointer">
											{copied ? <Check size={16} /> : <Copy size={16} />}
										</button>
									</div>
									<p className="text-[11px] text-(--accent-orange) mt-1">{t('auth.tokens.manage.securityWarning')}</p>
								</div>

								<form onSubmit={handleUpdate} className="flex flex-col overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
									<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
										<label className="text-sm font-medium text-(--text)">{t('auth.tokens.manage.nameLabel')}</label>
										<input
											type="text"
											value={name}
											onChange={(e) => setName(e.target.value)}
											className="w-full rounded-xl border border-(--border)/20 bg-(--background) px-4 py-2.5 text-sm text-(--text) outline-none transition focus:border-(--accent)"
											required
										/>
									</div>

									<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
										<label className="text-sm font-medium text-(--text)">{t('auth.tokens.manage.ownersLabel')}</label>
										<AsyncUserMultiSelector values={owners} onChange={setOwners} getEnvUrl={getEnvUrl} />
									</div>

									{token.status !== 'pending' && token.status !== 'suspended' && (
										<div className="flex items-center justify-between rounded-xl border border-(--border)/20 bg-(--background) px-4 py-3">
											<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
												<span className="text-sm font-medium text-(--text)">{t('auth.tokens.manage.statusTitle', {}, 'Active Status')}</span>
												<span className="text-xs text-(--text-muted)">
													{status === 'active'
														? t('auth.tokens.manage.statusActive', {}, 'Token is active and can make API requests')
														: t('auth.tokens.manage.statusInactive', {}, 'Token is temporarily disabled')}
												</span>
											</div>
											<Toggle checked={status === 'active'} onChange={() => setStatus(status === 'active' ? 'inactive' : 'active')} />
										</div>
									)}

									<div className="flex justify-end gap-3 mt-2">
										{isDirty && (
											<Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
												{t('auth.tokens.manage.closeButton', {}, 'Cancel')}
											</Button>
										)}
										<Button type="submit" className="bg-(--accent) text-white hover:bg-(--accent-hover) gap-2" disabled={isSaving}>
											{isSaving ? <Loader2 size={16} className="animate-spin" /> : isDirty ? <Save size={16} /> : <Check size={16} />}
											{isDirty ? t('auth.tokens.manage.saveButton') : t('auth.tokens.manage.closeButton')}
										</Button>
									</div>
								</form>
							</>
						)}
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
