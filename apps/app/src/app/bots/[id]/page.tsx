// /** @format */

// 'use client';

// import { AnimatePresence, motion } from 'framer-motion';
// import { ArrowLeft, BarChart3, Globe, IdCard, Layers, LucideHome, Star, Terminal, Users } from 'lucide-react';
// import { useEffect, useState } from 'react';

// import About from '@/components/bots/About';
// import Statistics from '@/components/bots/Statistics';
// import { useSidebar } from '@/providers/SidebarProvider';

// type Bot = {
// 	id: string;
// 	description?: string;
// 	info?: string;
// 	owners?: string[];
// 	organization?: string;
// 	verified?: boolean;
// 	privacy?: 'public' | 'private' | 'limited';
// 	links?: Record<string, string>;
// 	commands?: { id: string; name: string; description: string }[];
// };

// type DiscordProfile = {
// 	id: string;
// 	username: string;
// 	avatar?: string;
// 	banner?: string;
// };

// export default function Page({ params }: { params: Promise<{ id: string }> }) {
// 	const { setNavItems, setView, view } = useSidebar();

// 	const [id, setId] = useState<string>();
// 	const [loading, setLoading] = useState(true);

// 	const [bot, setBot] = useState<Bot | null>(null);
// 	const [profile, setProfile] = useState<DiscordProfile | null>(null);
// 	const [profileExists, setProfileExists] = useState<boolean | null>(null);
// 	const [stats, setStats] = useState<any | null>(null);
// 	const [owners, setOwners] = useState<any[]>([]);
// 	const [organization, setOrganization] = useState<any | null>(null);

// 	/* ================= INIT ================= */

// 	useEffect(() => {
// 		(async () => {
// 			setView('about');

// 			setNavItems([
// 				{ label: 'Home', href: '/', icon: <LucideHome /> },
// 				{ label: 'Back to explore', href: '/explore', icon: <ArrowLeft /> },
// 				{ label: 'about', onClick: () => setView('about'), icon: <IdCard />, view: 'about' },
// 				{ label: 'statistics', onClick: () => setView('statistics'), icon: <BarChart3 />, view: 'statistics' },
// 				{ label: 'commands', onClick: () => setView('commands'), icon: <Terminal />, view: 'commands' },
// 			]);

// 			const resolved = await params;
// 			setId(resolved.id);
// 		})();
// 	}, []);

// 	/* ================= FETCH ================= */

// 	useEffect(() => {
// 		if (!id) return;

// 		(async () => {
// 			try {
// 				const [botRes, profileRes, statsRes] = await Promise.all([fetch(`/api/v1/bots/${id}/profile`), fetch(`/api/v1/discord/users/${id}/profile`), fetch(`/api/v1/bots/${id}/stats`)]);

// 				if (profileRes.ok) {
// 					const data = await profileRes.json();
// 					setProfile(data.user);
// 					setProfileExists(true);
// 				} else {
// 					setProfile(null);
// 					setProfileExists(false);
// 				}

// 				if (botRes.ok) {
// 					const data = await botRes.json();
// 					setBot(data);
// 				} else {
// 					setBot(null);
// 				}

// 				if (statsRes.ok) {
// 					const data = await statsRes.json();
// 					setStats(data?.[0] ?? null);
// 				}
// 			} catch {
// 				setBot(null);
// 				setProfile(null);
// 				setProfileExists(false);
// 			} finally {
// 				setLoading(false);
// 			}
// 		})();
// 	}, [id]);

// 	useEffect(() => {
// 		if (!bot) return;

// 		(async () => {
// 			try {
// 				// OWNERS → fetch Discord profiles
// 				if (bot.owners?.length) {
// 					const ownerProfiles = await Promise.all(
// 						bot.owners.map(async (id) => {
// 							try {
// 								const res = await fetch(`/api/v1/discord/users/${id}/profile`);
// 								if (!res.ok) return null;
// 								const data = await res.json();
// 								return data.user;
// 							} catch {
// 								return null;
// 							}
// 						})
// 					);

// 					setOwners(ownerProfiles.filter(Boolean));
// 				}

// 				// ORGANIZATION → fetch name
// 				if (bot.organization) {
// 					try {
// 						const res = await fetch(`/api/v1/organizations/${bot.organization}/profile`);
// 						if (res.ok) {
// 							const data = await res.json();

// 							setOrganization(data);
// 						}
// 					} catch {}
// 				}
// 			} catch {}
// 		})();
// 	}, [bot]);

// 	/* ================= LOADING ================= */

// 	if (loading || profileExists === null) {
// 		return <div style={{ padding: '2rem' }}>Loading...</div>;
// 	}

// 	const banner = profile?.banner && `https://cdn.discordapp.com/banners/${profile.id}/${profile.banner}?size=2048`;
// 	const avatar = profile?.avatar && `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;

// 	/* ================= NOT FOUND ================= */

// 	if (!bot) {
// 		return (
// 			<div style={{ padding: '2rem' }}>
// 				<div>{profile?.username || id}</div>
// 				<div style={{ opacity: 0.6 }}>{id}</div>
// 				<div style={{ marginTop: '1rem', color: '#ef4444' }}>{profileExists ? 'Bot exists but is not registered.' : 'Bot does not exist.'}</div>
// 			</div>
// 		);
// 	}

// 	/* ================= MAIN ================= */

// 	return (
// 		<div style={{ width: '100%', padding: '2rem' }}>
// 			{/* HEADER */}
// 			<motion.div
// 				initial={{ opacity: 0, y: 10 }}
// 				animate={{ opacity: 1, y: 0 }}
// 				style={{
// 					position: 'relative',
// 					borderRadius: '1rem',
// 					overflow: 'hidden',
// 					border: '1px solid var(--border)',
// 					background: 'var(--container)',
// 				}}
// 			>
// 				{/* BANNER */}
// 				<div style={{ height: '220px', position: 'relative', background: '#111' }}>
// 					{banner && (
// 						<img
// 							src={banner}
// 							style={{
// 								width: '100%',
// 								height: '100%',
// 								objectFit: 'cover',
// 								filter: 'brightness(0.55)',
// 							}}
// 						/>
// 					)}

// 					{/* overlay */}
// 					<div
// 						style={{
// 							position: 'absolute',
// 							inset: 0,
// 							background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.75))',
// 						}}
// 					/>

// 					{/* TOP RIGHT */}
// 					<div
// 						style={{
// 							position: 'absolute',
// 							top: '1rem',
// 							right: '1rem',
// 							display: 'flex',
// 							gap: '0.5rem',
// 							fontSize: '0.75rem',
// 						}}
// 					>
// 						<span style={{ opacity: 0.7 }}>{bot.privacy}</span>
// 					</div>

// 					{/* BOTTOM LEFT */}
// 					<div
// 						style={{
// 							position: 'absolute',
// 							bottom: '1rem',
// 							left: '1rem',
// 							display: 'flex',
// 							alignItems: 'center',
// 							gap: '0.75rem',
// 						}}
// 					>
// 						{/* AVATAR */}
// 						<div
// 							style={{
// 								width: '64px',
// 								height: '64px',
// 								borderRadius: '50%',
// 								overflow: 'hidden',
// 								border: '3px solid rgba(255,255,255,0.15)',
// 								background: '#222',
// 							}}
// 						>
// 							{avatar && <img src={avatar} style={{ width: '100%', height: '100%' }} />}
// 						</div>

// 						{/* TEXT */}
// 						<div>
// 							{/* NAME + VERIFIED */}
// 							<div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
// 								<div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{profile?.username || bot.id}</div>

// 								{bot.verified && (
// 									<span
// 										style={{
// 											fontSize: '0.65rem',
// 											padding: '0.15rem 0.4rem',
// 											borderRadius: '999px',
// 											background: 'rgba(34,197,94,0.15)',
// 											color: '#22c55e',
// 											border: '1px solid rgba(34,197,94,0.3)',
// 										}}
// 									>
// 										Verified
// 									</span>
// 								)}
// 							</div>

// 							{/* ID */}
// 							<div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{bot.id}</div>

// 							{/* ORG + OWNERS */}
// 							<div
// 								style={{
// 									marginTop: '0.4rem',
// 									display: 'flex',
// 									flexDirection: 'column',
// 									gap: '0.25rem',
// 								}}
// 							>
// 								{/* ORGANIZATION */}
// 								{organization && (
// 									<div
// 										style={{
// 											fontSize: '0.7rem',
// 											opacity: 0.75,
// 											fontWeight: 500,
// 										}}
// 									>
// 										{organization.name}
// 									</div>
// 								)}

// 								{/* OWNERS */}
// 								{owners.length > 0 && (
// 									<div
// 										style={{
// 											display: 'flex',
// 											gap: '0.35rem',
// 											flexWrap: 'wrap',
// 										}}
// 									>
// 										{owners.slice(0, 3).map((owner) => {
// 											const avatar = owner.avatar ? `https://cdn.discordapp.com/avatars/${owner.id}/${owner.avatar}.png` : null;

// 											return (
// 												<div
// 													key={owner.id}
// 													style={{
// 														display: 'flex',
// 														alignItems: 'center',
// 														gap: '0.3rem',
// 														padding: '0.15rem 0.35rem',
// 														borderRadius: '999px',
// 														background: 'rgba(255,255,255,0.06)',
// 														fontSize: '0.65rem',
// 														opacity: 0.85,
// 													}}
// 												>
// 													<div
// 														style={{
// 															width: '14px',
// 															height: '14px',
// 															borderRadius: '50%',
// 															overflow: 'hidden',
// 															background: '#222',
// 														}}
// 													>
// 														{avatar && <img src={avatar} style={{ width: '100%', height: '100%' }} />}
// 													</div>

// 													<span>{owner.username}</span>
// 												</div>
// 											);
// 										})}

// 										{owners.length > 3 && (
// 											<div
// 												style={{
// 													fontSize: '0.65rem',
// 													opacity: 0.6,
// 													display: 'flex',
// 													alignItems: 'center',
// 												}}
// 											>
// 												+{owners.length - 3}
// 											</div>
// 										)}
// 									</div>
// 								)}
// 							</div>
// 						</div>
// 					</div>

// 					{/* BOTTOM RIGHT: STATS */}
// 					{stats && (
// 						<div
// 							style={{
// 								position: 'absolute',
// 								bottom: '1rem',
// 								right: '1rem',
// 								display: 'flex',
// 								gap: '1rem',
// 								fontSize: '0.75rem',
// 								opacity: 0.85,
// 							}}
// 						>
// 							<div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
// 								<Globe size={14} style={{ opacity: 0.6 }} />
// 								{stats.guildCount.toLocaleString()}
// 							</div>

// 							<div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
// 								<Users size={14} style={{ opacity: 0.6 }} />
// 								{stats.userCount.toLocaleString()}
// 							</div>

// 							<div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
// 								<Layers size={14} style={{ opacity: 0.6 }} />
// 								{stats.shardCount}
// 							</div>

// 							<div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
// 								<Star size={14} style={{ opacity: 0.6 }} />
// 								{stats.voteCount}
// 							</div>
// 						</div>
// 					)}
// 				</div>
// 			</motion.div>

// 			{/* CONTENT */}
// 			<div style={{ marginTop: '1.5rem' }}>
// 				<AnimatePresence mode="wait">
// 					<motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
// 						{view === 'about' && <About bot={bot} />}

// 						{view === 'statistics' && <Statistics id={id!} />}

// 						{view === 'commands' && (
// 							<>
// 								<h2>Commands</h2>
// 								{bot.commands?.length ? (
// 									<div style={{ display: 'grid', gap: '0.5rem' }}>
// 										{bot.commands.map((cmd) => (
// 											<div
// 												key={cmd.id}
// 												style={{
// 													padding: '0.75rem',
// 													borderRadius: '0.5rem',
// 													background: 'var(--container)',
// 													border: '1px solid var(--border)',
// 												}}
// 											>
// 												<div style={{ fontWeight: 600 }}>{cmd.name}</div>
// 												<div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{cmd.description}</div>
// 											</div>
// 										))}
// 									</div>
// 								) : (
// 									<div style={{ opacity: 0.6 }}>No commands available.</div>
// 								)}
// 							</>
// 						)}
// 					</motion.div>
// 				</AnimatePresence>
// 			</div>
// 		</div>
// 	);
// }
/** @format */

export default function Page() {
	return null;
}
