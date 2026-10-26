/** @format */

'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Bell, Building2, Check, Columns2, EyeOff, Gift, Layers, Minus, MousePointerClick, Radio, RefreshCw, Search, Sparkles, Square, Store, X } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export function DesktopInteractivePreview() {
	const { t } = useDictionary();
	const [activeAccount, setActiveAccount] = useState<'main' | 'alt'>('main');
	const [claimed, setClaimed] = useState(false);
	const [overlayOpen, setOverlayOpen] = useState(true);
	const [ghostMode, setGhostMode] = useState(false);
	const [overlayOpacity, setOverlayOpacity] = useState<1 | 0.7>(1);
	const [osToastOpen, setOsToastOpen] = useState(false);
	const [rpcEnabled, setRpcEnabled] = useState(true);
	const [controlStyle, setControlStyle] = useState<'xernerx' | 'macos' | 'windows'>('macos');

	const currentName = activeAccount === 'main' ? 'Alex' : 'Alex_Alt';

	const cycleControls = () => {
		setControlStyle((prev) => (prev === 'macos' ? 'xernerx' : prev === 'xernerx' ? 'windows' : 'macos'));
	};

	return (
		<div className="relative w-full pb-5 sm:pr-3">
			{/* Ambient Accent Glow Behind Window */}
			<div
				className="pointer-events-none absolute -inset-4 rounded-3xl opacity-35 blur-2xl transition-all duration-500"
				style={{
					background: 'radial-gradient(circle at 50% 40%, var(--accent), transparent 70%)',
				}}
			/>

			{/* Main Mock Frameless Desktop Window */}
			<div className="relative rounded-3xl bg-(--foreground)/40 backdrop-blur-md border border-(--accent)/30 shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_22%,transparent)] overflow-hidden flex flex-col">
				{/* Custom Frameless Header Bar */}
				<div className="flex items-center justify-between border-b border-(--border)/10 bg-(--background)/60 px-4 py-2.5">
					<div className="flex items-center gap-2.5">
						{controlStyle === 'macos' && (
							<button type="button" onClick={cycleControls} className="group/tl flex items-center gap-1.5 mr-1 hover:cursor-pointer">
								<span className="h-5 w-5 rounded-full flex items-center justify-center text-(--text-muted)">
									<Columns2 size={11} />
								</span>
								<span className="h-3.5 w-3.5 rounded-full bg-(--border)/35 group-hover/tl:bg-(--accent-orange) flex items-center justify-center text-(--background) transition-colors">
									<Minus size={8} strokeWidth={3} className="opacity-0 group-hover/tl:opacity-100 transition-opacity" />
								</span>
								<span className="h-3.5 w-3.5 rounded-full bg-(--border)/35 group-hover/tl:bg-(--accent-green) flex items-center justify-center text-(--background) transition-colors">
									<Square size={6} strokeWidth={3} className="opacity-0 group-hover/tl:opacity-100 transition-opacity" />
								</span>
								<span className="h-3.5 w-3.5 rounded-full bg-(--accent-red)/60 group-hover/tl:bg-(--accent-red) flex items-center justify-center text-(--background) transition-colors">
									<X size={8} strokeWidth={3} className="opacity-0 group-hover/tl:opacity-100 transition-opacity" />
								</span>
							</button>
						)}
						<div className="h-6 w-6 rounded-full bg-(--accent) flex items-center justify-center text-[11px] font-black text-(--text)">X</div>
						<span className="text-xs font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.download.preview.windowTitle')}
						</span>
					</div>

					<div className="flex items-center gap-1.5">
						<span className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-(--foreground)/35 border border-(--border)/10 px-2 py-0.5 text-[10px] font-mono font-bold text-(--text-muted)">
							<Search size={10} className="text-(--accent)" />
							Ctrl K
						</span>
						<span className="hidden sm:inline-flex h-6 w-6 items-center justify-center rounded-xl bg-(--foreground)/35 border border-(--border)/10 text-(--text-muted)">
							<Building2 size={11} />
						</span>
						<span className="hidden sm:inline-flex h-6 w-6 items-center justify-center rounded-xl bg-(--foreground)/35 border border-(--border)/10 text-(--text-muted)">
							<Store size={11} />
						</span>
						<button
							type="button"
							onClick={() => setOsToastOpen((v) => !v)}
							title={t('www.download.perks.notifications.title')}
							className={`relative inline-flex h-6 w-6 items-center justify-center rounded-xl border transition hover:cursor-pointer ${
								osToastOpen ? 'bg-(--accent)/15 border-(--accent)/40 text-(--accent)' : 'bg-(--foreground)/35 border-(--border)/10 text-(--text-muted) hover:text-(--text)'
							}`}
						>
							<Bell size={11} />
							<span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-(--accent) border border-(--background)" />
						</button>
						<button
							type="button"
							onClick={() => setOverlayOpen((v) => !v)}
							className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition hover:cursor-pointer ${
								overlayOpen ? 'bg-(--accent)/15 border-(--accent)/40 text-(--accent)' : 'bg-(--foreground)/40 border-(--border)/10 text-(--text-muted) hover:text-(--text)'
							}`}
						>
							<Layers size={11} />
							{t('www.download.preview.overlayActive')}
						</button>
						{controlStyle !== 'macos' && (
							<button type="button" onClick={cycleControls} className="flex items-center gap-1.5 ml-1 hover:cursor-pointer">
								<span className="h-5 w-5 rounded-full flex items-center justify-center text-(--text-muted)">
									<Columns2 size={11} />
								</span>
								{controlStyle === 'xernerx' ? (
									<>
										<span className="h-5 w-5 rounded-full bg-(--foreground)/50 border border-(--border)/15 flex items-center justify-center text-(--text-muted)">
											<Minus size={11} />
										</span>
										<span className="h-5 w-5 rounded-full bg-(--foreground)/50 border border-(--border)/15 flex items-center justify-center text-(--text-muted)">
											<Square size={9} />
										</span>
										<span className="h-5 w-5 rounded-full bg-(--foreground)/50 border border-(--border)/15 flex items-center justify-center text-(--text-muted)">
											<X size={11} />
										</span>
									</>
								) : (
									<div className="flex items-center gap-2.5 text-(--text-muted)">
										<Minus size={13} />
										<Square size={10} />
										<X size={13} />
									</div>
								)}
							</button>
						)}
					</div>
				</div>

				{/* Window Body (Matching Page.tsx radial + linear accent gradient) */}
				<div
					className="flex flex-col transition-all duration-200"
					style={{
						padding: 'calc(var(--ui-gap) * 1.1)',
						paddingBottom: overlayOpen ? 'calc(var(--ui-gap) * 2.5)' : 'calc(var(--ui-gap) * 1.1)',
						gap: 'calc(var(--ui-gap) * 0.85)',
						background:
							'radial-gradient(circle at 50% 15%, color-mix(in srgb, var(--accent) 22%, var(--foreground)) 0%, var(--foreground) 78%), linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, var(--foreground)) 0%, var(--foreground) 50%, color-mix(in srgb, var(--accent) 14%, var(--foreground)) 100%)',
					}}
				>
					{/* Interactive Account Switcher Strip */}
					<div className="flex items-center justify-between gap-2 rounded-2xl bg-(--background)/60 border border-(--border)/10 p-2">
						<div className="flex items-center gap-2 min-w-0">
							<motion.div
								key={activeAccount}
								initial={{ scale: 0.8, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								className="h-9 w-9 rounded-full bg-(--accent) flex items-center justify-center text-xs font-black text-(--text) shrink-0 shadow-sm"
							>
								{activeAccount === 'main' ? 'A' : '2'}
							</motion.div>
							<div className="flex flex-col text-left min-w-0">
								<span className="text-xs font-extrabold text-(--text) truncate">{t('www.download.preview.welcomeBack', { name: currentName })}</span>
								<span className="text-[10px] font-semibold text-(--accent)">{activeAccount === 'main' ? t('www.download.preview.mainRole') : t('www.download.preview.altRole')}</span>
							</div>
						</div>

						<button
							type="button"
							onClick={() => {
								setActiveAccount((prev) => (prev === 'main' ? 'alt' : 'main'));
								setClaimed(false);
							}}
							className="inline-flex items-center gap-1.5 rounded-xl bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-(--text) border border-(--accent)/30 px-3 py-1.5 text-xs font-bold transition-all hover:cursor-pointer shrink-0"
						>
							<RefreshCw size={12} />
							{t('www.download.preview.switchAccount')}
						</button>
					</div>

					{/* Interactive Daily Gift Card + Credit Multiplier Pill */}
					<div className="flex items-center justify-between gap-3 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-3">
						<div className="flex items-center gap-2.5 text-left">
							<div className="h-9 w-9 rounded-2xl bg-(--accent)/15 border border-(--accent)/30 flex items-center justify-center text-(--accent) shrink-0">
								<Gift size={18} />
							</div>
							<div className="flex flex-col">
								<div className="flex items-center gap-1.5">
									<span className="text-xs font-bold text-(--text)">{t('www.download.preview.dailyRewardReady')}</span>
									<span className="rounded-full bg-(--accent)/15 border border-(--accent)/30 px-1.5 py-0.2 text-[9px] font-extrabold text-(--accent)">
										{activeAccount === 'main' ? '2x' : '1.25x'}
									</span>
								</div>
								<span className="text-[11px] text-(--text-muted)">14d 🔥</span>
							</div>
						</div>

						<motion.button
							type="button"
							whileTap={{ scale: 0.95 }}
							onClick={() => setClaimed((v) => !v)}
							className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all hover:cursor-pointer ${
								claimed ? 'bg-(--accent-green)/15 border border-(--accent-green)/30 text-(--accent-green)' : 'bg-(--accent) hover:bg-(--hover-accent) text-(--text) shadow-sm'
							}`}
						>
							{claimed ? <Check size={13} /> : <Sparkles size={13} />}
							{claimed ? t('www.download.preview.claimedReward') : t('www.download.preview.claimReward')}
						</motion.button>
					</div>

					{/* Discord Profile Status Bar */}
					<button
						type="button"
						onClick={() => setRpcEnabled((v) => !v)}
						className="flex items-center justify-between gap-2 rounded-2xl bg-(--background)/60 border border-(--border)/10 hover:border-(--accent)/35 px-3.5 py-2.5 transition-colors hover:cursor-pointer"
					>
						<div className="flex items-center gap-2 min-w-0">
							<span className={`h-2 w-2 rounded-full shrink-0 ${rpcEnabled ? 'bg-(--accent-green) animate-pulse' : 'bg-(--text-muted)/50'}`} />
							<Radio size={14} className={rpcEnabled ? 'text-(--accent) shrink-0' : 'text-(--text-muted) shrink-0'} />
							<span className="text-xs font-semibold text-(--text) truncate">{rpcEnabled ? t('www.download.preview.discordStatus') : t('www.download.preview.discordStatusOff')}</span>
						</div>
						<span
							className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${
								rpcEnabled ? 'bg-(--accent)/10 border-(--accent)/30 text-(--accent)' : 'bg-(--foreground)/50 border-(--border)/15 text-(--text-muted)'
							}`}
						>
							{rpcEnabled ? t('www.download.preview.liveBadge') : t('www.download.preview.offBadge')}
						</span>
					</button>
				</div>
			</div>

			{/* Native OS Notification Toast Preview (Top-Right Pop-Out) */}
			<AnimatePresence>
				{osToastOpen && (
					<motion.div
						initial={{ opacity: 0, scale: 0.92, y: -10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.92, y: -10 }}
						transition={{ duration: 0.2 }}
						onClick={() => setOsToastOpen(false)}
						className="absolute top-12 right-4 z-30 w-64 rounded-2xl bg-(--background)/95 backdrop-blur-xl border border-(--accent)/45 shadow-[0_12px_30px_rgba(0,0,0,0.45),0_0_24px_color-mix(in_srgb,var(--accent)_25%,transparent)] p-3 flex items-start gap-2.5 hover:cursor-pointer"
					>
						<div className="h-8 w-8 rounded-xl bg-(--accent)/15 border border-(--accent)/30 flex items-center justify-center text-(--accent) shrink-0 mt-0.5">
							<Bell size={14} />
						</div>
						<div className="flex flex-col text-left min-w-0 flex-1">
							<div className="flex items-center justify-between gap-1">
								<span className="text-[10px] font-extrabold uppercase tracking-wider text-(--accent)">{t('www.download.perks.notifications.badge')}</span>
								<span className="text-[9px] font-mono text-(--text-muted)">{controlStyle === 'macos' ? 'macOS' : 'Win 11'}</span>
							</div>
							<span className="text-xs font-bold text-(--text) truncate">{t('www.download.perks.notifications.toastTitle')}</span>
							<span className="text-[11px] text-(--text-muted) truncate">{t('www.download.perks.notifications.toastBody')}</span>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Floating Mini Overlay Pop-Out Window (Pops out over bottom-right corner without overlapping LIVE badge) */}
			<AnimatePresence>
				{overlayOpen && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 12 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: 12 }}
						transition={{ duration: 0.2 }}
						onClick={() => setOverlayOpen(false)}
						style={{ opacity: overlayOpacity }}
						className="absolute bottom-0 right-0 z-20 w-72 rounded-2xl bg-(--background)/95 backdrop-blur-xl border border-(--accent)/45 shadow-[0_12px_30px_rgba(0,0,0,0.45),0_0_24px_color-mix(in_srgb,var(--accent)_25%,transparent)] p-3 flex flex-col gap-2 hover:cursor-pointer transition-opacity"
					>
						<div className="flex items-center justify-between gap-1.5">
							<span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-(--accent)">
								<span className="h-1.5 w-1.5 rounded-full bg-(--accent-green) animate-pulse" />
								{ghostMode ? t('www.download.preview.ghostActive') : t('www.download.perks.overlay.pinnedLabel')}
							</span>
							<div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
								<button
									type="button"
									onClick={() => setOverlayOpacity((prev) => (prev === 1 ? 0.7 : 1))}
									className="rounded-full bg-(--foreground)/50 border border-(--border)/15 px-1.5 py-0.5 text-[9px] font-mono font-bold text-(--text-muted) hover:text-(--accent) hover:cursor-pointer"
								>
									{Math.round(overlayOpacity * 100)}%
								</button>
								<button
									type="button"
									onClick={() => setGhostMode((v) => !v)}
									className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold transition hover:cursor-pointer ${
										ghostMode ? 'bg-(--accent)/15 border-(--accent)/40 text-(--accent)' : 'bg-(--foreground)/50 border-(--border)/15 text-(--text-muted) hover:text-(--text)'
									}`}
								>
									{ghostMode ? <EyeOff size={9} /> : <MousePointerClick size={9} />}
									{t('www.download.preview.ghostBadge')}
								</button>
								<Activity size={12} className="text-(--accent)" />
							</div>
						</div>
						<span className="text-xs font-bold text-(--text) text-left">{t('www.download.perks.overlay.eventLabel')}</span>

						{/* Overlay Quick Daily Gift Claim Pill */}
						<div
							onClick={(e) => {
								e.stopPropagation();
								setClaimed((v) => !v);
							}}
							className="flex items-center justify-between gap-2 rounded-xl bg-(--foreground)/40 border border-(--border)/10 px-2.5 py-1.5"
						>
							<span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-(--text)">
								<Gift size={11} className="text-(--accent)" />
								<span>{claimed ? '23h 59m • 15d 🔥' : '14d 🔥'}</span>
							</span>
							<span
								className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
									claimed ? 'bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/30' : 'bg-(--accent) text-(--text)'
								}`}
							>
								{claimed ? <Check size={9} /> : <Sparkles size={9} />}
								{claimed ? t('www.download.preview.claimedReward') : t('www.download.preview.claimReward')}
							</span>
						</div>

						{/* Overlay Owned Bots Status Ticker */}
						<div className="flex items-center gap-1.5 pt-0.5">
							<span className="inline-flex items-center gap-1 rounded-full bg-(--foreground)/40 border border-(--border)/10 px-2 py-0.5 text-[10px] font-bold text-(--text)">
								<span className="h-1.5 w-1.5 rounded-full bg-(--accent-green) animate-pulse" />
								<span>Virtue</span>
								<span className="font-mono text-[9px] text-(--accent)">1.2k</span>
							</span>
							<span className="inline-flex items-center gap-1 rounded-full bg-(--foreground)/40 border border-(--border)/10 px-2 py-0.5 text-[10px] font-bold text-(--text)">
								<span className="h-1.5 w-1.5 rounded-full bg-(--accent-green) animate-pulse" />
								<span>Xernerx</span>
								<span className="font-mono text-[9px] text-(--accent)">420</span>
							</span>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
