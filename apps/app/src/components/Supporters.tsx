/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import Image from 'next/image';

type Member = {
	id: string;
	username: string;
	avatar_url: string;
	status: 'online' | 'idle' | 'dnd' | 'offline';
};

export default function Supporters() {
	const [supporters, setSupporters] = useState<Member[]>([]);
	const [me, setMe] = useState<string | null>(null);

	const guildId = '687429190165069838';

	// fetch widget members
	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch(`https://app.discord.com/api/guilds/${guildId}/widget.json`);
				const guild = await res.json();
				setSupporters(guild.members || []);
			} catch {
				setSupporters([]);
			}
		};

		fetchData();
		const interval = setInterval(fetchData, 60000);
		return () => clearInterval(interval);
	}, []);

	// fetch current user member
	useEffect(() => {
		if (!supporters.length) return;

		(async () => {
			const { member } = await fetch(`/api/v1/discord/guilds/${guildId}/member`)
				.then((res) => res.json())
				.catch(() => ({ member: null }));

			if (!member) return;

			const match = supporters.find((s) => s.username === member.nick || s.username === member.user.username);

			if (match) setMe(match.id);
		})();
	}, [supporters]);

	if (!supporters.length) return null;

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">Our Supporting Members</h1>

			<div className="flex flex-wrap gap-3 overflow-y-visible overflow-x-hidden">
				{supporters.map((s, i) => {
					const isMe = s.id === me;

					return (
						<div
							key={s.id}
							className="group relative flex-shrink-0"
							style={{
								paddingRight: 140,
								marginRight: -140,
							}}
						>
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{
									opacity: 1,
									y: 0,
									scale: isMe ? 1.1 : 1,
								}}
								transition={{
									delay: i * 0.03,
									type: isMe ? 'spring' : 'tween',
									stiffness: 300,
								}}
								className="flex items-center rounded-xl border cursor-pointer relative"
								style={{
									borderColor: isMe ? 'var(--accent)' : 'var(--border)',
									background: 'var(--bg-main)',
									padding: '6px 8px',
									boxShadow: isMe ? '0 0 0 2px var(--accent-hover)' : 'none',
								}}
							>
								{/* avatar */}
								<div className="relative flex-shrink-0">
									<Image src={s.avatar_url} alt={s.username} width={36} height={36} className="h-10 w-10 rounded-full object-cover" />
									<span
										className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2"
										style={{
											borderColor: 'var(--bg-main)',
											background: s.status === 'online' ? 'rgb(34,197,94)' : s.status === 'idle' ? 'rgb(234,179,8)' : s.status === 'dnd' ? 'rgb(239,68,68)' : 'rgb(148,163,184)',
										}}
									/>
								</div>

								{/* username */}
								<div className="overflow-hidden max-w-0 group-hover:max-w-35 transition-all duration-300">
									<span
										className="text-sm whitespace-nowrap"
										style={{
											color: 'var(--text-main)',
											paddingLeft: 8,
											paddingRight: 8,
										}}
									>
										{s.username}
									</span>
								</div>

								{/* special bubble */}
								<AnimatePresence>
									{isMe && (
										<motion.div
											initial={{ opacity: 0, y: -10, scale: 0.8 }}
											animate={{ opacity: 1, y: -20, scale: 1 }}
											exit={{ opacity: 0 }}
											className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs px-2 py-1 rounded-md shadow"
											style={{
												background: 'var(--bg-main)',
												border: '1px solid var(--border)',
											}}
										>
											Hey! It’s you!
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
