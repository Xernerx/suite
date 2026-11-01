/** @format */

'use client';

import { Badge } from '@xernerx/ui';
import { Check, Lock, Sparkles } from 'lucide-react';
import { DESKTOP_ICON_UNLOCK_MAP, isCosmeticUnlocked } from './cosmeticUnlocks';
import { DESKTOP_APP_ICON_OPTIONS, type DesktopAppIcon } from './desktopPreferencesConfig';
import { useDictionary, useEnvironment, usePermissions, useToast, useUser } from '@xernerx/providers';

interface DesktopAppIconPickerProps {
	value: DesktopAppIcon;
	onChange: (nextIcon: DesktopAppIcon) => void;
}

export function DesktopAppIconPicker({ value, onChange }: DesktopAppIconPickerProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { user } = useUser();
	const { hasPermission } = usePermissions();
	const { toast } = useToast();
	const hasAdminAccess = hasPermission('access');
	const activeValue: DesktopAppIcon = value || 'default';

	const handleSelectIcon = (icon: DesktopAppIcon) => {
		const reqUnlock = DESKTOP_ICON_UNLOCK_MAP[icon];
		if (!isCosmeticUnlocked(user, hasAdminAccess, reqUnlock)) {
			toast({
				type: 'info',
				title: t('account.appearance.dotMatrix.lockedToastTitle'),
				description: t('account.preferences.desktopIconLockedDesc'),
				action: {
					label: t('account.appearance.dotMatrix.openCreditStore'),
					onClick: () => {
						window.location.href = getEnvUrl('https://store.xernerx.com/?category=credits');
					},
				},
			});
			return;
		}
		onChange(icon);
	};

	return (
		<div className="flex flex-col border-b border-(--border)/5" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex items-start gap-3.5 max-w-2xl">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-0.5">
					<Sparkles size={18} />
				</div>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="text-base font-semibold text-(--text)">{t('account.preferences.desktopItems.appIcon.title')}</h3>
						<Badge variant="muted" size="sm">
							{t('account.preferences.desktop.restartBannerTitle')}
						</Badge>
					</div>
					<p className="text-xs text-(--text-muted)">{t('account.preferences.desktopItems.appIcon.description')}</p>
				</div>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 w-full">
				{DESKTOP_APP_ICON_OPTIONS.map((option) => {
					const isSelected = activeValue === option.value;
					const unlocked = isCosmeticUnlocked(user, hasAdminAccess, DESKTOP_ICON_UNLOCK_MAP[option.value]);
					return (
						<button
							key={option.value}
							type="button"
							onClick={() => handleSelectIcon(option.value)}
							className={`group relative flex flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-3 transition-all cursor-pointer ${
								isSelected
									? 'bg-(--accent)/15 border-(--accent)/40 text-(--text) shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_18%,transparent)]'
									: 'bg-(--background)/50 border-(--border)/10 text-(--text-muted) hover:bg-(--foreground)/40 hover:text-(--text) hover:border-(--border)/20'
							}`}
						>
							<div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-(--background)/80 border border-(--border)/10 p-1.5 shadow-sm">
								<img
									src={option.previewSrc}
									alt={t(`account.preferences.desktopItems.appIcon.options.${option.value}`)}
									className={`h-full w-full object-contain select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] ${!unlocked ? 'opacity-70' : ''}`}
									draggable={false}
								/>
								{isSelected ? (
									<span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-(--accent) text-(--accent-contrast) border border-(--border)/20">
										<Check size={10} strokeWidth={3} />
									</span>
								) : !unlocked ? (
									<span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-(--foreground) text-(--accent) border border-(--accent)/35">
										<Lock size={9} strokeWidth={2.6} />
									</span>
								) : null}
							</div>
							<span className={`text-xs font-semibold leading-tight text-center ${isSelected ? 'text-(--accent)' : 'text-(--text-muted) group-hover:text-(--text)'}`}>
								{t(`account.preferences.desktopItems.appIcon.options.${option.value}`)}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
