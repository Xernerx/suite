/** @format */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PenSquare, Rss, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useDictionary, useEnvironment, usePermissions, useSidebar, useToast } from '@xernerx/providers';
import { Button, Input } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { BlogPostCard } from './BlogPostCard';
import type { BlogCategory, BlogPostItem } from './types';

const CATEGORIES: Array<'all' | BlogCategory> = ['all', 'announcements', 'security', 'product', 'engineering', 'community'];

export default function BlogHomeClient() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { hide } = useSidebar();
	const { hasPermission } = usePermissions();
	const { toast } = useToast();

	const canManageBlog = hasPermission('announcements');

	const [posts, setPosts] = useState<BlogPostItem[]>([]);
	const [loading, setLoading] = useState(true);

	const [search, setSearch] = useState('');
	const [activeCategory, setActiveCategory] = useState<'all' | BlogCategory>('all');

	useEffect(() => {
		hide();
	}, [hide]);

	useEffect(() => {
		if (!isReady) return;
		setLoading(true);
		fetch(getEnvUrl('https://api.xernerx.com/core/blog'), { credentials: 'include' })
			.then((res) => (res.ok ? res.json() : { posts: [] }))
			.then((data) => {
				setPosts(Array.isArray(data?.posts) ? data.posts : []);
			})
			.catch(() => {
				setPosts([]);
			})
			.finally(() => setLoading(false));
	}, [isReady, getEnvUrl]);

	const filteredPosts = useMemo(() => {
		const q = search.trim().toLowerCase();
		return posts.filter((post) => {
			if (activeCategory !== 'all' && post.category !== activeCategory) return false;
			if (!q) return true;
			const hay = `${post.title} ${post.subtitle} ${post.category} ${(post.tags || []).join(' ')} ${post.author?.globalName || ''}`.toLowerCase();
			return q.split(/\s+/).every((tok) => hay.includes(tok));
		});
	}, [posts, search, activeCategory]);

	const featuredPost = useMemo(() => {
		if (search.trim() || activeCategory !== 'all') return null;
		return filteredPosts.find((p) => p.featured) || filteredPosts[0] || null;
	}, [filteredPosts, search, activeCategory]);

	const gridPosts = useMemo(() => {
		if (!featuredPost) return filteredPosts;
		return filteredPosts.filter((p) => p.id !== featuredPost.id);
	}, [filteredPosts, featuredPost]);

	const handleCopyRss = async () => {
		const rssUrl = typeof window !== 'undefined' ? `${window.location.origin}/rss.xml` : 'https://blog.xernerx.com/rss.xml';
		try {
			await navigator.clipboard.writeText(rssUrl);
			toast({
				type: 'success',
				title: t('blog.home.rssCopiedTitle'),
				description: rssUrl,
			});
		} catch {
			window.open('/rss.xml', '_blank', 'noopener,noreferrer');
		}
	};

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			{/* Clean Header & Category Filter Bar */}
			<div className="flex flex-col gap-4 pt-2">
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
					<div className="flex flex-col gap-1.5">
						<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('blog.home.title')}
						</h1>
						<p className="text-sm text-(--text-muted) max-w-xl">{t('blog.home.subtitle')}</p>
					</div>

					<div className="flex items-center gap-2 w-full md:w-auto">
						<div className="w-full md:w-72">
							<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('blog.home.searchPlaceholder')} />
						</div>
						<Button variant="ghost" onClick={handleCopyRss} title={t('blog.home.rssFeedBtn')}>
							<Rss size={16} className="text-(--accent)" />
						</Button>
						{canManageBlog && (
							<Link
								href={getEnvUrl('https://admin.xernerx.com/?view=blog')}
								className="inline-flex items-center gap-2 rounded-2xl bg-(--accent) hover:bg-(--hover-accent) px-3.5 py-2.5 text-xs font-bold text-(--background) transition-colors shrink-0"
							>
								<PenSquare size={15} />
								<span className="hidden sm:inline">{t('blog.home.manageBlogBtn')}</span>
							</Link>
						)}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 border-b border-(--border)/10 pb-4">
					{CATEGORIES.map((cat) => (
						<button
							key={cat}
							type="button"
							onClick={() => setActiveCategory(cat)}
							className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
								activeCategory === cat
									? 'bg-(--accent) border-(--accent) text-(--background)'
									: 'bg-(--foreground)/30 border-(--border)/10 text-(--text-muted) hover:text-(--text) hover:border-(--border)/25'
							}`}
						>
							{t(`blog.categories.${cat}`)}
						</button>
					))}
				</div>
			</div>

			{/* Featured Article */}
			{featuredPost && <BlogPostCard post={featuredPost} featuredVariant={true} />}

			{/* Article Grid */}
			{gridPosts.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
					{gridPosts.map((post) => (
						<BlogPostCard key={post.id} post={post} />
					))}
				</div>
			) : (
				!featuredPost && (
					<div className="flex flex-col items-center justify-center text-center rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 py-16 px-6 gap-3">
						<Sparkles size={28} className="text-(--accent)" />
						<h3 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('blog.home.emptyTitle')}
						</h3>
						<p className="text-sm text-(--text-muted) max-w-md">{t('blog.home.emptyDesc')}</p>
						<Button
							variant="ghost"
							onClick={() => {
								setSearch('');
								setActiveCategory('all');
							}}
						>
							{t('blog.home.resetFilters')}
						</Button>
					</div>
				)
			)}
		</div>
	);
}
