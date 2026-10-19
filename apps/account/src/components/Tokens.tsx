/** @format */
'use client';

import { AlertTriangle, Key, Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button, Input } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useToast } from '@xernerx/providers';
import { useEffect, useState, useMemo } from 'react';
import { Loading } from '@xernerx/feedback';
import { TokenListInfo } from './tokens/types';
import TokenCard from './tokens/TokenCard';
import CreateTokenModal from './tokens/CreateTokenModal';
import ManageTokenModal from './tokens/ManageTokenModal';

export default function Tokens() {
	const { t } = useDictionary();
	const { data: session } = useSession();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [tokens, setTokens] = useState<TokenListInfo[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

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
				title: t('account.tokens.toast.loadError', {
					error: (error as Error).message,
				}),
				type: 'error',
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchTokens();
	}, []);

	const filteredTokens = useMemo(() => {
		return tokens.filter((token) => {
			if (statusFilter !== 'all' && token.status !== statusFilter) return false;
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return token.name?.toLowerCase().includes(q) || (token.id || token._id)?.toLowerCase().includes(q);
		});
	}, [tokens, searchQuery, statusFilter]);

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
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{
					padding: 'var(--ui-gap)',
					gap: 'var(--ui-gap)',
				}}
			>
				<div
					className="flex items-center"
					style={{
						gap: 'calc(var(--ui-gap) * 0.75)',
					}}
				>
					<div
						className="flex items-center justify-center rounded-2xl bg-(--accent)/10 text-(--accent) shrink-0"
						style={{
							width: 'calc(var(--ui-gap) * 2.5)',
							height: 'calc(var(--ui-gap) * 2.5)',
						}}
					>
						<Key size={24} />
					</div>
					<div
						className="flex flex-col"
						style={{
							gap: 'calc(var(--ui-gap) * 0.25)',
						}}
					>
						<h1
							className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm"
							style={{
								fontFamily: 'var(--font-fredoka)',
							}}
						>
							{t('account.tokens.title')}
						</h1>
						<p className="text-sm text-(--text-muted)">{t('account.tokens.description')}</p>
					</div>
				</div>

				<Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-(--accent) text-white hover:bg-(--accent-hover) rounded-xl px-5 py-2.5">
					<Plus size={16} />
					{t('account.tokens.generateButton')}
				</Button>
			</div>

			{/* Search & Status Filters */}
			{!isLoading && tokens.length > 0 && (
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
					<div className="w-full sm:max-w-sm">
						<Input variant="search" shortcut={true} placeholder={t('account.tokens.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
					</div>
					<div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
						{(['all', 'active', 'inactive'] as const).map((status) => (
							<button
								key={status}
								type="button"
								onClick={() => setStatusFilter(status)}
								className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
									statusFilter === status
										? 'bg-(--accent) text-white border-(--accent) shadow-sm'
										: 'bg-(--foreground)/30 text-(--text-muted) hover:text-(--text) border-(--border)/10'
								}`}
							>
								{status === 'all' ? t('account.tokens.filterAll') : status === 'active' ? t('account.tokens.filterActive') : t('account.tokens.filterInactive')}
							</button>
						))}
					</div>
				</div>
			)}

			{/* List */}
			{isLoading ? (
				<div className="flex h-40 items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm">
					<Loading />
				</div>
			) : tokens.length === 0 ? (
				<div
					className="flex flex-col h-40 items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm text-center px-4"
					style={{
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<AlertTriangle size={32} className="text-(--text-muted)" />
					<p className="text-sm font-medium text-(--text)">{t('account.tokens.empty.title')}</p>
					<p className="text-xs text-(--text-muted) max-w-sm">{t('account.tokens.empty.description')}</p>
				</div>
			) : filteredTokens.length === 0 ? (
				<div className="flex flex-col h-40 items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm text-center px-4">
					<p className="text-sm font-medium text-(--text-muted)">{t('account.tokens.noMatchingTokens')}</p>
				</div>
			) : (
				<div
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
					style={{
						gap: 'var(--ui-gap)',
					}}
				>
					<AnimatePresence>
						{filteredTokens.map((token, i) => (
							<TokenCard key={token.id || token._id} token={token} index={i} onSelect={setSelectedTokenId} />
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
