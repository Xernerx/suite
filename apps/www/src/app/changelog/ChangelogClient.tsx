/** @format */
'use client';

import { useSidebar, useToast } from '@xernerx/providers';
import { LayoutDashboard, Link2 } from 'lucide-react';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

import { useSearchParams, useRouter } from 'next/navigation';

function extractText(children: any): string {
	if (typeof children === 'string' || typeof children === 'number') return String(children);
	if (Array.isArray(children)) return children.map(extractText).join('');
	if (children && typeof children === 'object' && children.props && children.props.children) {
		return extractText(children.props.children);
	}
	return '';
}

export default function ChangelogClient({ changelogs }: { changelogs: { appName: string; content: string }[] }) {
	const { setNavItems, clearNavItems, show, setView, view } = useSidebar();
	const { toast } = useToast();
	const searchParams = useSearchParams();
	const router = useRouter();

	// Explicitly call show on mount as requested
	useEffect(() => {
		show();
	}, [show]);

	useEffect(() => {
		const items = changelogs.map((log) => ({
			label: log.appName,
			category: 'Changelogs',
			icon: LayoutDashboard as any,
			view: `changelog-${log.appName.toLowerCase()}`,
			onClick: () => {
				setView(`changelog-${log.appName.toLowerCase()}`);
				window.history.replaceState(null, '', `?item=${log.appName.toLowerCase()}${window.location.hash}`);
			},
		}));

		setNavItems(items);

		// If no view is selected, default to the first one or the query parameter
		if (!view && items.length > 0) {
			const itemParam = searchParams?.get('item');
			if (itemParam) {
				const match = items.find((i) => i.view === `changelog-${itemParam.toLowerCase()}`);
				setView(match ? match.view : items[0].view);
			} else {
				setView(items[0].view);
			}
		}

		return () => clearNavItems();
	}, [changelogs, setNavItems, clearNavItems, show, setView, view, searchParams, router]);

	const activeLog = changelogs.find((log) => `changelog-${log.appName.toLowerCase()}` === view) || changelogs[0];

	// Handle hash scrolling after render
	useEffect(() => {
		if (typeof window !== 'undefined' && window.location.hash) {
			const hash = window.location.hash.substring(1); // remove '#'
			const element = document.getElementById(hash);
			if (element) {
				// Use setTimeout to ensure DOM has fully painted the new view
				setTimeout(() => {
					element.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}, 100);
			}
		}
	}, [activeLog]);

	if (!activeLog) {
		return (
			<div className="flex flex-col w-full min-h-screen pt-24 px-4 sm:px-8 max-w-5xl mx-auto">
				<p className="text-(--text-muted)">No changelogs found.</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full min-h-screen pt-24 px-4 sm:px-8 max-w-5xl mx-auto">
			<div className="flex flex-col gap-2 mb-12">
				<h1 className="text-4xl md:text-5xl font-black text-(--text)">{activeLog.appName} Changelog</h1>
				<p className="text-lg text-(--text-muted)">See the latest updates and release notes.</p>
			</div>

			<div className="flex flex-col gap-16 pb-24">
				<div className="relative pl-8 lg:pl-12">
					{/* Ambient Glowing Wire */}
					<div className="absolute left-0 top-4 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-(--accent) to-transparent opacity-40" />

					<div className="prose prose-invert max-w-none text-(--text) prose-headings:text-(--text) prose-strong:text-(--text) prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:text-(--text-muted) prose-a:text-blue-500 hover:prose-a:text-blue-400">
						<ReactMarkdown
							components={{
								h2: ({ node, ...props }) => {
									const textContent = extractText(props.children);
									// Strip brackets, spaces, and 'v' prefix to just get the raw version (e.g. 2.5.0)
									const id = textContent.replace(/[^a-zA-Z0-9.-]/g, '').replace(/^v/i, '');

									return (
										<div
											id={id}
											className="relative group/item mt-12 mb-6 flex items-center scroll-mt-24 cursor-pointer text-(--text) hover:text-(--accent) transition-colors"
											onClick={() => {
												window.history.replaceState(null, '', `?item=${activeLog.appName.toLowerCase()}#${id}`);
												if (typeof window !== 'undefined') {
													navigator.clipboard.writeText(window.location.href);
													toast({ title: 'Link copied!', description: `Copied direct link to version ${id}` });
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
							{activeLog.content}
						</ReactMarkdown>
					</div>
				</div>
			</div>
		</div>
	);
}
