/** @format */

'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Bell, Check, Eye, Ghost, Gift, Minus, RefreshCw, Sparkles, X } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Tabs } from '@xernerx/ui';
import BannerPublic from '../../../../packages/public/banner.svg';
import type { PreviewControlStyle } from './DesktopPreviewHeader';
import type { PreviewBotTickerItem } from './useDesktopPreviewData';

interface DesktopPreviewOverlayProps {
	platform: 'windows' | 'macos' | 'linux';
	controlStyle: PreviewControlStyle;
	osToastOpen: boolean;
	setOsToastOpen: (open: boolean) => void;
	overlayOpen: boolean;
	setOverlayOpen: (open: boolean) => void;
	ghostMode: boolean;
	setGhostMode: (fn: (prev: boolean) => boolean) => void;
	overlayOpacity: 1 | 0.85 | 0.7 | 0.5;
	setOverlayOpacity: (val: 1 | 0.85 | 0.7 | 0.5) => void;
	claimed: boolean;
	setClaimed: (fn: (prev: boolean) => boolean) => void;
	streakDays: number;
	tickerBots: PreviewBotTickerItem[];
}

export function DesktopPreviewOverlay({
	platform,
	controlStyle,
	osToastOpen,
	setOsToastOpen,
	overlayOpen,
	setOverlayOpen,
	ghostMode,
	setGhostMode,
	overlayOpacity,
	setOverlayOpacity,
	claimed,
	setClaimed,
	streakDays,
	tickerBots,
}: DesktopPreviewOverlayProps) {
	const { t } = useDictionary();
	const [overlayTab, setOverlayTab] = useState<'feed' | 'servers' | 'inspector' | 'quick'>('feed');
	const osBadge = controlStyle === 'macos' || platform === 'macos' ? 'macOS' : platform === 'linux' ? 'Linux' : 'Win 11';
	const shownStreak = claimed ? streakDays + 1 : streakDays;

	return (
		<>
			{/* Native OS Notification Toast Preview */}
			<AnimatePresence>
				{osToastOpen && (
					<motion.div
						initial={{ opacity: 0, scale: 0.92, y: -10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.92, y: -10 }}
						transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
						onClick={() => setOsToastOpen(false)}
						className="origin-top-right absolute top-16 right-5 z-50 w-80 rounded-3xl bg-(--background)/95 backdrop-blur-xl border border-(--accent)/45 shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_24px_color-mix(in_srgb,var(--accent)_25%,transparent)] p-4 flex items-start gap-3 cursor-pointer"
					>
						<div className="h-10 w-10 rounded-2xl bg-(--accent)/15 border border-(--accent)/30 flex items-center justify-center text-(--accent) shrink-0">
							<Bell size={18} />
						</div>
						<div className="flex flex-col text-left min-w-0 flex-1 gap-0.5">
							<div className="flex items-center justify-between gap-2">
								<span className="text-[11px] font-extrabold uppercase tracking-wider text-(--accent)">{t('www.download.perks.notifications.badge')}</span>
								<span className="text-[10px] font-mono text-(--text-muted)">{osBadge}</span>
							</div>
							<span className="text-sm font-bold text-(--text) truncate">{t('www.download.perks.notifications.toastTitle')}</span>
							<span className="text-xs text-(--text-muted) truncate">{t('www.download.perks.notifications.toastBody')}</span>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Authentic /overlay Frameless BrowserWindow (Matches clients/desktop/src/overlay.ts + OverlayMonitor.tsx) */}
			<AnimatePresence>
				{overlayOpen && (
					<motion.div
						initial={{ opacity: 0, scale: 0.92, y: 12 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.92, y: 12 }}
						transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
						style={{ opacity: overlayOpacity }}
						className="origin-bottom-right absolute bottom-4 right-4 z-40 w-[372px] rounded-2xl bg-(--background)/95 backdrop-blur-xl border border-(--accent)/45 shadow-[0_22px_50px_rgba(0,0,0,0.6),0_0_28px_color-mix(in_srgb,var(--accent)_25%,transparent)] overflow-hidden flex flex-col transition-opacity"
					>
						{/* Mini Frameless Electron Titlebar */}
						<div className="flex h-9 items-center justify-between bg-(--background) px-3 border-b border-(--border)/10">
							<BannerPublic className="h-6 text-(--accent)" />
							<div className="flex items-center gap-2.5 text-(--text-muted)">
								<button type="button" aria-label={t('common.window.minimize')} onClick={() => setOverlayOpen(false)} className="hover:text-(--accent) transition-colors cursor-pointer">
									<Minus size={15} />
								</button>
								<button
									type="button"
									aria-label={t('app.overlay.closeOverlay')}
									onClick={() => setOverlayOpen(false)}
									className="hover:text-(--accent-red) transition-colors cursor-pointer"
								>
									<X size={15} />
								</button>
							</div>
						</div>

						<div className="p-3.5 flex flex-col gap-2.5">
							{/* Telemetry Status Card */}
							<div className="rounded-2xl border border-(--border)/10 bg-(--foreground)/45 p-3 flex flex-col gap-2">
								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-2.5 min-w-0">
										<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
											<Activity size={15} />
										</div>
										<div className="flex flex-col text-left min-w-0">
											<span className="text-xs font-extrabold text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
												{t('app.overlay.title')}
											</span>
											<div className="flex items-center gap-1.5 text-[10px] text-(--text-muted)">
												<span className="h-1.5 w-1.5 rounded-full bg-(--accent-green)" />
												<span>{t('app.overlay.statusOnline')}</span>
												<span className="font-mono text-(--accent)">• 18ms</span>
											</div>
										</div>
									</div>

									<span className="h-7 w-7 rounded-xl bg-(--background)/60 border border-(--border)/10 flex items-center justify-center text-(--text-muted)">
										<RefreshCw size={12} />
									</span>
								</div>

								<div className="flex items-center justify-between gap-1.5 rounded-xl bg-(--background)/60 border border-(--border)/10 px-2.5 py-1.5">
									<button
										type="button"
										onClick={() => setGhostMode((v) => !v)}
										className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
											ghostMode ? 'bg-(--accent)/20 border-(--accent)/40 text-(--accent)' : 'bg-(--foreground)/50 border-(--border)/15 text-(--text-muted) hover:text-(--text)'
										}`}
									>
										<Ghost size={11} />
										<span>{ghostMode ? t('www.download.preview.ghostActive') : t('www.download.preview.ghostBadge')}</span>
										<kbd className="font-mono text-[8px] opacity-75">Alt+Shift+O</kbd>
									</button>

									<div className="flex items-center gap-0.5">
										<Eye size={11} className="text-(--text-muted) mr-0.5" />
										{([1, 0.85, 0.7, 0.5] as const).map((lvl) => (
											<button
												key={lvl}
												type="button"
												onClick={() => setOverlayOpacity(lvl)}
												className={`rounded-full px-1.5 py-0.5 text-[9px] font-mono font-bold transition-colors cursor-pointer ${
													overlayOpacity === lvl ? 'bg-(--accent) text-(--accent-contrast)' : 'bg-(--foreground)/40 text-(--text-muted) hover:text-(--text)'
												}`}
											>
												{Math.round(lvl * 100)}%
											</button>
										))}
									</div>
								</div>
							</div>

							{/* Quick Daily Gift Claim Pill */}
							<button
								type="button"
								onClick={() => setClaimed((v) => !v)}
								className="flex items-center justify-between gap-2 rounded-2xl bg-(--foreground)/40 hover:bg-(--foreground)/60 border border-(--border)/10 px-3 py-2 transition-colors cursor-pointer"
							>
								<span className="inline-flex items-center gap-2 text-xs font-bold text-(--text)">
									<Gift size={13} className="text-(--accent)" />
									<span>{claimed ? `23h 59m • ${shownStreak}d 🔥` : `${shownStreak}d 🔥`}</span>
								</span>
								<span
									className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
										claimed ? 'bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/30' : 'bg-(--accent) text-(--accent-contrast)'
									}`}
								>
									{claimed ? <Check size={10} /> : <Sparkles size={10} />}
									{claimed ? t('www.download.preview.claimedReward') : t('www.download.preview.claimReward')}
								</span>
							</button>

							{/* Owned Bots Status Ticker */}
							<div className="flex flex-wrap items-center gap-1.5">
								{tickerBots.map((bot) => (
									<span
										key={bot.name}
										className="inline-flex items-center gap-1.5 rounded-full bg-(--foreground)/40 border border-(--border)/10 px-2.5 py-0.5 text-[10px] font-bold text-(--text)"
									>
										<span className="h-1.5 w-1.5 rounded-full bg-(--accent-green) shrink-0" />
										<span className="truncate max-w-[84px]">{bot.name}</span>
										<span className="font-mono text-[9px] text-(--accent) shrink-0">{bot.count}</span>
									</span>
								))}
							</div>

							{/* OverlayMonitor 4-Tab Bar */}
							<Tabs
								size="sm"
								activeTab={overlayTab}
								onChange={(id) => setOverlayTab(id as any)}
								tabs={[
									{ id: 'feed', label: t('app.overlay.tabs.feed') },
									{ id: 'servers', label: t('app.overlay.tabs.servers') },
									{ id: 'inspector', label: t('app.overlay.tabs.inspector') },
									{ id: 'quick', label: t('app.overlay.tabs.quick') },
								]}
							/>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
