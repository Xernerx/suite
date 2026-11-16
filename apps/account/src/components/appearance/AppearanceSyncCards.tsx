/** @format */
'use client';

import { Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface AppearanceSyncCardsProps {
	clientSync: boolean;
	onToggleClientSync: (e: React.ChangeEvent<HTMLInputElement> | boolean) => void;
	syncFromDiscord: boolean;
	onToggleDiscordSync: (e: React.ChangeEvent<HTMLInputElement> | boolean) => void;
}

export function AppearanceSyncCards({ clientSync, onToggleClientSync, syncFromDiscord, onToggleDiscordSync }: AppearanceSyncCardsProps) {
	const { t } = useDictionary();

	return (
		<>
			{/* Sync Accent with Clients */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.clientSync.title')}</h2>
					<p className="text-xs text-(--text-muted)">{t('account.appearance.clientSync.description')}</p>
				</div>
				<Toggle checked={clientSync} onChange={onToggleClientSync} suppressHydrationWarning />
			</div>

			{/* Sync Accent with Discord */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.discordSync.title')}</h2>
					<p className="text-xs text-(--text-muted)">{t('account.appearance.discordSync.description')}</p>
				</div>
				<Toggle checked={syncFromDiscord} onChange={onToggleDiscordSync} suppressHydrationWarning />
			</div>
		</>
	);
}
