/** @format */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Award, Bot, ChevronRight, ChevronUp, Rocket, Server, Shield, ShieldCheck, User, Users } from 'lucide-react';
import { UserProfilePopover } from '@xernerx/components';
import { useDictionary } from '@xernerx/providers';
import { Markdown } from '@xernerx/ui';

const SERVER_MILESTONE_TIERS = [10000, 5000, 1000, 500, 250, 100, 50, 10] as const;

export default function Profile({ organization, bots, servers }: { organization: any; bots: any[]; servers: any[] }) {
	const { t } = useDictionary();
	const totalServers = bots.reduce((acc, bot) => acc + Number(bot.guildCount ?? bot.stats?.guildCount ?? bot.latestStat?.guildCount ?? 0), 0);
	const totalUsers = bots.reduce((acc, bot) => acc + Number(bot.userCount ?? bot.stats?.userCount ?? bot.latestStat?.userCount ?? 0), 0);
	const totalVotes =
		bots.reduce((acc, bot) => acc + Number(bot.voteCount ?? bot.stats?.voteCount ?? bot.latestStat?.voteCount ?? 0), 0) + servers.reduce((acc, srv) => acc + Number(srv.voteCount ?? 0), 0);
	const totalAssets = bots.length + servers.length;

	const recentReleases = bots
		.flatMap((bot) => {
			const botName = bot.discord?.global_name || bot.discord?.username || bot.name || t('common.unknownBot');
			const botSlug = bot.vanitySlug || bot.id;
			const releases = Array.isArray(bot.releases) ? bot.releases : [];
			return releases.map((rel: any) => ({
				botId: bot.id,
				botName,
				botSlug,
				version: rel.version || 'v1.0.0',
				title: rel.title || rel.version || 'Update',
				body: rel.body || rel.description || '',
				createdAt: rel.createdAt ? new Date(rel.createdAt).getTime() : 0,
			}));
		})
		.sort((a, b) => b.createdAt - a.createdAt)
		.slice(0, 4);

	const unlockedMilestones = bots
		.map((bot) => {
			const guilds = Number(bot.guildCount ?? bot.stats?.guildCount ?? bot.latestStat?.guildCount ?? 0);
			const highestTier = SERVER_MILESTONE_TIERS.find((tier) => guilds >= tier);
			if (!highestTier) return null;
			return {
				botId: bot.id,
				botName: bot.discord?.global_name || bot.discord?.username || bot.name || t('common.unknownBot'),
				botSlug: bot.vanitySlug || bot.id,
				tier: highestTier,
				guilds,
			};
		})
		.filter(Boolean) as { botId: string; botName: string; botSlug: string; tier: number; guilds: number }[];

	return (
		<div className="flex flex-col gap-8">
			{/* Organization Info Markdown - Now at the top */}
			{organization.info && (
				<div className="bg-(--foreground)/30 backdrop-blur-md p-8 rounded-3xl border border-(--border)/10 shadow-sm mb-4">
					<Markdown>{organization.info}</Markdown>
				</div>
			)}

			{!organization.info && bots.length === 0 && servers.length === 0 && (
				<div className="bg-(--foreground)/30 p-8 rounded-3xl border border-(--border)/10 text-center text-(--text-muted) py-12">{t('app.organization.profile.noDetails')}</div>
			)}

			{/* Aggregated Top Stats */}
			{(bots.length > 0 || servers.length > 0) && (
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="bg-(--foreground)/50 border border-(--border)/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-2.5 backdrop-blur-md shadow-sm">
						<Server className="w-7 h-7 text-(--accent)" />
						<div className="text-3xl font-bold font-mono" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{totalServers.toLocaleString()}
						</div>
						<div className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('app.organization.profile.totalServers')}</div>
					</div>
					<div className="bg-(--foreground)/50 border border-(--border)/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-2.5 backdrop-blur-md shadow-sm">
						<Users className="w-7 h-7 text-(--accent)" />
						<div className="text-3xl font-bold font-mono" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{totalUsers.toLocaleString()}
						</div>
						<div className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('app.organization.profile.totalUsers')}</div>
					</div>
					<div className="bg-(--foreground)/50 border border-(--border)/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-2.5 backdrop-blur-md shadow-sm">
						<ChevronUp className="w-7 h-7 text-(--accent)" />
						<div className="text-3xl font-bold font-mono" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{totalVotes.toLocaleString()}
						</div>
						<div className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('app.organization.profile.combinedVotes')}</div>
					</div>
					<div className="bg-(--foreground)/50 border border-(--border)/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-2.5 backdrop-blur-md shadow-sm">
						<Bot className="w-7 h-7 text-(--accent)" />
						<div className="text-3xl font-bold font-mono" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{totalAssets.toLocaleString()}
						</div>
						<div className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('app.organization.profile.publishedAssets')}</div>
					</div>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 flex flex-col gap-10">
					{bots.length > 0 && (
						<div className="flex flex-col gap-6">
							<div className="flex items-center gap-3">
								<h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('app.organization.profile.publishedBots')}
								</h2>
								<span className="bg-(--accent)/10 text-(--accent) text-xs font-bold px-2 py-1 rounded-xl">{bots.length}</span>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{bots.map((bot) => {
									const avatarUrl =
										bot.discord?.avatarUrl ||
										(bot.discord?.avatar
											? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.discord.avatar}.png?size=128`
											: bot.avatar
												? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png?size=128`
												: null);

									return (
										<Link
											href={`/bots/${bot.vanitySlug || bot.id}`}
											key={bot.id}
											className="flex flex-col p-5 rounded-3xl bg-(--foreground)/50 border border-(--border)/10 hover:border-(--accent)/50 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_15%,transparent)] transition-all group"
										>
											<div className="flex items-center gap-4 mb-4">
												{avatarUrl ? (
													<Image
														src={avatarUrl}
														alt={bot.name || t('app.bots.avatarAlt')}
														width={48}
														height={48}
														className="rounded-xl shadow-sm border border-(--border)/20"
													/>
												) : (
													<div className="w-12 h-12 rounded-xl bg-(--background) border border-(--border)/20 flex items-center justify-center text-(--text-muted) shadow-sm">
														<User className="w-6 h-6" />
													</div>
												)}
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-1">
														<h3 className="font-bold text-lg text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
															{bot.discord?.global_name || bot.discord?.username || bot.name || t('common.unknownBot')}
														</h3>
														{bot.verified && <ShieldCheck className="w-4 h-4 text-(--accent-green) flex-shrink-0" />}
													</div>
													<div className="flex items-center gap-2 text-xs text-(--text-muted) mt-0.5">
														<span className="flex items-center gap-1">
															<Server className="w-3 h-3" /> {Number(bot.guildCount ?? bot.stats?.guildCount ?? bot.latestStat?.guildCount ?? 0).toLocaleString()}
														</span>
														<span>•</span>
														<span className="flex items-center gap-1">
															<Users className="w-3 h-3" /> {Number(bot.userCount ?? bot.stats?.userCount ?? bot.latestStat?.userCount ?? 0).toLocaleString()}
														</span>
													</div>
												</div>
											</div>
											<p className="text-sm text-(--text-muted) line-clamp-2">{bot.description || t('common.noDescription')}</p>
										</Link>
									);
								})}
							</div>
						</div>
					)}

					{servers.length > 0 && (
						<div className="flex flex-col gap-6">
							<div className="flex items-center gap-3">
								<h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('app.organization.profile.officialServers')}
								</h2>
								<span className="bg-(--accent)/10 text-(--accent) text-xs font-bold px-2 py-1 rounded-xl">{servers.length}</span>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{servers.map((server) => {
									const avatarUrl = server.iconUrl || (server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=128` : null);

									return (
										<Link
											href={`/servers/${server.vanitySlug || server.id}`}
											key={server.id}
											className="flex flex-col p-5 rounded-3xl bg-(--foreground)/50 border border-(--border)/10 hover:border-(--accent)/50 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_15%,transparent)] transition-all group"
										>
											<div className="flex items-center gap-4 mb-4">
												<div className="w-12 h-12 rounded-xl border border-(--border)/20 bg-(--background) overflow-hidden shadow-sm flex items-center justify-center shrink-0">
													{avatarUrl ? (
														<Image src={avatarUrl} alt={server.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
													) : (
														<div className="text-lg font-bold text-(--text-muted)">{server.name.charAt(0)}</div>
													)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-1">
														<h3 className="font-bold text-lg text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
															{server.name}
														</h3>
													</div>
													<div className="flex items-center gap-2 text-xs text-(--text-muted) mt-0.5">
														<span className="flex items-center gap-1">
															<Users className="w-3 h-3" /> {(server.memberCount || 0).toLocaleString()}
														</span>
													</div>
												</div>
											</div>
											<p className="text-sm text-(--text-muted) line-clamp-2">{server.description || t('common.noDescription')}</p>
										</Link>
									);
								})}
							</div>
						</div>
					)}

					{/* Recent Releases & Milestones Feed */}
					{(recentReleases.length > 0 || unlockedMilestones.length > 0) && (
						<div className="flex flex-col gap-5 p-6 rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 flex items-center justify-center shrink-0">
									<Rocket className="w-5 h-5" />
								</div>
								<div>
									<h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
										{t('app.organization.profile.recentActivityTitle')}
									</h2>
									<p className="text-xs text-(--text-muted)">{t('app.organization.profile.recentActivitySubtitle')}</p>
								</div>
							</div>

							{unlockedMilestones.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{unlockedMilestones.map((ms) => (
										<Link
											key={`ms-${ms.botId}`}
											href={`/bots/${ms.botSlug}?view=milestones`}
											className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-(--accent)/10 hover:bg-(--accent)/20 border border-(--accent)/25 text-xs font-bold text-(--accent) transition-colors"
										>
											<Award className="w-3.5 h-3.5" />
											<span>{ms.botName}</span>
											<span>•</span>
											<span>{t('app.organization.profile.milestoneUnlocked', { count: ms.tier.toLocaleString() })}</span>
										</Link>
									))}
								</div>
							)}

							{recentReleases.length > 0 && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									{recentReleases.map((rel, idx) => (
										<Link
											key={`${rel.botId}-${rel.version}-${idx}`}
											href={`/bots/${rel.botSlug}?view=releases`}
											className="flex flex-col justify-between gap-2 p-4 rounded-2xl bg-(--background)/50 hover:bg-(--background)/80 border border-(--border)/10 hover:border-(--accent)/35 transition-all group"
										>
											<div className="flex items-center justify-between gap-2">
												<span className="text-xs font-extrabold text-(--text) group-hover:text-(--accent) transition-colors truncate">{rel.botName}</span>
												<span className="px-2 py-0.5 rounded-full bg-(--accent)/15 text-(--accent) border border-(--accent)/25 text-[10px] font-mono font-bold">
													{t('app.organization.profile.releaseBadge', { version: rel.version })}
												</span>
											</div>
											<div className="text-sm font-bold text-(--text) truncate">{rel.title}</div>
											{rel.body && <p className="text-xs text-(--text-muted) line-clamp-2">{rel.body}</p>}
											<div className="flex items-center justify-between text-[11px] text-(--text-muted) pt-1">
												<span>{rel.createdAt ? new Date(rel.createdAt).toLocaleDateString() : ''}</span>
												<ChevronRight className="w-3.5 h-3.5 text-(--accent) opacity-0 group-hover:opacity-100 transition-opacity" />
											</div>
										</Link>
									))}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Right Sidebar: Team Members */}
				<div className="lg:col-span-1 flex flex-col gap-6">
					<div className="bg-(--foreground)/30 p-6 rounded-3xl border border-(--border)/10 shadow-sm flex flex-col gap-4 sticky top-8">
						<div className="flex items-center gap-2 mb-2">
							<Shield className="w-5 h-5 text-(--accent)" />
							<h3 className="text-xl font-bold" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.organization.profile.theTeam')}
							</h3>
						</div>

						{organization.membersData && organization.membersData.length > 0 ? (
							<div className="flex flex-col gap-6">
								{/* Extract owner */}
								{(() => {
									const owner = organization.membersData.find((m: any) => m.id === organization.owner);
									if (!owner) return null;
									return (
										<div className="flex flex-col gap-2">
											<div className="text-xs font-bold text-(--text-muted) uppercase tracking-widest px-2">{t('app.organization.profile.owner')}</div>
											<UserProfilePopover userId={owner.id} initialUser={owner} className="w-full">
												<div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-(--background) border border-transparent hover:border-(--border)/10 transition-colors group w-full">
													<Image
														src={
															owner.avatarUrl ||
															(owner.avatar
																? `https://cdn.discordapp.com/avatars/${owner.id}/${owner.avatar}.png?size=64`
																: `https://cdn.discordapp.com/embed/avatars/${Number(owner.discriminator || 0) % 5}.png`)
														}
														alt={owner.global_name || owner.username || owner.id}
														width={40}
														height={40}
														unoptimized
														className="rounded-full shadow-sm group-hover:ring-2 group-hover:ring-(--accent)/50 transition-all"
													/>
													<div className="flex flex-col min-w-0">
														<span className="text-sm font-bold text-(--text) group-hover:text-(--accent) transition-colors truncate">
															{owner.global_name || owner.username || owner.id}
														</span>
													</div>
												</div>
											</UserProfilePopover>
										</div>
									);
								})()}

								{/* Extract groups by role */}
								{(organization.roles || []).map((role: any) => {
									const roleMembers = organization.membersData.filter((m: any) => m.id !== organization.owner && m.roles?.includes(role.id));
									if (roleMembers.length === 0) return null;

									return (
										<div key={role.id} className="flex flex-col gap-2">
											<div className="text-xs font-bold text-(--text-muted) uppercase tracking-widest px-2">{role.name}</div>
											{roleMembers.map((member: any) => (
												<UserProfilePopover key={member.id} userId={member.id} initialUser={member} className="w-full">
													<div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-(--background) border border-transparent hover:border-(--border)/10 transition-colors group w-full">
														<Image
															src={
																member.avatarUrl ||
																(member.avatar
																	? `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=64`
																	: `https://cdn.discordapp.com/embed/avatars/${Number(member.discriminator || 0) % 5}.png`)
															}
															alt={member.global_name || member.username || member.id}
															width={40}
															height={40}
															unoptimized
															className="rounded-full shadow-sm group-hover:ring-2 group-hover:ring-(--accent)/50 transition-all"
														/>
														<div className="flex flex-col min-w-0">
															<span className="text-sm font-bold text-(--text) group-hover:text-(--accent) transition-colors truncate">
																{member.global_name || member.username || member.id}
															</span>
														</div>
													</div>
												</UserProfilePopover>
											))}
										</div>
									);
								})}

								{/* Unassigned Members */}
								{(() => {
									const unassignedMembers = organization.membersData.filter((m: any) => m.id !== organization.owner && (!m.roles || m.roles.length === 0));
									if (unassignedMembers.length === 0) return null;

									return (
										<div className="flex flex-col gap-2">
											<div className="text-xs font-bold text-(--text-muted) uppercase tracking-widest px-2">{t('app.organization.profile.members')}</div>
											{unassignedMembers.map((member: any) => (
												<UserProfilePopover key={member.id} userId={member.id} initialUser={member} className="w-full">
													<div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-(--background) border border-transparent hover:border-(--border)/10 transition-colors group w-full">
														<Image
															src={
																member.avatarUrl ||
																(member.avatar
																	? `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=64`
																	: `https://cdn.discordapp.com/embed/avatars/${Number(member.discriminator || 0) % 5}.png`)
															}
															alt={member.global_name || member.username || member.id}
															width={40}
															height={40}
															unoptimized
															className="rounded-full shadow-sm group-hover:ring-2 group-hover:ring-(--accent)/50 transition-all"
														/>
														<div className="flex flex-col min-w-0">
															<span className="text-sm font-bold text-(--text) group-hover:text-(--accent) transition-colors truncate">
																{member.global_name || member.username || member.id}
															</span>
														</div>
													</div>
												</UserProfilePopover>
											))}
										</div>
									);
								})()}
							</div>
						) : (
							<div className="text-sm text-(--text-muted)">{t('app.organization.profile.noMembers')}</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
