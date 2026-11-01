/** @format */
'use client';

import { useState } from 'react';
import { BookOpen, Bot, Check, ChevronUp, Copy, ExternalLink, KeyRound, Plus, Server, Settings, User, Users } from 'lucide-react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { BotRow } from '@xernerx/components';
import { Button } from '@xernerx/ui';
import Image from 'next/image';
import Link from 'next/link';

interface PersonalWorkspaceProps {
	session: any;
	bots: any[];
	organizations: any[];
	guilds?: any[];
	onCreateOrg?: () => void;
}

export default function PersonalWorkspace({ session, bots, organizations, guilds = [], onCreateOrg }: PersonalWorkspaceProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [copiedId, setCopiedId] = useState(false);

	const userId = session?.user?.id;
	const personalBots = bots.filter((b) => !b.organization || b.organization === 'null' || b.organization === 'undefined' || !organizations.some((org) => org._id === b.organization));
	const orgBotCount = Math.max(0, bots.length - personalBots.length);

	const totalServersReached = bots.reduce((sum, b) => sum + Number(b.guildCount ?? b.stats?.guildCount ?? b.latestStat?.guildCount ?? 0), 0);
	const totalUsersReached = bots.reduce((sum, b) => sum + Number(b.userCount ?? b.stats?.userCount ?? b.latestStat?.userCount ?? 0), 0);
	const totalVotes = bots.reduce((sum, b) => sum + Number(b.voteCount ?? b.stats?.voteCount ?? b.latestStat?.voteCount ?? 0), 0);

	const handleCopyId = () => {
		if (!userId) return;
		navigator.clipboard.writeText(userId);
		setCopiedId(true);
		toast({ title: t('app.portal.workspace.idCopied'), type: 'success' });
		setTimeout(() => setCopiedId(false), 2000);
	};

	const kpiCards = [
		{
			id: 'bots',
			label: t('app.portal.workspace.kpiBots'),
			value: bots.length.toLocaleString(),
			sub: t('app.portal.workspace.kpiBotsSub', { count: personalBots.length, orgCount: orgBotCount }),
			icon: Bot,
		},
		{
			id: 'servers',
			label: t('app.portal.workspace.kpiServersReached'),
			value: totalServersReached.toLocaleString(),
			sub: t('app.portal.workspace.kpiServersReachedSub'),
			icon: Server,
		},
		{
			id: 'users',
			label: t('app.portal.workspace.kpiUsersReached'),
			value: totalUsersReached.toLocaleString(),
			sub: t('app.portal.workspace.kpiUsersReachedSub'),
			icon: Users,
		},
		{
			id: 'votes',
			label: t('app.portal.workspace.kpiVotes'),
			value: totalVotes.toLocaleString(),
			sub: t('app.portal.workspace.kpiVotesSub', { count: guilds.length }),
			icon: ChevronUp,
		},
	];

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden p-8">
				<div className="relative z-10 flex items-center gap-4">
					{session?.user?.image ? (
						<Image
							src={session.user.image}
							alt="Avatar"
							width={80}
							height={80}
							unoptimized
							className="h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0 shadow-lg"
						/>
					) : (
						<div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--background)/50 shrink-0 shadow-lg border border-(--border)/10">
							<User className="w-8 h-8 text-(--text-muted)" />
						</div>
					)}
					<div className="flex flex-col gap-1.5">
						<span className="text-3xl font-extrabold text-(--text) drop-shadow-md tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{session?.user?.name || t('app.portal.nav.personal')}
						</span>
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-sm font-medium text-(--text-muted)">{t('app.portal.myWorkspace')}</span>
							{userId && (
								<button
									type="button"
									onClick={handleCopyId}
									className="inline-flex items-center gap-1.5 w-fit text-xs font-mono text-(--text-muted) hover:text-(--text) bg-(--background)/60 hover:bg-(--background) px-2.5 py-0.5 rounded-lg border border-(--border)/10 transition-colors cursor-pointer"
								>
									<span>{t('app.portal.workspace.id', { id: userId })}</span>
									{copiedId ? <Check className="w-3.5 h-3.5 text-(--accent-green)" /> : <Copy className="w-3.5 h-3.5" />}
								</button>
							)}
						</div>
					</div>
				</div>
				<div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0">
					{onCreateOrg && (
						<Button variant="primary" onClick={onCreateOrg} className="gap-2">
							<Plus className="w-4 h-4" />
							{t('app.portal.workspace.createOrgBtn')}
						</Button>
					)}
					<Link href={getEnvUrl('https://account.xernerx.com/?view=tokens')}>
						<Button variant="secondary" className="gap-2">
							<KeyRound className="w-4 h-4 text-(--accent)" />
							{t('app.portal.workspace.manageTokensBtn')}
						</Button>
					</Link>
					<Link href={getEnvUrl('https://docs.xernerx.com')}>
						<Button variant="secondary" className="gap-2">
							<BookOpen className="w-4 h-4 text-(--accent)" />
							{t('app.portal.workspace.openDocsBtn')}
						</Button>
					</Link>
					{userId && (
						<Link href={getEnvUrl(`https://app.xernerx.com/users/${userId}`)}>
							<Button variant="secondary" className="gap-2">
								<ExternalLink className="w-4 h-4" />
								{t('app.portal.workspace.viewPublicProfile')}
							</Button>
						</Link>
					)}
				</div>
			</div>

			{/* Aggregate Developer KPI Strip */}
			<div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--ui-gap)' }}>
				{kpiCards.map((card) => {
					const Icon = card.icon;
					return (
						<div
							key={card.id}
							className="flex flex-col justify-between rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm"
							style={{ padding: 'var(--ui-gap)' }}
						>
							<div className="flex items-center justify-between gap-2 mb-3">
								<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted) truncate">{card.label}</span>
								<div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
									<Icon className="w-4 h-4" />
								</div>
							</div>
							<div>
								<div className="text-2xl font-extrabold text-(--text) font-mono tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{card.value}
								</div>
								<div className="text-[11px] font-semibold text-(--text-muted) mt-0.5 truncate">{card.sub}</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Personal Bots Card */}
			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-3xl p-8 shadow-sm">
				<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
					<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
						<Bot className="w-4 h-4" />
					</div>
					<span>{t('app.portal.personalBots')}</span>
					<span className="px-2.5 py-0.5 rounded-full bg-(--accent)/15 text-(--accent) text-xs font-bold">{personalBots.length}</span>
				</div>
				<div className="flex flex-col items-center justify-center w-full">
					{personalBots.length > 0 ? (
						<div className="flex flex-col w-full bg-(--foreground)/30 border border-(--border)/10 rounded-3xl overflow-hidden shadow-sm">
							{personalBots.map((bot) => (
								<BotRow key={bot._id || bot.id} bot={bot} hrefPrefix="/bots" />
							))}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center p-8 bg-(--background)/50 rounded-2xl border border-(--border)/10 border-dashed w-full">
							<Bot className="w-8 h-8 text-(--text-muted) opacity-50 mb-3" />
							<p className="text-sm text-(--text-muted) mb-4">{t('app.portal.noBots')}</p>
							<div className="text-xs text-(--text-muted) bg-(--background) border border-(--border)/20 px-4 py-2 rounded-lg">{t('app.portal.botsAutoRegister')}</div>
						</div>
					)}
				</div>
			</div>

			{/* Managed Discord Servers Card */}
			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-3xl p-8 shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-3 mb-6">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
							<Server className="w-4 h-4" />
						</div>
						<div>
							<div className="flex items-center gap-2 text-(--text) font-extrabold text-sm tracking-widest uppercase">
								<span>{t('app.portal.workspace.managedServersTitle')}</span>
								<span className="px-2.5 py-0.5 rounded-full bg-(--accent)/15 text-(--accent) text-xs font-bold">{guilds.length}</span>
							</div>
							<p className="text-xs text-(--text-muted) mt-0.5">{t('app.portal.workspace.managedServersSubtitle')}</p>
						</div>
					</div>
				</div>

				{guilds.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{guilds.map((guild) => {
							const iconUrl = guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128` : null;
							return (
								<div
									key={guild.id}
									className="flex flex-col justify-between gap-4 p-4 rounded-2xl bg-(--background)/50 hover:bg-(--background)/80 border border-(--border)/10 hover:border-(--accent)/35 transition-all"
								>
									<div className="flex items-center gap-3 min-w-0">
										{iconUrl ? (
											<Image
												src={iconUrl}
												alt={guild.name}
												width={44}
												height={44}
												unoptimized
												className="w-11 h-11 rounded-2xl object-cover border border-(--border)/15 shrink-0"
											/>
										) : (
											<div className="w-11 h-11 rounded-2xl bg-(--foreground) border border-(--border)/15 flex items-center justify-center font-bold text-(--text-muted) shrink-0">
												{String(guild.name || 'S').charAt(0)}
											</div>
										)}
										<div className="min-w-0 flex-1">
											<div className="font-bold text-sm text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
												{guild.name}
											</div>
											<div className="text-[11px] font-mono text-(--text-muted) truncate">{guild.id}</div>
										</div>
									</div>

									<div className="flex items-center gap-2 pt-2 border-t border-(--border)/10">
										<Link href={getEnvUrl(`https://app.xernerx.com/dashboard?guild=${encodeURIComponent(guild.id)}`)} className="flex-1">
											<Button variant="primary" className="w-full justify-center text-xs gap-1.5">
												<Settings className="w-3.5 h-3.5" />
												{t('app.portal.workspace.manageInDashboard')}
											</Button>
										</Link>
										<Link href={getEnvUrl(`https://app.xernerx.com/servers/${encodeURIComponent(guild.id)}`)}>
											<Button variant="secondary" className="text-xs gap-1.5">
												<ExternalLink className="w-3.5 h-3.5" />
												{t('app.portal.workspace.viewServerListing')}
											</Button>
										</Link>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center p-8 bg-(--background)/50 rounded-2xl border border-(--border)/10 border-dashed w-full">
						<Server className="w-8 h-8 text-(--text-muted) opacity-50 mb-3" />
						<p className="text-sm text-(--text-muted)">{t('app.portal.workspace.noManagedServers')}</p>
					</div>
				)}
			</div>
		</div>
	);
}
