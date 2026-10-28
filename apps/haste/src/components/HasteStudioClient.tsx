/** @format */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, Code2, Compass, FileCode2, FolderGit2, Globe, KeyRound, Link2, Lock, Plus, Save, Sparkles, Terminal, Trash2 } from 'lucide-react';
import { useDictionary, useEnvironment, useShortcuts, useSidebar, useToast, useUser } from '@xernerx/providers';
import { Button, CodeBlock, Input, Selector } from '@xernerx/ui';
import { formatBytes, HASTE_LANGUAGES } from './hasteConstants';
import { HasteExplorerList } from './HasteExplorerList';

type HasteTab = 'editor' | 'public' | 'mine';

export function HasteStudioClient() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { user } = useUser();
	const { registerShortcut } = useShortcuts();
	const { show, setNavItems, clearNavItems, view, setView } = useSidebar();
	const router = useRouter();
	const searchParams = useSearchParams();

	const activeTab: HasteTab = view === 'public' || view === 'mine' ? view : 'editor';
	const setActiveTab = useCallback(
		(tab: HasteTab) => {
			setView(tab);
		},
		[setView]
	);
	const [title, setTitle] = useState('');
	const [language, setLanguage] = useState('typescript');
	const [privacy, setPrivacy] = useState<'public' | 'limited' | 'private'>('limited');
	const [expiresIn, setExpiresIn] = useState<'1h' | '24h' | '7d' | '30d' | 'never'>('7d');
	const [content, setContent] = useState('');
	const [saving, setSaving] = useState(false);

	// Register sidebar tabs
	useEffect(() => {
		show();
		setNavItems([
			{
				label: t('haste.tabs.editor'),
				icon: Plus,
				view: 'editor',
				category: t('haste.sidebar.title'),
			},
			{
				label: t('haste.tabs.public'),
				icon: Compass,
				view: 'public',
				category: t('haste.sidebar.title'),
			},
			{
				label: t('haste.tabs.mine'),
				icon: FolderGit2,
				view: 'mine',
				category: t('haste.sidebar.title'),
			},
		]);
		if (!view || !['editor', 'public', 'mine'].includes(view)) {
			setView('editor');
		}
		return () => clearNavItems();
	}, [clearNavItems, setNavItems, setView, show, t, view]);

	// Load forked document if ?fork=<id> is provided
	const forkId = searchParams.get('fork');
	useEffect(() => {
		if (!forkId) return;
		let cancelled = false;
		async function loadFork() {
			try {
				const url = getEnvUrl(`https://api.xernerx.com/v1/haste/${encodeURIComponent(forkId!)}`);
				const res = await fetch(url, {
					headers: user?.userId ? { 'x-user-id': user.userId } : undefined,
				});
				const json = await res.json();
				if (!cancelled && res.ok && json.data?.content) {
					setTitle(json.data.title ? `${json.data.title} (Fork)` : '');
					setLanguage(json.data.language || 'typescript');
					setContent(json.data.content);
					setActiveTab('editor');
				}
			} catch {
				// Ignore fork load errors
			}
		}
		void loadFork();
		return () => {
			cancelled = true;
		};
	}, [forkId, getEnvUrl, user?.userId]);

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
		if (!user?.userId) {
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
					'x-user-id': user.userId,
				},
				body: JSON.stringify({
					userId: user.userId,
					title: title.trim(),
					content,
					language,
					privacy,
					expiresIn,
				}),
			});
			const json = await res.json();
			if (res.ok && json.key) {
				toast({
					title: t('haste.toasts.createdTitle'),
					description: t('haste.toasts.createdDescription'),
					type: 'success',
				});
				router.push(`/${json.key}`);
			} else {
				toast({
					title: t('haste.toasts.errorTitle'),
					description: json.message || t('haste.toasts.createFailedDescription'),
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
	}, [content, expiresIn, language, privacy, router, saving, t, title, toast, user?.userId]);

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
	const exampleUserId = user?.userId || 'YOUR_XERNERX_USER_ID';

	const apiSnippetTabs = useMemo(
		() => [
			{
				id: 'commands',
				label: '@xernerx/commands',
				language: 'typescript',
				code: `// Drop-in Hastebin URL with your Xernerx User ID (from client.owners)\nconst ownerId = client.owners?.[0] ?? '${exampleUserId}';\nconst hasteUrl = \`https://haste.xernerx.com/documents/\${ownerId}\`;\n\nconst response = await fetch(hasteUrl, {\n\tmethod: 'POST',\n\tbody: content,\n});\nconst { key } = await response.json();\nconsole.log(\`https://haste.xernerx.com/\${key}\`);`,
			},
			{
				id: 'rest',
				label: 'REST API (v1)',
				language: 'typescript',
				code: `const response = await fetch('https://api.xernerx.com/v1/haste', {\n\tmethod: 'POST',\n\theaders: { 'Content-Type': 'application/json' },\n\tbody: JSON.stringify({\n\t\tuserId: '${exampleUserId}',\n\t\ttitle: 'Eval Output',\n\t\tlanguage: 'typescript',\n\t\tprivacy: 'limited',\n\t\texpiresIn: '7d',\n\t\tcontent: 'console.log("Hello Xernerx Haste!");',\n\t}),\n});\nconst { key, url, rawUrl } = await response.json();`,
			},
			{
				id: 'curl',
				label: 'cURL',
				language: 'bash',
				code: `curl -X POST "https://haste.xernerx.com/documents/${exampleUserId}?language=typescript&expiresIn=7d" \\\n  -H "Content-Type: text/plain" \\\n  --data-binary "console.log('Hello from Xernerx Haste!');"`,
			},
		],
		[exampleUserId]
	);

	return (
		<div className="flex flex-col w-full max-w-7xl mx-auto" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			{/* Hero Header */}
			<div
				className="flex flex-col lg:flex-row items-start lg:items-center justify-between rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex items-start" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_25%,transparent)]">
						<FileCode2 className="w-7 h-7" />
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<div className="flex items-center flex-wrap gap-2">
							<h1 className="text-2xl sm:text-3xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('haste.hero.title')}
							</h1>
							<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/15 text-(--accent) border border-(--accent)/30 px-3 py-0.5 text-xs font-bold">
								<Sparkles className="w-3.5 h-3.5" />
								{t('haste.hero.badge')}
							</span>
						</div>
						<p className="text-sm text-(--text-muted) max-w-2xl">{t('haste.hero.subtitle')}</p>
					</div>
				</div>

				{/* Mode Switcher Pills */}
				<div className="flex items-center flex-wrap rounded-2xl bg-(--background)/60 border border-(--border)/10 p-1.5 shrink-0" style={{ gap: 'calc(var(--ui-gap) * 0.35)' }}>
					<Button variant={activeTab === 'editor' ? 'primary' : 'secondary'} size="sm" className="rounded-xl px-3.5 py-2" onClick={() => setActiveTab('editor')}>
						<Plus className="w-4 h-4 mr-1.5" />
						{t('haste.tabs.editor')}
					</Button>
					<Button variant={activeTab === 'public' ? 'primary' : 'secondary'} size="sm" className="rounded-xl px-3.5 py-2" onClick={() => setActiveTab('public')}>
						<Compass className="w-4 h-4 mr-1.5" />
						{t('haste.tabs.public')}
					</Button>
					<Button variant={activeTab === 'mine' ? 'primary' : 'secondary'} size="sm" className="rounded-xl px-3.5 py-2" onClick={() => setActiveTab('mine')}>
						<FolderGit2 className="w-4 h-4 mr-1.5" />
						{t('haste.tabs.mine')}
					</Button>
				</div>
			</div>

			{activeTab === 'public' && <HasteExplorerList mode="public" />}
			{activeTab === 'mine' && <HasteExplorerList mode="mine" />}

			{activeTab === 'editor' && (
				<>
					{/* Unauthenticated Notice Banner */}
					{!user?.userId && (
						<div
							className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--accent)/30"
							style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
						>
							<div className="flex items-center" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent)">
									<KeyRound className="w-5 h-5" />
								</div>
								<div className="flex flex-col">
									<span className="text-sm font-bold text-(--text)">{t('haste.authBanner.title')}</span>
									<span className="text-xs text-(--text-muted)">{t('haste.authBanner.description')}</span>
								</div>
							</div>
							<Button
								variant="primary"
								size="sm"
								className="rounded-2xl px-4 py-2 shrink-0"
								onClick={() => {
									window.location.href = getEnvUrl('https://account.xernerx.com');
								}}
							>
								{t('haste.authBanner.signInCta')}
							</Button>
						</div>
					)}

					{/* Editor Metadata Bar */}
					<div
						className="grid grid-cols-1 md:grid-cols-12 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm"
						style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
					>
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
					<div
						className="flex flex-col rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm"
						style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
					>
						<div className="flex items-center justify-between flex-wrap gap-2">
							<div className="flex items-center gap-3 text-xs text-(--text-muted) font-mono">
								<span className="px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-(--text)">{t('haste.editor.linesCount', { count: lineCount })}</span>
								<span className="px-2.5 py-1 rounded-full bg-(--background)/60 border border-(--border)/10">{formatBytes(byteSize)} / 512 KB</span>
							</div>

							<div className="flex items-center gap-2">
								{content.length > 0 && (
									<Button
										variant="secondary"
										size="sm"
										className="rounded-2xl px-3 py-2"
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
									className="rounded-2xl px-5 py-2 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
									onClick={() => void handleSaveHaste()}
									disabled={saving || !content.trim()}
								>
									<Save className="w-4 h-4 mr-1.5" />
									{saving ? t('haste.actions.publishing') : t('haste.actions.publish')}
								</Button>
							</div>
						</div>

						<Input
							variant="textarea"
							rows={18}
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder={t('haste.editor.contentPlaceholder')}
							className="font-mono text-sm leading-relaxed min-h-[420px] bg-(--background)/60 border border-(--border)/10 resize-y"
							spellCheck={false}
						/>
					</div>

					{/* Programmatic Bot / CLI Integration Card */}
					<div
						className="flex flex-col rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10"
						style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
					>
						<div className="flex items-center justify-between flex-wrap gap-2">
							<div className="flex items-center gap-2.5">
								<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent)">
									<Terminal className="w-4 h-4" />
								</div>
								<div className="flex flex-col">
									<h2 className="text-base font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
										{t('haste.integration.title')}
									</h2>
									<p className="text-xs text-(--text-muted)">{t('haste.integration.subtitle')}</p>
								</div>
							</div>
							{user?.userId && (
								<span className="inline-flex items-center gap-1.5 rounded-full bg-(--background)/60 border border-(--border)/10 px-3 py-1 text-xs font-mono text-(--text-muted)">
									<span>userId:</span>
									<strong className="text-(--accent)">{user.userId}</strong>
								</span>
							)}
						</div>

						<CodeBlock tabs={apiSnippetTabs} />
					</div>
				</>
			)}
		</div>
	);
}
