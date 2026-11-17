/** @format */
'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Confirm } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';

interface ServerBotSetupDangerCardsProps {
	guildId?: string;
	mode?: 'both' | 'virtue' | 'yourapps';
	onDeleted?: () => void;
}

export function ServerBotSetupDangerCards({ guildId, mode = 'both', onDeleted }: ServerBotSetupDangerCardsProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [confirmVirtueOpen, setConfirmVirtueOpen] = useState(false);
	const [deletingVirtue, setDeletingVirtue] = useState(false);
	const [confirmYourAppsOpen, setConfirmYourAppsOpen] = useState(false);
	const [deletingYourApps, setDeletingYourApps] = useState(false);

	if (!guildId) return null;

	const handleDeleteVirtueSetup = async () => {
		setDeletingVirtue(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/virtue`), {
				method: 'DELETE',
				credentials: 'include',
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.error || t('app.dashboard.settings.virtueSetupData.toastError'));
			}
			toast({
				type: 'success',
				title: t('app.dashboard.settings.virtueSetupData.toastSuccessTitle'),
				description: t('app.dashboard.settings.virtueSetupData.toastSuccessDesc'),
			});
			setConfirmVirtueOpen(false);
			onDeleted?.();
		} catch (err: any) {
			toast({
				type: 'error',
				title: t('app.dashboard.settings.virtueSetupData.toastError'),
				description: err.message,
			});
		} finally {
			setDeletingVirtue(false);
		}
	};

	const handleDeleteYourAppsSetup = async () => {
		setDeletingYourApps(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications`), {
				method: 'DELETE',
				credentials: 'include',
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.error || t('app.dashboard.settings.yourappsSetupData.toastError'));
			}
			toast({
				type: 'success',
				title: t('app.dashboard.settings.yourappsSetupData.toastSuccessTitle'),
				description: t('app.dashboard.settings.yourappsSetupData.toastSuccessDesc'),
			});
			setConfirmYourAppsOpen(false);
			onDeleted?.();
		} catch (err: any) {
			toast({
				type: 'error',
				title: t('app.dashboard.settings.yourappsSetupData.toastError'),
				description: err.message,
			});
		} finally {
			setDeletingYourApps(false);
		}
	};

	const showVirtue = mode === 'both' || mode === 'virtue';
	const showYourApps = mode === 'both' || mode === 'yourapps';

	return (
		<>
			{showVirtue && (
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<div className="flex items-center text-(--accent-orange) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
							<AlertTriangle size={18} />
							<h3>{t('app.dashboard.settings.virtueSetupData.title')}</h3>
						</div>
						<p className="text-xs text-(--accent-orange)/80">{t('app.dashboard.settings.virtueSetupData.description')}</p>
					</div>
					<button
						type="button"
						onClick={() => setConfirmVirtueOpen(true)}
						className="flex items-center justify-center rounded-2xl bg-(--accent-orange) text-sm font-medium text-white transition-colors hover:bg-(--accent-orange)/80 shrink-0 shadow-sm cursor-pointer"
						style={{
							padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<Trash2 size={16} />
						<span>{t('app.dashboard.settings.virtueSetupData.button')}</span>
					</button>
				</div>
			)}

			{showYourApps && (
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<div className="flex items-center text-(--accent-orange) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
							<AlertTriangle size={18} />
							<h3>{t('app.dashboard.settings.yourappsSetupData.title')}</h3>
						</div>
						<p className="text-xs text-(--accent-orange)/80">{t('app.dashboard.settings.yourappsSetupData.description')}</p>
					</div>
					<button
						type="button"
						onClick={() => setConfirmYourAppsOpen(true)}
						className="flex items-center justify-center rounded-2xl bg-(--accent-orange) text-sm font-medium text-white transition-colors hover:bg-(--accent-orange)/80 shrink-0 shadow-sm cursor-pointer"
						style={{
							padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<Trash2 size={16} />
						<span>{t('app.dashboard.settings.yourappsSetupData.button')}</span>
					</button>
				</div>
			)}

			<Confirm
				open={confirmVirtueOpen}
				onOpenChange={setConfirmVirtueOpen}
				title={t('app.dashboard.settings.virtueSetupData.title')}
				description={t('app.dashboard.settings.virtueSetupData.confirmDescription')}
				confirmText={t('app.dashboard.settings.virtueSetupData.button')}
				cancelText={t('common.buttons.cancel')}
				variant="warning"
				loading={deletingVirtue}
				onConfirm={handleDeleteVirtueSetup}
			/>

			<Confirm
				open={confirmYourAppsOpen}
				onOpenChange={setConfirmYourAppsOpen}
				title={t('app.dashboard.settings.yourappsSetupData.title')}
				description={t('app.dashboard.settings.yourappsSetupData.confirmDescription')}
				confirmText={t('app.dashboard.settings.yourappsSetupData.button')}
				cancelText={t('common.buttons.cancel')}
				variant="warning"
				loading={deletingYourApps}
				onConfirm={handleDeleteYourAppsSetup}
			/>
		</>
	);
}
