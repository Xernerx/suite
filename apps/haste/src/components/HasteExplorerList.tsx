/** @format */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Code2, Copy, ExternalLink, Eye, FileCode2, Globe, Link2, Lock, RefreshCw, Trash2 } from 'lucide-react';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import { Button, Confirm, Input, Selector } from '@xernerx/ui';
import { formatBytes, HASTE_LANGUAGES, type HasteDocumentItem } from './hasteConstants';

interface HasteExplorerListProps {
	mode: 'public' | 'mine';
}

export function HasteExplorerList({ mode }: HasteExplorerListProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { user } = useUser();

	const [documents, setDocuments] = useState<HasteDocumentItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [languageFilter, setLanguageFilter] = useState('all');
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const languageOptions = useMemo(() => [{ value: 'all', label: t('haste.explorer.allLanguages') }, ...HASTE_LANGUAGES.map((lang) => ({ value: lang.value, label: lang.label }))], [t]);

	const fetchDocuments = useCallback(async () => {
		if (mode === 'mine' && !user?.userId) {
			setDocuments([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set('limit', '50');
			if (mode === 'mine' && user?.userId) {
				params.set('mine', 'true');
				params.set('userId', user.userId);
			}
			if (searchQuery.trim()) {
				params.set('search', searchQuery.trim());
			}
			if (languageFilter && languageFilter !== 'all') {
				params.set('language', languageFilter);
			}

			const url = getEnvUrl(`https://api.xernerx.com/v1/haste?${params.toString()}`);
			const res = await fetch(url, {
				headers: user?.userId ? { 'x-user-id': user.userId } : undefined,
				cache: 'no-store',
			});
			const json = await res.json();
			if (res.ok && json.data?.documents) {
				setDocuments(json.data.documents);
			} else {
				setDocuments([]);
			}
		} catch {
			setDocuments([]);
		} finally {
			setLoading(false);
		}
	}, [getEnvUrl, languageFilter, mode, searchQuery, user?.userId]);

	useEffect(() => {
		const timer = setTimeout(() => {
			void fetchDocuments();
		}, 150);
		return () => clearTimeout(timer);
	}, [fetchDocuments]);

	const handleCopyLink = (id: string) => {
		const link = getEnvUrl(`https://haste.xernerx.com/${id}`);
		navigator.clipboard.writeText(link);
		toast({
			title: t('haste.toasts.copiedTitle'),
			description: t('haste.toasts.copiedLinkDescription'),
			type: 'success',
		});
	};

	const handleDeleteConfirmed = async () => {
		if (!deletingId || !user?.userId) return;
		setDeleteLoading(true);
		try {
			const url = getEnvUrl(`https://api.xernerx.com/v1/haste/${deletingId}?userId=${encodeURIComponent(user.userId)}`);
			const res = await fetch(url, {
				method: 'DELETE',
				headers: { 'x-user-id': user.userId },
			});
			if (res.ok) {
				setDocuments((prev) => prev.filter((doc) => doc.id !== deletingId));
				toast({
					title: t('haste.toasts.deletedTitle'),
					description: t('haste.toasts.deletedDescription'),
					type: 'success',
				});
			} else {
				toast({
					title: t('haste.toasts.errorTitle'),
					description: t('haste.toasts.deleteFailedDescription'),
					type: 'error',
				});
			}
		} catch {
			toast({
				title: t('haste.toasts.errorTitle'),
				description: t('haste.toasts.deleteFailedDescription'),
				type: 'error',
			});
		} finally {
			setDeleteLoading(false);
			setDeletingId(null);
		}
	};

	const renderPrivacyBadge = (privacy: HasteDocumentItem['privacy']) => {
		if (privacy === 'public') {
			return (
				<span className="inline-flex items-center gap-1 rounded-full bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/30 px-2.5 py-0.5 text-[11px] font-bold">
					<Globe className="w-3 h-3" />
					{t('haste.privacy.public')}
				</span>
			);
		}
		if (privacy === 'limited') {
			return (
				<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/15 text-(--accent) border border-(--accent)/30 px-2.5 py-0.5 text-[11px] font-bold">
					<Link2 className="w-3 h-3" />
					{t('haste.privacy.limited')}
				</span>
			);
		}
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-(--accent-orange)/15 text-(--accent-orange) border border-(--accent-orange)/30 px-2.5 py-0.5 text-[11px] font-bold">
				<Lock className="w-3 h-3" />
				{t('haste.privacy.private')}
			</span>
		);
	};

	return (
		<div className="flex flex-col w-full" style={{ gap: 'var(--ui-gap)' }}>
			<div
				className="flex flex-col md:flex-row items-stretch md:items-center justify-between rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex-1 min-w-0">
					<Input
						variant="search"
						shortcut={true}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onSearch={(val) => setSearchQuery(val)}
						placeholder={t('haste.explorer.searchPlaceholder')}
					/>
				</div>
				<div className="flex items-center shrink-0" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<div className="w-48">
						<Selector value={languageFilter} options={languageOptions} onChange={setLanguageFilter} />
					</div>
					<Button variant="secondary" className="rounded-2xl h-11 px-4" onClick={() => void fetchDocuments()} disabled={loading}>
						<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
					</Button>
				</div>
			</div>

			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-(--ui-gap)">
					{[0, 1, 2, 3].map((item) => (
						<div key={item} className="h-44 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 animate-pulse" style={{ padding: 'var(--ui-gap)' }} />
					))}
				</div>
			) : documents.length === 0 ? (
				<div
					className="flex flex-col items-center justify-center text-center rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10"
					style={{ padding: 'calc(var(--ui-gap) * 2.5)', gap: 'calc(var(--ui-gap) * 0.75)' }}
				>
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/10 text-(--accent) border border-(--accent)/20">
						<FileCode2 className="w-7 h-7" />
					</div>
					<h3 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{mode === 'mine' ? t('haste.explorer.emptyMineTitle') : t('haste.explorer.emptyPublicTitle')}
					</h3>
					<p className="text-sm text-(--text-muted) max-w-md">{mode === 'mine' ? t('haste.explorer.emptyMineDescription') : t('haste.explorer.emptyPublicDescription')}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
					{documents.map((doc) => (
						<div
							key={doc.id}
							className="flex flex-col justify-between rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/30 transition-all shadow-sm"
							style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
						>
							<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
								<div className="flex items-start justify-between gap-2">
									<Link
										href={`/${doc.id}`}
										className="text-lg font-bold text-(--text) hover:text-(--accent) transition-colors truncate"
										style={{ fontFamily: 'var(--font-fredoka)' }}
									>
										{doc.title || `${doc.id}.${doc.language}`}
									</Link>
									<div className="flex items-center gap-1.5 shrink-0">
										<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/10 text-(--accent) border border-(--accent)/20 px-2.5 py-0.5 text-[11px] font-mono font-bold">
											<Code2 className="w-3 h-3" />
											{doc.language}
										</span>
										{renderPrivacyBadge(doc.privacy)}
									</div>
								</div>

								{doc.preview && (
									<pre className="rounded-2xl bg-(--background)/60 border border-(--border)/10 p-3 text-xs font-mono text-(--text-muted) overflow-hidden max-h-28 whitespace-pre-wrap break-all">
										{doc.preview}
									</pre>
								)}
							</div>

							<div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-(--border)/10 text-xs text-(--text-muted)">
								<div className="flex items-center flex-wrap gap-3">
									<span className="font-mono text-(--text) font-semibold">#{doc.id}</span>
									<span className="inline-flex items-center gap-1">
										<Eye className="w-3.5 h-3.5 text-(--accent)" />
										{doc.views}
									</span>
									<span>{formatBytes(doc.size)}</span>
									<span className="inline-flex items-center gap-1">
										<Clock className="w-3.5 h-3.5" />
										{new Date(doc.createdAt).toLocaleDateString()}
									</span>
								</div>

								<div className="flex items-center gap-1.5">
									<Button variant="secondary" size="sm" className="rounded-xl px-2.5 py-1.5" onClick={() => handleCopyLink(doc.id)}>
										<Copy className="w-3.5 h-3.5" />
									</Button>
									<Link href={`/${doc.id}`}>
										<Button variant="primary" size="sm" className="rounded-xl px-3 py-1.5">
											<ExternalLink className="w-3.5 h-3.5 mr-1" />
											{t('haste.actions.open')}
										</Button>
									</Link>
									{(mode === 'mine' || doc.isOwner) && (
										<Button variant="danger" size="sm" className="rounded-xl px-2.5 py-1.5" onClick={() => setDeletingId(doc.id)}>
											<Trash2 className="w-3.5 h-3.5" />
										</Button>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			<Confirm
				open={Boolean(deletingId)}
				onOpenChange={(open) => {
					if (!open) setDeletingId(null);
				}}
				title={t('haste.confirmDelete.title')}
				description={t('haste.confirmDelete.description')}
				confirmText={t('haste.confirmDelete.confirm')}
				cancelText={t('haste.confirmDelete.cancel')}
				variant="danger"
				loading={deleteLoading}
				onConfirm={handleDeleteConfirmed}
			/>
		</div>
	);
}
