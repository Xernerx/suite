/** @format */

'use client';

import { Clock, Cpu, FlaskConical, Folder, Globe, IdCard, Layers, Link, Monitor, PieChart, QrCode, Timer, TimerIcon, TimerReset, Wifi } from 'lucide-react';
import { forwardRef, useEffect, useRef, useState } from 'react';

import QRCode from 'react-qr-code';
import { XernerxWebsocket } from '@xernerx/websocket';
import { motion } from 'framer-motion';
import uptime from '@/lib/uptime';

interface Props {
	user: any;
}

function calculateLevel(level: number) {
	const { a, b } = { a: 5, b: 50 };
	return a * (level + 1) * (level + 1) + b * (level + 1);
}

const Profile = forwardRef<HTMLDivElement, Props>(({ user }, ref) => {
	const [qr, setQr] = useState(false);

	const [profileView, setProfileView] = useState<'card' | 'status'>('card');
	const [status, setStatus] = useState<any>({});

	const clientRef = useRef<XernerxWebsocket | null>(null);
	const [profile, setProfile] = useState<any>(null);
	const [profileLoading, setProfileLoading] = useState(false);

	useEffect(() => {
		let cancelled = false;

		(async () => {
			try {
				const res = await fetch('/api/ws/token');

				const { token } = await res.json();

				if (cancelled) return;

				clientRef.current = new XernerxWebsocket({
					token,
				});

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

	useEffect(() => {
		if (!user?.id) return;

		let cancelled = false;

		const run = async () => {
			if (!clientRef.current) {
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
				setProfileLoading(true);

				const data = await clientRef.current!.get('virtue', 'users', {
					id: user.id,
				});

				if (!cancelled) {
					setProfile(data?._doc ?? null);
				}
			} catch (err) {
				console.error('User profile fetch failed:', err);

				if (!cancelled) {
					setProfile(null);
				}
			} finally {
				if (!cancelled) {
					setProfileLoading(false);
				}
			}
		};

		run();

		return () => {
			cancelled = true;
		};
	}, [user?.id]);

	useEffect(() => {
		if (profileView !== 'status') return;

		let cancelled = false;

		async function fetchStatus() {
			try {
				const start = performance.now();

				const response = await fetch('/api/v1/status').then((res) => res.json());

				if (cancelled) return;

				response.server.latency = Math.round(performance.now() - start);

				setStatus(response);
			} catch (err) {
				console.error(err);
			}
		}

		fetchStatus();

		const interval = setInterval(fetchStatus, 1000);

		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [profileView]);

	return (
		<motion.div
			ref={ref}
			initial={{
				opacity: 0,
				y: 10,
				scale: 0.95,
			}}
			animate={{
				opacity: 1,
				y: 0,
				scale: 1,
			}}
			exit={{
				opacity: 0,
				y: 10,
				scale: 0.95,
			}}
			className="absolute min-w-[16rem] bottom-20 left-3 rounded-xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl"
			style={{
				background: 'var(--bg-panel)',
				width: 'calc(16rem * var(--zoom) / 100)',
			}}
		>
			{/* CARD VIEW */}

			{profileView === 'card' && (
				<div className="min-w-68 z-99999">
					<div className="relative">
						<div className="h-24 w-full overflow-hidden">
							{user.banner && <img src={`https://cdn.discordapp.com/banners/${user.id}/${user.banner}?size=4096`} className="object-cover h-24 w-full" />}
						</div>

						<img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=4096`} className="absolute left-3 -bottom-8 w-16 h-16 rounded-full border-4 border-(--bg-panel)" />
					</div>

					<div className="pt-10 px-4 pb-4 space-y-2">
						<div className="font-semibold">{user.global_name ?? user.username}</div>

						<div className="text-xs opacity-60">@{user.username}</div>

						<div className="flex gap-2 flex-wrap">
							{user.clan?.identity_enabled && (
								<div className="flex items-center gap-2 text-xs opacity-80 bg-(--accent) rounded p-1">
									<img src={`https://cdn.discordapp.com/clan-badges/${user.clan.identity_guild_id}/${user.clan.badge}.png`} className="h-4 w-4" />

									<span className="font-semibold">{user.clan.tag}</span>
								</div>
							)}

							<div className="flex items-center gap-2 text-xs opacity-80 bg-(--accent) rounded p-1">
								<span className="font-semibold uppercase">{user?.role}</span>
							</div>
						</div>

						{profileLoading
							? null
							: profile
								? (() => {
										const currentLevel = profile.textLevel ?? 0;

										const currentXP = profile.textExperience ?? 0;

										const currentLevelXP = calculateLevel(currentLevel);

										const nextLevelXP = calculateLevel(currentLevel + 1);

										const requiredXP = nextLevelXP - currentLevelXP;

										const progress = (currentXP / nextLevelXP) * 100;

										return (
											<div className="pt-2">
												<div className="flex items-center justify-between text-[11px] mb-1">
													<div className="font-medium">Level {currentLevel}</div>

													<div className="opacity-60">{currentXP.toLocaleString()} XP</div>
												</div>

												<div
													className="relative h-2 overflow-hidden rounded-full"
													style={{
														background: 'color-mix(in srgb, var(--container) 70%, black)',
													}}
												>
													<motion.div
														initial={{
															width: 0,
														}}
														animate={{
															width: `${Math.max(0, Math.min(100, progress))}%`,
														}}
														transition={{
															duration: 0.8,
															ease: 'easeOut',
														}}
														className="absolute left-0 top-0 h-full rounded-full"
														style={{
															background: 'linear-gradient(to right, var(--accent), color-mix(in srgb, var(--accent) 75%, white))',
														}}
													/>
												</div>

												<div className="flex justify-between text-[10px] opacity-50 mt-1">
													<span></span>
													<span>
														{(nextLevelXP - currentXP).toLocaleString()}
														xp to next
													</span>
												</div>
											</div>
										);
									})()
								: null}

						<button
							onClick={() => navigator.clipboard.writeText(user.id)}
							className="flex items-center justify-center gap-2 w-full text-xs bg-black/30 px-3 py-2 rounded-md cursor-pointer hover:bg-(--accent-hover) transition"
						>
							<IdCard size={14} />
							Copy ID
						</button>
					</div>
				</div>
			)}

			{/* STATUS VIEW */}

			{profileView === 'status' && !qr && (
				<div className="p-4 space-y-4 text-xs min-w-68">
					{/* ENVIRONMENT */}

					{status.environment === 'DEVELOPMENT' && (
						<>
							<h1
								className="font-semibold mb-2 flex items-center gap-2"
								style={{
									color: 'var(--accent)',
								}}
							>
								<Globe size={16} />
								Environment
							</h1>

							<div className="space-y-2 text-xs">
								<div
									style={{
										background: 'var(--container)',
									}}
									className="flex justify-between rounded-md p-2 border border-white/5"
								>
									<span className="flex items-center gap-2">
										<FlaskConical size={14} />
										Environment
									</span>

									<span
										className="font-semibold"
										style={{
											color: 'var(--accent)',
										}}
									>
										{status.environment}
									</span>
								</div>

								{/* WEB */}

								<div
									style={{
										background: 'var(--container)',
									}}
									className="flex justify-between rounded-md p-2 border border-white/5"
								>
									<span className="flex items-center gap-2">
										<Monitor size={14} />
										Web
									</span>

									<div className="flex gap-2">
										<a
											style={{
												color: 'var(--accent)',
											}}
											className="p-1 rounded cursor-pointer hover:bg-(--accent-hover)"
											href={status.urls?.https}
										>
											<Globe size={14} />
										</a>

										<a
											style={{
												color: 'var(--accent)',
											}}
											className="px-2 py-1 text-[10px] rounded"
											href={`${status.urls?.http}:${status.ports?.web}`}
										>
											LAN
										</a>

										<a
											style={{
												color: 'var(--accent)',
											}}
											className="p-1 rounded"
											href={`${status.urls?.host}:${status.ports?.web}`}
										>
											<Monitor size={14} />
										</a>
									</div>
								</div>

								{/* MOBILE */}

								<div
									style={{
										background: 'var(--container)',
									}}
									className="flex justify-between rounded-md p-2 border border-white/5"
								>
									<span className="flex items-center gap-2">
										<Monitor size={14} />
										Mobile
									</span>

									<div className="flex gap-2">
										<a
											style={{
												color: 'var(--accent)',
											}}
											className="p-1 rounded text-blue-400"
											href={`${status.urls?.http}:${status.ports?.mobile}`}
										>
											<Globe size={14} />
										</a>

										<button
											style={{
												color: 'var(--accent)',
											}}
											onClick={() => setQr(true)}
											className="p-1 rounded cursor-pointer hover:bg-(--accent-hover)"
										>
											<QrCode size={14} />
										</button>
									</div>
								</div>
							</div>
						</>
					)}

					{/* SERVER */}

					<h1
						className="font-semibold mb-2 flex items-center gap-2"
						style={{
							color: 'var(--accent)',
						}}
					>
						<Timer size={16} />
						Server
					</h1>

					<div className="space-y-2 text-xs">
						<div
							style={{
								background: 'var(--container)',
							}}
							className="flex justify-between rounded-md p-2 border border-white/5"
						>
							<span className="flex items-center gap-2">
								<Clock size={14} />
								Time
							</span>

							<span
								style={{
									color: 'var(--accent)',
								}}
							>
								{status.server?.time}
							</span>
						</div>

						<div
							style={{
								background: 'var(--container)',
							}}
							className="flex justify-between rounded-md p-2 border border-white/5"
						>
							<span className="flex items-center gap-2">
								<TimerIcon size={14} />
								Timezone
							</span>

							<span
								style={{
									color: 'var(--accent)',
								}}
							>
								{status.server?.timezone}
							</span>
						</div>

						<div
							style={{
								background: 'var(--container)',
							}}
							className="flex justify-between rounded-md p-2 border border-white/5"
						>
							<span className="flex items-center gap-2">
								<TimerReset size={14} />
								Uptime
							</span>

							<span className="text-emerald-400 font-semibold">{uptime(status.server?.uptime)}</span>
						</div>

						<div
							style={{
								background: 'var(--container)',
							}}
							className="flex justify-between rounded-md p-2 border border-white/5"
						>
							<span className="flex items-center gap-2">
								<Cpu size={14} />
								Memory
							</span>

							<span
								className={`${
									status.server?.memory?.usedMB > status.server?.memory?.totalMB * 0.9
										? 'text-red-400'
										: status.server?.memory?.usedMB > status.server?.memory?.totalMB * 0.7
											? 'text-amber-400'
											: 'text-emerald-400'
								}`}
							>
								{Math.round(status.server?.memory?.usedMB / 10) / 100}
								Gb ({Math.round((status.server?.memory?.usedMB / status.server?.memory?.totalMB) * 10000) / 100}
								%)
							</span>
						</div>

						<div
							style={{
								background: 'var(--container)',
							}}
							className="flex justify-between rounded-md p-2 border border-white/5"
						>
							<span className="flex items-center gap-2">
								<Wifi size={14} />
								Latency
							</span>

							<span className={`${status.server?.latency > 300 ? 'text-red-400' : status.server?.latency > 100 ? 'text-amber-400' : 'text-emerald-400'}`}>
								{status.server?.latency}
								ms
							</span>
						</div>
					</div>

					{/* DATABASE */}

					<h1
						className="font-semibold mb-2 flex items-center gap-2"
						style={{
							color: 'var(--accent)',
						}}
					>
						<Folder size={16} />
						Database
					</h1>

					<div className="space-y-2 text-xs">
						<div
							style={{
								background: 'var(--container)',
							}}
							className="flex justify-between rounded-md p-2 border border-white/5"
						>
							<span className="flex items-center gap-2">
								<Link size={14} />
								Connection
							</span>

							<span className={`font-semibold ${status.database?.status === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>{status.database?.status}</span>
						</div>

						<div
							style={{
								background: 'var(--container)',
							}}
							className="flex justify-between rounded-md p-2 border border-white/5"
						>
							<span className="flex items-center gap-2">
								<Layers size={14} />
								Pool Size
							</span>

							<span>{status.database?.poolSize}</span>
						</div>
					</div>
				</div>
			)}

			{/* QR VIEW */}

			{profileView === 'status' && qr && (
				<div className="p-6 flex flex-col items-center gap-3">
					<QRCode value={`exp://${status.urls?.http}:${status.ports?.mobile}`} size={120} />

					<button onClick={() => setQr(false)} className="text-xs bg-black/30 px-3 py-1 rounded-md hover:bg-(--accent-hover) transition cursor-pointer">
						Close
					</button>
				</div>
			)}

			{/* TABS */}

			<div className="flex">
				<TabButton active={profileView === 'card'} onClick={() => setProfileView('card')} icon={<IdCard size={16} />} position="left" />

				<TabButton active={profileView === 'status'} onClick={() => setProfileView('status')} icon={<PieChart size={16} />} position="right" />
			</div>
		</motion.div>
	);
});

Profile.displayName = 'Profile';

export default Profile;

function TabButton({ active, onClick, icon, position }: { active: boolean; onClick: () => void; icon: React.ReactNode; position: 'left' | 'right' }) {
	const inactiveShape = position === 'left' ? 'rounded-tr-lg' : 'rounded-tl-lg';

	return (
		<button
			onClick={onClick}
			className={`flex-1 flex justify-center items-center py-2 transition relative ${
				active ? 'bg-transparent' : `border border-white/10 border-b-0 ${inactiveShape} bg-[rgba(0,0,0,0.2)] cursor-pointer hover:bg-(--accent-hover)`
			}`}
		>
			<span
				style={{
					color: active ? 'var(--accent)' : 'var(--text-muted)',
				}}
			>
				{icon}
			</span>
		</button>
	);
}
