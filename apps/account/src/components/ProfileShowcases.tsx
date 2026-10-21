/** @format */
'use client';

import React, { useState } from 'react';
import { Award, Coins, ExternalLink, LayoutGrid, Lock, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Badge, Button, Input, Modal, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';

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

const VANITY_BADGES = [
	{ id: 'credit_patron', labelKey: 'account.profile.showcases.badges.credit_patron', threshold: 2500 },
	{ id: 'high_roller', labelKey: 'account.profile.showcases.badges.high_roller', threshold: 10000 },
	{ id: 'vault_sovereign', labelKey: 'account.profile.showcases.badges.vault_sovereign', threshold: 25000 },
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

	const openCreateModal = () => {
		setEditingItem(null);
		setTitle('');
		setDescription('');
		setImageUrl('');
		setLinkUrl('');
		setTag('');
		setModalOpen(true);
	};

	const openEditModal = (item: ShowcaseItem) => {
		setEditingItem(item);
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

				<div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					{VANITY_BADGES.map((b) => {
						const isUnlocked = unlockedBadges.includes(b.id);
						const isActive = activeBadges.includes(b.id);

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
										{isUnlocked ? <Sparkles size={18} /> : <Lock size={16} />}
									</div>
									<div className="min-w-0">
										<p className="text-sm font-bold text-(--text) truncate">{t(b.labelKey)}</p>
										<p className="text-[11px] text-(--text-muted)">
											{isUnlocked ? t('account.profile.showcases.badgeUnlocked') : t('account.profile.showcases.badgeRequirement', { credits: b.threshold.toLocaleString() })}
										</p>
									</div>
								</div>

								{isUnlocked ? (
									<Toggle checked={isActive} onChange={(e) => handleToggleBadge(b.id, e.target.checked)} />
								) : (
									<a href={getEnvUrl('https://store.xernerx.com/?category=credits')} className="text-xs font-bold text-(--accent) hover:underline shrink-0">
										{t('account.profile.showcases.unlockLink')}
									</a>
								)}
							</div>
						);
					})}
				</div>
			</div>

			<Modal open={modalOpen} onOpenChange={setModalOpen} title={editingItem ? t('account.profile.showcases.modal.editTitle') : t('account.profile.showcases.modal.createTitle')}>
				<form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
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
