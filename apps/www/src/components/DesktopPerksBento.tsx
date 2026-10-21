/** @format */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Command, Layers, QrCode, Radio, RefreshCw, Sparkles, Users, Zap } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

const SAMPLE_CODES = ['XRN-84K', 'K7M-92P', 'V4X-31Q', 'Q9L-55Z'];

export function DesktopPerksBento() {
	const { t } = useDictionary();
	const [selectedAccount, setSelectedAccount] = useState<'main' | 'alt'>('main');
	const [altActivity, setAltActivity] = useState(false);
	const [pinned, setPinned] = useState(true);
	const [codeIndex, setCodeIndex] = useState(0);
	const [keyBounce, setKeyBounce] = useState(false);
	const [currentTime, setCurrentTime] = useState<string>('--:--');

	useEffect(() => {
		const updateClock = () => {
			const now = new Date();
			const hh = String(now.getHours()).padStart(2, '0');
			const mm = String(now.getMinutes()).padStart(2, '0');
			setCurrentTime(`${hh}:${mm}`);
		};
		updateClock();
		const interval = setInterval(updateClock, 10000);
		return () => clearInterval(interval);
	}, []);

	return (
		<section className="w-full pb-16" style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--ui-gap) * 1.5)' }}>
			<div className="flex flex-col items-center text-center max-w-2xl mx-auto" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				<span className="inline-flex items-center gap-1.5 rounded-full bg-(--accent)/10 border border-(--accent)/30 px-3.5 py-1 text-xs font-bold text-(--accent)">
					<Sparkles size={13} />
					{t('www.download.badge')}
				</span>
				<h2 className="text-2xl md:text-3xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('www.download.perks.title')}
				</h2>
				<p className="text-sm text-(--text-muted)">{t('www.download.perks.subtitle')}</p>
			</div>

			{/* ASYMMETRIC INTERACTIVE BENTO GRID */}
			<div className="grid grid-cols-1 md:grid-cols-12" style={{ gap: 'var(--ui-gap)' }}>
				{/* 1. WIDE FEATURE CARD: 1-CLICK MULTI-ACCOUNT SWITCHER (col-span-7) */}
				<motion.div
					whileHover={{ y: -3 }}
					className="md:col-span-7 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/30 shadow-sm hover:shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)] transition-all flex flex-col justify-between"
					style={{ padding: 'calc(var(--ui-gap) * 1.35)', gap: 'var(--ui-gap)' }}
				>
					{/* Interactive Account Switcher Playground */}
					<div className="rounded-2xl bg-(--background)/60 border border-(--border)/10 p-3 flex flex-col gap-2">
						{(
							[
								{ id: 'main', handle: '@Alex', role: t('www.download.preview.mainRole'), initial: 'A' },
								{ id: 'alt', handle: '@CozyAlt', role: t('www.download.preview.altRole'), initial: 'C' },
							] as const
						).map((acct) => {
							const isCurrent = selectedAccount === acct.id;
							return (
								<button
									type="button"
									key={acct.id}
									onClick={() => setSelectedAccount(acct.id)}
									className={`w-full flex items-center justify-between rounded-2xl border px-3.5 py-2.5 transition-all hover:cursor-pointer ${
										isCurrent ? 'bg-(--accent)/15 border-(--accent)/40 shadow-sm' : 'bg-(--foreground)/40 border-(--border)/10 hover:border-(--accent)/25'
									}`}
								>
									<div className="flex items-center gap-3 min-w-0">
										<div
											className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
												isCurrent ? 'bg-(--accent) text-(--text)' : 'bg-(--foreground) border border-(--border)/20 text-(--text-muted)'
											}`}
										>
											{acct.initial}
										</div>
										<div className="flex flex-col text-left min-w-0">
											<span className="text-xs font-extrabold text-(--text) truncate">{acct.handle}</span>
											<span className="text-[11px] text-(--text-muted)">{acct.role}</span>
										</div>
									</div>

									{isCurrent ? (
										<span className="rounded-full bg-(--accent-green)/15 border border-(--accent-green)/30 px-3 py-1 text-[10px] font-extrabold text-(--accent-green)">
											{t('www.download.perks.multiAccount.activeLabel')}
										</span>
									) : (
										<span className="rounded-full bg-(--accent)/10 border border-(--accent)/30 px-3 py-1 text-[10px] font-bold text-(--accent)">
											{t('www.download.perks.multiAccount.switchLabel')}
										</span>
									)}
								</button>
							);
						})}
					</div>

					<div className="flex flex-col gap-1.5 text-left">
						<div className="flex items-center gap-2 text-(--accent)">
							<Users size={18} />
							<span className="text-[11px] font-bold uppercase tracking-wider">{t('www.download.perks.multiAccount.badge')}</span>
						</div>
						<h3 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.download.perks.multiAccount.title')}
						</h3>
						<p className="text-xs md:text-sm text-(--text-muted) leading-relaxed">{t('www.download.perks.multiAccount.description')}</p>
					</div>
				</motion.div>

				{/* 2. DISCORD PROFILE STATUS (col-span-5) */}
				<motion.div
					whileHover={{ y: -3 }}
					onClick={() => setAltActivity((v) => !v)}
					className="md:col-span-5 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/30 shadow-sm hover:shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)] transition-all flex flex-col justify-between hover:cursor-pointer"
					style={{ padding: 'calc(var(--ui-gap) * 1.35)', gap: 'var(--ui-gap)' }}
				>
					{/* Interactive Discord Status Card */}
					<div className="rounded-2xl bg-(--background)/60 border border-(--border)/10 p-4 flex flex-col gap-3">
						<div className="flex items-center gap-3">
							<div className="relative h-12 w-12 rounded-2xl bg-(--accent)/15 border border-(--accent)/30 flex items-center justify-center text-(--accent) shrink-0">
								<Radio size={22} />
								<span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-(--accent-green) border-2 border-(--background)" />
							</div>
							<div className="flex flex-col text-left min-w-0 flex-1 gap-0.5">
								<div className="flex items-center justify-between gap-2">
									<span className="text-xs font-extrabold text-(--text) truncate">{t('www.download.perks.discordRpc.activityName')}</span>
									<span className="rounded-full bg-(--accent-green)/15 px-2 py-0.5 text-[10px] font-mono font-bold text-(--accent-green)">{currentTime}</span>
								</div>
								<motion.span
									key={altActivity ? 'alt' : 'main'}
									initial={{ opacity: 0, y: 4 }}
									animate={{ opacity: 1, y: 0 }}
									className="text-xs font-semibold text-(--accent) truncate"
								>
									{altActivity ? t('www.download.perks.discordRpc.activityStateAlt') : t('www.download.perks.discordRpc.activityState')}
								</motion.span>
							</div>
						</div>

						<div className="flex items-center justify-between rounded-xl bg-(--foreground)/40 border border-(--border)/10 px-3 py-1.5 text-[11px] font-semibold text-(--text-muted)">
							<span>{t('www.download.perks.discordRpc.toggleActivity')}</span>
							<RefreshCw size={12} className="text-(--accent)" />
						</div>
					</div>

					<div className="flex flex-col gap-1.5 text-left">
						<div className="flex items-center gap-2 text-(--accent)">
							<Radio size={18} />
							<span className="text-[11px] font-bold uppercase tracking-wider">{t('www.download.perks.discordRpc.badge')}</span>
						</div>
						<h3 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.download.perks.discordRpc.title')}
						</h3>
						<p className="text-xs md:text-sm text-(--text-muted) leading-relaxed">{t('www.download.perks.discordRpc.description')}</p>
					</div>
				</motion.div>

				{/* 3. FLOATING MINI OVERLAY (col-span-4) */}
				<motion.div
					whileHover={{ y: -3 }}
					onClick={() => setPinned((v) => !v)}
					className="md:col-span-4 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/30 shadow-sm hover:shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)] transition-all flex flex-col justify-between hover:cursor-pointer"
					style={{ padding: 'calc(var(--ui-gap) * 1.25)', gap: 'var(--ui-gap)' }}
				>
					<div className="rounded-2xl bg-(--background)/60 border border-(--border)/10 p-3.5 flex flex-col gap-2.5">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<span className="h-2 w-2 rounded-full bg-(--accent-green) animate-pulse" />
								<span className="text-xs font-bold text-(--text)">{t('www.download.perks.overlay.latencyLabel')}</span>
							</div>
							<span
								className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider transition-colors ${
									pinned ? 'bg-(--accent)/15 border-(--accent)/40 text-(--accent)' : 'bg-(--foreground)/50 border-(--border)/20 text-(--text-muted)'
								}`}
							>
								{pinned ? t('www.download.perks.overlay.pinnedLabel') : t('www.download.perks.overlay.unpinnedLabel')}
							</span>
						</div>
						<div className="rounded-xl bg-(--foreground)/40 border border-(--border)/10 px-3 py-2 text-left">
							<span className="text-xs font-semibold text-(--text)">{pinned ? t('www.download.perks.overlay.eventLabel') : t('www.download.perks.overlay.eventLabel2')}</span>
						</div>
					</div>

					<div className="flex flex-col gap-1.5 text-left">
						<div className="flex items-center gap-2 text-(--accent)">
							<Activity size={18} />
							<span className="text-[11px] font-bold uppercase tracking-wider">{t('www.download.perks.overlay.badge')}</span>
						</div>
						<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.download.perks.overlay.title')}
						</h3>
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('www.download.perks.overlay.description')}</p>
					</div>
				</motion.div>

				{/* 4. SIGN IN WITH YOUR PHONE (col-span-4) */}
				<motion.div
					whileHover={{ y: -3 }}
					onClick={() => setCodeIndex((i) => (i + 1) % SAMPLE_CODES.length)}
					className="md:col-span-4 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/30 shadow-sm hover:shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)] transition-all flex flex-col justify-between hover:cursor-pointer"
					style={{ padding: 'calc(var(--ui-gap) * 1.25)', gap: 'var(--ui-gap)' }}
				>
					<div className="rounded-2xl bg-(--background)/60 border border-(--border)/10 p-3.5 flex items-center justify-between gap-3">
						<div className="h-12 w-12 rounded-2xl bg-(--accent)/15 border border-(--accent)/30 flex items-center justify-center text-(--accent) shrink-0">
							<QrCode size={24} />
						</div>
						<div className="flex flex-col items-start gap-1 flex-1 min-w-0">
							<motion.div
								key={SAMPLE_CODES[codeIndex]}
								initial={{ scale: 0.9, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								className="rounded-xl bg-(--foreground)/60 border border-(--accent)/30 px-3 py-1 font-mono text-sm font-black tracking-[0.2em] text-(--accent)"
							>
								{SAMPLE_CODES[codeIndex]}
							</motion.div>
							<span className="text-[10px] font-semibold text-(--text-muted) truncate">{t('www.download.perks.qrLogin.codeHint')}</span>
						</div>
					</div>

					<div className="flex flex-col gap-1.5 text-left">
						<div className="flex items-center gap-2 text-(--accent)">
							<QrCode size={18} />
							<span className="text-[11px] font-bold uppercase tracking-wider">{t('www.download.perks.qrLogin.badge')}</span>
						</div>
						<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.download.perks.qrLogin.title')}
						</h3>
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('www.download.perks.qrLogin.description')}</p>
					</div>
				</motion.div>

				{/* 5. QUICK SUMMON SHORTCUT & TRAY (col-span-4) */}
				<motion.div
					whileHover={{ y: -3 }}
					onClick={() => {
						setKeyBounce(true);
						setTimeout(() => setKeyBounce(false), 350);
					}}
					className="md:col-span-4 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/30 shadow-sm hover:shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)] transition-all flex flex-col justify-between hover:cursor-pointer"
					style={{ padding: 'calc(var(--ui-gap) * 1.25)', gap: 'var(--ui-gap)' }}
				>
					<div className="rounded-2xl bg-(--background)/60 border border-(--border)/10 p-3.5 flex flex-col items-center justify-center gap-2.5">
						<motion.div animate={keyBounce ? { scale: [1, 1.12, 1] } : {}} className="flex items-center gap-1.5">
							{['Ctrl', 'Shift', 'X'].map((key, idx) => (
								<div key={key} className="flex items-center gap-1.5">
									<kbd className="rounded-xl bg-(--foreground)/70 border border-(--accent)/40 px-3 py-1.5 text-xs font-black text-(--text) shadow-sm">{key}</kbd>
									{idx < 2 && <span className="text-xs font-bold text-(--text-muted)">+</span>}
								</div>
							))}
						</motion.div>
						<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-(--accent)">
							<Zap size={12} />
							{t('www.download.perks.hotkey.trayReady')}
						</span>
					</div>

					<div className="flex flex-col gap-1.5 text-left">
						<div className="flex items-center gap-2 text-(--accent)">
							<Command size={18} />
							<span className="text-[11px] font-bold uppercase tracking-wider">{t('www.download.perks.hotkey.badge')}</span>
						</div>
						<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.download.perks.hotkey.title')}
						</h3>
						<p className="text-xs text-(--text-muted) leading-relaxed">{t('www.download.perks.hotkey.description')}</p>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
