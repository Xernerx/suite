/** @format */
'use client';

import { BellRing, Camera, Code2, Columns2, FileText, Layers, Lock, RefreshCw, Trash2 } from 'lucide-react';
import { Badge, Button } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import type { DesktopMetadata } from '../desktopPreferencesConfig';

interface DesktopPreferencesToolbarProps {
	desktopMeta: DesktopMetadata;
	broadcasterName: string | null;
	onBatteryPower: boolean;
	developerMode: boolean;
	capturing: boolean;
	clearingCache: boolean;
	isJsonMode: boolean;
	needsRestart: boolean;
	onQuickCapture: () => void;
	onTestNotification: () => void;
	onLaunchOverlay: () => void;
	onOpenLogs: () => void;
	onClearCache: () => void;
	onToggleEditorMode: () => void;
	onRestartDesktopApp: () => void;
}

export function DesktopPreferencesToolbar({
	desktopMeta,
	broadcasterName,
	onBatteryPower,
	developerMode,
	capturing,
	clearingCache,
	isJsonMode,
	needsRestart,
	onQuickCapture,
	onTestNotification,
	onLaunchOverlay,
	onOpenLogs,
	onClearCache,
	onToggleEditorMode,
	onRestartDesktopApp,
}: DesktopPreferencesToolbarProps) {
	const { t } = useDictionary();

	return (
		<>
			<div className="bg-(--background)/50 border-b border-(--border)/10 flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('account.preferences.sections.desktop')}
						</h2>
						{desktopMeta.streamerMode && (
							<Badge variant="accent" size="sm">
								{broadcasterName ? `${t('account.preferences.desktop.streamerActive')} (${broadcasterName})` : t('account.preferences.desktop.streamerProtected')}
							</Badge>
						)}
						{onBatteryPower && desktopMeta.batterySaver && (
							<Badge variant="muted" size="sm">
								{t('account.preferences.desktop.batterySaverActive')}
							</Badge>
						)}
					</div>
					<p className="text-xs text-(--text-muted)">{t('account.preferences.sections.desktopDesc')}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button variant="secondary" size="sm" onClick={() => (window as any).electron?.setDockedMode?.()} className="flex items-center gap-1.5">
						<Columns2 size={14} /> {t('account.preferences.desktop.dockToggle')}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => (window as any).electron?.lockPrivacyShield?.()} className="flex items-center gap-1.5">
						<Lock size={14} /> {t('account.preferences.desktop.lockNow')}
					</Button>
					<Button variant="secondary" size="sm" onClick={onQuickCapture} disabled={capturing} className="flex items-center gap-1.5">
						<Camera size={14} /> {t('account.preferences.desktop.quickCapture')}
					</Button>
					<Button variant="secondary" size="sm" onClick={onTestNotification} className="flex items-center gap-1.5">
						<BellRing size={14} /> {t('account.preferences.desktop.testNotification')}
					</Button>
					{developerMode && (
						<Button variant="secondary" size="sm" onClick={onLaunchOverlay} className="flex items-center gap-1.5">
							<Layers size={14} /> {t('account.preferences.desktop.launchOverlay')}
						</Button>
					)}
					<Button variant="secondary" size="sm" onClick={onOpenLogs} className="flex items-center gap-1.5">
						<FileText size={14} /> {t('account.preferences.desktop.openLogs')}
					</Button>
					<Button variant="secondary" size="sm" onClick={onClearCache} disabled={clearingCache} className="flex items-center gap-1.5">
						{clearingCache ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />} {t('account.preferences.desktop.clearCache')}
					</Button>
					<Button variant={isJsonMode ? 'primary' : 'secondary'} size="sm" onClick={onToggleEditorMode} className="flex items-center gap-1.5">
						<Code2 size={14} /> {isJsonMode ? t('account.preferences.desktop.visualEditor') : t('account.preferences.desktop.editJson')}
					</Button>
				</div>
			</div>

			{needsRestart && (
				<div className="flex flex-col sm:flex-row sm:items-center justify-between bg-(--accent)/10 border-b border-(--accent)/25" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
					<div className="flex items-center gap-3">
						<RefreshCw size={18} className="text-(--accent) shrink-0 animate-spin" />
						<div className="flex flex-col">
							<span className="text-sm font-bold text-(--text)">{t('account.preferences.desktop.restartBannerTitle')}</span>
							<span className="text-xs text-(--text-muted)">{t('account.preferences.desktop.restartBannerDesc')}</span>
						</div>
					</div>
					<Button variant="primary" size="sm" onClick={onRestartDesktopApp} className="flex items-center gap-2 shrink-0">
						<RefreshCw size={14} /> {t('account.preferences.desktop.restartNow')}
					</Button>
				</div>
			)}
		</>
	);
}
