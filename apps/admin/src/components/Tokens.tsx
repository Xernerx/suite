/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button, Input } from '@xernerx/ui';
import { Plus } from 'lucide-react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useEffect, useMemo, useState } from 'react';
import { Loading } from '@xernerx/feedback';
import type { Token } from './tokens/types';
import { TokenCard } from './tokens/TokenCard';
import { CreateTokenModal } from './tokens/CreateTokenModal';

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
	const [newWebsocket, setNewWebsocket] = useState(false);
	const [creating, setCreating] = useState(false);

	useEffect(() => {
		const fetchTokens = async () => {
			setLoading(true);
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/tokens?admin=true'), {
					credentials: 'include',
				});
				if (!res.ok) throw new Error(t('admin.tokens.toast.fetchFailed'));
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
						websocket: newWebsocket,
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
				setNewWebsocket(false);
				toast({
					type: 'success',
					title: t('admin.tokens.toast.createSuccess'),
				});
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || 'Unknown error');
			}
		} catch (err: any) {
			console.error('Failed to create token:', err);
			toast({
				type: 'error',
				title: t('admin.tokens.toast.createError'),
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
						setNewWebsocket(false);
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
			<CreateTokenModal
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				newName={newName}
				setNewName={setNewName}
				newStatus={newStatus}
				setNewStatus={setNewStatus}
				newBotId={newBotId}
				setNewBotId={setNewBotId}
				newSelectedOwners={newSelectedOwners}
				setNewSelectedOwners={setNewSelectedOwners}
				newSecure={newSecure}
				setNewSecure={setNewSecure}
				newWebsocket={newWebsocket}
				setNewWebsocket={setNewWebsocket}
				getEnvUrl={getEnvUrl}
				onSubmit={handleCreate}
				creating={creating}
			/>
		</div>
	);
}
