/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Copy, Home, Menu, Minus, RefreshCw, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import Banner from '@/../public/banner.svg';
import Link from 'next/link';
import { SHORTCUTS } from '@/lib/shortcuts';
import { usePlatform } from '@/providers/PlatformProvider';
import { useSidebar } from '@/providers/SidebarProvider';

export default function Header() {
	const { toggle, state } = useSidebar();
	const { type } = usePlatform();
	const router = useRouter();
	const pathname = usePathname();

	const [maximized, setMaximized] = useState(false);
	const [url, setUrl] = useState(false);
	const [shortcut, setShortcut] = useState(false);
	const [path, setPath] = useState('');
	const [version, setVersion] = useState('');

	async function toggleMaximize() {
		await window.electron?.maximize();
		setMaximized((await window.electron?.isMaximized?.())!);
	}

	function groupShortcuts(shortcuts: typeof SHORTCUTS) {
		return shortcuts.reduce(
			(acc, shortcut) => {
				if (!acc[shortcut.category]) acc[shortcut.category] = [];
				acc[shortcut.category].push(shortcut);
				return acc;
			},
			{} as Record<string, typeof SHORTCUTS>
		);
	}

	const grouped = groupShortcuts(SHORTCUTS);

	/* --------------------------------------------- */
	/* Sync URL                                      */
	/* --------------------------------------------- */

	useEffect(() => {
		setPath(pathname);
	}, [pathname]);

	/* --------------------------------------------- */
	/* Keyboard shortcuts                            */
	/* --------------------------------------------- */

	useEffect(() => {
		fetch('/api/v1/status')
			.then((res) => res.json())
			.then((data) => setVersion(data.server.version));

		function handler(e: KeyboardEvent) {
			if (e.ctrlKey && e.key === '`') {
				e.preventDefault();
				toggle();
			}

			if (e.ctrlKey && e.key === '/') {
				e.preventDefault();
				setShortcut((prev) => !prev);
			}

			if (e.ctrlKey && e.key === '.') {
				e.preventDefault();
				setUrl((prev) => !prev);
			}

			if (e.ctrlKey && e.key === 'i') {
				e.preventDefault();
				router.push('/account');
			}

			if (e.ctrlKey && e.key === 'd') {
				e.preventDefault();
				router.push('/dashboard');
			}

			if (e.ctrlKey && e.key === 'e') {
				e.preventDefault();
				router.push('/explore');
			}

			if (e.ctrlKey && e.key === 'p') {
				e.preventDefault();
				router.push('/portal');
			}
		}

		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, []);

	/* --------------------------------------------- */
	/* Window state                                  */
	/* --------------------------------------------- */

	useEffect(() => {
		if (!type) return;

		async function check() {
			const state = await window.electron?.isMaximized?.();
			setMaximized(!!state);
		}

		check();
	}, [type]);

	/* --------------------------------------------- */
	/* Render                                        */
	/* --------------------------------------------- */

	return (
		<motion.header
			animate={{ height: url ? 110 : 60 }}
			transition={{ duration: 0.2, ease: 'easeInOut' }}
			style={
				{
					width: '100%',
					background: 'var(--bg-main)',
					color: 'var(--text-main)',
					position: 'relative',
					zIndex: 5,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
				} as React.CSSProperties
			}
		>
			{/* TOP BAR */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					padding: '0 20px',
					height: 60,
				}}
			>
				{/* LEFT */}
				<div className="flex items-center gap-8">
					{state !== 'hidden' && (
						<button
							onClick={toggle}
							style={{
								background: 'transparent',
								border: 'none',
								cursor: 'pointer',
								color: 'var(--text-main)',
							}}
							className="p-2 rounded-md transition hover:bg-white/5"
						>
							<Menu size={20} />
						</button>
					)}

					<Link href="/">
						<div className="h-8 flex items-center">
							<Banner className="h-full w-auto" style={{ color: 'var(--accent)' }} />
						</div>
					</Link>
				</div>

				<div style={{ flex: 1, WebkitAppRegion: 'drag' } as React.CSSProperties} className="w-full h-full" />

				{/* WINDOW CONTROLS */}
				{type === 'application' && (
					<div className="flex items-center">
						<button className="w-11 h-9 flex items-center justify-center hover:bg-white/5" onClick={() => window.electron?.minimize()}>
							<Minus size={16} />
						</button>

						<button className="w-11 h-9 flex items-center justify-center hover:bg-white/5" onClick={toggleMaximize}>
							{maximized ? <Copy size={14} /> : <Square size={14} />}
						</button>

						<button className="w-11 h-9 flex items-center justify-center hover:bg-red-500/20" onClick={() => window.electron?.close()}>
							<X size={16} />
						</button>
					</div>
				)}
			</div>

			{/* URL BAR */}
			<AnimatePresence>
				{url && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.15 }}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							padding: '0 20px 10px',
						}}
					>
						<button onClick={() => router.push('/')} className="p-2 hover:bg-white/5 rounded-md">
							<Home size={18} />
						</button>
						<button onClick={router.back} className="p-2 hover:bg-white/5 rounded-md">
							<ChevronLeft size={18} />
						</button>

						<button onClick={router.forward} className="p-2 hover:bg-white/5 rounded-md">
							<ChevronRight size={18} />
						</button>

						<button onClick={router.refresh} className="p-2 hover:bg-white/5 rounded-md">
							<RefreshCw size={18} />
						</button>

						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								height: 36,
								width: '100%',
								borderRadius: 8,
								border: '1px solid var(--border)',
								background: 'color-mix(in srgb, var(--bg-main) 70%, black)',
								padding: '0 12px',
								color: 'var(--text-main)',
							}}
						>
							<span
								style={{
									color: 'var(--text-muted)',
									userSelect: 'none',

									whiteSpace: 'nowrap',
								}}
							>
								{window.location.origin}
							</span>

							<input
								type="text"
								value={path}
								onChange={(e) => setPath(e.target.value)}
								onKeyDown={(e) => {
									if (e.key !== 'Enter') return;

									let value = e.currentTarget.value.trim();

									if (!value.startsWith('/')) value = '/' + value;

									router.push(value.toLowerCase());
								}}
								style={{
									flex: 1,
									border: 'none',
									outline: 'none',
									background: 'transparent',
									color: 'var(--text-main)',
								}}
							/>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{shortcut && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={() => setShortcut(false)} // ← outside click
						style={{
							position: 'fixed',
							inset: 0,
							zIndex: 999,
							background: 'rgba(0,0,0,0.4)',
							backdropFilter: 'blur(12px)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							transition={{ duration: 0.2 }}
							onClick={(e) => e.stopPropagation()} // ← prevent closing when clicking inside
							style={{
								width: 'min(800px, 90%)',
								maxHeight: '80%',
								overflowY: 'auto',
								borderRadius: 16,
								padding: 24,
								background: 'var(--bg-panel)',
								border: '1px solid var(--border)',
								boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
							}}
						>
							<h2 style={{ marginBottom: 20, fontSize: 18 }}>Keyboard Shortcuts</h2>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
								{Object.entries(grouped).map(([category, items]) => (
									<div key={category}>
										<div
											style={{
												marginBottom: 10,
												fontSize: 13,
												color: 'var(--text-muted)',
												textTransform: 'uppercase',
												letterSpacing: 1,
											}}
										>
											{category}
										</div>

										<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
											{items.map((s, i) => (
												<div
													key={i}
													style={{
														display: 'flex',
														justifyContent: 'space-between',
														alignItems: 'center',
														padding: '10px 12px',
														borderRadius: 10,
														background: 'color-mix(in srgb, var(--bg-main) 60%, black)',
														border: '1px solid var(--border)',
													}}
												>
													<span>{s.description}</span>

													<div style={{ display: 'flex', gap: 6 }}>
														{s.keys.map((key, idx) => (
															<span
																key={idx}
																style={{
																	padding: '4px 8px',
																	borderRadius: 6,
																	fontSize: 12,
																	fontFamily: 'monospace',
																	background: 'color-mix(in srgb, var(--bg-main) 80%, black)',
																	border: '1px solid var(--border)',
																}}
															>
																{key}
															</span>
														))}
													</div>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
							<div
								className="--text-(--muted) flex gap-2"
								style={{
									marginTop: 10,
									marginBottom: 10,
									fontSize: 10,
									color: 'var(--text-muted)',
									textTransform: 'uppercase',
									letterSpacing: 1,
								}}
							>
								{window?.electron?.version && <p>App {window.electron?.version} - </p>}
								<p>Next {version}</p>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.header>
	);
}
