/** @format */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Award, ExternalLink, Server, Trophy, Users } from 'lucide-react';
import { formatMilestoneCount, getHighestMilestoneBadge } from '@xernerx/lib';
import { useDictionary } from '@xernerx/providers';

interface BiggestBotMilestonesCardProps {
	bots: any[];
}

export default function BiggestBotMilestonesCard({ bots }: BiggestBotMilestonesCardProps) {
	const { t } = useDictionary();

	if (!Array.isArray(bots) || bots.length === 0) return null;

	const maxGuildBot = bots.reduce((best, b) => {
		const bGuilds = Number(b?.stats?.guildCount ?? b?.guildCount ?? 0) || 0;
		const bestGuilds = Number(best?.stats?.guildCount ?? best?.guildCount ?? 0) || 0;
		return bGuilds > bestGuilds ? b : best;
	}, bots[0]);

	const maxUserBot = bots.reduce((best, b) => {
		const bUsers = Number(b?.stats?.userCount ?? b?.userCount ?? 0) || 0;
		const bestUsers = Number(best?.stats?.userCount ?? best?.userCount ?? 0) || 0;
		return bUsers > bestUsers ? b : best;
	}, bots[0]);

	const maxGuildCount = Number(maxGuildBot?.stats?.guildCount ?? maxGuildBot?.guildCount ?? 0) || 0;
	const maxUserCount = Number(maxUserBot?.stats?.userCount ?? maxUserBot?.userCount ?? 0) || 0;

	const serverBadge = getHighestMilestoneBadge(maxGuildCount, 'servers');
	const memberBadge = getHighestMilestoneBadge(maxUserCount, 'members');

	const guildBotName = maxGuildBot?.discord?.global_name || maxGuildBot?.discord?.username || maxGuildBot?.name || t('common.unknownBot');
	const userBotName = maxUserBot?.discord?.global_name || maxUserBot?.discord?.username || maxUserBot?.name || t('common.unknownBot');

	return (
		<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/35 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
						<Trophy size={18} />
					</div>
					<div>
						<h2 className="text-xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('app.users.profile.milestones.title')}
						</h2>
						<p className="text-xs text-(--text-muted)">{t('app.users.profile.milestones.subtitle')}</p>
					</div>
				</div>
				<span className="inline-flex items-center gap-1.5 rounded-full bg-(--accent)/15 border border-(--accent)/30 px-3 py-1 text-xs font-extrabold text-(--accent)">
					<Award size={12} />
					{t('app.users.profile.milestones.badgeCount', { count: bots.length })}
				</span>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Biggest Server Milestone Card */}
				<Link
					href={`/bots/${maxGuildBot.id}`}
					className="group flex items-center justify-between gap-4 rounded-2xl border border-(--border)/10 bg-(--background)/50 hover:border-(--accent)/45 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_16%,transparent)] p-4 transition-all"
				>
					<div className="flex items-center gap-3.5 min-w-0">
						<div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-(--foreground)/40 border border-(--accent)/30 p-2 shadow-sm">
							<Image src={serverBadge.badgeSvg} alt={serverBadge.label} width={44} height={44} unoptimized className="h-10 w-10 object-contain" />
						</div>
						<div className="flex flex-col min-w-0">
							<div className="flex items-center gap-1.5">
								<span className="text-[10px] font-extrabold uppercase tracking-wider text-(--accent)">
									{serverBadge.unlocked ? t('app.users.profile.milestones.tierUnlocked', { tier: serverBadge.tier }) : t('app.users.profile.milestones.starterTier')}
								</span>
							</div>
							<span className="text-base font-extrabold text-(--text) group-hover:text-(--accent) transition-colors truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{serverBadge.label}
							</span>
							<div className="flex items-center gap-1.5 text-xs text-(--text-muted) mt-0.5 truncate">
								<Server size={12} className="text-(--accent) shrink-0" />
								<span className="font-bold text-(--text) truncate">{guildBotName}</span>
								<span>•</span>
								<span className="font-mono">{formatMilestoneCount(maxGuildCount)}</span>
							</div>
						</div>
					</div>
					<ExternalLink size={15} className="text-(--text-muted) group-hover:text-(--accent) shrink-0 transition-colors" />
				</Link>

				{/* Biggest Member Milestone Card */}
				<Link
					href={`/bots/${maxUserBot.id}`}
					className="group flex items-center justify-between gap-4 rounded-2xl border border-(--border)/10 bg-(--background)/50 hover:border-(--accent)/45 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_16%,transparent)] p-4 transition-all"
				>
					<div className="flex items-center gap-3.5 min-w-0">
						<div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-(--foreground)/40 border border-(--accent)/30 p-2 shadow-sm">
							<Image src={memberBadge.badgeSvg} alt={memberBadge.label} width={44} height={44} unoptimized className="h-10 w-10 object-contain" />
						</div>
						<div className="flex flex-col min-w-0">
							<div className="flex items-center gap-1.5">
								<span className="text-[10px] font-extrabold uppercase tracking-wider text-(--accent)">
									{memberBadge.unlocked ? t('app.users.profile.milestones.tierUnlocked', { tier: memberBadge.tier }) : t('app.users.profile.milestones.starterTier')}
								</span>
							</div>
							<span className="text-base font-extrabold text-(--text) group-hover:text-(--accent) transition-colors truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{memberBadge.label}
							</span>
							<div className="flex items-center gap-1.5 text-xs text-(--text-muted) mt-0.5 truncate">
								<Users size={12} className="text-(--accent) shrink-0" />
								<span className="font-bold text-(--text) truncate">{userBotName}</span>
								<span>•</span>
								<span className="font-mono">{formatMilestoneCount(maxUserCount)}</span>
							</div>
						</div>
					</div>
					<ExternalLink size={15} className="text-(--text-muted) group-hover:text-(--accent) shrink-0 transition-colors" />
				</Link>
			</div>
		</div>
	);
}
