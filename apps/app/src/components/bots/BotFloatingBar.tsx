/** @format */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Activity, ChevronUp, ExternalLink, ShieldCheck, Star, Tag, Terminal, Trophy, User } from 'lucide-react';
import { useDictionary, useSidebar } from '@xernerx/providers';
import { Button, Tooltip } from '@xernerx/ui';

interface BotFloatingBarProps {
	bot: any;
	avatarUrl: string | null;
	botDisplayName: string;
	isSignedIn?: boolean;
	canVote: boolean;
	voting: boolean;
	timeLeft: string;
	nextVoteAt: string | null;
	onVote: () => void;
}

export default function BotFloatingBar({ bot, avatarUrl, botDisplayName, isSignedIn = false, canVote, voting, timeLeft, nextVoteAt, onVote }: BotFloatingBarProps) {
	const { t } = useDictionary();
	const { view, setView } = useSidebar();
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const scrollContainer = document.getElementById('main-scroll-container');
		const handleScroll = () => {
			const top = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
			setVisible(top > 320);
		};

		handleScroll();
		if (scrollContainer) {
			scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
		}
		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			if (scrollContainer) {
				scrollContainer.removeEventListener('scroll', handleScroll);
			}
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	const currentView = view || 'profile';

	const tabs = [
		{ id: 'profile', label: t('app.bots.tabs.profile'), icon: User },
		{ id: 'stats', label: t('app.bots.tabs.statistics'), icon: Activity },
		{ id: 'milestones', label: t('app.bots.tabs.milestones'), icon: Trophy },
		{ id: 'commands', label: t('app.bots.tabs.commands'), icon: Terminal },
		{ id: 'releases', label: t('app.bots.tabs.releases'), icon: Tag },
		{ id: 'reviews', label: t('app.bots.tabs.reviews'), icon: Star },
	];

	return (
		<div
			className={`sticky top-3 z-40 transition-all duration-300 ${
				visible ? 'opacity-100 translate-y-0 mb-4 pointer-events-auto' : 'opacity-0 -translate-y-3 h-0 overflow-hidden mb-0 pointer-events-none'
			}`}
		>
			<div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-3xl bg-(--background)/85 border border-(--accent)/25 backdrop-blur-xl shadow-[0_8px_30px_color-mix(in_srgb,var(--accent)_18%,transparent)]">
				{/* Left: Bot Identity */}
				<div className="flex items-center gap-3 min-w-0">
					{avatarUrl ? (
						<Image src={avatarUrl} alt={botDisplayName} width={36} height={36} unoptimized className="w-9 h-9 rounded-2xl object-cover border border-(--border)/20 shrink-0" />
					) : (
						<div className="w-9 h-9 rounded-2xl bg-(--foreground) border border-(--border)/20 flex items-center justify-center text-(--text-muted) shrink-0">
							<User className="w-4 h-4" />
						</div>
					)}
					<div className="flex items-center gap-1.5 min-w-0">
						<span className="text-sm font-extrabold text-(--text) truncate max-w-[180px]" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{botDisplayName}
						</span>
						{bot.verified && <ShieldCheck className="w-4 h-4 text-(--accent-green) shrink-0" />}
					</div>
				</div>

				{/* Center: Quick View Tabs */}
				<div className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-(--foreground)/50 border border-(--border)/10">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const active = currentView === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setView(tab.id)}
								className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
									active ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--background)/50'
								}`}
							>
								<Icon className="w-3.5 h-3.5" />
								{tab.label}
							</button>
						);
					})}
				</div>

				{/* Right: Quick Vote + Invite */}
				<div className="flex items-center gap-2 shrink-0">
					{!isSignedIn ? (
						<Tooltip content={t('app.bots.id.signInToVote')}>
							<span className="inline-flex">
								<Button disabled variant="outline" className="px-3.5 py-1.5 text-xs rounded-2xl border border-(--border)/10 opacity-50 cursor-not-allowed pointer-events-none">
									<ChevronUp className="w-3.5 h-3.5 mr-1" />
									{t('app.bots.id.vote')}
								</Button>
							</span>
						</Tooltip>
					) : (
						<Button
							onClick={onVote}
							disabled={!canVote || voting}
							variant="outline"
							className={`px-3.5 py-1.5 text-xs rounded-2xl border border-(--border)/10 ${
								canVote ? 'hover:border-(--accent)/50 hover:bg-(--accent)/10 text-(--accent)' : 'opacity-50 cursor-not-allowed'
							}`}
						>
							<ChevronUp className="w-3.5 h-3.5 mr-1" />
							{voting ? t('app.bots.id.voting') : canVote ? t('app.bots.id.vote') : nextVoteAt ? timeLeft || '...' : t('app.bots.id.vote')}
						</Button>
					)}
					{bot.links?.invite && (
						<Button onClick={() => window.open(bot.links.invite, '_blank')} className="px-4 py-1.5 text-xs rounded-2xl shadow-[0_0_14px_color-mix(in_srgb,var(--accent)_35%,transparent)]">
							{t('app.bots.explore.quickInvite')}
							<ExternalLink className="w-3 h-3 ml-1.5" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
