/** @format */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Edit3, ExternalLink, Eye, Heart, Lock, Newspaper, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import { Button, Confirm, Input, Selector } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import type { ChannelOption } from './announcements/types';
import { BlogEditorModal, type BlogDraftState } from './blog/BlogEditorModal';

const INITIAL_DRAFT: BlogDraftState = {
	title: '',
	slug: '',
	subtitle: '',
	content: '',
	category: 'announcements',
	audience: 'all',
	privacy: 'public',
	featured: false,
	tagsInput: '',
	publishedAt: '',
	authorRole: 'Xernerx Staff',
	createHeaderBanner: false,
	crossPostDiscord: false,
	channelId: '',
	webhookUrl: '',
	bannerExpiresAt: '',
	targetApps: ['all'],
};

export default function BlogStudio() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { user } = useUser() as { user: any };

	const [posts, setPosts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [channels, setChannels] = useState<ChannelOption[]>([]);

	const [search, setSearch] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('all');
	const [privacyFilter, setPrivacyFilter] = useState('all');

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [draft, setDraft] = useState<BlogDraftState>(INITIAL_DRAFT);
	const [saving, setSaving] = useState(false);
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	const fetchPosts = async () => {
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/blog'), { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				setPosts(Array.isArray(data) ? data : []);
			}
		} catch (err) {
			console.error('Failed to fetch blog posts:', err);
		} finally {
			setLoading(false);
		}
	};

	const fetchChannels = async () => {
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/admin_server_id'), { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				if (data.value) {
					const guildRes = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${data.value}`), { credentials: 'include' });
					if (guildRes.ok) {
						const guildData = await guildRes.json();
						if (Array.isArray(guildData.channels)) {
							setChannels(guildData.channels.map((c: any) => ({ label: '#' + c.name, value: c.id })));
						}
					}
				}
			}
		} catch {}
	};

	useEffect(() => {
		fetchPosts();
		fetchChannels();
	}, []);

	const generateWebhook = async (passedChannelId?: string) => {
		const targetChannel = passedChannelId || draft.channelId;
		if (!targetChannel) return;
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/announcements/create-webhook'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ channelId: targetChannel, name: 'Xernerx Blog' }),
			});
			const data = await res.json();
			if (res.ok && data.url) {
				setDraft((prev) => ({ ...prev, webhookUrl: data.url }));
				toast({ type: 'success', title: t('admin.dashboard.announcements.toasts.webhookLinked') });
			}
		} catch (e: any) {
			toast({ type: 'error', title: t('admin.dashboard.announcements.toasts.createWebhookFailed'), description: e.message });
		}
	};

	const handleOpenCreate = () => {
		setEditingId(null);
		setDraft({
			...INITIAL_DRAFT,
			publishedAt: new Date().toISOString().slice(0, 16),
			bannerExpiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 16),
		});
		setIsModalOpen(true);
	};

	const handleOpenEdit = (post: any) => {
		setEditingId(post.id);
		setDraft({
			title: post.title || '',
			slug: post.slug || '',
			subtitle: post.subtitle || '',
			content: post.content || '',
			category: post.category || 'announcements',
			audience: post.audience || 'all',
			privacy: post.privacy || 'public',
			featured: Boolean(post.featured),
			tagsInput: Array.isArray(post.tags) ? post.tags.join(', ') : '',
			publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : '',
			authorRole: post.author?.role || 'Xernerx Staff',
			createHeaderBanner: false,
			crossPostDiscord: false,
			channelId: '',
			webhookUrl: '',
			bannerExpiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 16),
			targetApps: ['all'],
		});
		setIsModalOpen(true);
	};

	const handleSavePost = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);

		try {
			const tags = draft.tagsInput
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);

			const payload = {
				title: draft.title,
				slug: draft.slug,
				subtitle: draft.subtitle,
				content: draft.content,
				category: draft.category,
				audience: draft.audience,
				privacy: draft.privacy,
				featured: draft.featured,
				tags,
				publishedAt: draft.publishedAt ? new Date(draft.publishedAt).toISOString() : new Date().toISOString(),
				author: {
					id: user?.id || 'system',
					username: user?.username || 'Xernerx Studios',
					globalName: user?.global_name || user?.username || 'Xernerx Studios',
					avatar: user?.avatar || null,
					role: draft.authorRole || 'Xernerx Staff',
				},
				createHeaderBanner: draft.createHeaderBanner,
				crossPostDiscord: draft.crossPostDiscord,
				channelId: draft.channelId,
				webhookUrl: draft.webhookUrl,
				bannerExpiresAt: draft.bannerExpiresAt ? new Date(draft.bannerExpiresAt).toISOString() : null,
				targetApps: draft.targetApps,
			};

			const url = editingId ? getEnvUrl(`https://api.xernerx.com/secure/blog/${encodeURIComponent(editingId)}`) : getEnvUrl('https://api.xernerx.com/secure/blog');
			const res = await fetch(url, {
				method: editingId ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				toast({
					type: 'success',
					title: editingId ? t('admin.dashboard.blog.updateSuccess') : t('admin.dashboard.blog.createSuccess'),
				});
				setIsModalOpen(false);
				fetchPosts();
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || 'Failed to save blog post');
			}
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.blog.saveError'), description: err.message });
		} finally {
			setSaving(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!confirmDeleteId) return;
		const id = confirmDeleteId;
		setConfirmDeleteId(null);

		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/blog/${encodeURIComponent(id)}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				toast({ type: 'success', title: t('admin.dashboard.blog.deleteSuccess') });
				fetchPosts();
			}
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.blog.deleteError'), description: err.message });
		}
	};

	const filteredPosts = useMemo(() => {
		const q = search.trim().toLowerCase();
		return posts.filter((p) => {
			if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
			if (privacyFilter !== 'all' && p.privacy !== privacyFilter) return false;
			if (!q) return true;
			const hay = `${p.title || ''} ${p.slug || ''} ${p.subtitle || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
			return hay.includes(q);
		});
	}, [posts, search, categoryFilter, privacyFilter]);

	const stats = useMemo(() => {
		const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);
		const totalReactions = posts.reduce((acc, p) => acc + (p.totalReactions || 0), 0);
		return { count: posts.length, totalViews, totalReactions };
	}, [posts]);

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div className="flex flex-col">
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('admin.dashboard.blog.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.dashboard.blog.subtitle')}</p>
				</div>

				<div className="flex items-center gap-2.5">
					<a
						href={getEnvUrl('https://blog.xernerx.com')}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 rounded-2xl bg-(--foreground)/40 hover:bg-(--accent)/15 border border-(--border)/10 px-4 py-2.5 text-xs font-bold text-(--text) hover:text-(--accent) transition-colors"
					>
						<ExternalLink size={14} />
						{t('admin.dashboard.blog.openLiveBlog')}
					</a>
					<Button variant="primary" onClick={handleOpenCreate}>
						<Plus size={16} />
						{t('admin.dashboard.blog.createButton')}
					</Button>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
				<div className="rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 p-5 flex items-center justify-between">
					<div className="flex flex-col">
						<span className="text-xs font-medium text-(--text-muted)">{t('admin.dashboard.blog.statsArticles')}</span>
						<span className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{stats.count}
						</span>
					</div>
					<Newspaper size={22} className="text-(--accent)" />
				</div>
				<div className="rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 p-5 flex items-center justify-between">
					<div className="flex flex-col">
						<span className="text-xs font-medium text-(--text-muted)">{t('admin.dashboard.blog.statsViews')}</span>
						<span className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{stats.totalViews}
						</span>
					</div>
					<Eye size={22} className="text-(--accent)" />
				</div>
				<div className="rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 p-5 flex items-center justify-between">
					<div className="flex flex-col">
						<span className="text-xs font-medium text-(--text-muted)">{t('admin.dashboard.blog.statsReactions')}</span>
						<span className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{stats.totalReactions}
						</span>
					</div>
					<Heart size={22} className="text-(--accent)" />
				</div>
			</div>

			{/* Search & Filters */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div className="flex-1">
					<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.dashboard.blog.searchPlaceholder')} />
				</div>
				<div className="w-full sm:w-48">
					<Selector
						value={categoryFilter}
						onChange={setCategoryFilter}
						options={[
							{ value: 'all', label: t('blog.categories.all') },
							{ value: 'announcements', label: t('blog.categories.announcements') },
							{ value: 'security', label: t('blog.categories.security') },
							{ value: 'product', label: t('blog.categories.product') },
							{ value: 'engineering', label: t('blog.categories.engineering') },
							{ value: 'community', label: t('blog.categories.community') },
						]}
					/>
				</div>
				<div className="w-full sm:w-48">
					<Selector
						value={privacyFilter}
						onChange={setPrivacyFilter}
						options={[
							{ value: 'all', label: t('admin.dashboard.blog.allPrivacy') },
							{ value: 'public', label: t('admin.dashboard.blog.privacyPublic') },
							{ value: 'limited', label: t('admin.dashboard.blog.privacyLimited') },
							{ value: 'private', label: t('admin.dashboard.blog.privacyPrivate') },
						]}
					/>
				</div>
			</div>

			{/* Articles List */}
			<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
				{filteredPosts.map((post) => (
					<div
						key={post.id}
						className="rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 flex flex-col justify-between"
						style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
					>
						<div className="flex flex-col gap-2.5">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div className="flex flex-wrap items-center gap-2">
									{post.featured && (
										<span className="inline-flex items-center gap-1 rounded-full bg-(--accent) px-2.5 py-0.5 text-[11px] font-bold text-(--background)">
											<Sparkles size={11} />
											{t('blog.badges.featured')}
										</span>
									)}
									<span className="rounded-full bg-(--accent)/15 border border-(--accent)/30 px-2.5 py-0.5 text-xs font-bold text-(--accent)">
										{t(`blog.categories.${post.category}`)}
									</span>
									<span
										className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
											post.privacy === 'public'
												? 'bg-(--accent-green)/15 border-(--accent-green)/30 text-(--accent-green)'
												: post.privacy === 'limited'
													? 'bg-(--accent-orange)/15 border-(--accent-orange)/30 text-(--accent-orange)'
													: 'bg-(--accent-red)/15 border-(--accent-red)/30 text-(--accent-red)'
										}`}
									>
										{post.privacy !== 'public' && <Lock size={10} />}
										{post.privacy.toUpperCase()}
									</span>
								</div>

								<span className="text-xs font-mono text-(--text-muted)">/{post.slug}</span>
							</div>

							<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{post.title}
							</h3>
							<p className="text-xs text-(--text-muted) line-clamp-2">{post.subtitle}</p>
						</div>

						<div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-(--border)/10">
							<div className="flex items-center gap-3 text-xs text-(--text-muted)">
								<span className="inline-flex items-center gap-1">
									<Calendar size={12} className="text-(--accent)" />
									{new Date(post.publishedAt).toLocaleDateString('en-GB')}
								</span>
								<span className="inline-flex items-center gap-1">
									<Clock size={12} className="text-(--accent)" />
									{post.readingTimeMinutes}m
								</span>
								<span className="inline-flex items-center gap-1">
									<Eye size={12} className="text-(--accent)" />
									{post.views || 0}
								</span>
								<span className="inline-flex items-center gap-1">
									<Heart size={12} className="text-(--accent)" />
									{post.totalReactions || 0}
								</span>
							</div>

							<div className="flex items-center gap-2">
								<a
									href={getEnvUrl(`https://blog.xernerx.com/${post.slug}`)}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 rounded-xl bg-(--background)/60 hover:bg-(--accent)/15 border border-(--border)/10 px-3 py-1.5 text-xs font-bold text-(--text) hover:text-(--accent) transition-colors"
								>
									<ExternalLink size={12} />
									{t('admin.dashboard.blog.viewBtn')}
								</a>
								<Button variant="ghost" onClick={() => handleOpenEdit(post)}>
									<Edit3 size={13} />
									{t('admin.dashboard.blog.editBtn')}
								</Button>
								<Button variant="danger" onClick={() => setConfirmDeleteId(post.id)}>
									<Trash2 size={13} />
								</Button>
							</div>
						</div>
					</div>
				))}
			</div>

			<BlogEditorModal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				editingId={editingId}
				draft={draft}
				setDraft={setDraft}
				channels={channels}
				generateWebhook={generateWebhook}
				onSubmit={handleSavePost}
				saving={saving}
			/>

			<Confirm
				open={Boolean(confirmDeleteId)}
				onOpenChange={(open) => !open && setConfirmDeleteId(null)}
				title={t('admin.dashboard.blog.deleteConfirmTitle')}
				description={t('admin.dashboard.blog.deleteConfirmDesc')}
				onConfirm={handleConfirmDelete}
				variant="danger"
			/>
		</div>
	);
}
