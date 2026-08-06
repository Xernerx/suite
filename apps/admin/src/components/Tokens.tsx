/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button, Confirm, Modal, Selector, Toggle } from '@xernerx/ui';
import { ChevronDown, Key, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@xernerx/feedback';
import { useEnvironment } from '@xernerx/providers';

interface Token {
	id: string;
	name: string;
	owners?: string[];
	status: 'active' | 'inactive' | 'suspended' | 'pending';
	permissions?: {
		isXernerx?: boolean;
	};
	botId?: string;
	createdAt?: string;
	updatedAt?: string;
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
	const [isExpanded, setIsExpanded] = useState(false);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [fullToken, setFullToken] = useState<Token | null>(null);
	const [saving, setSaving] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Editable form states
	const [name, setName] = useState(token.name || '');
	const [status, setStatus] = useState<Token['status']>(token.status || 'active');
	const [botId, setBotId] = useState('');
	const [ownersInput, setOwnersInput] = useState('');
	const [isXernerx, setIsXernerx] = useState(false);

	const handleToggleExpand = async () => {
		const nextState = !isExpanded;
		setIsExpanded(nextState);

		if (nextState && !fullToken) {
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
					setOwnersInput((data.owners || []).join(', '));
					setIsXernerx(!!data.permissions?.isXernerx);
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
			const owners = ownersInput
				.split(',')
				.map((o) => o.trim())
				.filter(Boolean);

			const payload = {
				name,
				status,
				botId: botId || undefined,
				owners,
				permissions: {
					isXernerx,
				},
			};

			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/tokens/${token.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				const updated = await res.json();
				onTokenUpdated(updated);
			}
		} catch (err) {
			console.error('Failed to update token:', err);
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
			}
		} catch (err) {
			console.error('Failed to delete token:', err);
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
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/10 shrink-0 text-(--accent)">
							<Key size={24} />
						</div>
						<div className="flex flex-col overflow-hidden">
							<h2 className="font-bold text-base text-(--text) truncate">{token.name || 'Unnamed Token'}</h2>
							<div className="flex items-center gap-2 mt-0.5">
								<span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[token.status] || statusColors.active}`}>{token.status}</span>
							</div>
							<span className="text-[10px] text-(--text-muted)/60 font-mono mt-1">ID: {token.id}</span>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
							<ChevronDown size={18} className="text-(--text-muted)" />
						</motion.div>
					</div>
				</div>

				{/* Expanded Content: Token Management Form */}
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
										<h3 className="text-sm font-bold text-(--text)">Manage Token Configuration</h3>

										<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
											<label className="block text-xs font-medium text-(--text)">Token Name</label>
											<input
												type="text"
												value={name}
												onChange={(e) => setName(e.target.value)}
												className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
												style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
												required
											/>
										</div>

										<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
											<label className="block text-xs font-medium text-(--text)">Status</label>
											<Selector
												value={status}
												options={[
													{ label: 'Active', value: 'active' },
													{ label: 'Inactive', value: 'inactive' },
													{ label: 'Suspended', value: 'suspended' },
													{ label: 'Pending', value: 'pending' },
												]}
												onChange={(val: string) => setStatus(val as Token['status'])}
											/>
										</div>

										<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
											<label className="block text-xs font-medium text-(--text)">Bot ID</label>
											<input
												type="text"
												value={botId}
												onChange={(e) => setBotId(e.target.value)}
												placeholder="Optional Bot ID..."
												className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
												style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
											/>
										</div>

										<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
											<label className="block text-xs font-medium text-(--text)">Owners (comma-separated)</label>
											<input
												type="text"
												value={ownersInput}
												onChange={(e) => setOwnersInput(e.target.value)}
												placeholder="owner1_id, owner2_id"
												className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
												style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
											/>
										</div>

										<div className="flex items-center justify-between pt-1">
											<div className="flex flex-col">
												<span className="text-xs font-medium text-(--text)">Is Xernerx</span>
												<span className="text-[11px] text-(--text-muted)">Allow fetching data from /secure</span>
											</div>
											<Toggle checked={isXernerx} onChange={(e) => setIsXernerx(e.target.checked)} size="sm" />
										</div>

										<div className="flex items-center justify-between pt-2">
											<button
												type="button"
												onClick={() => setConfirmDeleteOpen(true)}
												className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-colors"
											>
												<Trash2 size={14} />
												Delete Token
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
				title="Delete Token"
				description={`Are you sure you want to delete token "${token.name || 'Unnamed'}"? This action cannot be undone.`}
				confirmText="Delete"
				cancelText="Cancel"
				onConfirm={handleDelete}
				loading={deleting}
			/>
		</>
	);
}

export default function Tokens() {
	const { getEnvUrl } = useEnvironment();

	const [tokens, setTokens] = useState<Token[]>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Modal state for creation
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newName, setNewName] = useState('');
	const [newStatus, setNewStatus] = useState<Token['status']>('active');
	const [newBotId, setNewBotId] = useState('');
	const [newOwnersInput, setNewOwnersInput] = useState('');
	const [newIsXernerx, setNewIsXernerx] = useState(false);
	const [creating, setCreating] = useState(false);

	useEffect(() => {
		const fetchTokens = async () => {
			setLoading(true);
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/tokens'), {
					credentials: 'include',
				});
				if (!res.ok) throw new Error('Failed to fetch tokens');
				const data = await res.json();
				setTokens(data);
			} catch (err: any) {
				setError(err.message || 'Failed to load tokens.');
			} finally {
				setLoading(false);
			}
		};

		fetchTokens();
	}, [getEnvUrl]);

	const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const submitter = (e.nativeEvent as SubmitEvent).submitter;
		if (submitter && submitter.getAttribute('type') !== 'submit') return;
		if (!newName) return;

		setCreating(true);
		const newId = crypto.randomUUID();

		try {
			const owners = newOwnersInput
				.split(',')
				.map((o) => o.trim())
				.filter(Boolean);

			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/tokens/${newId}`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					name: newName,
					status: newStatus,
					botId: newBotId || undefined,
					owners,
					permissions: {
						isXernerx: newIsXernerx,
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
				setNewOwnersInput('');
				setNewIsXernerx(false);
			}
		} catch (err) {
			console.error('Failed to create token:', err);
		} finally {
			setCreating(false);
		}
	};

	const handleTokenDeleted = (deletedId: string) => {
		setTokens((prev) => prev.filter((t) => t.id !== deletedId));
	};

	const handleTokenUpdated = (updatedToken: Token) => {
		setTokens((prev) => prev.map((t) => (t.id === updatedToken.id ? updatedToken : t)));
	};

	const filteredTokens = useMemo(() => {
		return tokens.filter((t) => t.name?.toLowerCase().includes(search.toLowerCase()) || t.id?.toLowerCase().includes(search.toLowerCase()));
	}, [tokens, search]);

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
			{/* Header & New Token Button */}
			<div className="flex flex-col sm:flex-row items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col">
					<h1 className="text-3xl font-black tracking-tight text-(--text)">API Token Management</h1>
					<p className="text-sm text-(--text-muted)">Manage organization access tokens, bot identifiers, and secure endpoint permissions.</p>
				</div>
				<Button
					variant="primary"
					onClick={() => {
						setNewName('');
						setNewStatus('active');
						setNewBotId('');
						setNewOwnersInput('');
						setNewIsXernerx(false);
						setIsCreateOpen(true);
					}}
					style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}
				>
					<Plus size={16} />
					<span>New Token</span>
				</Button>
			</div>

			{/* Controls Bar: Search */}
			<div className="relative w-full">
				<Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted)" />
				<input
					type="text"
					placeholder="Search by token name or UUID..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full rounded-2xl border border-(--border)/10 bg-(--foreground) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
					style={{ padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap) calc(var(--ui-gap) * 0.6) calc(var(--ui-gap) * 2.5)' }}
				/>
			</div>

			{/* Tokens Grid (3 Columns) */}
			{filteredTokens.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground) py-16 text-center">
					<p className="text-sm text-(--text-muted)">No tokens found matching your search.</p>
				</div>
			) : (
				<motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
					<AnimatePresence>
						{filteredTokens.map((token) => (
							<TokenCard key={token.id} token={token} getEnvUrl={getEnvUrl} onTokenDeleted={handleTokenDeleted} onTokenUpdated={handleTokenUpdated} />
						))}
					</AnimatePresence>
				</motion.div>
			)}

			{/* Create Modal */}
			<Modal open={isCreateOpen} onOpenChange={setIsCreateOpen} title="Create New Token" description="Add a new API token with associated permissions and configuration.">
				<form onSubmit={handleCreate} className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
						<label className="block text-xs font-medium text-(--text)">Token Name</label>
						<input
							type="text"
							placeholder="e.g., Production Bot Token"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
							style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
							required
						/>
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
						<label className="block text-xs font-medium text-(--text)">Status</label>
						<Selector
							value={newStatus}
							options={[
								{ label: 'Active', value: 'active' },
								{ label: 'Inactive', value: 'inactive' },
								{ label: 'Suspended', value: 'suspended' },
								{ label: 'Pending', value: 'pending' },
							]}
							onChange={(val: string) => setNewStatus(val as Token['status'])}
						/>
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
						<label className="block text-xs font-medium text-(--text)">Bot ID</label>
						<input
							type="text"
							placeholder="Optional Bot ID..."
							value={newBotId}
							onChange={(e) => setNewBotId(e.target.value)}
							className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
							style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
						/>
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
						<label className="block text-xs font-medium text-(--text)">Owners (comma-separated)</label>
						<input
							type="text"
							placeholder="owner1_id, owner2_id"
							value={newOwnersInput}
							onChange={(e) => setNewOwnersInput(e.target.value)}
							className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
							style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
						/>
					</div>
					<div className="flex items-center justify-between pt-1">
						<div className="flex flex-col">
							<span className="text-xs font-medium text-(--text)">Is Xernerx</span>
							<span className="text-[11px] text-(--text-muted)">Allow fetching data from /secure</span>
						</div>
						<Toggle checked={newIsXernerx} onChange={(e) => setNewIsXernerx(e.target.checked)} size="sm" />
					</div>
					<div className="flex justify-end gap-3 pt-2">
						<Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" variant="primary" disabled={creating}>
							{creating ? 'Creating...' : 'Create Token'}
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
