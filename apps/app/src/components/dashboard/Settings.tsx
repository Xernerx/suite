/** @format */
'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, Building2, AlertTriangle, Trash2, Globe, Coins, Sparkles, Lock } from 'lucide-react';
import { Badge, Button, Confirm, Input, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import WidgetSettingsCard from '@/components/WidgetSettingsCard';

interface SettingsProps {
	guildConfig: any;
	setGuildConfig: (config: any) => void;
	onVanityUnlocked?: () => void;
	organizations: any[];
	handleDeleteGuild: () => void;
}

export default function Settings({ guildConfig, setGuildConfig, onVanityUnlocked, organizations, handleDeleteGuild }: SettingsProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { user, mutate: mutateUser } = useUser();
	const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
	const [unlockingVanity, setUnlockingVanity] = useState(false);

	const isVanityUnlocked = Boolean(guildConfig.vanityUnlocked || guildConfig.vanitySlug || guildConfig.verified);
	const extraVanitySlots = Number(user?.credits?.extraVanitySlots) || 0;

	const handleUnlockVanity = async () => {
		setUnlockingVanity(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildConfig.id}`), {
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
				setGuildConfig({ ...guildConfig, vanityUnlocked: true });
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
		<>
			{/* Privacy Setting Card */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<SettingsIcon size={18} />
						<h3>{t('app.dashboard.text13')}</h3>
					</div>
					<div className="flex items-center gap-1 text-xs text-(--text-muted)">{t('app.dashboard.text14')}</div>
				</div>
				<div className="w-full sm:w-48 shrink-0">
					<Selector
						value={guildConfig.privacy || 'private'}
						onChange={(val: string) => setGuildConfig({ ...guildConfig, privacy: val })}
						options={[
							{ label: t('app.dashboard.settings.public'), value: 'public' },
							{ label: t('app.dashboard.settings.limited'), value: 'limited' },
							{ label: t('app.dashboard.settings.private'), value: 'private' },
						]}
					/>
				</div>
			</div>

			{/* Vanity Slug Card */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex flex-wrap items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Globe size={18} className="text-(--accent)" />
						<h3>{t('app.dashboard.settings.vanitySlugTitle')}</h3>
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
					<div className="flex flex-wrap items-center gap-1 text-xs text-(--text-muted)">
						{t('app.dashboard.settings.vanitySlugDesc')} <span className="font-mono text-(--accent)">xernerx.com/servers/{guildConfig.vanitySlug || guildConfig.id}</span>
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
							value={guildConfig.vanitySlug || ''}
							onChange={(e) =>
								setGuildConfig({
									...guildConfig,
									vanitySlug: e.target.value
										.toLowerCase()
										.replace(/[^a-z0-9-]/g, '-')
										.replace(/-+/g, '-')
										.slice(0, 32),
								})
							}
							placeholder={t('app.dashboard.settings.vanitySlugPlaceholder')}
						/>
					) : (
						<Button variant="primary" onClick={handleUnlockVanity} loading={unlockingVanity} className="w-full gap-2">
							{extraVanitySlots > 0 ? <Sparkles size={15} /> : <Coins size={15} />}
							<span>{extraVanitySlots > 0 ? t('app.dashboard.settings.redeemVanitySlotBtn') : t('app.dashboard.settings.unlockVanityBtn')}</span>
						</Button>
					)}
				</div>
			</div>

			{/* Public Embed Widget Card */}
			<WidgetSettingsCard
				entityType="guilds"
				entityId={guildConfig.id}
				entityName={guildConfig.name}
				enabled={Boolean(guildConfig.widgets)}
				onChange={(val) => setGuildConfig({ ...guildConfig, widgets: val })}
			/>

			{/* Transfer Organization Card */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--accent-orange) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Building2 size={18} />
						<h3>{t('app.dashboard.settings.transferTitle')}</h3>
					</div>
					<p className="text-xs text-(--accent-orange)/80">{t('app.dashboard.settings.transferDescription')}</p>
				</div>
				<div className="w-full sm:w-64 shrink-0">
					<Selector
						value={guildConfig.organization || ''}
						onChange={(val: string) => setGuildConfig({ ...guildConfig, organization: val })}
						options={[
							{ label: t('app.dashboard.settings.personalOrg'), value: '' },
							...organizations.map((org) => ({
								label: org.name,
								value: org._id,
							})),
						]}
					/>
				</div>
			</div>

			{/* Reset Data Card */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--accent-orange) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<AlertTriangle size={18} />
						<h3>{t('app.dashboard.text15')}</h3>
					</div>
					<p className="text-xs text-(--accent-orange)/80">{t('app.dashboard.text16')}</p>
				</div>
				<button
					type="button"
					onClick={() => setIsResetConfirmOpen(true)}
					className="flex items-center justify-center rounded-xl bg-(--accent-orange) text-sm font-medium text-white transition-colors hover:bg-(--accent-orange)/80 shrink-0 shadow-sm"
					style={{
						padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<Trash2 size={16} />
					<span>{t('app.dashboard.text17')}</span>
				</button>
			</div>

			{/* Delete Server Data Card */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-red)/20 bg-(--accent-red)/5 shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--accent-red) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<AlertTriangle size={18} />
						<h3>{t('app.dashboard.text18')}</h3>
					</div>
					<p className="text-xs text-(--accent-red)/80">{t('app.dashboard.text19')}</p>
				</div>
				<button
					type="button"
					onClick={handleDeleteGuild}
					className="flex items-center justify-center rounded-xl bg-(--accent-red) text-sm font-medium text-white transition-colors hover:bg-(--accent-red)/80 shrink-0 shadow-sm"
					style={{
						padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<Trash2 size={16} />
					<span>{t('app.dashboard.text20')}</span>
				</button>
			</div>

			<Confirm
				open={isResetConfirmOpen}
				onOpenChange={setIsResetConfirmOpen}
				title={t('app.dashboard.settings.resetConfirmTitle')}
				description={t('app.dashboard.settings.resetConfirmDesc')}
				confirmText={t('app.dashboard.text17')}
				cancelText={t('common.buttons.cancel')}
				variant="warning"
				confirmKeyword="RESET"
				onConfirm={() => {
					setGuildConfig({ ...guildConfig, description: '', info: '', locale: '', links: {}, widgets: false });
					setIsResetConfirmOpen(false);
				}}
			/>
		</>
	);
}
