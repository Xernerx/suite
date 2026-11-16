/** @format */
'use client';

import { Compass, LogOut, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Button, Confirm } from '@xernerx/ui';

interface AccountSessionAndTourCardsProps {
	isConfirmRevokeAllOpen: boolean;
	setIsConfirmRevokeAllOpen: (open: boolean) => void;
	isRevokingAllSessions: boolean;
	handleRevokeAllSessions: () => void;
	handleLogout: () => void;
	isTourPostponed: boolean;
}

export function AccountSessionAndTourCards({
	isConfirmRevokeAllOpen,
	setIsConfirmRevokeAllOpen,
	isRevokingAllSessions,
	handleRevokeAllSessions,
	handleLogout,
	isTourPostponed,
}: AccountSessionAndTourCardsProps) {
	const { t } = useDictionary();

	return (
		<>
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
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
					<h3 className="text-base font-semibold text-(--text)">{t('account.account.session.title')}</h3>
					<p className="text-xs text-(--text-muted)">{t('account.account.session.description')}</p>
				</div>
				<div className="flex flex-wrap items-center gap-2 shrink-0">
					<button
						type="button"
						onClick={() => setIsConfirmRevokeAllOpen(true)}
						className="flex items-center justify-center rounded-2xl border border-(--accent-orange)/30 bg-(--accent-orange)/10 text-sm font-medium text-(--accent-orange) transition-colors hover:bg-(--accent-orange)/20 shrink-0 cursor-pointer"
						style={{
							padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<ShieldAlert size={16} />
						<span>{t('account.account.session.revokeAllButton')}</span>
					</button>
					<button
						type="button"
						onClick={handleLogout}
						className="flex items-center justify-center rounded-2xl bg-(--accent-red)/15 text-sm font-medium text-(--accent-red) transition-colors hover:bg-(--accent-red)/20 shrink-0 cursor-pointer"
						style={{
							padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<LogOut size={16} />
						<span>{t('account.account.session.button')}</span>
					</button>
				</div>
			</div>

			<Confirm
				open={isConfirmRevokeAllOpen}
				onOpenChange={setIsConfirmRevokeAllOpen}
				title={t('account.account.session.revokeAllConfirmTitle')}
				description={t('account.account.session.revokeAllConfirmDesc')}
				confirmText={t('account.account.session.revokeAllButton')}
				cancelText={t('common.buttons.cancel')}
				variant="danger"
				loading={isRevokingAllSessions}
				onConfirm={handleRevokeAllSessions}
			/>

			{/* Interactive Suite Tour Card */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
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
						className="flex items-center text-(--text) font-semibold text-base"
						style={{
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<Compass size={18} className="text-(--accent)" />
						<h3>{t('account.account.tour.title')}</h3>
						{isTourPostponed && (
							<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/15 border border-(--accent)/35 px-2.5 py-0.5 text-[11px] font-bold text-(--accent)">
								<Sparkles size={11} />
								{t('account.account.tour.postponedBadge')}
							</span>
						)}
					</div>
					<p className="text-xs text-(--text-muted)">{isTourPostponed ? t('account.account.tour.postponedDescription') : t('account.account.tour.description')}</p>
				</div>
				<div className="flex flex-wrap items-center gap-2 shrink-0">
					{isTourPostponed && (
						<Button
							variant="secondary"
							onClick={() => window.dispatchEvent(new CustomEvent('xernerx:open-suite-tutorial', { detail: { startPhase: 'header' } }))}
							className="gap-2 shrink-0"
						>
							<RotateCcw size={15} />
							<span>{t('account.account.tour.restartButton')}</span>
						</Button>
					)}
					<Button
						variant={isTourPostponed ? 'primary' : 'secondary'}
						onClick={() =>
							window.dispatchEvent(
								new CustomEvent('xernerx:open-suite-tutorial', {
									detail: isTourPostponed ? { resume: true } : { startPhase: 'header' },
								})
							)
						}
						className="gap-2 shrink-0"
					>
						<Sparkles size={15} />
						<span>{isTourPostponed ? t('components.header.continueTour') : t('account.account.tour.replayButton')}</span>
					</Button>
				</div>
			</div>
		</>
	);
}
