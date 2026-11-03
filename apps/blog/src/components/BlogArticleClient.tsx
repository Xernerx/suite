/** @format */
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowLeft, Calendar, Check, Clock, Copy, Eye, Flame, Heart, Lock, Megaphone, PenSquare, Rocket, Rss, ShieldCheck, Sparkles, Terminal, Users } from 'lucide-react';
import { useDictionary, useEnvironment, usePermissions, useSidebar, useToast, useUser } from '@xernerx/providers';
import { Loading, NotFound } from '@xernerx/feedback';
import { BlogMarkdownRenderer } from './BlogMarkdownRenderer';
import { BlogPostCard } from './BlogPostCard';
import { extractTocHeadings, type BlogCategory, type BlogPostItem, type ReactionKey } from './types';

const CATEGORY_ICONS: Record<BlogCategory, React.ElementType> = {
	announcements: Megaphone,
	security: ShieldCheck,
	product: Sparkles,
	engineering: Terminal,
	community: Users,
};

const REACTION_BUTTONS: Array<{ key: ReactionKey; icon: React.ElementType; labelKey: string }> = [
	{ key: 'rocket', icon: Rocket, labelKey: 'blog.reactions.rocket' },
	{ key: 'heart', icon: Heart, labelKey: 'blog.reactions.heart' },
	{ key: 'sparkles', icon: Sparkles, labelKey: 'blog.reactions.sparkles' },
	{ key: 'shield', icon: ShieldCheck, labelKey: 'blog.reactions.shield' },
	{ key: 'fire', icon: Flame, labelKey: 'blog.reactions.fire' },
];

export default function BlogArticleClient({ slug, initialPost }: { slug: string; initialPost?: BlogPostItem | null }) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { hide } = useSidebar();
	const { toast } = useToast();
	const { user } = useUser();
	const { hasPermission } = usePermissions();

	const canManageBlog = hasPermission('announcements');

	const [post, setPost] = useState<BlogPostItem | null>(initialPost || null);
	const [related, setRelated] = useState<BlogPostItem[]>([]);
	const [loading, setLoading] = useState(!initialPost);
	const [notFound, setNotFound] = useState(false);
	const [copied, setCopied] = useState(false);
	const [reactingKey, setReactingKey] = useState<ReactionKey | null>(null);
	const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

	const containerRef = useRef<HTMLElement | null>(null);
	const [scrollReady, setScrollReady] = useState(false);

	useEffect(() => {
		hide();
	}, [hide]);

	useEffect(() => {
		const el = document.getElementById('main-scroll-container');
		if (el) {
			containerRef.current = el;
			setScrollReady(true);
		}
	}, []);

	const { scrollYProgress } = useScroll(scrollReady ? { container: containerRef } : {});
	const scaleX = useSpring(scrollYProgress, {
		stiffness: 100,
		damping: 30,
	});

	useEffect(() => {
		if (!isReady) return;
		fetch(getEnvUrl(`https://api.xernerx.com/core/blog/${encodeURIComponent(slug)}`), { credentials: 'include' })
			.then(async (res) => {
				if (!res.ok) {
					if (!initialPost) setNotFound(true);
					return null;
				}
				return res.json();
			})
			.then((data) => {
				if (data?.post) {
					setPost(data.post);
					setRelated(Array.isArray(data.related) ? data.related : []);
				}
			})
			.catch(() => {
				if (!initialPost) setNotFound(true);
			})
			.finally(() => setLoading(false));
	}, [slug, isReady, getEnvUrl, initialPost]);

	const tocHeadings = useMemo(() => extractTocHeadings(post?.content || ''), [post?.content]);

	useEffect(() => {
		if (tocHeadings.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setActiveHeadingId(entry.target.id);
					}
				});
			},
			{
				root: document.getElementById('main-scroll-container'),
				rootMargin: '-40% 0px -50% 0px',
			}
		);

		tocHeadings.forEach((h) => {
			const el = document.getElementById(h.id);
			if (el) observer.observe(el);
		});

		return () => observer.disconnect();
	}, [tocHeadings]);

	const handleToggleReaction = async (key: ReactionKey) => {
		if (!post) return;
		if (!user) {
			toast({
				type: 'info',
				title: t('blog.reactions.signInRequiredTitle'),
				description: t('blog.reactions.signInRequiredDesc'),
			});
			return;
		}
		if (reactingKey) return;
		setReactingKey(key);

		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/blog/${encodeURIComponent(post.slug)}`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ reaction: key }),
			});
			if (res.ok) {
				const data = await res.json();
				setPost((prev) =>
					prev
						? {
								...prev,
								reactionCounts: data.reactionCounts || prev.reactionCounts,
								totalReactions: typeof data.totalReactions === 'number' ? data.totalReactions : prev.totalReactions,
								viewerReactions: Array.isArray(data.viewerReactions) ? data.viewerReactions : prev.viewerReactions,
							}
						: prev
				);
			}
		} catch {
			toast({ type: 'error', title: t('blog.reactions.errorTitle') });
		} finally {
			setReactingKey(null);
		}
	};

	const handleCopyLink = async () => {
		const url = typeof window !== 'undefined' ? window.location.href : `https://blog.xernerx.com/${slug}`;
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			toast({ type: 'success', title: t('blog.article.linkCopied'), description: url });
			setTimeout(() => setCopied(false), 2000);
		} catch {}
	};

	if (loading) return <Loading />;
	if (notFound || !post) return <NotFound />;

	const CategoryIcon = CATEGORY_ICONS[post.category] || Megaphone;
	const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	const avatarUrl =
		post.author?.avatar && post.author?.id && !post.author.avatar.startsWith('http')
			? `https://cdn.discordapp.com/avatars/${post.author.id}/${post.author.avatar}.png?size=64`
			: post.author?.avatar || '/logo.png';

	return (
		<div className="relative">
			{/* Policy-Style Top Reading Progress Bar */}
			<motion.div
				style={{
					scaleX,
					top: 'calc(50px + env(safe-area-inset-top, 0px))',
				}}
				className="fixed left-0 right-0 h-0.75 origin-left bg-(--accent) z-50"
			/>

			<div className="min-h-screen px-6 py-16 lg:py-24">
				<div className="max-w-(--page-width) mx-auto w-full grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-16">
					{/* Policy-Style Sticky Left TOC */}
					<aside className="hidden lg:block sticky top-32 self-start space-y-8">
						<Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-(--text-muted) hover:text-(--accent) transition-colors">
							<ArrowLeft size={14} />
							{t('blog.article.backToBlog')}
						</Link>

						{tocHeadings.length > 0 && (
							<div>
								<div className="text-sm uppercase tracking-wide text-(--text-muted) mb-6">{t('blog.article.tocTitle')}</div>
								<nav className="space-y-4 text-sm">
									{tocHeadings.map((h) => (
										<a
											key={h.id}
											href={`#${h.id}`}
											className={`block transition ${activeHeadingId === h.id ? 'text-(--accent) font-medium' : 'text-(--text-muted) hover:text-(--text)'}`}
										>
											{h.text}
										</a>
									))}
								</nav>
							</div>
						)}

						<div className="pt-4 border-t border-(--border)/10">
							<div className="text-sm uppercase tracking-wide text-(--text-muted) mb-4">{t('blog.article.resourcesTitle')}</div>
							<div className="flex flex-col gap-2">
								<Link
									href={getEnvUrl('https://www.xernerx.com/security')}
									className="flex items-center gap-2 rounded-2xl bg-(--foreground)/30 hover:bg-(--accent)/10 border border-(--border)/10 hover:border-(--accent)/30 px-3.5 py-2.5 text-xs font-bold text-(--text) hover:text-(--accent) transition-colors"
								>
									<ShieldCheck size={14} className="text-(--accent) shrink-0" />
									<span>{t('blog.home.securityHubBtn')}</span>
								</Link>
								<Link
									href={getEnvUrl('https://info.xernerx.com/changelog')}
									className="flex items-center gap-2 rounded-2xl bg-(--foreground)/30 hover:bg-(--accent)/10 border border-(--border)/10 hover:border-(--accent)/30 px-3.5 py-2.5 text-xs font-bold text-(--text) hover:text-(--accent) transition-colors"
								>
									<Sparkles size={14} className="text-(--accent) shrink-0" />
									<span>{t('blog.article.changelogLink')}</span>
								</Link>
								<a
									href="/rss.xml"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 rounded-2xl bg-(--foreground)/30 hover:bg-(--accent)/10 border border-(--border)/10 hover:border-(--accent)/30 px-3.5 py-2.5 text-xs font-bold text-(--text) hover:text-(--accent) transition-colors"
								>
									<Rss size={14} className="text-(--accent) shrink-0" />
									<span>{t('blog.home.rssFeedBtn')}</span>
								</a>
							</div>
						</div>
					</aside>

					{/* Policy-Style Main Column */}
					<div className="space-y-12 min-w-0">
						{/* Mobile Back Navigation */}
						<div className="lg:hidden">
							<Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-(--text-muted) hover:text-(--accent) transition-colors">
								<ArrowLeft size={14} />
								{t('blog.article.backToBlog')}
							</Link>
						</div>

						{/* Centered Policy-Style Header with Personalisation & Small Statistics */}
						<header className="text-center bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col items-center gap-4">
							<div className="flex flex-wrap items-center justify-center gap-2">
								<span className="inline-flex items-center gap-2 rounded-full bg-(--accent)/10 border border-(--accent)/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-(--accent)">
									<CategoryIcon size={14} />
									{t(`blog.categories.${post.category}`)}
								</span>
								{post.privacy !== 'public' && (
									<span className="inline-flex items-center gap-1 rounded-full bg-(--accent-orange)/15 border border-(--accent-orange)/30 px-3 py-1 text-xs font-bold text-(--accent-orange)">
										<Lock size={12} />
										{post.privacy.toUpperCase()}
									</span>
								)}
							</div>

							<h1
								className="text-3xl sm:text-5xl font-extrabold text-(--text) drop-shadow-sm"
								style={{
									fontFamily: 'var(--font-fredoka)',
								}}
							>
								{post.title}
							</h1>

							{post.subtitle && <p className="max-w-3xl text-base text-(--text-muted) leading-relaxed">{post.subtitle}</p>}

							{/* Author Personalisation & Small Statistics Bar */}
							<div className="w-full pt-5 mt-2 border-t border-(--border)/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
								<div className="flex items-center gap-3">
									<img
										src={avatarUrl}
										alt={post.author?.globalName || 'Xernerx'}
										className="h-9 w-9 rounded-full object-cover border border-(--accent)/30 bg-(--background) shrink-0"
									/>
									<div className="flex flex-col">
										<span className="text-xs font-bold text-(--text)">{post.author?.globalName || 'Xernerx Studios'}</span>
										<span className="text-[11px] text-(--text-muted)">{post.author?.role || 'Core Engineering'}</span>
									</div>
								</div>

								<div className="flex flex-wrap items-center justify-center gap-3 text-xs text-(--text-muted)">
									<span className="inline-flex items-center gap-1.5">
										<Calendar size={13} className="text-(--accent)" />
										{formattedDate}
									</span>
									<span className="inline-flex items-center gap-1.5">
										<Clock size={13} className="text-(--accent)" />
										{t('blog.card.minRead', { minutes: post.readingTimeMinutes })}
									</span>
									<span className="inline-flex items-center gap-1.5">
										<Eye size={13} className="text-(--accent)" />
										{t('blog.article.viewsCount', { count: post.views })}
									</span>

									<button
										type="button"
										onClick={handleCopyLink}
										className="inline-flex items-center gap-1.5 rounded-full bg-(--background)/50 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/30 px-3 py-1 text-xs font-medium text-(--text) hover:text-(--accent) transition-colors cursor-pointer"
									>
										{copied ? <Check size={12} className="text-(--accent-green)" /> : <Copy size={12} className="text-(--accent)" />}
										{copied ? t('blog.article.copied') : t('blog.article.shareBtn')}
									</button>

									{canManageBlog && (
										<Link
											href={getEnvUrl(`https://admin.xernerx.com/?view=blog&edit=${encodeURIComponent(post.id)}`)}
											className="inline-flex items-center gap-1.5 rounded-full bg-(--accent)/15 hover:bg-(--accent)/25 border border-(--accent)/30 px-3 py-1 text-xs font-bold text-(--accent) transition-colors"
										>
											<PenSquare size={12} />
											{t('blog.article.editArticle')}
										</Link>
									)}
								</div>
							</div>
						</header>

						{/* Policy-Style Content Card */}
						<div className="bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl p-8 sm:p-10 shadow-sm space-y-12">
							<BlogMarkdownRenderer content={post.content || ''} />

							{/* Subtle Footer inside Content Card: Reactions & Tags */}
							<div className="pt-8 border-t border-(--border)/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
								<div className="flex flex-wrap items-center gap-1.5">
									{REACTION_BUTTONS.map(({ key, icon: Icon, labelKey }) => {
										const count = post.reactionCounts?.[key] || 0;
										const isActive = (post.viewerReactions || []).includes(key);
										return (
											<button
												key={key}
												type="button"
												disabled={reactingKey === key}
												onClick={() => handleToggleReaction(key)}
												title={t(labelKey)}
												className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer ${
													isActive
														? 'bg-(--accent)/20 border-(--accent) text-(--accent)'
														: 'bg-(--background)/50 border-(--border)/10 text-(--text-muted) hover:text-(--text) hover:border-(--accent)/40'
												}`}
											>
												<Icon size={13} className={isActive ? 'text-(--accent)' : ''} />
												<span>{count}</span>
											</button>
										);
									})}
								</div>

								{post.tags && post.tags.length > 0 && (
									<div className="flex flex-wrap items-center gap-1.5">
										{post.tags.map((tag) => (
											<span key={tag} className="rounded-full bg-(--background)/50 border border-(--border)/10 px-2.5 py-1 text-[11px] font-medium text-(--text-muted)">
												#{tag}
											</span>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Related Articles */}
						{related.length > 0 && (
							<div className="space-y-6">
								<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('blog.article.relatedTitle')}
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{related.slice(0, 2).map((item) => (
										<BlogPostCard key={item.id} post={item} />
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
