/** @format */
'use client';

import React from 'react';
import { FileText, Megaphone, Sparkles } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Button, Input, Markdown, Modal, MultiSelector, Selector, Toggle } from '@xernerx/ui';
import type { ChannelOption } from '../announcements/types';

export interface BlogDraftState {
	title: string;
	slug: string;
	subtitle: string;
	content: string;
	category: string;
	audience: string;
	privacy: 'public' | 'limited' | 'private';
	featured: boolean;
	tagsInput: string;
	publishedAt: string;
	authorRole: string;
	createHeaderBanner: boolean;
	crossPostDiscord: boolean;
	channelId: string;
	webhookUrl: string;
	bannerExpiresAt: string;
	targetApps: string[];
}

interface BlogEditorModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingId: string | null;
	draft: BlogDraftState;
	setDraft: React.Dispatch<React.SetStateAction<BlogDraftState>>;
	channels: ChannelOption[];
	generateWebhook: (channelId?: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	saving: boolean;
}

const TARGET_APP_KEYS = ['all', 'app', 'portal', 'store', 'account', 'docs', 'info', 'blog', 'www'] as const;

export function BlogEditorModal({ open, onOpenChange, editingId, draft, setDraft, channels, generateWebhook, onSubmit, saving }: BlogEditorModalProps) {
	const { t } = useDictionary();

	const applyTemplate = (kind: 'security' | 'product' | 'engineering' | 'community') => {
		if (kind === 'security') {
			setDraft((prev) => ({
				...prev,
				category: 'security',
				audience: 'all',
				title: prev.title || 'Security Advisory: Platform Protection Update',
				subtitle: prev.subtitle || 'How we are strengthening authentication, bot data minimization, and self-service privacy controls across the Xernerx Suite.',
				tagsInput: 'Security, Privacy, Architecture',
				content:
					prev.content ||
					`## Overview\n\nSummary of the security enhancement and why it matters for your Discord communities.\n\n## Key Security Guarantees\n\n- **Zero Message Logging**: Never storing message content.\n- **3-Tier Privacy Truth**: Enforced across all endpoints.\n\n## What You Need to Do\n\nReview your settings at [account.xernerx.com](https://account.xernerx.com) or inspect our full posture at [xernerx.com/security](https://www.xernerx.com/security).`,
			}));
		} else if (kind === 'product') {
			setDraft((prev) => ({
				...prev,
				category: 'product',
				audience: 'end-user',
				title: prev.title || 'New Feature Release: Suite Experience Upgrade',
				subtitle: prev.subtitle || 'Explore the newest customization tools, dashboard enhancements, and Credit Store perks.',
				tagsInput: 'Product, Release, Credit Store',
				content:
					prev.content ||
					`## What's New\n\nIntroduce the new end-user capabilities and visual upgrades.\n\n## Key Highlights\n\n1. **Feature One**: Benefit-driven explanation.\n2. **Feature Two**: How to unlock or enable it.\n\n## Try It Today\n\nOpen [app.xernerx.com](https://app.xernerx.com) or visit the [Credit Store](https://store.xernerx.com/?tab=credits).`,
			}));
		} else if (kind === 'engineering') {
			setDraft((prev) => ({
				...prev,
				category: 'engineering',
				audience: 'developer',
				title: prev.title || 'Engineering Deep-Dive: SDK & API Architecture',
				subtitle: prev.subtitle || 'Technical breakdown of our latest @xernerx/* SDK improvements, REST API endpoints, and WebSocket gateway.',
				tagsInput: 'Engineering, API, TypeScript, SDK',
				content:
					prev.content ||
					`## Architecture Overview\n\nExplain the technical challenge and our solution across the monorepo.\n\n\`\`\`ts\nimport { Client } from '@xernerx/framework';\n// Code example\n\`\`\`\n\n## Documentation\n\nRead the full specification on [docs.xernerx.com](https://docs.xernerx.com).`,
			}));
		} else {
			setDraft((prev) => ({
				...prev,
				category: 'community',
				audience: 'all',
				title: prev.title || 'Community Spotlight & Ecosystem Recap',
				subtitle: prev.subtitle || 'Celebrating top community servers, verified bots, and upcoming roadmap milestones.',
				tagsInput: 'Community, Milestone, Roadmap',
				content:
					prev.content ||
					`## Community Highlights\n\nShare recent milestones, leaderboard highlights, and upcoming events.\n\n## What's Next on the Roadmap\n\nVote on upcoming features at [info.xernerx.com/roadmap](https://info.xernerx.com/roadmap).`,
			}));
		}
	};

	const targetAppOptions = TARGET_APP_KEYS.map((key) => ({
		value: key,
		label: t(`admin.dashboard.announcements.targetApps.${key}`),
	}));

	const handleTargetAppsChange = (next: string[]) => {
		if (next.length === 0) {
			setDraft((prev) => ({ ...prev, targetApps: ['all'] }));
			return;
		}
		const hadAll = draft.targetApps.includes('all');
		const hasAll = next.includes('all');
		if (!hadAll && hasAll) {
			setDraft((prev) => ({ ...prev, targetApps: ['all'] }));
		} else if (hadAll && next.length > 1) {
			setDraft((prev) => ({ ...prev, targetApps: next.filter((app) => app !== 'all') }));
		} else {
			setDraft((prev) => ({ ...prev, targetApps: next }));
		}
	};

	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title={editingId ? t('admin.dashboard.blog.editModalTitle') : t('admin.dashboard.blog.createModalTitle')}
			description={t('admin.dashboard.blog.modalDesc')}
			size="page"
			maxWidth="max-w-(--page-width)"
		>
			<form onSubmit={onSubmit} className="flex flex-col gap-5 max-h-[82dvh] overflow-y-auto pr-2">
				{/* Templates */}
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border)/10 pb-3">
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-xs font-bold text-(--text-muted) mr-1">{t('admin.dashboard.blog.templatesLabel')}:</span>
						<Button type="button" variant="ghost" onClick={() => applyTemplate('security')}>
							{t('admin.dashboard.blog.tplSecurity')}
						</Button>
						<Button type="button" variant="ghost" onClick={() => applyTemplate('product')}>
							{t('admin.dashboard.blog.tplProduct')}
						</Button>
						<Button type="button" variant="ghost" onClick={() => applyTemplate('engineering')}>
							{t('admin.dashboard.blog.tplEngineering')}
						</Button>
						<Button type="button" variant="ghost" onClick={() => applyTemplate('community')}>
							{t('admin.dashboard.blog.tplCommunity')}
						</Button>
					</div>

					<div className="flex items-center gap-3">
						<span className="text-xs font-medium text-(--text)">{t('admin.dashboard.blog.featuredLabel')}</span>
						<Toggle checked={draft.featured} onChange={(e) => setDraft((prev) => ({ ...prev, featured: e.target.checked }))} />
					</div>
				</div>

				{/* Core Metadata */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<div className="flex flex-col gap-1 sm:col-span-2">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.blog.titleLabel')}</label>
						<Input value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder={t('admin.dashboard.blog.titlePlaceholder')} required />
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.blog.slugLabel')}</label>
						<Input value={draft.slug} onChange={(e) => setDraft((prev) => ({ ...prev, slug: e.target.value }))} placeholder={t('admin.dashboard.blog.slugPlaceholder')} />
					</div>

					<div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.blog.subtitleLabel')}</label>
						<Input value={draft.subtitle} onChange={(e) => setDraft((prev) => ({ ...prev, subtitle: e.target.value }))} placeholder={t('admin.dashboard.blog.subtitlePlaceholder')} />
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.blog.categoryLabel')}</label>
						<Selector
							value={draft.category}
							onChange={(val) => setDraft((prev) => ({ ...prev, category: val }))}
							options={[
								{ value: 'announcements', label: t('blog.categories.announcements') },
								{ value: 'security', label: t('blog.categories.security') },
								{ value: 'product', label: t('blog.categories.product') },
								{ value: 'engineering', label: t('blog.categories.engineering') },
								{ value: 'community', label: t('blog.categories.community') },
							]}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.blog.audienceLabel')}</label>
						<Selector
							value={draft.audience}
							onChange={(val) => setDraft((prev) => ({ ...prev, audience: val }))}
							options={[
								{ value: 'all', label: t('blog.audiences.all') },
								{ value: 'end-user', label: t('blog.audiences.end-user') },
								{ value: 'developer', label: t('blog.audiences.developer') },
							]}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.blog.privacyLabel')}</label>
						<Selector
							value={draft.privacy}
							onChange={(val) => setDraft((prev) => ({ ...prev, privacy: val as 'public' | 'limited' | 'private' }))}
							options={[
								{ value: 'public', label: t('admin.dashboard.blog.privacyPublic') },
								{ value: 'limited', label: t('admin.dashboard.blog.privacyLimited') },
								{ value: 'private', label: t('admin.dashboard.blog.privacyPrivate') },
							]}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.blog.tagsLabel')}</label>
						<Input value={draft.tagsInput} onChange={(e) => setDraft((prev) => ({ ...prev, tagsInput: e.target.value }))} placeholder="Security, Virtue, Webhooks" />
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.blog.publishedAtLabel')}</label>
						<Input type="datetime-local" value={draft.publishedAt} onChange={(e) => setDraft((prev) => ({ ...prev, publishedAt: e.target.value }))} />
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.blog.authorRoleLabel')}</label>
						<Input value={draft.authorRole} onChange={(e) => setDraft((prev) => ({ ...prev, authorRole: e.target.value }))} placeholder="Core Engineering" />
					</div>
				</div>

				{/* Shared @xernerx/ui Markdown Editor (Write / Split / Preview) */}
				<Markdown
					editable
					allowAdminMediaPaste
					defaultMode="split"
					label={
						<span className="inline-flex items-center gap-1.5 text-xs font-bold text-(--text)">
							<FileText size={14} className="text-(--accent)" />
							{t('admin.dashboard.blog.contentLabel')}
						</span>
					}
					value={draft.content}
					onChange={(val) => setDraft((prev) => ({ ...prev, content: val }))}
					placeholder={t('admin.dashboard.blog.contentPlaceholder')}
					emptyText={t('admin.dashboard.blog.emptyPreview')}
					rows={14}
					required
				/>

				{/* 1-Click Cross-Post to Discord & Suite Header Banner */}
				<div className="rounded-2xl bg-(--background)/50 border border-(--accent)/25 p-4 flex flex-col gap-4">
					<div className="flex items-center gap-2 text-sm font-bold text-(--text)">
						<Megaphone size={16} className="text-(--accent)" />
						{t('admin.dashboard.blog.crossPostTitle')}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex items-center justify-between rounded-2xl bg-(--foreground)/30 border border-(--border)/10 p-3">
							<div className="flex flex-col">
								<span className="text-xs font-bold text-(--text)">{t('admin.dashboard.blog.createHeaderBannerLabel')}</span>
								<span className="text-[11px] text-(--text-muted)">{t('admin.dashboard.blog.createHeaderBannerDesc')}</span>
							</div>
							<Toggle checked={draft.createHeaderBanner} onChange={(e) => setDraft((prev) => ({ ...prev, createHeaderBanner: e.target.checked }))} />
						</div>

						<div className="flex items-center justify-between rounded-2xl bg-(--foreground)/30 border border-(--border)/10 p-3">
							<div className="flex flex-col">
								<span className="text-xs font-bold text-(--text)">{t('admin.dashboard.blog.crossPostDiscordLabel')}</span>
								<span className="text-[11px] text-(--text-muted)">{t('admin.dashboard.blog.crossPostDiscordDesc')}</span>
							</div>
							<Toggle checked={draft.crossPostDiscord} onChange={(e) => setDraft((prev) => ({ ...prev, crossPostDiscord: e.target.checked }))} />
						</div>
					</div>

					{(draft.createHeaderBanner || draft.crossPostDiscord) && (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-(--border)/10">
							{draft.createHeaderBanner && (
								<>
									<div className="flex flex-col gap-1">
										<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.expiresAt')}</label>
										<Input type="datetime-local" value={draft.bannerExpiresAt} onChange={(e) => setDraft((prev) => ({ ...prev, bannerExpiresAt: e.target.value }))} />
									</div>
									<div className="flex flex-col gap-1">
										<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.targetAppsLabel')}</label>
										<MultiSelector value={draft.targetApps} options={targetAppOptions} onChange={handleTargetAppsChange} searchable={false} />
									</div>
								</>
							)}

							{draft.crossPostDiscord && (
								<>
									<div className="flex flex-col gap-1">
										<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.discordChannel')}</label>
										<Selector
											value={draft.channelId}
											options={[{ label: t('admin.dashboard.announcements.selectChannel'), value: '' }, ...channels]}
											onChange={(val: string) => {
												setDraft((prev) => ({ ...prev, channelId: val }));
												if (val) generateWebhook(val);
											}}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<label className="text-xs font-medium text-(--text)">{t('admin.dashboard.announcements.webhookUrl')}</label>
										<Input
											value={draft.webhookUrl}
											onChange={(e) => setDraft((prev) => ({ ...prev, webhookUrl: e.target.value }))}
											placeholder="https://discord.com/api/webhooks/..."
										/>
									</div>
								</>
							)}
						</div>
					)}
				</div>

				<div className="flex justify-end gap-3 sticky bottom-0 bg-(--foreground)/80 backdrop-blur-md pt-4 pb-2 border-t border-(--border)/10">
					<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
						{t('admin.dashboard.announcements.cancel')}
					</Button>
					<Button type="submit" variant="primary" disabled={saving}>
						<Sparkles size={15} />
						{saving ? t('admin.dashboard.announcements.saving') : editingId ? t('admin.dashboard.blog.updateBtn') : t('admin.dashboard.blog.publishBtn')}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
