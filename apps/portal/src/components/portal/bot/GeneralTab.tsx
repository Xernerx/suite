/** @format */
'use client';

import { useState } from 'react';
import { Check, Coins, Copy, ExternalLink, Globe, Lock, Settings, Sparkles } from 'lucide-react';
import { Badge, Button, Input, Markdown } from '@xernerx/ui';
import { OverlayBotRunnerCard } from '@xernerx/components';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';

interface GeneralTabProps {
	botConfig: any;
	setBotConfig: (config: any) => void;
	onVanityUnlocked?: () => void;
	availableTags: string[];
}

export default function GeneralTab({ botConfig, setBotConfig, onVanityUnlocked, availableTags }: GeneralTabProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { user, mutate: mutateUser } = useUser();
	const [unlockingVanity, setUnlockingVanity] = useState(false);
	const [copiedVanity, setCopiedVanity] = useState(false);

	const isVanityUnlocked = Boolean(botConfig.vanityUnlocked || botConfig.verified);
	const extraVanitySlots = Number(user?.credits?.extraVanitySlots) || 0;
	const publicBotUrl = getEnvUrl(`https://app.xernerx.com/bots/${botConfig.vanitySlug || botConfig.id}`);

	const handleCopyVanityUrl = () => {
		navigator.clipboard.writeText(publicBotUrl);
		setCopiedVanity(true);
		toast({ type: 'success', title: t('app.dashboard.settings.vanityUrlCopied') });
		setTimeout(() => setCopiedVanity(false), 2000);
	};

	const handleUnlockVanity = async () => {
		setUnlockingVanity(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botConfig.id}/profile`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'unlock_vanity' }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toast({
					type: 'error',
					title: t('common.toast.saveFailed'),
					description: data.error,
				});
				return;
			}
			if (onVanityUnlocked) {
				onVanityUnlocked();
			} else {
				setBotConfig({ ...botConfig, vanityUnlocked: true });
			}
			mutateUser().catch(() => null);
			toast({
				type: 'success',
				title: t('app.dashboard.settings.vanityUnlockSuccessTitle'),
				description: t('app.dashboard.settings.vanityUnlockSuccessDesc'),
			});
		} catch (err: any) {
			toast({ type: 'error', title: t('common.toast.saveFailed'), description: err.message });
		} finally {
			setUnlockingVanity(false);
		}
	};

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<OverlayBotRunnerCard
				fixedBot={{
					id: String(botConfig.id || 'local-bot'),
					name: String(botConfig.discord?.global_name || botConfig.discord?.username || botConfig.name || 'Bot'),
				}}
			/>

			{/* Vanity Slug Card (Locked behind Vanity Unlock) */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex flex-wrap items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Globe size={18} className="text-(--accent)" />
						<h3>{t('app.portal.bot.vanity.title')}</h3>
						{isVanityUnlocked ? (
							<Badge variant="accent" size="sm" icon={<Sparkles size={11} />}>
								{t('app.dashboard.settings.vanityUnlockedBadge')}
							</Badge>
						) : (
							<Badge variant="muted" size="sm" icon={<Coins size={11} />}>
								{extraVanitySlots > 0 ? t('app.dashboard.settings.vanitySlotAvailableBadge', { count: extraVanitySlots }) : t('app.dashboard.settings.vanityCostBadge')}
							</Badge>
						)}
					</div>
					<div className="flex flex-wrap items-center gap-2 text-xs text-(--text-muted)">
						<span>{t('app.portal.bot.vanity.description')}</span>
						<span className="font-mono text-(--accent)">app.xernerx.com/bots/{botConfig.vanitySlug || botConfig.id}</span>
						<button
							type="button"
							onClick={handleCopyVanityUrl}
							className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-(--background)/60 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 hover:border-(--accent)/30 transition-colors cursor-pointer"
						>
							{copiedVanity ? <Check size={11} className="text-(--accent-green)" /> : <Copy size={11} />}
							<span>{t('app.dashboard.settings.copyVanityUrl')}</span>
						</button>
						<a
							href={publicBotUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-(--background)/60 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 hover:border-(--accent)/30 transition-colors"
						>
							<span>{t('app.dashboard.settings.openPublicProfile')}</span>
							<ExternalLink size={11} />
						</a>
					</div>
					{!isVanityUnlocked && (
						<p className="text-xs text-(--text-muted) flex items-center gap-1.5 mt-0.5">
							<Lock size={12} className="text-(--accent)" />
							{t('app.dashboard.settings.vanityLockedHint')}
						</p>
					)}
				</div>
				<div className="w-full sm:w-64 shrink-0">
					{isVanityUnlocked ? (
						<Input
							value={botConfig.vanitySlug || ''}
							onChange={(e) =>
								setBotConfig({
									...botConfig,
									vanitySlug: e.target.value
										.toLowerCase()
										.replace(/[^a-z0-9-]/g, '-')
										.replace(/-+/g, '-')
										.slice(0, 32),
								})
							}
							placeholder={t('app.portal.bot.vanity.placeholder')}
						/>
					) : (
						<Button variant="primary" onClick={handleUnlockVanity} loading={unlockingVanity} className="w-full gap-2">
							{extraVanitySlots > 0 ? <Sparkles size={15} /> : <Coins size={15} />}
							<span>{extraVanitySlots > 0 ? t('app.dashboard.settings.redeemVanitySlotBtn') : t('app.dashboard.settings.unlockVanityBtn')}</span>
						</Button>
					)}
				</div>
			</div>
			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
				<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
					<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
						<Settings className="w-4 h-4" />
					</div>
					{t('app.portal.bot.general.header')}
				</div>
				<div className="flex flex-col gap-5">
					<div className="flex flex-col gap-2">
						<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.general.shortDesc')}</label>
						<Input
							value={botConfig.description || ''}
							onChange={(e) => setBotConfig({ ...botConfig, description: e.target.value })}
							placeholder={t('app.portal.bot.general.shortDescPlaceholder')}
						/>
					</div>
					<Markdown
						editable
						label={t('app.portal.bot.general.longDesc')}
						value={botConfig.info || ''}
						onChange={(val) => setBotConfig({ ...botConfig, info: val })}
						placeholder={t('app.portal.bot.general.longDescPlaceholder')}
						emptyText={t('app.portal.info.nothingToPreview')}
						rows={4}
					/>
					<div className="flex flex-col gap-2">
						<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.general.tags')}</label>
						<div className="flex flex-wrap gap-2 mb-1">
							{botConfig.tags?.map((tag: string, i: number) => (
								<span key={i} className="px-2 py-1 bg-(--accent)/10 text-(--accent) text-xs font-semibold rounded-xl flex items-center gap-1 border border-(--accent)/20 shadow-sm">
									{tag}
									<button
										onClick={() => setBotConfig({ ...botConfig, tags: botConfig.tags.filter((_: any, idx: number) => idx !== i) })}
										className="hover:text-(--accent-red) transition-colors ml-1"
									>
										×
									</button>
								</span>
							))}
						</div>
						<Input
							placeholder={t('app.portal.bot.general.tagsPlaceholder')}
							list="available-tags"
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									const val = e.currentTarget.value.trim();
									if (val && !(botConfig.tags || []).includes(val)) {
										setBotConfig({ ...botConfig, tags: [...(botConfig.tags || []), val] });
										e.currentTarget.value = '';
									}
								}
							}}
						/>
						<datalist id="available-tags">
							{availableTags
								.filter((t) => !(botConfig.tags || []).includes(t))
								.map((tag) => (
									<option key={tag} value={tag} />
								))}
						</datalist>
					</div>
				</div>
			</div>
		</div>
	);
}
