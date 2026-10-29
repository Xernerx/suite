/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Download, Laptop, Sparkles } from 'lucide-react';
import { FaApple, FaLinux, FaQuestion, FaWindows } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useLoading, usePlatform, useSidebar } from '@xernerx/providers';
import { redirect } from 'next/navigation';
import { DesktopPerksBento } from '@/components/DesktopPerksBento';
import { DesktopInteractivePreview } from '@/components/DesktopInteractivePreview';

export default function Page() {
	const { t } = useDictionary();
	const { platform, type } = usePlatform();
	const { hide } = useSidebar();
	const { setBackgroundMode } = useLoading();
	const { getEnvUrl, environment } = useEnvironment();
	const [channel, setChannel] = useState<'stable' | 'canary'>('stable');
	const [apps, setApps] = useState<Record<'windows' | 'macos' | 'linux', Record<string, string> | null>>({
		windows: null,
		macos: null,
		linux: null,
	});
	const [app, setApp] = useState<Record<string, string> | null>(null);
	const [show, setShow] = useState(false);
	const showChannelSelector = environment === 'canary' || environment === 'dev';

	useEffect(() => {
		hide();
		setBackgroundMode('sticky-ripple');
		return () => {
			setBackgroundMode(null);
		};
	}, [hide, setBackgroundMode]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const endpoint = `https://api.xernerx.com/core/downloads/app?channel=${channel}`;
				let fetchedApps = await fetch(getEnvUrl(endpoint))
					.then((r) => (r.ok ? r.json() : null))
					.catch(() => null);

				if (!fetchedApps || (!fetchedApps.windows && !fetchedApps.macos && !fetchedApps.linux)) {
					fetchedApps = await fetch(endpoint)
						.then((r) => (r.ok ? r.json() : null))
						.catch(() => null);
				}

				if (!cancelled && fetchedApps && typeof fetchedApps === 'object') {
					setApps(fetchedApps);
					const targetPlatform = platform === 'windows' || platform === 'macos' || platform === 'linux' ? platform : 'windows';
					setApp(fetchedApps[targetPlatform] || fetchedApps.windows || null);
				}
			} catch {
				// Ignore transient network errors
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [platform, channel]);

	if (type === 'application') return redirect('/');

	const activePlatform = platform === 'windows' || platform === 'macos' || platform === 'linux' ? platform : 'windows';

	return (
		<div
			className="relative flex flex-col max-w-(--page-width) mx-auto w-full items-center justify-center"
			style={{
				padding: 'calc(var(--ui-gap) * 1.5)',
				gap: 'calc(var(--ui-gap) * 2.25)',
				fontSize: 'var(--text-scale, 14px)',
				minHeight: '100%',
			}}
		>
			{/* ASYMMETRIC SPLIT HERO + INTERACTIVE LIVE DESKTOP PLAYGROUND */}
			<div
				className="relative z-10 overflow-hidden rounded-3xl w-full bg-(--foreground)/15 border border-(--border)/10 shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_16%,transparent)] grid grid-cols-1 lg:grid-cols-12 items-center"
				style={{
					padding: 'calc(var(--ui-gap) * 2)',
					gap: 'calc(var(--ui-gap) * 2)',
				}}
			>
				{/* Left Column: End-User Pitch + Download CTA */}
				<div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left" style={{ gap: 'calc(var(--ui-gap) * 1.15)' }}>
					<div className="inline-flex items-center gap-2 rounded-full bg-(--accent)/15 border border-(--accent)/30 px-3.5 py-1 text-xs font-bold text-(--accent)">
						<Laptop size={14} />
						<span>{t('www.download.badge')}</span>
					</div>

					<h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-(--text) leading-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('www.download.title')}
					</h1>

					<p className="text-sm md:text-base max-w-xl text-(--text-muted) leading-relaxed">{t('www.download.description')}</p>

					{/* Primary Download CTA + Channel Selector Row */}
					<div className="flex flex-col items-center lg:items-start gap-3 pt-1 w-full min-h-[84px] justify-center">
						<div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full">
							{app && (
								<motion.button
									type="button"
									initial={{ opacity: 0, scale: 0.96 }}
									animate={{ opacity: 1, scale: 1 }}
									whileHover={{ scale: 1.02, y: -1 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => (window.location.href = app.browser_download_url)}
									className="flex items-center justify-center gap-3 rounded-2xl bg-(--accent) hover:bg-(--hover-accent) text-(--text) font-extrabold transition hover:cursor-pointer shadow-[0_0_25px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
									style={{
										minWidth: 240,
										padding: 'calc(var(--ui-gap) * 0.85) calc(var(--ui-gap) * 1.5)',
									}}
								>
									<Download size={18} />
									<span>{t('www.download.button3')}</span>
									{activePlatform === 'windows' ? <FaWindows /> : activePlatform === 'macos' ? <FaApple /> : activePlatform === 'linux' ? <FaLinux /> : <FaQuestion />}
									<span className="capitalize">{activePlatform}</span>
								</motion.button>
							)}

							{showChannelSelector && (
								<div
									className="flex items-center rounded-2xl border border-(--border)/10 bg-(--background)/60 p-1"
									style={{
										gap: 'calc(var(--ui-gap) * 0.25)',
									}}
								>
									<button
										type="button"
										onClick={() => setChannel('stable')}
										className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all hover:cursor-pointer ${
											channel === 'stable' ? 'bg-(--accent) text-(--text) shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
										}`}
									>
										{t('www.download.button')}
									</button>
									<button
										type="button"
										onClick={() => setChannel('canary')}
										className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all hover:cursor-pointer ${
											channel === 'canary' ? 'bg-(--accent) text-(--text) shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
										}`}
									>
										{t('www.download.button2')}
									</button>
								</div>
							)}
						</div>

						{/* Other Platforms Rollout */}
						<div className="flex flex-col items-center lg:items-start gap-2 w-full">
							<button
								type="button"
								onClick={() => setShow((s) => !s)}
								className="flex items-center gap-2 rounded-full bg-(--background)/50 border border-(--border)/10 px-3.5 py-1 text-xs font-semibold text-(--text-muted) transition hover:text-(--text) hover:border-(--accent)/30 hover:cursor-pointer"
							>
								{t('www.download.button4')}
								<motion.span animate={{ rotate: show ? 180 : 0 }} transition={{ duration: 0.2 }}>
									<ChevronDown size={14} />
								</motion.span>
							</button>

							<AnimatePresence>
								{show && (
									<motion.div
										initial={{ opacity: 0, y: -6, height: 0 }}
										animate={{ opacity: 1, y: 0, height: 'auto' }}
										exit={{ opacity: 0, y: -6, height: 0 }}
										transition={{ duration: 0.2 }}
										className="flex flex-wrap justify-center lg:justify-start gap-2 mt-1 w-full"
									>
										{Object.entries(apps)
											.filter(([, value]) => value)
											.map(([key, value]) => (
												<button
													type="button"
													key={key}
													onClick={() => (window.location.href = value!.browser_download_url)}
													className="flex items-center gap-2 rounded-2xl border border-(--border)/10 bg-(--background)/60 text-xs font-semibold text-(--text) transition hover:border-(--accent)/40 hover:bg-(--accent)/10 hover:cursor-pointer"
													style={{
														padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
													}}
												>
													{key === 'windows' ? <FaWindows /> : key === 'macos' ? <FaApple /> : key === 'linux' ? <FaLinux /> : <FaQuestion />}
													<span className="capitalize">{key}</span>
												</button>
											))}
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>
				</div>

				{/* Right Column: Live Clickable Desktop App Window */}
				<div className="lg:col-span-6 flex flex-col items-center gap-3 w-full">
					<DesktopInteractivePreview />
					<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-(--text-muted)">
						<Sparkles size={12} className="text-(--accent)" />
						{t('www.download.tryInteractive')}
					</span>
				</div>
			</div>

			{/* ASYMMETRIC INTERACTIVE DESKTOP PERKS BENTO */}
			<div className="relative z-10 w-full">
				<DesktopPerksBento />
			</div>
		</div>
	);
}
