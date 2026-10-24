/** @format */
'use client';

import { Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface NotificationRemindersCardProps {
	voteReminders: Record<string, string>;
	dailyGiftReminderAt: string | null;
	targetNames: Record<string, string>;
	onRemoveReminder: (key: string) => void;
	onClearAllReminders: () => void;
}

export function NotificationRemindersCard({ voteReminders, dailyGiftReminderAt, targetNames, onRemoveReminder, onClearAllReminders }: NotificationRemindersCardProps) {
	const { t } = useDictionary();

	if (Object.keys(voteReminders).length === 0 && !dailyGiftReminderAt) {
		return null;
	}

	return (
		<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden">
			<div className="bg-(--background)/50 border-b border-(--border)/10 flex items-center justify-between" style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)' }}>
				<h2 className="font-semibold uppercase tracking-wider text-xs text-(--text-muted)">{t('account.notifications.categories.voteReminders')}</h2>
				<button
					type="button"
					onClick={onClearAllReminders}
					className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-(--foreground)/50 text-(--text-muted) hover:text-(--text) border border-(--border)/10 transition-colors cursor-pointer"
				>
					{t('account.notifications.voteReminders.clearAll')}
				</button>
			</div>
			<div className="flex flex-col">
				{dailyGiftReminderAt && (
					<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5 last:border-none" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
						<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
							<h3 className="text-base font-semibold text-(--text)">{t('account.notifications.voteReminders.dailyGiftReminder')}</h3>
							<p className="text-xs text-(--text-muted)">
								{new Date(dailyGiftReminderAt).getTime() <= Date.now()
									? t('account.notifications.voteReminders.readyNow')
									: t('account.notifications.voteReminders.scheduledFor', { time: new Date(dailyGiftReminderAt).toLocaleString() })}
							</p>
						</div>
						<div className="flex items-center flex-wrap" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
							<div className="flex flex-col items-center" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
								<span className="text-[10px] font-bold uppercase tracking-wider text-(--accent)">{t('account.notifications.voteReminders.activeChannel')}</span>
								<Toggle checked={true} onChange={() => onRemoveReminder('dailyGift')} suppressHydrationWarning />
							</div>
						</div>
					</div>
				)}
				{Object.entries(voteReminders).map(([reminderKey, remindAt]) => {
					const isServer = reminderKey.startsWith('server:') || reminderKey.startsWith('guild:');
					const cleanId = reminderKey.replace(/^(bot|server|guild):/, '');
					const displayName = targetNames[reminderKey] || cleanId;
					const remindMs = new Date(remindAt).getTime();
					const isReady = !Number.isNaN(remindMs) && remindMs <= Date.now();

					return (
						<div
							key={reminderKey}
							className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5 last:border-none"
							style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
						>
							<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
								<h3 className="text-base font-semibold text-(--text)">
									{isServer
										? t('account.notifications.voteReminders.serverReminder', { name: displayName })
										: t('account.notifications.voteReminders.botReminder', { name: displayName })}
								</h3>
								<p className="text-xs text-(--text-muted)">
									{isReady ? t('account.notifications.voteReminders.readyNow') : t('account.notifications.voteReminders.scheduledFor', { time: new Date(remindAt).toLocaleString() })}
								</p>
							</div>
							<div className="flex items-center flex-wrap" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
								<div className="flex flex-col items-center" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
									<span className="text-[10px] font-bold uppercase tracking-wider text-(--accent)">{t('account.notifications.voteReminders.activeChannel')}</span>
									<Toggle checked={true} onChange={() => onRemoveReminder(reminderKey)} suppressHydrationWarning />
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
