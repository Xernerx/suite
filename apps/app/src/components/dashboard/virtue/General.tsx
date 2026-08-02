/** @format */

'use client';

import { Info, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { XernerxWebsocket } from '@xernerx/websocket';
import { motion } from 'framer-motion';

const inputStyle = {
	borderColor: 'var(--border)',
	background: 'color-mix(in srgb, var(--bg-main) 45%, var(--bg-panel))',
	color: 'var(--text-main)',
};

export default function Virtue({ id }: { id?: string }) {
	const clientRef = useRef<XernerxWebsocket | null>(null);

	const [profile, setProfile] = useState<any | null>(null);
	const [loading, setLoading] = useState(false);

	const [state, setState] = useState({
		mode: 'balanced',
		cycles: {
			daily: false,
			weekly: false,
			monthly: false,
		},
		roles: {
			ignored: [] as string[],
			tracked: [] as string[],
		},

		levelUp: true,
		levelMessage: '[@mention] reached level [@level] :tada:!',
		levelChannel: '' as string | null,

		saving: false,
		autoDelete: 0,
	});

	/* ================= INIT WS CLIENT ================= */

	useEffect(() => {
		let cancelled = false;

		(async () => {
			try {
				const res = await fetch('/api/ws/token');
				const { token } = await res.json();

				if (cancelled) return;

				clientRef.current = new XernerxWebsocket({ token });

				await clientRef.current.connect();
			} catch (err) {
				console.error('WS init failed:', err);
			}
		})();

		return () => {
			cancelled = true;
			clientRef.current?.disconnect();
			clientRef.current = null;
		};
	}, []);

	/* ================= FETCH PROFILE ================= */

	useEffect(() => {
		if (!id) return;

		let cancelled = false;

		const run = async () => {
			if (!clientRef.current) {
				// wait until WS is ready
				await new Promise((resolve) => {
					const interval = setInterval(() => {
						if (clientRef.current) {
							clearInterval(interval);
							resolve(true);
						}
					}, 50);
				});
			}

			try {
				setLoading(true);
				setProfile(null);

				const data = await clientRef.current!.get('virtue', 'guilds', {
					id: id,
				});

				if (!cancelled) {
					setProfile(data?._doc);
				}
			} catch (err) {
				console.error('Virtue fetch failed:', err);

				if (!cancelled) {
					setProfile(null);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		run();

		return () => {
			cancelled = true;
		};
	}, [id]);

	/* ================= SYNC STATE ================= */

	useEffect(() => {
		if (!profile) return;

		setState((prev) => ({
			...prev,
			mode: profile.mode ?? 'balanced',

			cycles: {
				daily: profile.cycles?.daily ?? false,
				weekly: profile.cycles?.weekly ?? false,
				monthly: profile.cycles?.monthly ?? false,
			},

			roles: {
				ignored: profile.roles?.ignored ?? [],
				tracked: profile.roles?.tracked ?? [],
			},

			levelUp: profile.levelUp ?? true,
			levelMessage: profile.levelMessage ?? '[@mention] reached level [@level] :tada:!',
			levelChannel: profile.levelChannel ?? '',

			autoDelete: profile.autoDelete ?? 0,
		}));
	}, [profile]);

	async function ensureFreshConnection() {
		const res = await fetch('/api/ws/token');
		const { token } = await res.json();

		clientRef.current?.disconnect();

		const client = new XernerxWebsocket({
			token,
		});

		await client.connect();
		clientRef.current = client;
	}

	if (!id) return null;

	/* ================= LOADING ================= */

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="flex items-center gap-2 text-sm opacity-60">
					<Loader2 className="h-4 w-4 animate-spin" />
					Loading Virtue...
				</div>
			</div>
		);
	}

	/* ================= NO PROFILE ================= */

	if (!profile) {
		return (
			<div className="w-full py-16">
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					className="relative w-full rounded-3xl border p-8"
					style={{
						borderColor: 'var(--border)',
						background: 'color-mix(in srgb, var(--bg-panel) 88%, transparent)',
					}}
				>
					<div
						className="pointer-events-none absolute inset-0 rounded-3xl"
						style={{
							background: 'radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 16%, transparent), transparent 60%)',
						}}
					/>

					<div className="relative flex flex-col items-center justify-center gap-5 text-center">
						<div
							className="flex h-16 w-16 items-center justify-center rounded-2xl border"
							style={{
								borderColor: 'color-mix(in srgb, var(--accent) 30%, var(--border))',
								background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
							}}
						>
							<Sparkles className="h-7 w-7" />
						</div>

						<div className="max-w-xl">
							<h2 className="text-xl font-semibold">Virtue isn’t part of this server yet</h2>

							<p
								className="pt-4 pb-4 text-sm leading-relaxed"
								style={{
									color: 'color-mix(in srgb, var(--text-main) 70%, transparent)',
								}}
							>
								Virtue is a Discord bot focused on community engagement through leveling systems. Track progress globally or per server, and configure resets for monthly, weekly, or
								daily cycles.
							</p>
						</div>

						<a
							href="/invite/virtue"
							className="inline-flex items-center justify-center rounded-2xl border px-6 py-3 text-sm font-medium transition hover:scale-[1.04]"
							style={{
								borderColor: 'color-mix(in srgb, var(--accent) 35%, var(--border))',
								background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
								color: 'var(--text-main)',
							}}
						>
							Invite Virtue
						</a>
					</div>
				</motion.div>
			</div>
		);
	}

	/* ================= SAVE ================= */

	async function save() {
		if (!clientRef.current) return;

		setState((s) => ({ ...s, saving: true }));

		await ensureFreshConnection();

		try {
			await clientRef.current.update('virtue', 'guilds', {
				id: id,
				mode: state.mode,
				cycles: state.cycles,
				roles: state.roles,

				levelUp: state.levelUp,
				levelMessage: state.levelMessage,
				levelChannel: state.levelChannel || null,

				autoDelete: state.autoDelete,
			});
		} catch (err) {
			console.error('Save failed:', err);
		} finally {
			setState((s) => ({ ...s, saving: false }));
		}
	}

	/* ================= UI ================= */

	return (
		<div
			className="rounded-3xl border p-6"
			style={{
				borderColor: 'var(--border)',
				background: 'color-mix(in srgb, var(--bg-panel) 88%, transparent)',
			}}
		>
			<div className="flex flex-col gap-6">
				<div>
					<h2 className="text-lg font-semibold">Virtue Settings</h2>
					<p
						className="text-sm mt-1"
						style={{
							color: 'color-mix(in srgb, var(--text-main) 65%, transparent)',
						}}
					>
						Configure leveling behavior and tracking rules.
					</p>
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-sm font-medium">Level Mode</label>

					<select value={state.mode} onChange={(e) => setState((s) => ({ ...s, mode: e.target.value }))} className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle}>
						{['easy', 'casual', 'balanced', 'hard', 'extreme'].map((m) => (
							<option key={m} value={m}>
								{m.charAt(0).toUpperCase() + m.slice(1)}
							</option>
						))}
					</select>
				</div>

				{/* <div className='flex flex-col gap-3'>
					<label className='text-sm font-medium'>Reset Cycles</label>

					<div className='grid grid-cols-3 gap-2'>
						{(['daily', 'weekly', 'monthly'] as const).map((key) => {
							const active = state.cycles[key];

							return (
								<button
									key={key}
									onClick={() =>
										setState((s) => ({
											...s,
											cycles: {
												...s.cycles,
												[key]: !active,
											},
										}))
									}
									className='rounded-2xl border px-4 py-2 text-sm'
									style={{
										borderColor: active ? 'color-mix(in srgb, var(--accent) 35%, var(--border))' : 'var(--border)',
										background: active ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'color-mix(in srgb, var(--bg-panel) 76%, transparent)',
									}}>
									{key}
								</button>
							);
						})}
					</div>
				</div> */}

				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<label className="text-sm font-medium">Level Up Messages</label>

						<button
							type="button"
							onClick={() => setState((s) => ({ ...s, levelUp: !s.levelUp }))}
							className="relative w-9 h-5 rounded-full transition"
							style={{
								background: state.levelUp ? 'var(--accent)' : 'color-mix(in srgb, var(--border) 70%, transparent)',
							}}
						>
							<motion.div
								layout
								transition={{ type: 'spring', stiffness: 500, damping: 30 }}
								className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
								style={{
									left: state.levelUp ? 'calc(100% - 18px)' : '2px',
								}}
							/>
						</button>
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between gap-3 pt-1">
							<div className="flex items-center gap-1.5 text-sm">
								<span
									style={{
										color: `color-mix(in srgb, var(${state.levelChannel ? '--text-muted' : '--text-main'}) 80%, transparent)`,
									}}
								>
									Auto delete after
								</span>

								<div title="0 disables auto delete • max 60 seconds" className="opacity-60 hover:opacity-100 transition cursor-help">
									<Info size={14} />
								</div>
							</div>

							<div className="flex items-center gap-2">
								<input
									type="number"
									min={0}
									max={60}
									disabled={!!state.levelChannel}
									value={!state.levelChannel ? state.autoDelete || 0 : 0}
									onChange={(e) =>
										setState((s) => ({
											...s,
											autoDelete: Number(e.target.value),
										}))
									}
									style={inputStyle}
									className="w-16 rounded-xl border px-2 py-1 text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed"
								/>

								<span
									style={{
										color: `color-mix(in srgb, var(${state.levelChannel ? '--text-muted' : '--text-main'}) 80%, transparent)`,
									}}
								>
									sec
								</span>
							</div>
						</div>

						<label htmlFor="">Message</label>
						<textarea
							value={state.levelMessage}
							onChange={(e) =>
								setState((s) => ({
									...s,
									levelMessage: e.target.value,
								}))
							}
							disabled={!state.levelUp}
							rows={3}
							placeholder="Level-up message (use [@username])"
							className="rounded-2xl border px-4 py-3 text-sm outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
							style={inputStyle}
						/>

						<label htmlFor="">Channel</label>

						<input
							value={state.levelChannel ?? ''}
							onChange={(e) =>
								setState((s) => ({
									...s,
									levelChannel: e.target.value,
								}))
							}
							disabled={!state.levelUp}
							placeholder="Channel ID (optional)"
							className="rounded-2xl border px-4 py-3 text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed"
							style={inputStyle}
						/>
					</div>
				</div>

				<div className="flex flex-col gap-3">
					<label className="text-sm font-medium">Roles</label>

					<input
						value={state.roles?.ignored?.join(',') || ''}
						onChange={(e) =>
							setState((s) => ({
								...s,
								roles: {
									...s.roles,
									ignored: e.target.value
										.split(',')
										.map((r) => r.trim())
										.filter(Boolean),
								},
							}))
						}
						placeholder="Ignored roles (comma separated)"
						className="rounded-2xl border px-4 py-3 text-sm outline-none"
						style={inputStyle}
					/>

					<input
						value={state.roles?.tracked?.join(',') || ''}
						onChange={(e) =>
							setState((s) => ({
								...s,
								roles: {
									...s.roles,
									tracked: e.target.value
										.split(',')
										.map((r) => r.trim())
										.filter(Boolean),
								},
							}))
						}
						placeholder="Tracked roles (comma separated)"
						className="rounded-2xl border px-4 py-3 text-sm outline-none"
						style={inputStyle}
					/>
				</div>

				<div className="flex justify-end">
					<button
						onClick={save}
						disabled={state.saving}
						className="rounded-2xl border px-5 py-2.5 text-sm font-medium"
						style={{
							borderColor: 'color-mix(in srgb, var(--accent) 35%, var(--border))',
							background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
						}}
					>
						{state.saving ? 'Saving...' : 'Save changes'}
					</button>
				</div>
			</div>
		</div>
	);
}
