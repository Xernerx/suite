/** @format */
'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, Trash2, Globe, Coins, Sparkles, Lock } from 'lucide-react';
import { Badge, Button, Confirm, Input, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import WidgetSettingsCard from '@/components/WidgetSettingsCard';
import OrganizationTreasuryCard from '@/components/portal/OrganizationTreasuryCard';

interface OrgSettingsTabProps {
	orgConfig: any;
	setOrgConfig: (config: any) => void;
	onVanityUnlocked?: () => void;
	setIsConfirmDeleteOpen: (val: boolean) => void;
	orgBots?: any[];
	orgGuilds?: any[];
}

export default function OrgSettingsTab({ orgConfig, setOrgConfig, onVanityUnlocked, setIsConfirmDeleteOpen, orgBots = [], orgGuilds = [] }: OrgSettingsTabProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { user, mutate: mutateUser } = useUser();
	const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
	const [unlockingVanity, setUnlockingVanity] = useState(false);

	const isVanityUnlocked = Boolean(orgConfig.vanityUnlocked || orgConfig.vanitySlug || orgConfig.verified);
	const extraVanitySlots = Number(user?.credits?.extraVanitySlots) || 0;

	const handleUnlockVanity = async () => {
		setUnlockingVanity(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${orgConfig._id}`), {
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
				setOrgConfig({ ...orgConfig, vanityUnlocked: true });
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
			<OrganizationTreasuryCard
				orgId={orgConfig._id}
				orgName={orgConfig.name}
				orgBots={orgBots}
				orgGuilds={orgGuilds}
				onOrgVanityUnlocked={() => {
					if (onVanityUnlocked) {
						onVanityUnlocked();
					} else {
						setOrgConfig({ ...orgConfig, vanityUnlocked: true });
					}
				}}
			/>
			<div
				className="relative z-40 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Shield size={18} />
						<h3>{t('app.portal.settings.privacySetting')}</h3>
					</div>
					<div className="flex items-center gap-1 text-xs text-(--text-muted)">{t('app.portal.settings.privacyDesc')}</div>
				</div>
				<div className="w-full sm:w-48 shrink-0">
					<Selector
						value={orgConfig.privacy || 'private'}
						onChange={(val) => setOrgConfig({ ...orgConfig, privacy: val })}
						options={[
							{ label: t('app.portal.settings.public'), value: 'public' },
							{ label: t('app.portal.settings.limited'), value: 'limited' },
							{ label: t('app.portal.settings.private'), value: 'private' },
						]}
					/>
				</div>
			</div>

			{/* Vanity Slug Card */}
			<div
				className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex flex-wrap items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Globe size={18} className="text-(--accent)" />
						<h3>{t('app.portal.settings.vanitySlugTitle')}</h3>
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
						{t('app.portal.settings.vanitySlugDesc')} <span className="font-mono text-(--accent)">xernerx.com/organization/{orgConfig.vanitySlug || orgConfig._id}</span>
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
							value={orgConfig.vanitySlug || ''}
							onChange={(e) =>
								setOrgConfig({
									...orgConfig,
									vanitySlug: e.target.value
										.toLowerCase()
										.replace(/[^a-z0-9-]/g, '-')
										.replace(/-+/g, '-')
										.slice(0, 32),
								})
							}
							placeholder={t('app.portal.settings.vanitySlugPlaceholder')}
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
				entityType="organizations"
				entityId={orgConfig._id}
				entityName={orgConfig.name}
				enabled={Boolean(orgConfig.widgets)}
				onChange={(val) => setOrgConfig({ ...orgConfig, widgets: val })}
			/>

			{/* Reset Data Card */}
			<div
				className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--accent-orange) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<AlertTriangle size={18} />
						<h3>{t('app.portal.settings.resetData')}</h3>
					</div>
					<p className="text-xs text-(--accent-orange)/80">{t('app.portal.settings.resetDesc')}</p>
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
					<span>{t('app.portal.settings.resetData')}</span>
				</button>
			</div>

			{/* Delete Organization Card */}
			<div
				className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-red)/20 bg-(--accent-red)/5 shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--accent-red) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<AlertTriangle size={18} />
						<h3>{t('app.portal.settings.deleteOrg')}</h3>
					</div>
					<p className="text-xs text-(--accent-red)/80">{t('app.portal.settings.deleteDesc')}</p>
				</div>
				<button
					type="button"
					onClick={() => setIsConfirmDeleteOpen(true)}
					className="flex items-center justify-center rounded-xl bg-(--accent-red) text-sm font-medium text-white transition-colors hover:bg-(--accent-red)/80 shrink-0 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
					style={{
						padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<Trash2 size={16} />
					<span>{t('app.portal.settings.deleteOrg')}</span>
				</button>
			</div>

			<Confirm
				open={isResetConfirmOpen}
				onOpenChange={setIsResetConfirmOpen}
				title={t('app.portal.modals.reset.title')}
				description={t('app.portal.modals.reset.desc')}
				confirmText={t('app.portal.modals.reset.confirm')}
				cancelText={t('app.portal.modals.reset.cancel')}
				variant="warning"
				confirmKeyword="RESET"
				onConfirm={() => {
					setOrgConfig({ ...orgConfig, description: '', info: '', locale: '', links: {}, widgets: false });
					setIsResetConfirmOpen(false);
				}}
			/>
		</div>
	);
}
