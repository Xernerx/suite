/** @format */

import NextAuth, { DefaultSession } from 'next-auth';

export {};

declare global {
	interface Window {
		electron?: {
			minimize: () => void;
			maximize: () => void;
			close: () => void;
			isMaximized: () => Promise<boolean>;
			getMetadata?: () => Promise<any>;
			updateMetadata?: (patch: Record<string, any>) => Promise<any>;
			onMetadataUpdated?: (callback: (meta: any) => void) => () => void;
			getPowerState?: () => Promise<{ onBattery: boolean; batterySaverEnabled: boolean; effectiveBatterySaver: boolean; lastResumeAt: number | null; event?: string }>;
			onPowerStateChange?: (callback: (state: any) => void) => () => void;
			getStreamerState?: () => Promise<{ streamerMode: boolean; contentProtected: boolean; broadcasterDetected: boolean; broadcasterName: string | null }>;
			onStreamerStateChange?: (callback: (state: any) => void) => () => void;
			quickCapture?: (sourceType?: 'screen' | 'clipboard') => Promise<{ dataUrl: string; filename: string; sourceType: 'screen' | 'clipboard'; timestamp: number } | null>;
			captureBugReport?: (meta?: { pageUrl?: string; product?: string }) => Promise<{ dataUrl: string; filename: string; pageUrl: string; product?: string; timestamp: number } | null>;
			consumeBugReport?: () => Promise<{ dataUrl: string; filename: string; pageUrl: string; product?: string; timestamp: number } | null>;
			onQuickCapture?: (callback: (payload: { dataUrl: string; filename: string; sourceType: 'screen' | 'clipboard' | 'watch-folder'; timestamp: number }) => void) => () => void;
			writeClipboardText?: (text: string) => Promise<boolean>;
			guardClipboardSecret?: (secret: string, ttlMs?: number) => Promise<{ expiresAt: number; ttlMs: number }>;
			cancelClipboardGuard?: () => Promise<boolean>;
			onClipboardGuardState?: (callback: (payload: { active: boolean; expiresAt: number | null; ttlMs: number; event: 'guarded' | 'cleared' | 'cancelled' }) => void) => () => void;
			setProgressBar?: (progress: number, mode?: 'none' | 'normal' | 'indeterminate' | 'error' | 'paused') => Promise<boolean>;
			selectWatchFolder?: () => Promise<any>;
			clearWatchFolder?: () => Promise<any>;
			onQuickLaunch?: (callback: () => void) => () => void;
			clearCache?: () => Promise<boolean>;
			getLogs?: () => Promise<string | { path?: string; content?: string }>;
			openLogs?: () => Promise<boolean>;
			openExternal?: (url: string) => Promise<boolean>;
			notify?: (payload: {
				id?: string;
				title: string;
				body?: string;
				subtitle?: string;
				link?: string | null;
				silent?: boolean;
				urgency?: 'normal' | 'critical' | 'low';
				force?: boolean;
			}) => Promise<boolean> | void;
			setBadgeCount?: (count: number) => void;
			onNotificationClick?: (callback: (payload: any) => void) => () => void;
			setActivity?: (activity: { details?: string; state?: string }) => void;
			toggleOverlay?: () => Promise<boolean>;
			getOverlayState?: () => Promise<{ ghostMode: boolean; opacity: number }>;
			setOverlayGhostMode?: (enabled: boolean) => Promise<{ ghostMode: boolean; opacity: number }>;
			setOverlayInteractiveHover?: (hovering: boolean) => Promise<{ ghostMode: boolean; opacity: number }>;
			setOverlayOpacity?: (opacity: number) => Promise<{ ghostMode: boolean; opacity: number }>;
			onOverlayStateChange?: (callback: (state: { ghostMode: boolean; opacity: number }) => void) => () => void;
			openCompanionWindow?: (targetUrl?: string) => Promise<boolean>;
			relayLocalWebhook?: (req: { url: string; botId?: string; events?: string[] }) => Promise<any>;
			getWebhookHistory?: () => Promise<
				Array<{
					id: string;
					url: string;
					botId?: string;
					events: string[];
					ok: boolean;
					status: number;
					latencyMs: number;
					statusText: string;
					bodyPreview: string;
					timestamp: number;
				}>
			>;
			onWebhookDelivery?: (
				callback: (payload: {
					id: string;
					url: string;
					botId?: string;
					events: string[];
					ok: boolean;
					status: number;
					latencyMs: number;
					statusText: string;
					bodyPreview: string;
					timestamp: number;
				}) => void
			) => () => void;
			syncDailyGiftSchedule?: (payload: { nextClaimAt?: string | number | null; streak?: number }) => Promise<boolean>;
			navigateMain?: (targetPath: string) => void;
			getAccounts?: () => Promise<any>;
			syncAccountProfile?: (profile: { id?: string; username?: string; globalName?: string; avatar?: string }) => Promise<any>;
			switchAccount?: (slot: string) => Promise<boolean>;
			removeAccount?: (slot: string) => Promise<any>;
			checkForUpdate?: () => Promise<{
				outdated: boolean;
				currentVersion: string;
				latestVersion: string | null;
				tagName: string | null;
				publishedAt: string | null;
				channel: 'stable' | 'canary';
				downloadUrl: string | null;
				fileName: string | null;
				size: number | null;
			}>;
			installUpdate?: () => Promise<boolean>;
			onUpdateProgress?: (
				callback: (payload: {
					status: 'checking' | 'downloading' | 'installing' | 'up-to-date' | 'error';
					progress: number;
					downloadedBytes?: number;
					totalBytes?: number;
					version?: string | null;
					message?: string;
					error?: string;
				}) => void
			) => () => void;
			restart?: (finalMeta?: Record<string, any>) => Promise<boolean> | void;
			version: string;
			metadata: any;
		};
	}
}

declare module 'next-auth' {
	interface Session extends DefaultSession {
		user: {
			id: string;
		} & DefaultSession['user'];
		[index: string]: any;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		[index: string]: any;
	}
}

declare module '*.svg' {
	const content: any;
	export default content;
}
