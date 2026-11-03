/** @format */
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Lock, Megaphone, ShieldCheck, Sparkles, Terminal, Users } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import type { BlogCategory, BlogPostItem } from './types';

const CATEGORY_ICONS: Record<BlogCategory, React.ElementType> = {
	announcements: Megaphone,
	security: ShieldCheck,
	product: Sparkles,
	engineering: Terminal,
	community: Users,
};

export function BlogPostCard({ post, featuredVariant = false }: { post: BlogPostItem; featuredVariant?: boolean }) {
	const { t } = useDictionary();
	const CategoryIcon = CATEGORY_ICONS[post.category] || Megaphone;

	const formattedDate = React.useMemo(() => {
		try {
			return new Date(post.publishedAt).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
			});
		} catch {
			return '';
		}
	}, [post.publishedAt]);

	const avatarUrl =
		post.author?.avatar && post.author?.id && !post.author.avatar.startsWith('http')
			? `https://cdn.discordapp.com/avatars/${post.author.id}/${post.author.avatar}.png?size=64`
			: post.author?.avatar || '/logo.png';

	if (featuredVariant) {
		return (
			<Link
				href={`/${post.slug}`}
				className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-(--foreground)/40 backdrop-blur-md border border-(--accent)/30 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_15%,transparent)] hover:border-(--accent)/60 transition-all duration-300"
				style={{ padding: 'calc(var(--ui-gap) * 1.25)', gap: 'calc(var(--ui-gap) * 0.75)' }}
			>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1.5 rounded-full bg-(--accent)/15 border border-(--accent)/30 px-3 py-1 text-xs font-bold text-(--accent)">
							<CategoryIcon size={12} />
							{t(`blog.categories.${post.category}`)}
						</span>
						{post.privacy !== 'public' && (
							<span className="inline-flex items-center gap-1 rounded-full bg-(--accent-orange)/15 border border-(--accent-orange)/30 px-2.5 py-0.5 text-xs font-bold text-(--accent-orange)">
								<Lock size={11} />
								{post.privacy.toUpperCase()}
							</span>
						)}
					</div>
					<span className="text-xs text-(--text-muted)">
						{formattedDate} · {t('blog.card.minRead', { minutes: post.readingTimeMinutes })}
					</span>
				</div>

				<div className="flex flex-col gap-2">
					<h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-(--text) group-hover:text-(--accent) transition-colors" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{post.title}
					</h2>
					<p className="text-sm sm:text-base text-(--text-muted) leading-relaxed max-w-3xl line-clamp-2">{post.subtitle}</p>
				</div>

				<div className="flex items-center justify-between gap-4 pt-3 border-t border-(--border)/10">
					<div className="flex items-center gap-2.5">
						<img src={avatarUrl} alt={post.author?.globalName || 'Xernerx'} className="h-7 w-7 rounded-full object-cover border border-(--border)/15 bg-(--background)" />
						<span className="text-xs font-bold text-(--text)">{post.author?.globalName || 'Xernerx Studios'}</span>
					</div>

					<span className="inline-flex items-center gap-1 text-xs font-bold text-(--accent) group-hover:translate-x-1 transition-transform">
						{t('blog.card.readArticle')} <ArrowRight size={14} />
					</span>
				</div>
			</Link>
		);
	}

	return (
		<Link
			href={`/${post.slug}`}
			className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/40 shadow-sm transition-all duration-300"
			style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
		>
			<div className="flex flex-col gap-2.5">
				<div className="flex items-center justify-between gap-2">
					<span className="inline-flex items-center gap-1.5 rounded-full bg-(--accent)/10 border border-(--accent)/30 px-3 py-1 text-xs font-bold text-(--accent)">
						<CategoryIcon size={12} />
						{t(`blog.categories.${post.category}`)}
					</span>
					<span className="text-xs text-(--text-muted)">{formattedDate}</span>
				</div>

				<h3 className="text-lg font-bold text-(--text) group-hover:text-(--accent) transition-colors line-clamp-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{post.title}
				</h3>

				<p className="text-sm text-(--text-muted) leading-relaxed line-clamp-2">{post.subtitle}</p>
			</div>

			<div className="flex items-center justify-between gap-2 pt-3 border-t border-(--border)/10">
				<div className="flex items-center gap-2 min-w-0">
					<img src={avatarUrl} alt={post.author?.globalName || 'Xernerx'} className="h-6 w-6 rounded-full object-cover border border-(--border)/15 bg-(--background) shrink-0" />
					<span className="text-xs font-medium text-(--text-muted) truncate">{post.author?.globalName || 'Xernerx Studios'}</span>
				</div>

				<span className="inline-flex items-center gap-1 text-xs font-bold text-(--accent) group-hover:translate-x-0.5 transition-transform shrink-0">
					{t('blog.card.minRead', { minutes: post.readingTimeMinutes })}
					<ArrowRight size={13} />
				</span>
			</div>
		</Link>
	);
}
