/** @format */

import { BatteryCharging, Bell, Camera, Command, Cpu, ExternalLink, Flame, Gamepad2, Keyboard, Maximize2, Minimize2, Monitor, Pin, Power, ShieldCheck, Terminal } from 'lucide-react';

export type WindowControlsStyle = 'system' | 'windows' | 'macos' | 'xernerx';
export type StartupLocation = 'last' | 'explore' | 'dashboard' | 'account' | 'store' | 'portal' | 'api' | 'docs' | 'cdn' | 'website' | 'help' | 'admin';

export interface DesktopMetadata {
	hardwareAcceleration: boolean;
	debug: boolean;
	startOnBoot: boolean;
	startMaximized: boolean;
	startMinimized: boolean;
	alwaysOnTop: boolean;
	minimizeOnClose: boolean;
	globalHotkey: boolean;
	globalQuickLauncher: boolean;
	quickCaptureHotkey: boolean;
	streamerMode: boolean;
	batterySaver: boolean;
	openExternalInBrowser: boolean;
	discordRpc: boolean;
	desktopNotifications: boolean;
	dailyStreakReminder: boolean;
	windowControls: WindowControlsStyle;
	startupLocation: StartupLocation;
	cdnWatchFolder?: string;
}

export const DEFAULT_DESKTOP_METADATA: DesktopMetadata = {
	hardwareAcceleration: true,
	debug: false,
	startOnBoot: false,
	startMaximized: false,
	startMinimized: false,
	alwaysOnTop: false,
	minimizeOnClose: false,
	globalHotkey: true,
	globalQuickLauncher: false,
	quickCaptureHotkey: false,
	streamerMode: false,
	batterySaver: true,
	openExternalInBrowser: true,
	discordRpc: true,
	desktopNotifications: true,
	dailyStreakReminder: true,
	windowControls: 'system',
	startupLocation: 'dashboard',
	cdnWatchFolder: '',
};

export type BooleanDesktopKey = Exclude<keyof DesktopMetadata, 'windowControls' | 'startupLocation' | 'cdnWatchFolder'>;

export const RESTART_REQUIRED_KEYS: Array<BooleanDesktopKey> = ['hardwareAcceleration', 'debug', 'startMaximized', 'startMinimized'];

export const DESKTOP_ITEMS: Array<{ key: BooleanDesktopKey; icon: any; requiresRestart: boolean }> = [
	{ key: 'discordRpc', icon: Gamepad2, requiresRestart: false },
	{ key: 'streamerMode', icon: ShieldCheck, requiresRestart: false },
	{ key: 'batterySaver', icon: BatteryCharging, requiresRestart: false },
	{ key: 'desktopNotifications', icon: Bell, requiresRestart: false },
	{ key: 'dailyStreakReminder', icon: Flame, requiresRestart: false },
	{ key: 'globalHotkey', icon: Keyboard, requiresRestart: false },
	{ key: 'globalQuickLauncher', icon: Command, requiresRestart: false },
	{ key: 'quickCaptureHotkey', icon: Camera, requiresRestart: false },
	{ key: 'hardwareAcceleration', icon: Cpu, requiresRestart: true },
	{ key: 'debug', icon: Terminal, requiresRestart: true },
	{ key: 'startOnBoot', icon: Power, requiresRestart: false },
	{ key: 'startMaximized', icon: Maximize2, requiresRestart: true },
	{ key: 'startMinimized', icon: Minimize2, requiresRestart: true },
	{ key: 'alwaysOnTop', icon: Pin, requiresRestart: false },
	{ key: 'minimizeOnClose', icon: Monitor, requiresRestart: false },
	{ key: 'openExternalInBrowser', icon: ExternalLink, requiresRestart: false },
];

export const VALID_STARTUP_LOCATIONS: StartupLocation[] = ['last', 'explore', 'dashboard', 'account', 'store', 'portal', 'api', 'docs', 'cdn', 'website', 'help', 'admin'];

export function normalizeDesktopMetadata(raw?: Record<string, any> | null): DesktopMetadata {
	const merged = { ...DEFAULT_DESKTOP_METADATA, ...(raw && typeof raw === 'object' ? raw : {}) };
	const validControls: WindowControlsStyle[] = ['system', 'windows', 'macos', 'xernerx'];
	const rawLoc = typeof merged.startupLocation === 'string' ? merged.startupLocation.trim().toLowerCase() : 'dashboard';
	return {
		...merged,
		hardwareAcceleration: merged.hardwareAcceleration !== false,
		debug: Boolean(merged.debug),
		startOnBoot: Boolean(merged.startOnBoot),
		startMaximized: Boolean(merged.startMaximized),
		startMinimized: Boolean(merged.startMinimized),
		alwaysOnTop: Boolean(merged.alwaysOnTop),
		minimizeOnClose: Boolean(merged.minimizeOnClose),
		globalHotkey: merged.globalHotkey !== false,
		globalQuickLauncher: Boolean(merged.globalQuickLauncher),
		quickCaptureHotkey: Boolean(merged.quickCaptureHotkey),
		streamerMode: Boolean(merged.streamerMode),
		batterySaver: merged.batterySaver !== false,
		openExternalInBrowser: merged.openExternalInBrowser !== false,
		discordRpc: merged.discordRpc !== false,
		desktopNotifications: merged.desktopNotifications !== false,
		dailyStreakReminder: merged.dailyStreakReminder !== false,
		windowControls: validControls.includes(merged.windowControls as WindowControlsStyle) ? (merged.windowControls as WindowControlsStyle) : 'system',
		startupLocation: VALID_STARTUP_LOCATIONS.includes(rawLoc as StartupLocation) ? (rawLoc as StartupLocation) : 'dashboard',
		cdnWatchFolder: typeof merged.cdnWatchFolder === 'string' ? merged.cdnWatchFolder.trim() : '',
	};
}
