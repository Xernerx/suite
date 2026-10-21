/** @format */

'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Check, Gift, Layers, Minus, Radio, RefreshCw, Sparkles, Square, Users, X } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export function DesktopInteractivePreview() {
	const { t } = useDictionary();
	const [activeAccount, setActiveAccount] = useState<'main' | 'alt'>('main');
	const [claimed, setClaimed] = useState(false);
	const [overlayOpen, setOverlayOpen] = useState(true);
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

				{/* Window Body */}
				<div
					className="flex flex-col transition-all duration-200"
					style={{
						padding: 'calc(var(--ui-gap) * 1.1)',
						paddingBottom: overlayOpen ? 'calc(var(--ui-gap) * 2.5)' : 'calc(var(--ui-gap) * 1.1)',
						gap: 'calc(var(--ui-gap) * 0.85)',
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

					{/* Interactive Daily Gift Card */}
					<div className="flex items-center justify-between gap-3 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-3">
						<div className="flex items-center gap-2.5 text-left">
							<div className="h-9 w-9 rounded-2xl bg-(--accent)/15 border border-(--accent)/30 flex items-center justify-center text-(--accent) shrink-0">
								<Gift size={18} />
							</div>
							<div className="flex flex-col">
								<span className="text-xs font-bold text-(--text)">{t('www.download.preview.dailyRewardReady')}</span>
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
					<div className="flex items-center justify-between gap-2 rounded-2xl bg-(--background)/60 border border-(--border)/10 px-3.5 py-2.5">
						<div className="flex items-center gap-2 min-w-0">
							<span className="h-2 w-2 rounded-full bg-(--accent-green) animate-pulse shrink-0" />
							<Radio size={14} className="text-(--accent) shrink-0" />
							<span className="text-xs font-semibold text-(--text) truncate">{t('www.download.preview.discordStatus')}</span>
						</div>
						<span className="rounded-full bg-(--accent)/10 border border-(--accent)/30 px-2.5 py-0.5 text-[10px] font-bold text-(--accent) shrink-0">LIVE</span>
					</div>
				</div>
			</div>

			{/* Floating Mini Overlay Pop-Out Window (Pops out over bottom-right corner without overlapping LIVE badge) */}
			<AnimatePresence>
				{overlayOpen && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 12 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: 12 }}
						transition={{ duration: 0.2 }}
						onClick={() => setOverlayOpen(false)}
						className="absolute bottom-0 right-0 z-20 w-64 rounded-2xl bg-(--background)/95 backdrop-blur-xl border border-(--accent)/45 shadow-[0_12px_30px_rgba(0,0,0,0.45),0_0_24px_color-mix(in_srgb,var(--accent)_25%,transparent)] p-3 flex flex-col gap-1.5 hover:cursor-pointer"
					>
						<div className="flex items-center justify-between">
							<span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-(--accent)">
								<span className="h-1.5 w-1.5 rounded-full bg-(--accent-green) animate-pulse" />
								{t('www.download.perks.overlay.pinnedLabel')}
							</span>
							<Activity size={12} className="text-(--accent)" />
						</div>
						<span className="text-xs font-bold text-(--text) text-left">{t('www.download.perks.overlay.eventLabel')}</span>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
