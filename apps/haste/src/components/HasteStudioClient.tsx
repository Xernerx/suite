/** @format */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Clock, Code2, FileCode2, FolderGit2, Globe, Link2, Lock, Plus, Save, Trash2 } from 'lucide-react';
import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment, useShortcuts, useSidebar, useToast, useUser } from '@xernerx/providers';
import { Button, Input, Selector } from '@xernerx/ui';
import { formatBytes, HASTE_LANGUAGES } from './hasteConstants';
import { HasteExplorerList } from './HasteExplorerList';

type HasteTab = 'editor' | 'mine';

export function HasteStudioClient() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();
	const { user } = useUser();
	const { data: session, status } = useSession();
	const { registerShortcut } = useShortcuts();
	const { show, setNavItems, clearNavItems, view, setView } = useSidebar();
	const router = useRouter();
	const searchParams = useSearchParams();

	const effectiveUserId = user?.userId || (session?.user as any)?.id || '';
	const activeTab: HasteTab = view === 'mine' ? 'mine' : 'editor';

	const [title, setTitle] = useState('');
	const [language, setLanguage] = useState('typescript');
	const [privacy, setPrivacy] = useState<'public' | 'limited' | 'private'>('limited');
	const [expiresIn, setExpiresIn] = useState<'1h' | '24h' | '7d' | '30d' | 'never'>('7d');
	const [content, setContent] = useState('');
	const [saving, setSaving] = useState(false);

	// Redirect unauthenticated users to Account Login
	useEffect(() => {
		if (status === 'unauthenticated' && isReady) {
			window.location.href = `${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(window.location.href)}`;
		}
	}, [getEnvUrl, isReady, status]);

	// Sync initial ?view= query param if provided
	const requestedView = searchParams.get('view');
	useEffect(() => {
		if (requestedView === 'mine' || requestedView === 'editor') {
			setView(requestedView);
		}
	}, [requestedView, setView]);

	// Register sidebar navigation items
	useEffect(() => {
		if (status !== 'authenticated') return;
		show();
		setNavItems([
			{
				label: t('haste.tabs.editor'),
				icon: Plus,
				view: 'editor',
				category: t('haste.sidebar.title'),
			},
			{
				label: t('haste.tabs.mine'),
				icon: FolderGit2,
				view: 'mine',
				category: t('haste.sidebar.title'),
			},
		]);
		if (!view || !['editor', 'mine'].includes(view)) {
			setView('editor');
		}
		return () => clearNavItems();
	}, [clearNavItems, setNavItems, setView, show, status, t, view]);

	// Load forked document if ?fork=<id> is provided
	const forkId = searchParams.get('fork');
	useEffect(() => {
		if (!forkId || !isReady || status !== 'authenticated') return;
		let cancelled = false;
		async function loadFork() {
			try {
				const cleanForkId = forkId!.split('.')[0] || forkId!;
				const query = effectiveUserId ? `?userId=${encodeURIComponent(effectiveUserId)}` : '';
				const url = getEnvUrl(`https://api.xernerx.com/v1/haste/${encodeURIComponent(cleanForkId)}${query}`);
				const res = await fetch(url, {
					headers: effectiveUserId ? { 'x-user-id': effectiveUserId } : undefined,
				});
				const json = await res.json();
				const docData = json?.data || (json?.id ? json : null);
				if (!cancelled && res.ok && docData?.content) {
					setTitle(docData.title ? `${docData.title} (Fork)` : '');
					setLanguage(docData.language || 'typescript');
					setContent(docData.content);
					setView('editor');
				}
			} catch {
				// Ignore fork load errors
			}
		}
		void loadFork();
		return () => {
			cancelled = true;
		};
	}, [effectiveUserId, forkId, getEnvUrl, isReady, setView, status]);

	const languageOptions = useMemo(() => HASTE_LANGUAGES.map((item) => ({ value: item.value, label: item.label })), []);

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

	const handleSaveHaste = useCallback(async () => {
		if (saving) return;
		if (!effectiveUserId) {
			toast({
				title: t('haste.toasts.authRequiredTitle'),
				description: t('haste.toasts.authRequiredDescription'),
				type: 'warning',
			});
			return;
		}
		if (!content.trim()) {
			toast({
				title: t('haste.toasts.emptyContentTitle'),
				description: t('haste.toasts.emptyContentDescription'),
				type: 'warning',
			});
			return;
		}

		setSaving(true);
		try {
			const res = await fetch('/documents', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-user-id': effectiveUserId,
				},
				body: JSON.stringify({
					userId: effectiveUserId,
					title: title.trim(),
					content,
					language,
					privacy,
					expiresIn,
				}),
			});
			const json = await res.json();
			const createdKey = json?.key || json?.id || json?.data?.key || json?.data?.id;
			if (res.ok && createdKey) {
				toast({
					title: t('haste.toasts.createdTitle'),
					description: t('haste.toasts.createdDescription'),
					type: 'success',
				});
				router.push(`/${createdKey}`);
			} else {
				toast({
					title: t('haste.toasts.errorTitle'),
					description: json?.error || json?.message || t('haste.toasts.createFailedDescription'),
					type: 'error',
				});
			}
		} catch {
			toast({
				title: t('haste.toasts.errorTitle'),
				description: t('haste.toasts.createFailedDescription'),
				type: 'error',
			});
		} finally {
			setSaving(false);
		}
	}, [content, effectiveUserId, expiresIn, language, privacy, router, saving, t, title, toast]);

	// Register Ctrl+S / Ctrl+Enter shortcut to publish haste
	useEffect(() => {
		registerShortcut({
			key: 'Ctrl + S',
			description: 'haste.shortcuts.publishHaste',
			icon: Save,
		});

		const onKeyDown = (e: KeyboardEvent) => {
			if (activeTab !== 'editor') return;
			if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 's' || e.key === 'Enter')) {
				e.preventDefault();
				void handleSaveHaste();
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [activeTab, handleSaveHaste, registerShortcut]);

	const byteSize = useMemo(() => new TextEncoder().encode(content).length, [content]);
	const lineCount = useMemo(() => (content ? content.split(/\r?\n/).length : 1), [content]);

	if (status === 'loading' || status === 'unauthenticated' || !isReady) {
		return <Loading />;
	}

	return (
		<div className="flex flex-col w-full max-w-(--page-width) mx-auto" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			{activeTab === 'mine' ? (
				<HasteExplorerList />
			) : (
				<div
					className="flex flex-col rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_10%,transparent)]"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					{/* Studio Header Row */}
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-(--border)/10 pb-4" style={{ gap: 'var(--ui-gap)' }}>
						<div className="flex items-center" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
							<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
								<FileCode2 className="w-6 h-6" />
							</div>
							<div className="flex flex-col">
								<h1 className="text-xl sm:text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('haste.hero.title')}
								</h1>
								<p className="text-xs sm:text-sm text-(--text-muted)">{t('haste.hero.subtitle')}</p>
							</div>
						</div>

						<div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
							{content.length > 0 && (
								<Button
									variant="secondary"
									size="sm"
									className="rounded-2xl px-3.5 py-2"
									onClick={() => {
										setContent('');
										setTitle('');
									}}
								>
									<Trash2 className="w-4 h-4 mr-1.5" />
									{t('haste.actions.clear')}
								</Button>
							)}
							<Button
								variant="primary"
								size="sm"
								className="rounded-2xl px-5 py-2.5 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
								onClick={() => void handleSaveHaste()}
								disabled={saving || !content.trim()}
							>
								<Save className="w-4 h-4 mr-1.5" />
								{saving ? t('haste.actions.publishing') : t('haste.actions.publish')}
							</Button>
						</div>
					</div>

					{/* Metadata Controls */}
					<div className="grid grid-cols-1 md:grid-cols-12" style={{ gap: 'var(--ui-gap)' }}>
						<div className="md:col-span-4 flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.35)' }}>
							<label className="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-1.5">
								<FileCode2 className="w-3.5 h-3.5 text-(--accent)" />
								{t('haste.editor.titleLabel')}
							</label>
							<Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('haste.editor.titlePlaceholder')} maxLength={120} />
						</div>

						<div className="md:col-span-3 flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.35)' }}>
							<label className="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-1.5">
								<Code2 className="w-3.5 h-3.5 text-(--accent)" />
								{t('haste.editor.languageLabel')}
							</label>
							<Selector value={language} options={languageOptions} onChange={setLanguage} />
						</div>

						<div className="md:col-span-3 flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.35)' }}>
							<label className="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-1.5">
								{privacy === 'public' ? (
									<Globe className="w-3.5 h-3.5 text-(--accent-green)" />
								) : privacy === 'limited' ? (
									<Link2 className="w-3.5 h-3.5 text-(--accent)" />
								) : (
									<Lock className="w-3.5 h-3.5 text-(--accent-orange)" />
								)}
								{t('haste.editor.privacyLabel')}
							</label>
							<Selector value={privacy} options={privacyOptions} onChange={(val) => setPrivacy(val as 'public' | 'limited' | 'private')} />
						</div>

						<div className="md:col-span-2 flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.35)' }}>
							<label className="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-1.5">
								<Clock className="w-3.5 h-3.5 text-(--accent)" />
								{t('haste.editor.expirationLabel')}
							</label>
							<Selector value={expiresIn} options={expirationOptions} onChange={(val) => setExpiresIn(val as '1h' | '24h' | '7d' | '30d' | 'never')} />
						</div>
					</div>

					{/* Code Editor Surface */}
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Input
							variant="textarea"
							rows={20}
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder={t('haste.editor.contentPlaceholder')}
							className="font-mono text-sm leading-relaxed min-h-[460px] bg-(--background)/60 border border-(--border)/10 resize-y"
							spellCheck={false}
						/>

						<div className="flex items-center justify-between flex-wrap gap-2 text-xs text-(--text-muted) font-mono pt-1">
							<div className="flex items-center gap-2">
								<span className="px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-(--text)">{t('haste.editor.linesCount', { count: lineCount })}</span>
								<span className="px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10">{formatBytes(byteSize)} / 512 KB</span>
							</div>
							<span className="text-[11px] text-(--text-muted)">Ctrl + S</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
