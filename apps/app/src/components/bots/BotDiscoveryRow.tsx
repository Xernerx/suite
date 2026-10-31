/** @format */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronUp, Compass, Server, ShieldCheck, Sparkles, User, Users } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';

interface BotDiscoveryRowProps {
	bot: any;
}

function RelatedBotCard({ item }: { item: any }) {
	const avatarUrl = item.avatar ? (item.avatar.startsWith('http') ? item.avatar : `https://cdn.discordapp.com/avatars/${item.id}/${item.avatar}.png?size=128`) : null;

	return (
		<Link
			href={`/bots/${item.vanitySlug || item.id}`}
			className="flex flex-col justify-between rounded-3xl bg-(--foreground)/30 hover:bg-(--foreground)/45 border border-(--border)/10 hover:border-(--accent)/40 backdrop-blur-md transition-all group shadow-sm"
			style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.65)' }}
		>
			<div className="flex items-start gap-3.5">
				<div className="relative shrink-0">
					{avatarUrl ? (
						<Image src={avatarUrl} alt={item.name || item.id} width={48} height={48} unoptimized className="w-12 h-12 rounded-2xl object-cover border border-(--border)/15" />
					) : (
						<div className="w-12 h-12 rounded-2xl bg-(--background)/70 border border-(--border)/15 flex items-center justify-center text-(--text-muted)">
							<User className="w-5 h-5" />
						</div>
					)}
					{item.status && item.status !== 'offline' && (
						<span
							className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-(--background) ${
								item.status === 'online' ? 'bg-(--accent-green)' : item.status === 'idle' ? 'bg-(--accent-orange)' : 'bg-(--accent-red)'
							}`}
						/>
					)}
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1.5">
						<h4 className="text-base font-extrabold text-(--text) group-hover:text-(--accent) transition-colors truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{item.name || item.id}
						</h4>
						{item.verified && <ShieldCheck className="w-4 h-4 text-(--accent-green) shrink-0" />}
					</div>
					<p className="text-xs text-(--text-muted) line-clamp-2 mt-1">{item.description || '—'}</p>
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-(--border)/10 text-xs font-mono text-(--text-muted)">
				<div className="flex items-center gap-3">
					<span className="inline-flex items-center gap-1">
						<Server size={12} className="text-(--accent)" />
						{Number(item.guildCount || 0).toLocaleString()}
					</span>
					<span className="inline-flex items-center gap-1">
						<Users size={12} className="text-(--accent)" />
						{Number(item.userCount || 0).toLocaleString()}
					</span>
				</div>
				<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--accent)/10 text-(--accent) border border-(--accent)/20 font-bold">
					<ChevronUp size={12} />
					{Number(item.voteCount || 0).toLocaleString()}
				</span>
			</div>
		</Link>
	);
}

export function BotDiscoveryRow({ bot }: BotDiscoveryRowProps) {
	const { t } = useDictionary();

	const developerBots = Array.isArray(bot?.relatedBots?.developerBots) ? bot.relatedBots.developerBots : [];
	const similarBots = Array.isArray(bot?.relatedBots?.similarBots) ? bot.relatedBots.similarBots : [];

	if (developerBots.length === 0 && similarBots.length === 0) {
		return null;
	}

	const developerName = bot?.organizationData?.name || bot?.ownersData?.[0]?.global_name || bot?.ownersData?.[0]?.username || bot?.discord?.global_name || bot?.name || 'Developer';

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{developerBots.length > 0 && (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<div className="flex items-center gap-3 px-1">
						<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
							<Sparkles className="w-4 h-4" />
						</div>
						<div>
							<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.bots.overview.moreFromDeveloperTitle', { developer: developerName })}
							</h3>
							<p className="text-xs text-(--text-muted)">{t('app.bots.overview.moreFromDeveloperSubtitle')}</p>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--ui-gap)' }}>
						{developerBots.map((item: any) => (
							<RelatedBotCard key={item.id} item={item} />
						))}
					</div>
				</div>
			)}

			{similarBots.length > 0 && (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<div className="flex items-center gap-3 px-1">
						<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
							<Compass className="w-4 h-4" />
						</div>
						<div>
							<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.bots.overview.similarBotsTitle')}
							</h3>
							<p className="text-xs text-(--text-muted)">{t('app.bots.overview.similarBotsSubtitle')}</p>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--ui-gap)' }}>
						{similarBots.map((item: any) => (
							<RelatedBotCard key={item.id} item={item} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}
