/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Download, Laptop } from 'lucide-react';
import { FaApple, FaLinux, FaQuestion, FaWindows } from 'react-icons/fa';
import { useEffect, useState } from 'react';

import { redirect } from 'next/navigation';
import { usePlatform } from '@/providers/PlatformProvider';
import { useSidebar } from '@/providers/SidebarProvider';

export default function Page() {
	const { platform, type } = usePlatform();
	const { hide } = useSidebar();

	const [apps, setApps] = useState<Record<'windows' | 'macos' | 'linux', Record<string, string> | null>>({
		windows: null,
		macos: null,
		linux: null,
	});

	const [app, setApp] = useState<Record<string, string> | null>(null);
	const [show, setShow] = useState(false);

	if (type === 'application') return redirect('/');

	useEffect(() => {
		hide();
	});

	useEffect(() => {
		(async () => {
			const apps = await fetch('/api/downloads/app').then((r) => r.json());

			setApps(apps);
			setApp(apps[platform]);
		})();
	}, [platform]);

	return (
		<div
			className="flex min-h-full w-full items-center justify-center px-6 py-16"
			style={{
				background: 'var(--bg-effect), var(--bg-panel)',
				color: 'var(--text-main)',
			}}
		>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="flex flex-col items-center text-center"
				style={{ gap: 'calc(var(--ui-gap) * 1.75)' }}
			>
				{/* TITLE */}
				<div className="flex flex-col items-center gap-3">
					<div
						className="w-16 h-16 rounded-2xl flex items-center justify-center"
						style={{
							background: 'color-mix(in srgb, var(--accent) 18%, transparent)',
							color: 'var(--accent)',
						}}
					>
						<Laptop size={26} />
					</div>

					<h1 className="text-3xl font-semibold tracking-tight">Download Xernerx App</h1>

					<p className="text-sm max-w-md" style={{ color: 'var(--text-muted)' }}>
						Optimized for your system. One click and you're in.
					</p>
				</div>

				{/* PRIMARY DOWNLOAD */}
				{app && (
					<motion.button
						initial={{ opacity: 0, scale: 0.96 }}
						animate={{ opacity: 1, scale: 1 }}
						whileHover={{ scale: 1.02, y: -1 }}
						whileTap={{ scale: 0.98 }}
						onClick={() => (window.location.href = app.browser_download_url)}
						className="flex items-center justify-center gap-3 rounded-xl px-8 py-4 text-base font-medium transition hover:cursor-pointer"
						style={{
							background: 'var(--accent)',
							color: '#fff',
							boxShadow: '0 20px 50px color-mix(in srgb, var(--accent) 30%, transparent)',
							minWidth: 260,
						}}
					>
						Download for {platform == 'windows' ? <FaWindows /> : platform == 'macos' ? <FaApple /> : platform == 'linux' ? <FaLinux /> : <FaQuestion />}
						<span className="capitalize">{platform}</span>
					</motion.button>
				)}

				{/* OTHER DOWNLOADS TOGGLE */}
				<div className="flex flex-col items-center gap-2">
					<button onClick={() => setShow((s) => !s)} className="flex items-center gap-2 text-sm transition" style={{ color: 'var(--text-muted)' }}>
						Other platforms
						<motion.span animate={{ rotate: show ? 180 : 0 }} transition={{ duration: 0.2 }}>
							<ChevronDown size={16} />
						</motion.span>
					</button>

					<AnimatePresence>
						{show && (
							<motion.div
								initial={{ opacity: 0, y: -6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -6 }}
								transition={{ duration: 0.2 }}
								className="flex flex-wrap justify-center gap-3 mt-2"
							>
								{Object.entries(apps)
									.filter(([, value]) => value)
									.map(([key, value]) => (
										<button
											key={key}
											onClick={() => (window.location.href = value!.browser_download_url)}
											className="flex items-center gap-2 rounded-md px-4 py-2 text-sm transition hover:cursor-pointer"
											style={{
												background: 'var(--container)',
												border: '1px solid var(--border)',
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
