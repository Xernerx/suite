/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { Award, Coins, Cpu, Crown, ExternalLink, Flame, Gem, Heart, LayoutGrid, Lock, Pencil, Plus, Rocket, Trash2, Trophy, Zap } from 'lucide-react';
import { Badge, Button, Input, Modal, Selector, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { DotMatrixBannerStudio } from './DotMatrixBannerStudio';

interface QuickFillPreset {
	value: string;
	label: string;
	tag: string;
	title: string;
	description: string;
	imageUrl: string;
	linkUrl: string;
}

const PROVIDER_NAMES: Record<string, string> = {
	github: 'GitHub',
	twitch: 'Twitch',
	youtube: 'YouTube',
	twitter: 'X (Twitter)',
	spotify: 'Spotify',
	steam: 'Steam',
	reddit: 'Reddit',
};

export interface ShowcaseItem {
	id: string;
	title: string;
	description: string;
	imageUrl?: string;
	linkUrl?: string;
	tag?: string;
}

interface ProfileShowcasesProps {
	user: any;
	userId: string;
	mutate?: () => Promise<any>;
}

const VANITY_BADGES: Array<{ id: string; labelKey: string; threshold?: number; source?: 'achievement'; Icon: any }> = [
	{ id: 'dot_matrix_banner', labelKey: 'account.profile.showcases.badges.dot_matrix_banner', threshold: 3500, Icon: Cpu },
	{ id: 'credit_patron', labelKey: 'account.profile.showcases.badges.credit_patron', threshold: 2500, Icon: Coins },
	{ id: 'high_roller', labelKey: 'account.profile.showcases.badges.high_roller', threshold: 10000, Icon: Gem },
	{ id: 'vault_sovereign', labelKey: 'account.profile.showcases.badges.vault_sovereign', threshold: 25000, Icon: Crown },
	{ id: 'streak_master_7', labelKey: 'account.profile.showcases.badges.streak_master_7', source: 'achievement', Icon: Flame },
	{ id: 'streak_master_30', labelKey: 'account.profile.showcases.badges.streak_master_30', source: 'achievement', Icon: Zap },
	{ id: 'streak_master_100', labelKey: 'account.profile.showcases.badges.streak_master_100', source: 'achievement', Icon: Trophy },
	{ id: 'top_voter_10', labelKey: 'account.profile.showcases.badges.top_voter_10', source: 'achievement', Icon: Heart },
	{ id: 'top_voter_50', labelKey: 'account.profile.showcases.badges.top_voter_50', source: 'achievement', Icon: Award },
	{ id: 'ecosystem_builder', labelKey: 'account.profile.showcases.badges.ecosystem_builder', source: 'achievement', Icon: Rocket },
];

export function ProfileShowcases({ user, userId, mutate }: ProfileShowcasesProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const extraSlots = Math.max(0, Number(user?.credits?.extraShowcaseSlots) || 0);
	const maxSlots = 1 + extraSlots;
	const showcases: ShowcaseItem[] = Array.isArray(user?.showcases) ? user.showcases : [];
	const unlockedBadges: string[] = Array.isArray(user?.credits?.unlockedBadges) ? user.credits.unlockedBadges : [];
	const activeBadges: string[] = Array.isArray(user?.credits?.activeBadges) ? user.credits.activeBadges : [];

	const [modalOpen, setModalOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<ShowcaseItem | null>(null);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [imageUrl, setImageUrl] = useState('');
	const [linkUrl, setLinkUrl] = useState('');
	const [tag, setTag] = useState('');
	const [saving, setSaving] = useState(false);
	const [quickFillValue, setQuickFillValue] = useState('');
	const [ecosystemLoaded, setEcosystemLoaded] = useState(false);
	const [quickFillPresets, setQuickFillPresets] = useState<QuickFillPreset[]>([]);

	useEffect(() => {
		if (!modalOpen || ecosystemLoaded || !userId) return;
		let active = true;

		Promise.all([
			fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/bots?owner=${userId}`, { credentials: 'include' })
				.then((r) => (r.ok ? r.json() : []))
				.catch(() => []),
			fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/organizations?user=${userId}`, { credentials: 'include' })
				.then((r) => (r.ok ? r.json() : []))
				.catch(() => []),
			fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/guilds?owner=${userId}`, { credentials: 'include' })
				.then((r) => (r.ok ? r.json() : []))
				.catch(() => []),
		]).then(([bots, orgs, guilds]) => {
			if (!active) return;

			const botPresets: QuickFillPreset[] = (Array.isArray(bots) ? bots : []).map((bot: any) => {
				const avatarUrl = bot.avatar
					? bot.avatar.startsWith('http')
						? bot.avatar
						: `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.${bot.avatar.startsWith('a_') ? 'gif' : 'png'}?size=512`
					: '';
				return {
					value: `bot:${bot.id}`,
					label: bot.name || `Bot ${bot.id}`,
					tag: 'Bot',
					title: bot.name || `Bot ${bot.id}`,
					description: bot.description || '',
					imageUrl: avatarUrl,
					linkUrl: `https://app.xernerx.com/bots/${bot.id}`,
				};
			});

			const guildPresets: QuickFillPreset[] = (Array.isArray(guilds) ? guilds : []).map((guild: any) => {
				const bannerUrl = guild.banner
					? guild.banner.startsWith('http')
						? guild.banner
						: `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.${guild.banner.startsWith('a_') ? 'gif' : 'png'}?size=1024`
					: '';
				const iconUrl = guild.icon
					? guild.icon.startsWith('http')
						? guild.icon
						: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith('a_') ? 'gif' : 'png'}?size=512`
					: '';
				return {
					value: `server:${guild.id}`,
					label: guild.name || `Server ${guild.id}`,
					tag: 'Server',
					title: guild.name || `Server ${guild.id}`,
					description: guild.description || '',
					imageUrl: bannerUrl || iconUrl,
					linkUrl: `https://app.xernerx.com/servers/${guild.id}`,
				};
			});

			const orgPresets: QuickFillPreset[] = (Array.isArray(orgs) ? orgs : []).map((org: any) => {
				const orgId = String(org._id || org.id || '');
				return {
					value: `org:${orgId}`,
					label: org.name || `Organization ${orgId}`,
					tag: 'Organization',
					title: org.name || `Organization ${orgId}`,
					description: org.description || org.info || '',
					imageUrl: org.bannerUrl || org.iconUrl || org.icon || '',
					linkUrl: `https://app.xernerx.com/organization/${orgId}`,
				};
			});

			const connPresets: QuickFillPreset[] = (Array.isArray(user?.connections) ? user.connections : []).map((conn: any) => {
				const providerRaw = String(conn.provider || 'Connection');
				const providerName = PROVIDER_NAMES[providerRaw.toLowerCase()] || providerRaw.charAt(0).toUpperCase() + providerRaw.slice(1);
				const display = conn.displayName || conn.username || providerName;
				return {
					value: `conn:${providerRaw}:${conn.id || conn.username}`,
					label: `${display} (${providerName})`,
					tag: providerName,
					title: display,
					description: conn.username ? `@${conn.username} on ${providerName}` : '',
					imageUrl: conn.avatar || '',
					linkUrl: conn.url || '',
				};
			});

			setQuickFillPresets([...botPresets, ...guildPresets, ...orgPresets, ...connPresets]);
			setEcosystemLoaded(true);
		});

		return () => {
			active = false;
		};
	}, [modalOpen, ecosystemLoaded, userId, getEnvUrl, user?.connections]);

	const handleQuickFill = (val: string) => {
		setQuickFillValue(val);
		const found = quickFillPresets.find((p) => p.value === val);
		if (!found) return;
		setTitle(found.title);
		setDescription(found.description);
		setImageUrl(found.imageUrl);
		setTag(found.tag);
		setLinkUrl(found.linkUrl);
	};

	const openCreateModal = () => {
		setEditingItem(null);
		setQuickFillValue('');
		setTitle('');
		setDescription('');
		setImageUrl('');
		setLinkUrl('');
		setTag('');
		setModalOpen(true);
	};

	const openEditModal = (item: ShowcaseItem) => {
		setEditingItem(item);
		setQuickFillValue('');
		setTitle(item.title || '');
		setDescription(item.description || '');
		setImageUrl(item.imageUrl || '');
		setLinkUrl(item.linkUrl || '');
		setTag(item.tag || '');
		setModalOpen(true);
	};

	const saveShowcases = async (nextList: ShowcaseItem[]) => {
		if (!userId) return;
		setSaving(true);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ showcases: nextList }),
			});
			if (!res.ok) throw new Error('Failed to save showcase');
			if (mutate) await mutate();
			toast({ type: 'success', title: t('account.profile.toast.success') });
			setModalOpen(false);
		} catch {
			toast({ type: 'error', title: t('account.profile.toast.error') });
		} finally {
			setSaving(false);
		}
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) return;

		const nextItem: ShowcaseItem = {
			id: editingItem?.id || `sc_${Date.now()}`,
			title: title.trim(),
			description: description.trim(),
			imageUrl: imageUrl.trim(),
			linkUrl: linkUrl.trim(),
			tag: tag.trim(),
		};

		const nextList = editingItem ? showcases.map((s) => (s.id === editingItem.id ? nextItem : s)) : [...showcases.slice(0, maxSlots - 1), nextItem];

		await saveShowcases(nextList);
	};

	const handleDeleteShowcase = async (id: string) => {
		await saveShowcases(showcases.filter((s) => s.id !== id));
	};

	const handleToggleBadge = async (badgeId: string, enabled: boolean) => {
		if (!userId || !unlockedBadges.includes(badgeId)) return;
		const nextActive = enabled ? Array.from(new Set([...activeBadges, badgeId])) : activeBadges.filter((b) => b !== badgeId);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ credits: { activeBadges: nextActive } }),
			});
			if (!res.ok) throw new Error('Failed to update badge');
			if (mutate) await mutate();
			toast({ type: 'success', title: t('account.profile.toast.success') });
		} catch {
			toast({ type: 'error', title: t('account.profile.toast.error') });
		}
	};

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{/* Profile Showcase Slots Card */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<LayoutGrid size={18} className="text-(--accent)" />
							<h3 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('account.profile.showcases.title')}
							</h3>
							<Badge variant="accent" size="sm">
								{showcases.length} / {maxSlots}
							</Badge>
						</div>
						<p className="text-xs text-(--text-muted)">{t('account.profile.showcases.subtitle')}</p>
					</div>

					<div className="flex flex-wrap items-center gap-2 shrink-0">
						{showcases.length < maxSlots && (
							<Button variant="primary" size="sm" onClick={openCreateModal} className="flex items-center gap-1.5">
								<Plus size={14} />
								{t('account.profile.showcases.addButton')}
							</Button>
						)}
						<Button variant="secondary" size="sm" onClick={() => (window.location.href = getEnvUrl('https://store.xernerx.com/?category=credits'))} className="flex items-center gap-1.5">
							<Coins size={14} className="text-(--accent)" />
							{t('account.profile.showcases.unlockMoreSlots')}
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					{showcases.slice(0, maxSlots).map((item) => (
						<div key={item.id} className="flex flex-col justify-between rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4 gap-3">
							<div className="flex flex-col gap-2">
								{item.imageUrl && (
									<div className="h-28 w-full rounded-xl overflow-hidden border border-(--border)/10 bg-(--foreground)/30">
										<img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
									</div>
								)}
								<div className="flex items-start justify-between gap-2">
									<span className="font-bold text-sm text-(--text) truncate">{item.title}</span>
									{item.tag && (
										<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">{item.tag}</span>
									)}
								</div>
								{item.description && <p className="text-xs text-(--text-muted) line-clamp-2">{item.description}</p>}
							</div>

							<div className="flex items-center justify-between pt-2 border-t border-(--border)/10">
								{item.linkUrl ? (
									<a
										href={item.linkUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 text-xs font-semibold text-(--accent) hover:underline truncate max-w-[160px]"
									>
										<ExternalLink size={12} />
										<span className="truncate">{item.linkUrl}</span>
									</a>
								) : (
									<span className="text-[11px] text-(--text-muted)">—</span>
								)}
								<div className="flex items-center gap-1">
									<Button variant="secondary" size="sm" onClick={() => openEditModal(item)} className="!p-1.5 !h-7">
										<Pencil size={12} />
									</Button>
									<Button variant="danger" size="sm" onClick={() => handleDeleteShowcase(item.id)} className="!p-1.5 !h-7">
										<Trash2 size={12} />
									</Button>
								</div>
							</div>
						</div>
					))}

					{showcases.length < maxSlots && (
						<button
							type="button"
							onClick={openCreateModal}
							className="flex flex-col items-center justify-center min-h-[130px] rounded-2xl border border-dashed border-(--border)/20 bg-(--background)/30 hover:border-(--accent)/40 hover:bg-(--accent)/5 text-(--text-muted) hover:text-(--accent) transition-all cursor-pointer p-4 gap-2"
						>
							<Plus size={20} />
							<span className="text-xs font-bold">{t('account.profile.showcases.emptySlotPrompt')}</span>
						</button>
					)}
				</div>
			</div>

			{/* Vanity Badges Card */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<Award size={18} className="text-(--accent)" />
							<h3 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('account.profile.showcases.badgesHeading')}
							</h3>
						</div>
						<p className="text-xs text-(--text-muted)">{t('account.profile.showcases.badgesSubtitle')}</p>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					{VANITY_BADGES.map((b) => {
						const isUnlocked = unlockedBadges.includes(b.id);
						const isActive = activeBadges.includes(b.id);
						const BadgeIcon = b.Icon;

						return (
							<div
								key={b.id}
								className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
									isUnlocked ? 'bg-(--background)/60 border-(--accent)/30' : 'bg-(--background)/30 border-(--border)/10 opacity-75'
								}`}
							>
								<div className="flex items-center gap-3 min-w-0">
									<div
										className={`flex h-10 w-10 items-center justify-center rounded-2xl border shrink-0 ${
											isUnlocked ? 'bg-(--accent)/15 text-(--accent) border-(--accent)/30' : 'bg-(--foreground)/40 text-(--text-muted) border-(--border)/10'
										}`}
									>
										{isUnlocked ? <BadgeIcon size={18} /> : <Lock size={16} />}
									</div>
									<div className="min-w-0">
										<p className="text-sm font-bold text-(--text) truncate">{t(b.labelKey)}</p>
										<p className="text-[11px] text-(--text-muted)">
											{isUnlocked
												? t('account.profile.showcases.badgeUnlocked')
												: b.source === 'achievement'
													? t('account.profile.showcases.badgeAchievementRequirement')
													: t('account.profile.showcases.badgeRequirement', { credits: (b.threshold || 0).toLocaleString() })}
										</p>
									</div>
								</div>

								{isUnlocked ? (
									<Toggle checked={isActive} onChange={(e) => handleToggleBadge(b.id, e.target.checked)} />
								) : b.source === 'achievement' ? (
									<a href={getEnvUrl('https://account.xernerx.com/?tab=billing')} className="text-xs font-bold text-(--accent) hover:underline shrink-0">
										{t('account.profile.showcases.achievementsLink')}
									</a>
								) : (
									<a href={getEnvUrl('https://store.xernerx.com/?category=credits')} className="text-xs font-bold text-(--accent) hover:underline shrink-0">
										{t('account.profile.showcases.unlockLink')}
									</a>
								)}
							</div>
						);
					})}
				</div>

				<DotMatrixBannerStudio
					userId={userId}
					isUnlocked={unlockedBadges.includes('dot_matrix_banner')}
					isActive={activeBadges.includes('dot_matrix_banner')}
					savedVariant={(user?.credits?.dotMatrixVariant as any) || 'orbit'}
					mutate={mutate}
				/>
			</div>

			<Modal open={modalOpen} onOpenChange={setModalOpen} title={editingItem ? t('account.profile.showcases.modal.editTitle') : t('account.profile.showcases.modal.createTitle')}>
				<form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('account.profile.showcases.modal.quickFillLabel')}</label>
						<Selector
							value={quickFillValue}
							options={quickFillPresets.map((p) => ({
								value: p.value,
								label: p.label,
								badge: (
									<Badge variant="accent" size="sm">
										{p.tag}
									</Badge>
								),
							}))}
							onChange={handleQuickFill}
							placeholder={t('account.profile.showcases.modal.quickFillPlaceholder')}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('account.profile.showcases.modal.titleLabel')}</label>
						<Input value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder={t('account.profile.showcases.modal.titlePlaceholder')} required />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('account.profile.showcases.modal.descLabel')}</label>
						<Input
							variant="textarea"
							rows={3}
							value={description}
							onChange={(e: any) => setDescription(e.target.value)}
							placeholder={t('account.profile.showcases.modal.descPlaceholder')}
						/>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text-muted)">{t('account.profile.showcases.modal.tagLabel')}</label>
							<Input value={tag} onChange={(e: any) => setTag(e.target.value)} placeholder={t('account.profile.showcases.modal.tagPlaceholder')} />
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-(--text-muted)">{t('account.profile.showcases.modal.linkLabel')}</label>
							<Input value={linkUrl} onChange={(e: any) => setLinkUrl(e.target.value)} placeholder="https://..." />
						</div>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-(--text-muted)">{t('account.profile.showcases.modal.imageLabel')}</label>
						<Input value={imageUrl} onChange={(e: any) => setImageUrl(e.target.value)} placeholder="https://cdn.xernerx.com/raw/..." />
					</div>
					<div className="flex items-center justify-end gap-2 pt-3 border-t border-(--border)/10">
						<Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
							{t('account.media.modal.cancel')}
						</Button>
						<Button variant="primary" type="submit" disabled={saving || !title.trim()}>
							{t('account.media.modal.saveChanges')}
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
