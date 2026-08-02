/** @format */
'use client';

import { AlertTriangle, Check, Copy, Eye, EyeOff, Key, Loader2, Plus, Save, Settings2, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDictionary, useEnvironment, useSession, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { Button } from '@xernerx/ui';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type TokenStatus = 'active' | 'suspended' | 'pending';

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
	const [isSubmitting, setIsSubmitting] = useState(false);

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
					owners: userId ? [userId] : [],
				}),
			});

			if (!res.ok) throw new Error('Failed to create token');

			toast({ title: t('auth.tokens.create.success'), type: 'success' });
			setName('');
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

						<form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
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
	const [ownersStr, setOwnersStr] = useState('');
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
				setOwnersStr(data.owners.join(', '));
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

		setIsSaving(true);
		const ownersArray = ownersStr
			.split(',')
			.map((id) => id.trim())
			.filter(Boolean);

		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/tokens/${token.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ name, owners: ownersArray }),
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
										className="p-2 text-(--accent-red) hover:bg-(--accent-red)/10 rounded-xl transition-colors"
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
											onClick={() => setIsTokenVisible(!isTokenVisible)}
											className="p-2.5 rounded-xl bg-(--foreground) border border-(--border)/20 text-(--text-muted) hover:text-(--text) hover:border-(--accent) transition"
										>
											{isTokenVisible ? <EyeOff size={16} /> : <Eye size={16} />}
										</button>
										<button onClick={handleCopy} className="p-2.5 rounded-xl bg-(--accent) text-white hover:bg-(--accent-hover) transition">
											{copied ? <Check size={16} /> : <Copy size={16} />}
										</button>
									</div>
									<p className="text-[11px] text-(--accent-orange) mt-1">{t('auth.tokens.manage.securityWarning')}</p>
								</div>

								<form onSubmit={handleUpdate} className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
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

									<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
										<label className="text-sm font-medium text-(--text)">{t('auth.tokens.manage.ownersLabel')}</label>
										<input
											type="text"
											value={ownersStr}
											onChange={(e) => setOwnersStr(e.target.value)}
											placeholder={t('auth.tokens.manage.ownersPlaceholder')}
											className="w-full rounded-xl border border-(--border)/20 bg-(--background) px-4 py-2.5 text-sm font-mono text-(--text) outline-none transition focus:border-(--accent)"
										/>
									</div>

									<div className="flex justify-end gap-3 mt-2">
										<Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
											{t('auth.tokens.manage.closeButton')}
										</Button>
										<Button type="submit" className="bg-(--accent) text-white hover:bg-(--accent-hover) gap-2" disabled={isSaving}>
											{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
											{t('auth.tokens.manage.saveButton')}
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
