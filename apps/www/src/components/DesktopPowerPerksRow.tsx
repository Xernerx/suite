/** @format */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, EyeOff, Layers, MousePointerClick, Webhook } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

export function DesktopPowerPerksRow() {
	const { t } = useDictionary();
	const [relayPinged, setRelayPinged] = useState(false);
	const [startupIndex, setStartupIndex] = useState(0);
	const [ghostOverlay, setGhostOverlay] = useState(true);

	const startupTargets = [t('www.download.perks.multiWindow.targetPortal'), t('www.download.perks.multiWindow.targetLast'), t('www.download.perks.multiWindow.targetDashboard')];

	return (
		<>
			{/* 10. LOCALHOST WEBHOOK RELAY IN PORTAL (col-span-4) */}
			<motion.div
				whileHover={{ y: -3 }}
				onClick={() => {
					setRelayPinged(true);
					setTimeout(() => setRelayPinged(false), 2000);
				}}
				className="md:col-span-4 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/30 shadow-sm hover:shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)] transition-all flex flex-col justify-between hover:cursor-pointer"
				style={{ padding: 'calc(var(--ui-gap) * 1.25)', gap: 'var(--ui-gap)' }}
			>
				<div className="rounded-2xl bg-(--background)/60 border border-(--border)/10 p-3.5 flex items-center justify-between gap-3">
					<div className="h-11 w-11 rounded-2xl bg-(--accent)/15 border border-(--accent)/30 flex items-center justify-center text-(--accent) shrink-0">
						{relayPinged ? <Check size={20} className="text-(--accent-green)" /> : <Webhook size={20} />}
					</div>
					<div className="flex flex-col items-start gap-1 flex-1 min-w-0">
						<span
							className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold truncate max-w-full ${
								relayPinged ? 'bg-(--accent-green)/15 border-(--accent-green)/30 text-(--accent-green)' : 'bg-(--accent)/15 border-(--accent)/30 text-(--accent)'
							}`}
						>
							{relayPinged ? t('www.download.perks.localRelay.pingSent') : t('www.download.perks.localRelay.pingReady')}
						</span>
						<span className="text-[10px] font-mono text-(--text-muted) truncate">POST http://127.0.0.1:3000/webhooks</span>
					</div>
				</div>

				<div className="flex flex-col gap-1.5 text-left">
					<div className="flex items-center gap-2 text-(--accent)">
						<Webhook size={18} />
						<span className="text-[11px] font-bold uppercase tracking-wider">{t('www.download.perks.localRelay.badge')}</span>
					</div>
					<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('www.download.perks.localRelay.title')}
					</h3>
					<p className="text-xs text-(--text-muted) leading-relaxed">{t('www.download.perks.localRelay.description')}</p>
				</div>
			</motion.div>

			{/* 11. MULTI-WINDOW TEAR-OFF & CUSTOM STARTUP LOCATION (col-span-4) */}
			<motion.div
				whileHover={{ y: -3 }}
				onClick={() => setStartupIndex((i) => (i + 1) % startupTargets.length)}
				className="md:col-span-4 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/30 shadow-sm hover:shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)] transition-all flex flex-col justify-between hover:cursor-pointer"
				style={{ padding: 'calc(var(--ui-gap) * 1.25)', gap: 'var(--ui-gap)' }}
			>
				<div className="rounded-2xl bg-(--background)/60 border border-(--border)/10 p-3.5 flex items-center justify-between gap-3">
					<div className="h-11 w-11 rounded-2xl bg-(--accent)/15 border border-(--accent)/30 flex items-center justify-center text-(--accent) shrink-0">
						<Layers size={20} />
					</div>
					<div className="flex flex-col items-start gap-1 flex-1 min-w-0">
						<span className="text-xs font-extrabold text-(--text) truncate">{t('www.download.perks.multiWindow.startupLabel', { target: startupTargets[startupIndex] })}</span>
						<span className="text-[10px] font-mono text-(--accent) truncate">Ctrl + Shift + N • Middle-Click</span>
					</div>
				</div>

				<div className="flex flex-col gap-1.5 text-left">
					<div className="flex items-center gap-2 text-(--accent)">
						<Layers size={18} />
						<span className="text-[11px] font-bold uppercase tracking-wider">{t('www.download.perks.multiWindow.badge')}</span>
					</div>
					<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('www.download.perks.multiWindow.title')}
					</h3>
					<p className="text-xs text-(--text-muted) leading-relaxed">{t('www.download.perks.multiWindow.description')}</p>
				</div>
			</motion.div>

			{/* 12. CLICK-THROUGH GHOST OVERLAY, SHIFT+DROP CDN & STREAK GUARDIAN (col-span-4) */}
			<motion.div
				whileHover={{ y: -3 }}
				onClick={() => setGhostOverlay((v) => !v)}
				className="md:col-span-4 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/30 shadow-sm hover:shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)] transition-all flex flex-col justify-between hover:cursor-pointer"
				style={{ padding: 'calc(var(--ui-gap) * 1.25)', gap: 'var(--ui-gap)' }}
			>
				<div className="rounded-2xl bg-(--background)/60 border border-(--border)/10 p-3.5 flex items-center justify-between gap-3">
					<div className="h-11 w-11 rounded-2xl bg-(--accent)/15 border border-(--accent)/30 flex items-center justify-center text-(--accent) shrink-0">
						{ghostOverlay ? <EyeOff size={20} /> : <MousePointerClick size={20} />}
					</div>
					<div className="flex flex-col items-start gap-1 flex-1 min-w-0">
						<span className="text-xs font-extrabold text-(--text) truncate">
							{ghostOverlay ? t('www.download.perks.ghostAndGuardian.ghostOn') : t('www.download.perks.ghostAndGuardian.ghostOff')}
						</span>
						<span className="text-[10px] font-semibold text-(--accent) truncate">{t('www.download.perks.ghostAndGuardian.guardianHint')}</span>
					</div>
				</div>

				<div className="flex flex-col gap-1.5 text-left">
					<div className="flex items-center gap-2 text-(--accent)">
						<EyeOff size={18} />
						<span className="text-[11px] font-bold uppercase tracking-wider">{t('www.download.perks.ghostAndGuardian.badge')}</span>
					</div>
					<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('www.download.perks.ghostAndGuardian.title')}
					</h3>
					<p className="text-xs text-(--text-muted) leading-relaxed">{t('www.download.perks.ghostAndGuardian.description')}</p>
				</div>
			</motion.div>
		</>
	);
}
