'use client';

import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Button } from '@xernerx/ui';
import { User, ExternalLink, ShieldCheck, Globe, LifeBuoy, MessageSquare, FileText, Shield, ChevronUp } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

export default function Header({ bot, id, setBot }: { bot: any; id: string; setBot: any }) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();

	// Vote State
	const [canVote, setCanVote] = useState(false);
	const [nextVoteAt, setNextVoteAt] = useState<string | null>(null);
	const [voting, setVoting] = useState(false);
	const [timeLeft, setTimeLeft] = useState<string>('');

	useEffect(() => {
		if (!nextVoteAt || canVote) return;
		const interval = setInterval(() => {
			const diff = new Date(nextVoteAt).getTime() - Date.now();
			if (diff <= 0) {
				setCanVote(true);
				setNextVoteAt(null);
				clearInterval(interval);
			} else {
				const h = Math.floor(diff / (1000 * 60 * 60));
				const m = Math.floor((diff / 1000 / 60) % 60);
				setTimeLeft(`${h}h ${m}m`);
			}
		}, 60000);

		const diff = new Date(nextVoteAt).getTime() - Date.now();
		if (diff > 0) {
			const h = Math.floor(diff / (1000 * 60 * 60));
			const m = Math.floor((diff / 1000 / 60) % 60);
			setTimeLeft(`${h}h ${m}m`);
		}

		return () => clearInterval(interval);
	}, [nextVoteAt, canVote]);

	useEffect(() => {
		if (!isReady) return;
		const fetchVoteStatus = async () => {
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/vote`), { credentials: 'include' });
				if (res.ok) {
					const data = await res.json();
					setCanVote(data.canVote);
					setNextVoteAt(data.nextVoteAt);
				}
			} catch (error) {
				// Silently fail
			}
		};
		fetchVoteStatus();
	}, [id, getEnvUrl, isReady]);

	const handleVote = async () => {
		setVoting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/vote`), {
				method: 'POST',
				credentials: 'include',
			});
			if (res.ok) {
				setCanVote(false);
				setNextVoteAt(new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString());
				setBot((prev: any) => (prev ? { ...prev, voteCount: (prev.voteCount || 0) + 1 } : prev));
			}
		} catch (error) {
			console.error('Failed to vote', error);
		} finally {
			setVoting(false);
		}
	};

	const avatarUrl = bot.discord?.avatar
		? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.discord.avatar}.png?size=256`
		: bot.avatar
			? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png?size=256`
			: null;

	return (
		<div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 p-8 rounded-3xl bg-(--foreground)/50 border border-(--border)/10 backdrop-blur-md shadow-sm mt-8 relative overflow-hidden">
			{bot.discord?.banner && (
				<div
					className="absolute inset-0 opacity-20 pointer-events-none"
					style={{ backgroundImage: `url(https://cdn.discordapp.com/banners/${bot.id}/${bot.discord.banner}.png?size=1024)`, backgroundSize: 'cover', backgroundPosition: 'center' }}
				/>
			)}
			{avatarUrl ? (
				<Image
					src={avatarUrl}
					alt={bot.discord?.global_name || bot.discord?.username || bot.name || 'Bot Avatar'}
					width={128}
					height={128}
					className="rounded-2xl shadow-lg border-2 border-(--border)/20 relative z-10"
				/>
			) : (
				<div className="w-32 h-32 rounded-2xl bg-(--background) border-2 border-(--border)/20 flex items-center justify-center text-(--text-muted) shadow-lg relative z-10">
					<User className="w-12 h-12" />
				</div>
			)}
			<div className="flex-1 relative z-10">
				<div className="flex items-center gap-3 mb-2">
					<h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{bot.discord?.global_name || bot.discord?.username || bot.name || 'Unknown Bot'}
					</h1>
					{bot.verified && <ShieldCheck className="w-6 h-6 text-green-500" />}
					{bot.discord?.bot && <span className="px-2 py-0.5 bg-[#5865F2] text-white text-[10px] font-bold rounded-sm uppercase tracking-wider">{t('app.bots.id.text4')}</span>}
				</div>
				<p className="text-lg text-(--text-muted) mb-4 max-w-2xl">{bot.description || 'No description provided.'}</p>
				<div className="flex flex-wrap gap-2">
					{bot.tags?.map((tag: string) => (
						<span key={tag} className="px-3 py-1 bg-(--accent)/10 text-(--accent) text-sm font-semibold rounded-full border border-(--accent)/20 flex items-center gap-1">
							<span className="text-[10px] font-bold text-(--text-muted)">#</span> {tag}
						</span>
					))}
				</div>
			</div>

			<div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0 relative z-10 flex flex-col items-start md:items-end gap-6">
				<div className="flex flex-col items-start md:items-end gap-3 w-full">
					<div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
						{bot.links?.invite && (
							<Button onClick={() => window.open(bot.links!.invite, '_blank')} className="w-full sm:w-auto px-8 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_40%,transparent)]">
								{t('app.bots.id.text5')}
							</Button>
						)}
						<Button
							onClick={handleVote}
							disabled={!canVote || voting}
							variant="outline"
							className={`w-full sm:w-auto px-6 border border-(--border)/10 ${canVote ? 'hover:border-(--accent)/50 hover:bg-(--accent)/10 text-(--accent)' : 'opacity-50 cursor-not-allowed'}`}
						>
							<ChevronUp className="w-4 h-4 mr-2" />
							{voting ? 'Voting...' : canVote ? 'Vote' : nextVoteAt ? `Vote again in ${timeLeft || '...'}` : 'Voted'}
						</Button>
					</div>
					{bot.links && Object.entries(bot.links).filter(([key, val]) => key !== 'invite' && val).length > 0 && (
						<div className="flex flex-wrap gap-2 justify-end w-full">
							{Object.entries(bot.links)
								.filter(([key, val]) => key !== 'invite' && val)
								.map(([key, val]) => {
									let Icon: any = ExternalLink;
									if (key === 'github') Icon = FaGithub;
									else if (key === 'website') Icon = Globe;
									else if (key === 'support') Icon = LifeBuoy;
									else if (key === 'community') Icon = MessageSquare;
									else if (key === 'privacy') Icon = Shield;
									else if (key === 'terms') Icon = FileText;

									return (
										<button
											key={key}
											onClick={() => window.open(val as string, '_blank')}
											className="flex items-center gap-1.5 text-xs font-bold text-(--text-muted) hover:text-(--text) bg-(--background)/50 hover:bg-(--background) px-3 py-1.5 rounded-lg border border-(--border)/10 transition-all capitalize shadow-sm"
										>
											<Icon className="w-3.5 h-3.5" />
											{key}
										</button>
									);
								})}
						</div>
					)}
				</div>

				{bot.ownersData && bot.ownersData.length > 0 && (
					<div className="flex flex-col items-start md:items-end gap-2">
						<span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">{t('app.bots.id.text6')}</span>
						<div className="flex flex-wrap gap-2 justify-end">
							{bot.ownersData.map((owner: any) => (
								<Link
									href={`/users/${owner.id}`}
									key={owner.id}
									className="flex items-center gap-2 bg-(--background) border border-(--border)/10 px-3 py-1 rounded-full shadow-sm hover:border-(--accent)/50 transition-colors"
								>
									<Image
										src={
											owner.avatar
												? `https://cdn.discordapp.com/avatars/${owner.id}/${owner.avatar}.png?size=64`
												: `https://cdn.discordapp.com/embed/avatars/${Number(owner.discriminator) % 5}.png`
										}
										alt={owner.global_name || owner.username || 'Owner Avatar'}
										width={16}
										height={16}
										className="rounded-full"
									/>
									<span className="text-xs font-bold text-(--text)">{owner.global_name || owner.username}</span>
								</Link>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
