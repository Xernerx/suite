/** @format */
'use client';

import { useDictionary, useEnvironment, useSidebar, useToast } from '@xernerx/providers';
import { Button, Input } from '@xernerx/ui';
import { LayoutDashboard, Link2, Rss, Tag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';

function extractText(children: any): string {
	if (typeof children === 'string' || typeof children === 'number') return String(children);
	if (Array.isArray(children)) return children.map(extractText).join('');
	if (children && typeof children === 'object' && children.props && children.props.children) {
		return extractText(children.props.children);
	}
	return '';
}

function toVersionId(headingText: string): string {
	return headingText.replace(/[^a-zA-Z0-9.-]/g, '').replace(/^v/i, '');
}

export default function ChangelogClient({ changelogs }: { changelogs: { appName: string; content: string }[] }) {
	const { setNavItems, clearNavItems, show, setView, view } = useSidebar();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();

	const [search, setSearch] = useState('');
	const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

	useEffect(() => {
		show();
	}, [show]);

	useEffect(() => {
		const items = changelogs.map((log) => ({
			label: log.appName,
			category: t('www.changelog.category'),
			icon: LayoutDashboard as any,
			view: `changelog-${log.appName.toLowerCase()}`,
			onClick: () => {
				setView(`changelog-${log.appName.toLowerCase()}`);
				setSearch('');
				setActiveVersionId(null);
				window.history.replaceState(null, '', `?item=${log.appName.toLowerCase()}`);
			},
		}));

		setNavItems(items);

		if (!view && items.length > 0) {
			const itemParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('item') : null;
			if (itemParam) {
				const match = items.find((i) => i.view === `changelog-${itemParam.toLowerCase()}`);
				setView(match ? match.view : items[0].view);
			} else {
				setView(items[0].view);
			}
		}

		return () => clearNavItems();
	}, [changelogs, setNavItems, clearNavItems, show, setView, view, t]);

	const activeLog = changelogs.find((log) => `changelog-${log.appName.toLowerCase()}` === view) || changelogs[0];

	const parsedSections = useMemo(() => {
		if (!activeLog?.content) return [];
		const lines = activeLog.content.split(/\r?\n/);
		const sections: Array<{ id: string; label: string; markdown: string }> = [];
		let currentHeading = '';
		let currentLines: string[] = [];

		for (const line of lines) {
			if (line.startsWith('## ')) {
				if (currentHeading || currentLines.length > 0) {
					const rawBlock = currentLines.join('\n').trim();
					if (currentHeading) {
						const id = toVersionId(currentHeading);
						sections.push({
							id: id || `sec-${sections.length}`,
							label: currentHeading.replace(/^##\s+/, '').trim(),
							markdown: `${currentHeading}\n${rawBlock}`,
						});
					}
				}
				currentHeading = line;
				currentLines = [];
			} else {
				currentLines.push(line);
			}
		}

		if (currentHeading) {
			const rawBlock = currentLines.join('\n').trim();
			const id = toVersionId(currentHeading);
			sections.push({
				id: id || `sec-${sections.length}`,
				label: currentHeading.replace(/^##\s+/, '').trim(),
				markdown: `${currentHeading}\n${rawBlock}`,
			});
		}

		return sections;
	}, [activeLog]);

	const filteredContent = useMemo(() => {
		if (!activeLog?.content) return '';
		const q = search.trim().toLowerCase();
		if (!q || parsedSections.length === 0) return activeLog.content;
		const matching = parsedSections.filter((s) => s.markdown.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
		return matching.map((s) => s.markdown).join('\n\n');
	}, [activeLog, parsedSections, search]);

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
		window.history.replaceState(null, '', `?item=${activeLog.appName.toLowerCase()}#${id}`);
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	if (!activeLog) {
		return (
			<div className="flex flex-col w-full min-h-screen pt-24 px-4 sm:px-8 max-w-5xl mx-auto">
				<p className="text-(--text-muted)">{t('www.changelog.noLogs')}</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full min-h-screen pt-24 px-4 sm:px-8 max-w-5xl mx-auto">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
				<div className="flex flex-col gap-2">
					<h1 className="text-4xl md:text-5xl font-black text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('www.changelog.title', { name: activeLog.appName })}
					</h1>
					<p className="text-lg text-(--text-muted)">{t('www.changelog.subtitle')}</p>
				</div>
				<Button variant="secondary" onClick={() => window.open(getEnvUrl('https://api.xernerx.com/v1/changelog/rss.xml'), '_blank')} className="flex items-center gap-2 shrink-0">
					<Rss size={15} className="text-amber-500" />
					{t('www.changelog.rssFeed')}
				</Button>
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
									key={sec.id}
									type="button"
									onClick={() => jumpToVersion(sec.id)}
									className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
										isSelected
											? 'bg-(--accent) text-white border-(--accent) shadow-xs'
											: 'bg-(--foreground)/40 text-(--text-muted) border-(--border)/10 hover:border-(--accent)/40 hover:text-(--text)'
									}`}
								>
									v{sec.id}
								</button>
							);
						})}
					</div>
				)}
			</div>

			{!filteredContent.trim() && search.trim() ? (
				<div className="p-8 text-center border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm rounded-2xl text-(--text-muted)">
					{t('www.changelog.noMatchingVersions', { query: search })}
				</div>
			) : (
				<div className="flex flex-col gap-16 pb-24">
					<div className="relative pl-8 lg:pl-12">
						{/* Ambient Glowing Wire */}
						<div className="absolute left-0 top-4 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-(--accent) to-transparent opacity-40" />

						<div className="prose prose-invert max-w-none text-(--text) prose-headings:text-(--text) prose-strong:text-(--text) prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:text-(--text-muted) prose-a:text-blue-500 hover:prose-a:text-blue-400">
							<ReactMarkdown
								components={{
									h2: ({ node: _node, ...props }) => {
										const textContent = extractText(props.children);
										const id = toVersionId(textContent);

										return (
											<div
												id={id}
												className="relative group/item mt-12 mb-6 flex items-center scroll-mt-24 cursor-pointer text-(--text) hover:text-(--accent) transition-colors"
												onClick={() => {
													setActiveVersionId(id);
													window.history.replaceState(null, '', `?item=${activeLog.appName.toLowerCase()}#${id}`);
													if (typeof window !== 'undefined') {
														navigator.clipboard.writeText(window.location.href);
														toast({ title: t('www.changelog.linkCopiedTitle'), description: t('www.changelog.linkCopiedDesc', { version: id }) });
													}
													const element = document.getElementById(id);
													if (element) {
														element.scrollIntoView({ behavior: 'smooth', block: 'start' });
													}
												}}
											>
												{/* GLOWING NODE */}
												<div className="absolute -left-8 lg:-left-12 w-8 h-8 -translate-x-[45%] flex items-center justify-center z-10 transition-transform duration-500 group-hover/item:scale-125">
													<div className="absolute inset-0 bg-(--accent) rounded-full opacity-20 blur-md group-hover/item:opacity-60 transition-opacity" />
													<div className="w-3 h-3 bg-(--accent) rounded-full shadow-[0_0_15px_var(--accent)]" />
												</div>
												<h2 {...props} className="!m-0 !p-0 leading-none border-none inline-block group-hover/item:text-(--accent) transition-colors" />
												<Link2 className="w-5 h-5 ml-3 opacity-0 -translate-x-4 group-hover/item:translate-x-0 group-hover/item:opacity-100 transition-all text-(--accent)" />
											</div>
										);
									},
								}}
							>
								{filteredContent}
							</ReactMarkdown>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
