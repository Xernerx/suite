/** @format */

'use client';

import { AlertCircle, Check, Copy, ExternalLink, List, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { redirect } from 'next/navigation';
import { useSidebar } from '@/providers/SidebarProvider';
import { useToast } from '@/providers/ToastProvider';

type Invite = {
	id: string;
	name: string;
	shortName?: string;
	permissions: string;
};

type Bot = {
	id: string;
	username: string;
	avatar: string;
};

export default function Page({ params }: { params: Promise<{ type: string }> }) {
	const { hide } = useSidebar();
	const { toast } = useToast();

	const [type, setType] = useState<string | null>(null);
	const [copied, setCopied] = useState<string | null>(null);

	const [invites, setInvites] = useState<Invite[]>([]);
	const [bots, setBots] = useState<Record<string, Bot | null>>({});

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		hide();

		(async () => {
			const t = (await params).type?.toLowerCase();
			setType(t);

			// fetch invites
			const res = await fetch('/api/v1/invite');
			const data = await res.json();

			setInvites(data.invites);

			// fetch bot data in parallel
			const botEntries = await Promise.all(
				data.invites.map(async (invite: Invite) => {
					try {
						const res = await fetch(`/api/v1/discord/users/${invite.id}/profile`);
						const data = await res.json();
						return [invite.id, data.user];
					} catch {
						return [invite.id, null];
					}
				})
			);

			const botMap = Object.fromEntries(botEntries);
			setBots(botMap);

			// handle redirect
			const entry = data.invites.find((i: Invite) => {
				return i.name.toLowerCase() === t || i.shortName?.toLowerCase() === t || i.id === t;
			});

			if (entry) {
				const link = buildLink(entry);
				redirect(link);
			}

			setLoading(false);
		})();
	}, []);

	function buildLink(invite: Invite) {
		return `https://discord.com/oauth2/authorize?client_id=${invite.id}&permissions=${invite.permissions}&scope=bot+applications.commands`;
	}

	function copyLink(invite: Invite) {
		const link = buildLink(invite);

		navigator.clipboard.writeText(link);

		setCopied(invite.id);
		toast(`Copied invite for ${invite.name}`, 'success');

		setTimeout(() => setCopied(null), 1200);
	}

	if (!type || loading) {
		return <></>;
	}

	const notFound = type !== 'list' && !invites.find((i) => i.name.toLowerCase() === type || i.shortName?.toLowerCase() === type || i.id === type);

	return (
		<div
			style={{
				minHeight: '100vh',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				padding: '2rem',
			}}
		>
			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 10 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				transition={{ duration: 0.25 }}
				style={{
					width: '100%',
					maxWidth: '520px',
					borderRadius: '1rem',
					border: '1px solid var(--border)',
					background: 'var(--container)',
					padding: '1.5rem',
					boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
				}}
			>
				{/* HEADER */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
					<Sparkles size={18} />
					<h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Invite Center</h2>
				</div>

				{/* ERROR */}
				{notFound && (
					<motion.div
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							padding: '0.75rem',
							borderRadius: '0.5rem',
							background: 'rgba(239,68,68,0.15)',
							color: '#ef4444',
							fontSize: '0.9rem',
							marginBottom: '1rem',
						}}
					>
						<AlertCircle size={16} />
						Couldn’t find an invite for "{type}"
					</motion.div>
				)}

				{/* LIST */}
				<div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
						<List size={16} />
						<span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Available invites</span>
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
						<AnimatePresence>
							{invites
								.sort((a, b) => a.name.localeCompare(b.name))
								.map((invite) => {
									const isCopied = copied === invite.id;
									const bot = bots[invite.id];

									return (
										<motion.div key={invite.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', gap: '0.5rem' }}>
											{/* MAIN */}
											<motion.button
												whileHover={{ scale: 1.02, y: -2 }}
												whileTap={{ scale: 0.98 }}
												onClick={() => redirect(buildLink(invite))}
												style={{
													flex: 1,
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													padding: '0.75rem',
													borderRadius: '0.5rem',
													border: '1px solid var(--border)',
													background: 'var(--bg-main)',
												}}
											>
												<div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
													{bot ? (
														<img src={`https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.webp`} style={{ width: 24, height: 24, borderRadius: '50%' }} />
													) : (
														<div
															style={{
																width: 24,
																height: 24,
																borderRadius: '50%',
																background: 'var(--border)',
															}}
														/>
													)}

													<span style={{ fontWeight: 500 }}>{bot?.username || invite.name}</span>
												</div>

												<ExternalLink size={14} style={{ opacity: 0.6 }} />
											</motion.button>

											{/* COPY */}
											<motion.button
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
												onClick={() => copyLink(invite)}
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													width: '40px',
													borderRadius: '0.5rem',
													border: '1px solid var(--border)',
													background: isCopied ? 'var(--accent)' : 'var(--bg-main)',
													color: isCopied ? '#fff' : 'inherit',
												}}
											>
												{isCopied ? <Check size={14} /> : <Copy size={14} />}
											</motion.button>
										</motion.div>
									);
								})}
						</AnimatePresence>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
