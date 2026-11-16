/** @format */
'use client';

import { Code2, Compass, FolderSync, LayoutTemplate, Save, X } from 'lucide-react';
import { Badge, Button, Input, Selector, Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { DesktopAppIconPicker } from '../DesktopAppIconPicker';
import { type BooleanDesktopKey, DESKTOP_ITEMS, type DesktopAppIcon, type DesktopMetadata } from '../desktopPreferencesConfig';

interface DesktopPreferencesBodyProps {
	isJsonMode: boolean;
	jsonText: string;
	jsonError: string | null;
	onJsonChange: (nextText: string) => void;
	onFormatJson: () => void;
	onSaveJson: () => void;
	desktopMeta: DesktopMetadata;
	startupLocationOptions: { value: string; label: string }[];
	windowControlsOptions: { value: string; label: string }[];
	onStartupLocationChange: (val: string) => void;
	onWindowControlsChange: (val: string) => void;
	onAppIconChange: (nextIcon: DesktopAppIcon) => void;
	onSelectWatchFolder: () => void;
	onClearWatchFolder: () => void;
	onToggleDesktopFlag: (key: BooleanDesktopKey, requiresRestart: boolean, val: boolean | React.ChangeEvent<HTMLInputElement>) => void;
}

export function DesktopPreferencesBody({
	isJsonMode,
	jsonText,
	jsonError,
	onJsonChange,
	onFormatJson,
	onSaveJson,
	desktopMeta,
	startupLocationOptions,
	windowControlsOptions,
	onStartupLocationChange,
	onWindowControlsChange,
	onAppIconChange,
	onSelectWatchFolder,
	onClearWatchFolder,
	onToggleDesktopFlag,
}: DesktopPreferencesBodyProps) {
	const { t } = useDictionary();

	if (isJsonMode) {
		return (
			<div className="flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<Input
					variant="textarea"
					rows={14}
					value={jsonText}
					onChange={(e) => onJsonChange(e.target.value)}
					onKeyDown={(e) => {
						if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
							e.preventDefault();
							onSaveJson();
						}
					}}
					className="font-mono text-xs leading-relaxed"
				/>
				{jsonError && <p className="text-xs font-medium text-(--accent-red)">{jsonError}</p>}
				<div className="flex items-center justify-end gap-2">
					<Button variant="secondary" size="sm" onClick={onFormatJson} className="flex items-center gap-1.5">
						<Code2 size={14} />
						{t('account.preferences.desktop.formatJson')}
					</Button>
					<Button variant="primary" size="sm" onClick={onSaveJson} className="flex items-center gap-1.5">
						<Save size={14} />
						{t('account.preferences.desktop.saveJson')}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex items-start gap-3.5 max-w-2xl">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-0.5">
						<Compass size={18} />
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
						<h3 className="text-base font-semibold text-(--text)">{t('account.preferences.desktopItems.startupLocation.title')}</h3>
						<p className="text-xs text-(--text-muted)">{t('account.preferences.desktopItems.startupLocation.description')}</p>
					</div>
				</div>
				<div className="w-full sm:w-64 shrink-0">
					<Selector value={desktopMeta.startupLocation || 'dashboard'} options={startupLocationOptions} onChange={onStartupLocationChange} items={false} />
				</div>
			</div>

			<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex items-start gap-3.5 max-w-2xl">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-0.5">
						<LayoutTemplate size={18} />
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
						<h3 className="text-base font-semibold text-(--text)">{t('account.preferences.desktopItems.windowControls.title')}</h3>
						<p className="text-xs text-(--text-muted)">{t('account.preferences.desktopItems.windowControls.description')}</p>
					</div>
				</div>
				<div className="w-full sm:w-64 shrink-0">
					<Selector value={desktopMeta.windowControls || 'system'} options={windowControlsOptions} onChange={onWindowControlsChange} items={false} />
				</div>
			</div>

			<DesktopAppIconPicker value={desktopMeta.appIcon || 'default'} onChange={onAppIconChange} />

			<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex items-start gap-3.5 max-w-2xl">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-0.5">
						<FolderSync size={18} />
					</div>
					<div className="flex flex-col min-w-0" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
						<h3 className="text-base font-semibold text-(--text)">{t('account.preferences.desktop.watchFolderTitle')}</h3>
						<p className="text-xs text-(--text-muted)">{t('account.preferences.desktop.watchFolderDesc')}</p>
						<span className="mt-1 inline-flex items-center rounded-xl bg-(--background)/60 border border-(--border)/10 px-2.5 py-1 font-mono text-[11px] text-(--text-muted) truncate max-w-md">
							{desktopMeta.cdnWatchFolder || t('account.preferences.desktop.watchFolderEmpty')}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<Button variant="secondary" size="sm" onClick={onSelectWatchFolder} className="flex items-center gap-1.5">
						<FolderSync size={14} />
						{t('account.preferences.desktop.watchFolderSelect')}
					</Button>
					{desktopMeta.cdnWatchFolder && (
						<Button variant="ghost" size="sm" onClick={onClearWatchFolder} className="flex items-center gap-1 text-(--text-muted) hover:text-(--accent-red)">
							<X size={14} />
							{t('account.preferences.desktop.watchFolderClear')}
						</Button>
					)}
				</div>
			</div>

			{DESKTOP_ITEMS.map(({ key, icon: Icon, requiresRestart }) => (
				<div
					key={key}
					className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5 last:border-none"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex items-start gap-3.5 max-w-2xl">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 mt-0.5">
							<Icon size={18} />
						</div>
						<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="text-base font-semibold text-(--text)">{t(`account.preferences.desktopItems.${key}.title`)}</h3>
								{requiresRestart && (
									<Badge variant="muted" size="sm">
										{t('account.preferences.desktop.restartBannerTitle')}
									</Badge>
								)}
							</div>
							<p className="text-xs text-(--text-muted)">{t(`account.preferences.desktopItems.${key}.description`)}</p>
						</div>
					</div>
					<Toggle checked={desktopMeta[key]} onChange={(val) => onToggleDesktopFlag(key, requiresRestart, val)} suppressHydrationWarning />
				</div>
			))}
		</div>
	);
}
