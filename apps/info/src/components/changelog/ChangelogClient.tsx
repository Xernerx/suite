/** @format */
'use client';

import { useDictionary, useEnvironment, useSidebar, useToast } from '@xernerx/providers';
import { Button, Input, Markdown } from '@xernerx/ui';
import { ExternalLink, LayoutDashboard, Link2, Package, Rss, Tag } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface ChangelogEntry {
	appName: string;
	content: string;
	group?: 'applications' | 'packages';
	docsHref?: string;
}

function toVersionId(headingText: string): string {
	return headingText.replace(/[^a-zA-Z0-9.-]/g, '').replace(/^v/i, '');
}

function normalizeChangelogBody(raw: string): string {
	return raw
		.replace(/^([ \t]*[-*][ \t]*)<!--\s*@format\s*-->[ \t]*\r?\n+[ \t]+/gim, '$1')
		.replace(/^[ \t]*[-*][ \t]*<!--\s*@format\s*-->[ \t]*\r?\n*/gim, '')
		.replace(/<!--\s*@format\s*-->[ \t]*\r?\n*/gi, '')
		.replace(/^([ \t]*[-*][ \t]*)\r?\n+[ \t]+/gm, '$1')
		.replace(/^[ \t]*[-*][ \t]*$\r?\n?/gm, '')
		.replace(/^###[ \t]+(?:Major|Minor|Patch)[ \t]+Changes[ \t]*(?:\r?\n)*(?=#+|\s*$)/gim, '')
		.trim();
}

const REACTION_EMOJIS = ['🔥', '🚀', '❤️', '🎉'] as const;

const CLIENT_APPS = [
	{ id: 'app', name: 'App' },
	{ id: 'portal', name: 'Portal' },
	{ id: 'account', name: 'Account' },
	{ id: 'admin', name: 'Admin' },
	{ id: 'hosting', name: 'Hosting' },
	{ id: 'api', name: 'API' },
	{ id: 'cdn', name: 'CDN' },
	{ id: 'docs', name: 'Docs' },
	{ id: 'info', name: 'Info' },
	{ id: 'store', name: 'Store' },
	{ id: 'haste', name: 'Haste' },
	{ id: 'www', name: 'Website' },
] as const;

export default function ChangelogClient({ changelogs: initialChangelogs }: { changelogs: ChangelogEntry[] }) {
	const { setNavItems, clearNavItems, show, setView, view } = useSidebar();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();

	const [fallbackApps, setFallbackApps] = useState<ChangelogEntry[]>([]);
	const [search, setSearch] = useState('');
	const [groupFilter, setGroupFilter] = useState<'all' | 'applications' | 'packages'>('all');
	const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
	const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
	const [reactedMap, setReactedMap] = useState<Record<string, boolean>>({});
	const hasAppliedUrlParam = useRef(false);

	const changelogs = useMemo(() => {
		const existingNames = new Set(initialChangelogs.map((c) => c.appName.toLowerCase()));
		const missing = fallbackApps.filter((a) => !existingNames.has(a.appName.toLowerCase()));
		if (missing.length === 0) return initialChangelogs;
		const apps = [...initialChangelogs.filter((c) => (c.group || 'applications') === 'applications'), ...missing];
		const pkgs = initialChangelogs.filter((c) => c.group === 'packages');
		return [...apps, ...pkgs];
	}, [initialChangelogs, fallbackApps]);

	useEffect(() => {
		const existingNames = new Set(initialChangelogs.map((c) => c.appName.toLowerCase()));
		const missingApps = CLIENT_APPS.filter((a) => !existingNames.has(a.name.toLowerCase()));
		if (missingApps.length === 0) return;
		let cancelled = false;
		Promise.all(
			missingApps.map(async (app): Promise<ChangelogEntry | null> => {
				try {
					const host = app.id === 'www' ? 'https://xernerx.com' : `https://${app.id}.xernerx.com`;
					const res = await fetch(`${getEnvUrl(host)}/api/changelog?version=all`);
					if (!res.ok) return null;
					const data = await res.json();
					const raw = data?.fullContent || data?.content;
					const cleaned = typeof raw === 'string' ? normalizeChangelogBody(raw.replace(/^#\s+[^\r\n]+\r?\n*/gm, '')) : '';
					return cleaned ? { appName: app.name, content: cleaned, group: 'applications' } : null;
				} catch {
					return null;
				}
			})
		).then((loaded) => {
			if (!cancelled) {
				setFallbackApps(loaded.filter((e): e is ChangelogEntry => e !== null));
			}
		});
		return () => {
			cancelled = true;
		};
	}, [initialChangelogs, getEnvUrl]);

	useEffect(() => {
		try {
			const stored = localStorage.getItem('xernerx_changelog_reacted');
			if (stored) setReactedMap(JSON.parse(stored));
		} catch {}
		fetch(`${getEnvUrl('https://api.xernerx.com/')}core/changelog/reactions`)
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (data?.reactions) setReactions(data.reactions);
			})
			.catch(() => {});
	}, [getEnvUrl]);

	const handleToggleReaction = async (versionKey: string, emoji: string) => {
		const storageKey = `${versionKey}:${emoji}`;
		if (reactedMap[storageKey]) return;

		const nextReacted = { ...reactedMap, [storageKey]: true };
		setReactedMap(nextReacted);
		try {
			localStorage.setItem('xernerx_changelog_reacted', JSON.stringify(nextReacted));
		} catch {}

		setReactions((prev) => ({
			...prev,
			[versionKey]: {
				...(prev[versionKey] || {}),
				[emoji]: ((prev[versionKey] || {})[emoji] || 0) + 1,
			},
		}));

		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}core/changelog/reactions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ versionKey, emoji }),
			});
			const data = await res.json();
			if (res.ok && data?.reactions) {
				setReactions(data.reactions);
			}
		} catch {}
	};

	useEffect(() => {
		show();
	}, [show]);

	useEffect(() => {
		const items = changelogs.map((log) => {
			const isPkg = log.group === 'packages';
			const viewKey = `changelog-${log.appName.toLowerCase()}`;
			return {
				label: log.appName,
				category: isPkg ? t('www.changelog.packagesCategory') : t('www.changelog.category'),
				icon: (isPkg ? Package : LayoutDashboard) as any,
				view: viewKey,
				onClick: () => {
					setView(viewKey);
					setSearch('');
					setActiveVersionId(null);
					window.history.replaceState(null, '', `#${log.appName.toLowerCase()}`);
				},
			};
		});

		setNavItems(items);

		if (items.length > 0) {
			if (!hasAppliedUrlParam.current) {
				hasAppliedUrlParam.current = true;
				const itemParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('item') : null;
				const rawHash = typeof window !== 'undefined' && window.location.hash ? decodeURIComponent(window.location.hash.substring(1)).toLowerCase() : null;
				const targetItem = (itemParam ? decodeURIComponent(itemParam).toLowerCase() : null) || rawHash;
				if (targetItem) {
					const match = items.find((i) => i.view === `changelog-${targetItem}` || i.view === `changelog-@xernerx/${targetItem}`);
					if (match && view !== match.view) {
						setView(match.view);
					} else if (!view) {
						setView(items[0].view);
					}
				} else if (!view || !items.some((i) => i.view === view)) {
					setView(items[0].view);
				}
			} else if (!view) {
				setView(items[0].view);
			}
		}

		return () => clearNavItems();
	}, [changelogs, setNavItems, clearNavItems, show, setView, view, t]);

	const visibleLogs = useMemo(() => {
		if (groupFilter === 'all') return changelogs;
		return changelogs.filter((l) => (l.group || 'applications') === groupFilter);
	}, [changelogs, groupFilter]);

	const activeLog =
		visibleLogs.find((log) => `changelog-${log.appName.toLowerCase()}` === view) || changelogs.find((log) => `changelog-${log.appName.toLowerCase()}` === view) || visibleLogs[0] || changelogs[0];

	const parsedSections = useMemo(() => {
		if (!activeLog?.content) return [];
		const lines = activeLog.content.split(/\r?\n/);
		const sectionsMap = new Map<string, { id: string; label: string; body: string; markdown: string }>();
		let currentHeading = '';
		let currentLines: string[] = [];

		const pushSection = () => {
			if (!currentHeading) return;
			const rawBlock = normalizeChangelogBody(currentLines.join('\n'));
			if (!rawBlock) return;
			const id = toVersionId(currentHeading) || `sec-${sectionsMap.size}`;
			const label = currentHeading.replace(/^##\s+/, '').trim();
			const existing = sectionsMap.get(id);
			if (!existing) {
				sectionsMap.set(id, { id, label, body: rawBlock, markdown: `${currentHeading}\n${rawBlock}` });
			} else if (!existing.body.includes(rawBlock)) {
				const mergedBody = `${existing.body}\n\n${rawBlock}`;
				sectionsMap.set(id, { id, label, body: mergedBody, markdown: `${currentHeading}\n${mergedBody}` });
			}
		};

		for (const line of lines) {
			if (line.startsWith('## ')) {
				pushSection();
				currentHeading = line;
				currentLines = [];
			} else {
				currentLines.push(line);
			}
		}
		pushSection();

		return Array.from(sectionsMap.values());
	}, [activeLog]);

	const filteredSections = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return parsedSections;
		return parsedSections.filter((s) => s.markdown.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
	}, [parsedSections, search]);

	useEffect(() => {
		if (typeof window !== 'undefined' && window.location.hash) {
			const hash = window.location.hash.substring(1);
			setActiveVersionId(hash);
			const element = document.getElementById(hash);
			if (element) {
				setTimeout(() => {
					element.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}, 100);
			}
		}
	}, [activeLog]);

	const jumpToVersion = (id: string) => {
		if (!activeLog) return;
		setActiveVersionId(id);
		window.history.replaceState(null, '', `?item=${encodeURIComponent(activeLog.appName.toLowerCase())}#${id}`);
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	const selectLogItem = (log: ChangelogEntry) => {
		const viewKey = `changelog-${log.appName.toLowerCase()}`;
		setView(viewKey);
		setSearch('');
		setActiveVersionId(null);
		window.history.replaceState(null, '', `#${log.appName.toLowerCase()}`);
	};

	if (!activeLog) {
		return (
			<div className="flex flex-col w-full min-h-screen pt-24 px-4 sm:px-8 max-w-(--page-width) mx-auto">
				<h1 className="text-4xl md:text-5xl font-black text-(--text) mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('www.changelog.title', { name: 'Xernerx' })}
				</h1>
				<p className="text-(--text-muted)">{t('www.changelog.noLogs')}</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full min-h-screen pt-24 px-4 sm:px-8 max-w-(--page-width) mx-auto">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
				<div className="flex flex-col gap-2">
					<div className="flex flex-wrap items-center gap-2.5">
						<h1 className="text-4xl md:text-5xl font-black text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.changelog.title', { name: activeLog.appName })}
						</h1>
						<span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
							{activeLog.group === 'packages' ? t('www.changelog.packagesCategory') : t('www.changelog.category')}
						</span>
					</div>
					<p className="text-lg text-(--text-muted)">{t('www.changelog.subtitle')}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2 shrink-0">
					{activeLog.docsHref && (
						<Button variant="secondary" onClick={() => window.open(getEnvUrl(`https://docs.xernerx.com${activeLog.docsHref}`), '_blank')} className="flex items-center gap-2">
							<Package size={15} className="text-(--accent)" />
							<span>{t('www.changelog.viewPackageDocs')}</span>
							<ExternalLink size={13} />
						</Button>
					)}
					<Button variant="secondary" onClick={() => window.open(getEnvUrl('https://api.xernerx.com/v1/changelog/rss.xml'), '_blank')} className="flex items-center gap-2">
						<Rss size={15} className="text-(--accent-orange)" />
						{t('www.changelog.rssFeed')}
					</Button>
				</div>
			</div>

			{/* Category Filter & Item Quick Switcher Bar */}
			<div className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm p-3.5 mb-6 flex flex-col gap-3">
				<div className="flex flex-wrap items-center gap-1.5 pb-2.5 border-b border-(--border)/10">
					{(
						[
							{ id: 'all', label: t('www.changelog.filterAll'), icon: Tag },
							{ id: 'applications', label: t('www.changelog.filterApps'), icon: LayoutDashboard },
							{ id: 'packages', label: t('www.changelog.filterPackages'), icon: Package },
						] as const
					).map((tab) => {
						const Icon = tab.icon;
						const isSelected = groupFilter === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => {
									setGroupFilter(tab.id);
									const firstInGroup = tab.id === 'all' ? changelogs[0] : changelogs.find((c) => (c.group || 'applications') === tab.id);
									if (firstInGroup) selectLogItem(firstInGroup);
								}}
								className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
									isSelected
										? 'bg-(--accent) text-white border-(--accent) shadow-xs'
										: 'bg-(--background)/60 text-(--text-muted) border-(--border)/10 hover:text-(--text) hover:border-(--accent)/30'
								}`}
							>
								<Icon size={13} />
								<span>{tab.label}</span>
							</button>
						);
					})}
				</div>

				<div className="flex flex-wrap items-center gap-1.5">
					{visibleLogs.map((log) => {
						const isCurrent = activeLog.appName === log.appName;
						const isPkg = log.group === 'packages';
						return (
							<button
								key={log.appName}
								type="button"
								onClick={() => selectLogItem(log)}
								className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isPkg ? 'font-mono' : ''} ${
									isCurrent
										? 'bg-(--accent)/15 text-(--accent) border-(--accent)/40 font-bold'
										: 'bg-(--background)/50 text-(--text-muted) border-(--border)/10 hover:text-(--text) hover:border-(--accent)/25'
								}`}
							>
								{isPkg ? <Package size={12} /> : <LayoutDashboard size={12} />}
								<span>{log.appName}</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Search Bar & Version Quick-Jump Pills */}
			<div className="flex flex-col gap-4 mb-10">
				<div className="max-w-xl w-full">
					<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('www.changelog.searchPlaceholder')} />
				</div>

				{parsedSections.length > 0 && (
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-(--text-muted) mr-1">
							<Tag size={12} className="text-(--accent)" />
							{t('www.changelog.jumpToVersion')}
						</span>
						{parsedSections.slice(0, 12).map((sec) => {
							const isSelected = activeVersionId === sec.id;
							return (
								<button
									key={`${activeLog.appName}-pill-${sec.id}`}
									type="button"
									onClick={() => jumpToVersion(sec.id)}
									className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer backdrop-blur-md ${
										isSelected
											? 'bg-(--accent) text-white border-(--accent) shadow-xs'
											: 'bg-(--foreground)/30 text-(--text-muted) border-(--border)/10 shadow-xs hover:border-(--accent)/40 hover:text-(--text)'
									}`}
								>
									v{sec.id}
								</button>
							);
						})}
					</div>
				)}
			</div>

			{filteredSections.length === 0 && search.trim() ? (
				<div className="p-8 text-center border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm rounded-3xl text-(--text-muted)">
					{t('www.changelog.noMatchingVersions', { query: search })}
				</div>
			) : filteredSections.length > 0 ? (
				<div className="relative flex flex-col gap-6 pl-8 lg:pl-12 pb-24">
					{/* Ambient Glowing Wire */}
					<div className="absolute left-3 lg:left-5 top-6 bottom-6 w-[2px] bg-gradient-to-b from-transparent via-(--accent) to-transparent opacity-40" />

					{filteredSections.map((sec) => {
						const versionKey = `${activeLog.appName.toLowerCase()}-${sec.id}`;
						const vCounts = reactions[versionKey] || {};
						const isHighlighted = activeVersionId === sec.id;

						return (
							<div
								key={`${activeLog.appName}-sec-${sec.id}`}
								id={sec.id}
								className={`relative group/item scroll-mt-24 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border shadow-sm p-6 sm:p-8 transition-all ${
									isHighlighted ? 'border-(--accent)/50 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)]' : 'border-(--border)/10 hover:border-(--accent)/35'
								}`}
							>
								{/* GLOWING NODE */}
								<div className="absolute -left-5 lg:-left-7 top-7 w-8 h-8 -translate-x-1/2 flex items-center justify-center z-10 transition-transform duration-500 group-hover/item:scale-125">
									<div className="absolute inset-0 bg-(--accent) rounded-full opacity-20 blur-md group-hover/item:opacity-60 transition-opacity" />
									<div className="w-3 h-3 bg-(--accent) rounded-full shadow-[0_0_15px_var(--accent)]" />
								</div>

								<div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-(--border)/10">
									<div
										className="flex items-center gap-2.5 cursor-pointer text-(--text) hover:text-(--accent) transition-colors"
										onClick={() => {
											setActiveVersionId(sec.id);
											window.history.replaceState(null, '', `?item=${encodeURIComponent(activeLog.appName.toLowerCase())}#${sec.id}`);
											if (typeof window !== 'undefined') {
												navigator.clipboard.writeText(window.location.href);
												toast({ title: t('www.changelog.linkCopiedTitle'), description: t('www.changelog.linkCopiedDesc', { version: sec.id }) });
											}
											const element = document.getElementById(sec.id);
											if (element) {
												element.scrollIntoView({ behavior: 'smooth', block: 'start' });
											}
										}}
									>
										<span className="px-2.5 py-0.5 rounded-xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 text-xs font-mono font-bold">v{sec.id}</span>
										<h2 className="text-xl sm:text-2xl font-extrabold font-mono m-0 leading-none group-hover/item:text-(--accent) transition-colors">{sec.label}</h2>
										<Link2 className="w-4 h-4 opacity-0 -translate-x-2 group-hover/item:translate-x-0 group-hover/item:opacity-100 transition-all text-(--accent)" />
									</div>

									<div className="flex flex-wrap items-center gap-1.5">
										{REACTION_EMOJIS.map((emoji) => {
											const count = vCounts[emoji] || 0;
											const hasReacted = Boolean(reactedMap[`${versionKey}:${emoji}`]);
											return (
												<button
													key={emoji}
													type="button"
													onClick={() => handleToggleReaction(versionKey, emoji)}
													className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all cursor-pointer backdrop-blur-md ${
														hasReacted
															? 'bg-(--accent)/15 text-(--accent) border-(--accent)/40'
															: 'bg-(--background)/50 text-(--text-muted) border-(--border)/10 shadow-xs hover:border-(--accent)/35 hover:text-(--text)'
													}`}
												>
													<span>{emoji}</span>
													<span className="font-mono">{count}</span>
												</button>
											);
										})}
									</div>
								</div>

								<Markdown proseClassName="prose-h3:text-base prose-h3:font-bold prose-h3:text-(--text-muted) prose-h3:mt-4 first:prose-h3:mt-0 prose-h3:mb-2">{sec.body}</Markdown>
							</div>
						);
					})}
				</div>
			) : (
				<div className="pb-24">
					<div className="rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm p-6 sm:p-10">
						<Markdown>{normalizeChangelogBody(activeLog.content)}</Markdown>
					</div>
				</div>
			)}
		</div>
	);
}
