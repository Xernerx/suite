/** @format */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Check, Clock, Code2, Copy, Download, ExternalLink, Eye, FileCode2, FolderGit2, GitFork, Globe, Link2, Lock, Plus, Trash2, User } from 'lucide-react';
import { Loading, NotFound } from '@xernerx/feedback';
import { useDictionary, useEnvironment, useSidebar, useToast, useUser } from '@xernerx/providers';
import { Button, CodeBlock, Confirm, Selector } from '@xernerx/ui';
import { formatBytes, HASTE_FILE_EXTENSION_MAP, type HasteDocumentItem } from './hasteConstants';

interface HasteDocumentViewerProps {
	id: string;
}

export function HasteDocumentViewer({ id }: HasteDocumentViewerProps) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();
	const { user } = useUser();
	const { data: session, status } = useSession();
	const { show, hide, setNavItems, clearNavItems } = useSidebar();
	const router = useRouter();

	const effectiveUserId = user?.userId || (session?.user as any)?.id || '';

	const [doc, setDoc] = useState<HasteDocumentItem | null>(null);
	const [loading, setLoading] = useState(true);
	const [redirectingToLogin, setRedirectingToLogin] = useState(false);
	const [copiedCode, setCopiedCode] = useState(false);
	const [copiedLink, setCopiedLink] = useState(false);
	const [updatingMeta, setUpdatingMeta] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	// Configure sidebar for authenticated users; hide for unauthenticated viewers
	useEffect(() => {
		if (status === 'authenticated') {
			show();
			setNavItems([
				{
					label: t('haste.tabs.editor'),
					icon: Plus,
					onClick: () => router.push('/?view=editor'),
					category: t('haste.sidebar.title'),
				},
				{
					label: t('haste.tabs.mine'),
					icon: FolderGit2,
					onClick: () => router.push('/?view=mine'),
					category: t('haste.sidebar.title'),
				},
			]);
		} else if (status === 'unauthenticated') {
			hide();
			clearNavItems();
		}
		return () => clearNavItems();
	}, [clearNavItems, hide, router, setNavItems, show, status, t]);

	const fetchDocument = useCallback(async () => {
		if (!isReady || status === 'loading') return;
		setLoading(true);
		try {
			const cleanId = id.split('.')[0] || id;
			const query = effectiveUserId ? `?userId=${encodeURIComponent(effectiveUserId)}` : '';
			const url = getEnvUrl(`https://api.xernerx.com/v1/haste/${encodeURIComponent(cleanId)}${query}`);
			const res = await fetch(url, {
				headers: effectiveUserId ? { 'x-user-id': effectiveUserId } : undefined,
				cache: 'no-store',
			});
			const json = await res.json().catch(() => null);
			const docData = json?.data || (json?.id ? json : null);

			if (res.ok && docData) {
				setDoc(docData);
			} else if (res.status === 403 && status === 'unauthenticated') {
				setRedirectingToLogin(true);
				window.location.href = `${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(window.location.href)}`;
				return;
			} else {
				setDoc(null);
			}
		} catch {
			setDoc(null);
		} finally {
			setLoading(false);
		}
	}, [effectiveUserId, getEnvUrl, id, isReady, status]);

	useEffect(() => {
		void fetchDocument();
	}, [fetchDocument]);

	const privacyOptions = useMemo(
		() => [
			{ value: 'limited', label: t('haste.privacy.limitedOption') },
			{ value: 'public', label: t('haste.privacy.publicOption') },
			{ value: 'private', label: t('haste.privacy.privateOption') },
		],
		[t]
	);

	const expirationOptions = useMemo(
		() => [
			{ value: '1h', label: t('haste.expiration.1h') },
			{ value: '24h', label: t('haste.expiration.24h') },
			{ value: '7d', label: t('haste.expiration.7d') },
			{ value: '30d', label: t('haste.expiration.30d') },
			{ value: 'never', label: t('haste.expiration.never') },
		],
		[t]
	);

	const handleCopyCode = () => {
		if (!doc?.content) return;
		navigator.clipboard.writeText(doc.content);
		setCopiedCode(true);
		toast({
			title: t('haste.toasts.copiedTitle'),
			description: t('haste.toasts.copiedCodeDescription'),
			type: 'success',
		});
		setTimeout(() => setCopiedCode(false), 2000);
	};

	const handleCopyLink = () => {
		if (!doc) return;
		const url = getEnvUrl(`https://haste.xernerx.com/${doc.id}`);
		navigator.clipboard.writeText(url);
		setCopiedLink(true);
		toast({
			title: t('haste.toasts.copiedTitle'),
			description: t('haste.toasts.copiedLinkDescription'),
			type: 'success',
		});
		setTimeout(() => setCopiedLink(false), 2000);
	};

	const handleDownload = () => {
		if (!doc?.content) return;
		const ext = HASTE_FILE_EXTENSION_MAP[doc.language] || 'txt';
		const filename = `${doc.id}.${ext}`;
		const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(link.href);
	};

	const handleUpdateMetadata = async (patch: { privacy?: 'public' | 'limited' | 'private'; expiresIn?: '1h' | '24h' | '7d' | '30d' | 'never' }) => {
		if (!doc || !effectiveUserId || updatingMeta) return;
		setUpdatingMeta(true);
		try {
			const url = getEnvUrl(`https://api.xernerx.com/v1/haste/${doc.id}`);
			const res = await fetch(url, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'x-user-id': effectiveUserId,
				},
				body: JSON.stringify({
					userId: effectiveUserId,
					...patch,
				}),
			});
			const json = await res.json();
			const updated = json?.data || (json?.id ? json : null);
			if (res.ok && updated) {
				setDoc((prev) => (prev ? { ...prev, ...updated } : prev));
				toast({
					title: t('haste.toasts.updatedTitle'),
					description: t('haste.toasts.updatedDescription'),
					type: 'success',
				});
			} else {
				toast({
					title: t('haste.toasts.errorTitle'),
					description: json?.error || json?.message || t('haste.toasts.updateFailedDescription'),
					type: 'error',
				});
			}
		} catch {
			toast({
				title: t('haste.toasts.errorTitle'),
				description: t('haste.toasts.updateFailedDescription'),
				type: 'error',
			});
		} finally {
			setUpdatingMeta(false);
		}
	};

	const handleDelete = async () => {
		if (!doc || !effectiveUserId) return;
		setDeleteLoading(true);
		try {
			const url = getEnvUrl(`https://api.xernerx.com/v1/haste/${doc.id}?userId=${encodeURIComponent(effectiveUserId)}`);
			const res = await fetch(url, {
				method: 'DELETE',
				headers: { 'x-user-id': effectiveUserId },
			});
			if (res.ok) {
				toast({
					title: t('haste.toasts.deletedTitle'),
					description: t('haste.toasts.deletedDescription'),
					type: 'success',
				});
				router.push('/');
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
			setDeleteModalOpen(false);
		}
	};

	const isOwner = Boolean(doc && (doc.isOwner || (effectiveUserId && effectiveUserId === doc.userId)));
	const linesCount = useMemo(() => (doc?.content ? doc.content.split(/\r?\n/).length : 0), [doc]);
	const authorDisplayName = doc?.author?.globalName || doc?.author?.username || doc?.author?.name || null;

	if (!isReady || status === 'loading' || loading || redirectingToLogin) {
		return <Loading />;
	}

	if (!doc) {
		return <NotFound />;
	}

	return (
		<div className="flex flex-col w-full max-w-(--page-width) mx-auto" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div
				className="flex flex-col rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_10%,transparent)]"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				{/* Header & Action Toolbar */}
				<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex items-start min-w-0" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
						{status === 'authenticated' && (
							<Link href="/">
								<Button variant="secondary" size="icon" className="rounded-2xl h-11 w-11 shrink-0">
									<ArrowLeft className="w-5 h-5" />
								</Button>
							</Link>
						)}
						<div className="flex flex-col min-w-0" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
							<div className="flex items-center flex-wrap gap-2">
								<h1 className="text-xl sm:text-2xl font-bold text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{doc.title || `${doc.id}.${HASTE_FILE_EXTENSION_MAP[doc.language] || 'txt'}`}
								</h1>
								<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/15 text-(--accent) border border-(--accent)/30 px-2.5 py-0.5 text-xs font-mono font-bold">
									<Code2 className="w-3.5 h-3.5" />
									{doc.language}
								</span>
								{doc.privacy === 'public' ? (
									<span className="inline-flex items-center gap-1 rounded-full bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/30 px-2.5 py-0.5 text-xs font-bold">
										<Globe className="w-3.5 h-3.5" />
										{t('haste.privacy.public')}
									</span>
								) : doc.privacy === 'limited' ? (
									<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/15 text-(--accent) border border-(--accent)/30 px-2.5 py-0.5 text-xs font-bold">
										<Link2 className="w-3.5 h-3.5" />
										{t('haste.privacy.limited')}
									</span>
								) : (
									<span className="inline-flex items-center gap-1 rounded-full bg-(--accent-orange)/15 text-(--accent-orange) border border-(--accent-orange)/30 px-2.5 py-0.5 text-xs font-bold">
										<Lock className="w-3.5 h-3.5" />
										{t('haste.privacy.private')}
									</span>
								)}
							</div>

							<div className="flex items-center flex-wrap gap-3 text-xs text-(--text-muted)">
								<span className="font-mono text-(--text) font-semibold">#{doc.id}</span>
								{authorDisplayName && (
									<span className="inline-flex items-center gap-1">
										<User className="w-3.5 h-3.5 text-(--accent)" />
										{authorDisplayName}
									</span>
								)}
								<span className="inline-flex items-center gap-1">
									<Eye className="w-3.5 h-3.5 text-(--accent)" />
									{t('haste.viewer.viewsCount', { count: doc.views })}
								</span>
								<span>{t('haste.editor.linesCount', { count: linesCount })}</span>
								<span>{formatBytes(doc.size)}</span>
								<span className="inline-flex items-center gap-1">
									<Clock className="w-3.5 h-3.5" />
									{doc.expiresAt ? t('haste.viewer.expiresOn', { date: new Date(doc.expiresAt).toLocaleString() }) : t('haste.expiration.never')}
								</span>
							</div>
						</div>
					</div>

					{/* Primary Action Toolbar */}
					<div className="flex items-center flex-wrap gap-2 shrink-0">
						<Button variant="secondary" size="sm" className="rounded-2xl px-3.5 py-2" onClick={handleCopyCode}>
							{copiedCode ? <Check className="w-4 h-4 mr-1.5 text-(--accent-green)" /> : <Copy className="w-4 h-4 mr-1.5" />}
							{t('haste.actions.copyCode')}
						</Button>
						<Button variant="secondary" size="sm" className="rounded-2xl px-3.5 py-2" onClick={handleCopyLink}>
							{copiedLink ? <Check className="w-4 h-4 mr-1.5 text-(--accent-green)" /> : <Link2 className="w-4 h-4 mr-1.5" />}
							{t('haste.actions.copyLink')}
						</Button>
						<Link href={`/raw/${doc.id}`} target="_blank">
							<Button variant="secondary" size="sm" className="rounded-2xl px-3.5 py-2">
								<ExternalLink className="w-4 h-4 mr-1.5" />
								{t('haste.actions.raw')}
							</Button>
						</Link>
						<Button variant="secondary" size="sm" className="rounded-2xl px-3.5 py-2" onClick={handleDownload}>
							<Download className="w-4 h-4 mr-1.5" />
							{t('haste.actions.download')}
						</Button>
						<Link href={`/?fork=${doc.id}`}>
							<Button variant="primary" size="sm" className="rounded-2xl px-4 py-2">
								<GitFork className="w-4 h-4 mr-1.5" />
								{t('haste.actions.fork')}
							</Button>
						</Link>
					</div>
				</div>

				{/* Owner Management Row */}
				{isOwner && (
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-(--border)/10" style={{ gap: 'var(--ui-gap)' }}>
						<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-1.5">
							<FileCode2 className="w-3.5 h-3.5 text-(--accent)" />
							{t('haste.viewer.ownerControls')}
						</span>
						<div className="flex items-center flex-wrap gap-2.5">
							<div className="w-48">
								<Selector value={doc.privacy} options={privacyOptions} onChange={(val) => void handleUpdateMetadata({ privacy: val as 'public' | 'limited' | 'private' })} />
							</div>
							<div className="w-44">
								<Selector
									value={doc.expiresIn}
									options={expirationOptions}
									onChange={(val) => void handleUpdateMetadata({ expiresIn: val as '1h' | '24h' | '7d' | '30d' | 'never' })}
								/>
							</div>
							<Button variant="danger" size="sm" className="rounded-2xl px-3.5 py-2.5" onClick={() => setDeleteModalOpen(true)}>
								<Trash2 className="w-4 h-4 mr-1.5" />
								{t('haste.actions.delete')}
							</Button>
						</div>
					</div>
				)}

				{/* Document Code Display */}
				<div className="pt-1">
					<CodeBlock
						tabs={[
							{
								id: doc.id,
								label: `${doc.id}.${HASTE_FILE_EXTENSION_MAP[doc.language] || 'txt'}`,
								language: doc.language || 'plaintext',
								code: doc.content || '',
							},
						]}
					/>
				</div>
			</div>

			<Confirm
				open={deleteModalOpen}
				onOpenChange={setDeleteModalOpen}
				title={t('haste.confirmDelete.title')}
				description={t('haste.confirmDelete.description')}
				confirmText={t('haste.confirmDelete.confirm')}
				cancelText={t('haste.confirmDelete.cancel')}
				variant="danger"
				loading={deleteLoading}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
