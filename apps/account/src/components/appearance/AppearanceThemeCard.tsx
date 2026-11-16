/** @format */
'use client';

import { EyeOff, Laptop, Moon, RotateCcw, Sun } from 'lucide-react';
import { Button, Selector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface AppearanceHeaderProps {
	onHideUi: () => void;
	onResetDefaults: () => void;
}

export function AppearanceHeader({ onHideUi, onResetDefaults }: AppearanceHeaderProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('account.appearance.title')}
				</h1>
				<p className="text-sm text-(--text-muted)">{t('account.appearance.description')}</p>
			</div>

			<div className="flex flex-wrap items-center gap-2 shrink-0">
				<Button variant="secondary" onClick={onHideUi} className="flex items-center gap-2">
					<EyeOff size={15} />
					{t('account.appearance.hideUi')}
				</Button>
				<Button variant="secondary" onClick={onResetDefaults} className="flex items-center gap-2">
					<RotateCcw size={15} />
					{t('account.appearance.resetDefaults')}
				</Button>
			</div>
		</div>
	);
}

interface AppearanceThemeCardProps {
	selectedTheme: string;
	onThemeChange: (themeMode: string) => void;
}

export function AppearanceThemeCard({ selectedTheme, onThemeChange }: AppearanceThemeCardProps) {
	const { t } = useDictionary();

	const renderOption = (Icon: any, text: string) => (
		<div className="flex items-center gap-2.5">
			<Icon size={16} />
			<span className="font-medium">{text}</span>
		</div>
	);

	const themeOptions = [
		{ value: 'dark', label: renderOption(Moon, t('account.appearance.theme.options.dark')) },
		{ value: 'light', label: renderOption(Sun, t('account.appearance.theme.options.light')) },
		{ value: 'system', label: renderOption(Laptop, t('account.appearance.theme.options.system')) },
	];

	return (
		<div
			className="relative z-50 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
			style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
		>
			<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.theme.title')}</h2>
				<p className="text-xs text-(--text-muted)">{t('account.appearance.theme.description')}</p>
			</div>
			<div className="w-full sm:w-auto">
				<Selector value={selectedTheme} options={themeOptions} onChange={onThemeChange} />
			</div>
		</div>
	);
}
