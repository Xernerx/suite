/** @format */
'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { Confirm } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface AccountDangerZoneProps {
	isConfirmDataOpen: boolean;
	setIsConfirmDataOpen: (open: boolean) => void;
	isDeletingData: boolean;
	handleDeleteData: () => Promise<void>;
	isConfirmAccountOpen: boolean;
	setIsConfirmAccountOpen: (open: boolean) => void;
	isDeletingAccount: boolean;
	handleDeleteAccount: () => Promise<void>;
}

export function AccountDangerZone({
	isConfirmDataOpen,
	setIsConfirmDataOpen,
	isDeletingData,
	handleDeleteData,
	isConfirmAccountOpen,
	setIsConfirmAccountOpen,
	isDeletingAccount,
	handleDeleteAccount,
}: AccountDangerZoneProps) {
	const { t } = useDictionary();

	return (
		<>
			{/* Reset Data Card */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
				style={{
					padding: 'var(--ui-gap)',
					gap: 'var(--ui-gap)',
				}}
			>
				<div
					className="flex flex-col max-w-xl"
					style={{
						gap: 'calc(var(--ui-gap) * 0.25)',
					}}
				>
					<div
						className="flex items-center text-(--accent-orange) font-semibold text-base"
						style={{
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<AlertTriangle size={18} />
						<h3>{t('account.common.title2')}</h3>
					</div>
					<p className="text-xs text-(--accent-orange)/80">{t('account.common.description3')}</p>
				</div>
				<button
					type="button"
					onClick={() => setIsConfirmDataOpen(true)}
					className="flex items-center justify-center rounded-2xl bg-(--accent-orange) text-sm font-medium text-white transition-colors hover:bg-(--accent-orange)/80 shrink-0 shadow-sm cursor-pointer"
					style={{
						padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<Trash2 size={16} />
					<span>{t('account.common.description4')}</span>
				</button>
			</div>

			{/* Delete Account Card */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-red)/20 bg-(--accent-red)/5 shadow-sm"
				style={{
					padding: 'var(--ui-gap)',
					gap: 'var(--ui-gap)',
				}}
			>
				<div
					className="flex flex-col max-w-xl"
					style={{
						gap: 'calc(var(--ui-gap) * 0.25)',
					}}
				>
					<div
						className="flex items-center text-(--accent-red) font-semibold text-base"
						style={{
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<AlertTriangle size={18} />
						<h3>{t('account.account.danger.title')}</h3>
					</div>
					<p className="text-xs text-(--accent-red)/80">{t('account.account.danger.description')}</p>
				</div>
				<button
					type="button"
					onClick={() => setIsConfirmAccountOpen(true)}
					className="flex items-center justify-center rounded-2xl bg-(--accent-red) text-sm font-medium text-white transition-colors hover:bg-(--accent-red)/80 shrink-0 shadow-sm cursor-pointer"
					style={{
						padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<Trash2 size={16} />
					<span>{t('account.common.description5')}</span>
				</button>
			</div>

			<Confirm
				open={isConfirmDataOpen}
				onOpenChange={setIsConfirmDataOpen}
				title={t('account.common.title2')}
				description={t('account.common.description3')}
				confirmText={t('account.common.description4')}
				variant="warning"
				loading={isDeletingData}
				onConfirm={handleDeleteData}
			/>

			<Confirm
				open={isConfirmAccountOpen}
				onOpenChange={setIsConfirmAccountOpen}
				title={t('account.account.danger.title')}
				description={t('account.account.danger.confirmDescription')}
				confirmText={t('account.common.description5')}
				variant="danger"
				loading={isDeletingAccount}
				onConfirm={handleDeleteAccount}
			/>
		</>
	);
}
