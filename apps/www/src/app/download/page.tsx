/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Laptop } from 'lucide-react';
import { FaApple, FaLinux, FaQuestion, FaWindows } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useEnvironment, usePlatform, useSidebar } from '@xernerx/providers';

import { redirect } from 'next/navigation';

export default function Page() {
	const { platform, type } = usePlatform();
	const { hide } = useSidebar();
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
	}, []);

	useEffect(() => {
		(async () => {
			const endpoint = `https://api.xernerx.com/secure/downloads/app?channel=${channel}`;
			const fetchedApps = await fetch(getEnvUrl(endpoint)).then((r) => r.json());

			setApps(fetchedApps);
			setApp(fetchedApps[platform]);
		})();
	}, [platform, channel]);

	if (type === 'application') return redirect('/');

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full items-center justify-center"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
				minHeight: '100%',
			}}
		>
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="flex flex-col items-center text-center rounded-3xl w-full max-w-xl"
				style={{
					padding: 'calc(var(--ui-gap) * 2)',
					gap: 'calc(var(--ui-gap) * 1.75)',
				}}
			>
				{/* TITLE */}
				<div className="flex flex-col items-center gap-3">
					<div
						className="flex h-16 w-16 items-center justify-center rounded-2xl"
						style={{
							background: 'color-mix(in srgb, var(--accent) 18%, transparent)',
							color: 'var(--accent)',
						}}
					>
						<Laptop size={26} />
					</div>

					<h1 className="text-3xl font-black tracking-tight text-(--text)">Download Xernerx App</h1>

					<p className="text-sm max-w-md text-(--text-muted)">Optimized for your system. One click and you are in.</p>
				</div>

				{/* CHANNEL SELECTOR (Visible only on Canary & Dev environments) */}
				{showChannelSelector && (
					<div className="flex items-center rounded-2xl border border-(--border)/10 bg-(--background) p-1" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<button
							type="button"
							onClick={() => setChannel('stable')}
							className="rounded-xl px-5 py-2 text-xs font-medium transition-all hover:cursor-pointer"
							style={{
								background: channel === 'stable' ? 'var(--accent)' : 'transparent',
								color: channel === 'stable' ? '#fff' : 'var(--text-muted)',
							}}
						>
							Stable
						</button>
						<button
							type="button"
							onClick={() => setChannel('canary')}
							className="rounded-xl px-5 py-2 text-xs font-medium transition-all hover:cursor-pointer"
							style={{
								background: channel === 'canary' ? 'var(--accent)' : 'transparent',
								color: channel === 'canary' ? '#fff' : 'var(--text-muted)',
							}}
						>
							Canary
						</button>
					</div>
				)}

				{/* PRIMARY DOWNLOAD */}
				{app && (
					<motion.button
						initial={{ opacity: 0, scale: 0.96 }}
						animate={{ opacity: 1, scale: 1 }}
						whileHover={{ scale: 1.02, y: -1 }}
						whileTap={{ scale: 0.98 }}
						onClick={() => (window.location.href = app.browser_download_url)}
						className="flex items-center justify-center gap-3 rounded-2xl font-medium transition hover:cursor-pointer shadow-sm"
						style={{
							background: 'var(--accent)',
							color: '#fff',
							boxShadow: '0 20px 50px color-mix(in srgb, var(--accent) 25%, transparent)',
							minWidth: 260,
							padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)',
						}}
					>
						Download for {platform == 'windows' ? <FaWindows /> : platform == 'macos' ? <FaApple /> : platform == 'linux' ? <FaLinux /> : <FaQuestion />}
						<span className="capitalize">{platform}</span>
					</motion.button>
				)}

				{/* OTHER DOWNLOADS TOGGLE */}
				<div className="flex flex-col items-center gap-2 w-full">
					<button type="button" onClick={() => setShow((s) => !s)} className="flex items-center gap-2 text-sm text-(--text-muted) transition hover:text-(--text) hover:cursor-pointer">
						Other platforms
						<motion.span animate={{ rotate: show ? 180 : 0 }} transition={{ duration: 0.2 }}>
							<ChevronDown size={16} />
						</motion.span>
					</button>

					<AnimatePresence>
						{show && (
							<motion.div
								initial={{ opacity: 0, y: -6, height: 0 }}
								animate={{ opacity: 1, y: 0, height: 'auto' }}
								exit={{ opacity: 0, y: -6, height: 0 }}
								transition={{ duration: 0.2 }}
								className="flex flex-wrap justify-center gap-2 mt-2 w-full"
							>
								{Object.entries(apps)
									.filter(([, value]) => value)
									.map(([key, value]) => (
										<button
											type="button"
											key={key}
											onClick={() => (window.location.href = value!.browser_download_url)}
											className="flex items-center gap-2 rounded-xl border border-(--border)/10 bg-(--background) text-sm text-(--text) transition hover:border-(--border)/40 hover:cursor-pointer"
											style={{
												padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
											}}
										>
											{key == 'windows' ? <FaWindows /> : key == 'macos' ? <FaApple /> : key == 'linux' ? <FaLinux /> : <FaQuestion />}
											<span className="capitalize">{key}</span>
										</button>
									))}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</motion.div>
		</div>
	);
}
