/** @format */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, ShieldCheck, Server, Users, Building2, Sparkles, Clock, Award, Flame, Globe, ExternalLink, CheckCircle2, Bot } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Markdown } from '@xernerx/ui';
import SafeAvatar from '@/components/SafeAvatar';
import { normalizeUserConnection, normalizeUserShowcase, resolveUserLevelAndXp, type NormalizedUserConnection, type NormalizedUserShowcase } from './userProfileHelpers';

function ShowcaseImage({ src, alt }: { src: string; alt: string }) {
	const [failed, setFailed] = useState(false);
	if (failed) return null;
	return (
		<div className="h-36 w-full rounded-2xl overflow-hidden border border-(--border)/15 bg-(--background)/50">
			<img src={src} alt={alt} className="h-full w-full object-cover" onError={() => setFailed(true)} />
		</div>
	);
}

export default function Profile({ user, bots, organizations, servers = [] }: { user: any; bots: any[]; organizations: any[]; servers?: any[] }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	const { level: resolvedLevel, xp: resolvedXp } = resolveUserLevelAndXp(user);
	const streakCount = Math.max(0, Number(user?.credits?.streak || 0) || 0);
	const formattedStreak = streakCount === 1 ? t('app.users.profile.daySingular', { count: 1 }) : t('app.users.profile.days', { count: streakCount.toLocaleString() });

	const totalServers = bots.reduce((acc, bot) => acc + (bot.guildCount ?? bot.stats?.guildCount ?? bot.latestStat?.guildCount ?? 0), 0);
	const totalUsers = bots.reduce((acc, bot) => acc + (bot.userCount ?? bot.stats?.userCount ?? bot.latestStat?.userCount ?? 0), 0);
	const totalGuildMembers = servers.reduce((acc, srv) => acc + (srv.memberCount || 0), 0);
	const combinedReach = totalUsers + totalGuildMembers;

	const publicConnections: NormalizedUserConnection[] = (Array.isArray(user?.connections) ? user.connections : [])
		.filter((c: any) => c && c.showOnProfile !== false && c.provider !== 'easypanel' && c.provider !== 'ssh' && c.provider !== 'vercel')
		.map((c: any) => normalizeUserConnection(c));

	const showcases: NormalizedUserShowcase[] = (Array.isArray(user?.showcases) ? user.showcases : []).filter(Boolean).map((sc: any, idx: number) => normalizeUserShowcase(sc, idx, getEnvUrl));

	const hasDetails = Boolean(user?.pronouns || user?.timezone || resolvedLevel > 1 || resolvedXp > 0 || streakCount > 0 || publicConnections.length > 0);

	return (
		<div className="flex flex-col gap-8">
			{/* Universal 4-Card User KPI Strip */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="bg-(--foreground)/40 border border-(--border)/10 p-5 rounded-3xl flex flex-col justify-between gap-2 backdrop-blur-md shadow-sm">
					<div className="flex items-center justify-between">
						<span className="text-xs font-extrabold uppercase tracking-wider text-(--text-muted)">{t('app.users.profile.kpi.globalLevel')}</span>
						<div className="w-8 h-8 rounded-2xl bg-(--accent)/15 border border-(--accent)/25 flex items-center justify-center text-(--accent)">
							<Award className="w-4 h-4" />
						</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							Lv. {resolvedLevel.toLocaleString()}
						</div>
						<div className="text-xs text-(--text-muted) mt-0.5">{t('app.users.profile.kpi.xpProgress', { xp: resolvedXp.toLocaleString() })}</div>
					</div>
				</div>

				<div className="bg-(--foreground)/40 border border-(--border)/10 p-5 rounded-3xl flex flex-col justify-between gap-2 backdrop-blur-md shadow-sm">
					<div className="flex items-center justify-between">
						<span className="text-xs font-extrabold uppercase tracking-wider text-(--text-muted)">{t('app.users.profile.kpi.dailyStreak')}</span>
						<div className="w-8 h-8 rounded-2xl bg-(--accent)/15 border border-(--accent)/25 flex items-center justify-center text-(--accent)">
							<Flame className="w-4 h-4" />
						</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{formattedStreak}
						</div>
						<div className="text-xs text-(--text-muted) mt-0.5">{t('app.users.profile.kpi.streakActive')}</div>
					</div>
				</div>

				<div className="bg-(--foreground)/40 border border-(--border)/10 p-5 rounded-3xl flex flex-col justify-between gap-2 backdrop-blur-md shadow-sm">
					<div className="flex items-center justify-between">
						<span className="text-xs font-extrabold uppercase tracking-wider text-(--text-muted)">{t('app.users.profile.kpi.publishedAssets')}</span>
						<div className="w-8 h-8 rounded-2xl bg-(--accent)/15 border border-(--accent)/25 flex items-center justify-center text-(--accent)">
							<Server className="w-4 h-4" />
						</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{(bots.length + servers.length).toLocaleString()}
						</div>
						<div className="text-xs text-(--text-muted) mt-0.5">{t('app.users.profile.kpi.botsAndServersSub', { bots: bots.length, servers: servers.length })}</div>
					</div>
				</div>

				<div className="bg-(--foreground)/40 border border-(--border)/10 p-5 rounded-3xl flex flex-col justify-between gap-2 backdrop-blur-md shadow-sm">
					<div className="flex items-center justify-between">
						<span className="text-xs font-extrabold uppercase tracking-wider text-(--text-muted)">
							{bots.length > 0 ? t('app.users.profile.totalServers') : t('app.users.profile.kpi.communityReach')}
						</span>
						<div className="w-8 h-8 rounded-2xl bg-(--accent)/15 border border-(--accent)/25 flex items-center justify-center text-(--accent)">
							<Users className="w-4 h-4" />
						</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{bots.length > 0 ? totalServers.toLocaleString() : combinedReach > 0 ? combinedReach.toLocaleString() : (organizations.length + publicConnections.length).toLocaleString()}
						</div>
						<div className="text-xs text-(--text-muted) mt-0.5">
							{bots.length > 0
								? `${totalUsers.toLocaleString()} ${t('app.users.profile.totalUsers')}`
								: t('app.users.profile.kpi.orgsAndReachSub', { orgs: organizations.length, connections: publicConnections.length })}
						</div>
					</div>
				</div>
			</div>

			{user?.info && (
				<div className="bg-(--foreground)/30 backdrop-blur-md p-8 rounded-3xl border border-(--border)/10 shadow-sm mb-4">
					<Markdown>{user.info}</Markdown>
				</div>
			)}

			{!user?.info && showcases.length === 0 && bots.length === 0 && organizations.length === 0 && servers.length === 0 && !hasDetails && (
				<div className="bg-(--foreground)/30 backdrop-blur-md p-8 rounded-3xl border border-(--border)/10 text-center text-(--text-muted) py-12">{t('app.users.profile.noDetails')}</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 flex flex-col gap-10">
					{showcases.length > 0 && (
						<div className="flex flex-col gap-6">
							<div className="flex items-center gap-3">
								<h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('account.profile.showcases.title')}
								</h2>
								<span className="bg-(--accent)/15 text-(--accent) border border-(--accent)/25 text-xs font-bold px-2.5 py-0.5 rounded-full">{showcases.length}</span>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{showcases.map((sc) => {
									const CardWrapper: any = sc.href ? 'a' : 'div';
									const wrapperProps = sc.href ? { href: sc.href, target: '_blank', rel: 'noopener noreferrer' } : {};
									return (
										<CardWrapper
											key={sc.id}
											{...wrapperProps}
											className="flex flex-col justify-between p-5 rounded-3xl bg-(--foreground)/40 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/50 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_15%,transparent)] transition-all group"
										>
											<div className="flex flex-col gap-3">
												{sc.imageUrl && <ShowcaseImage src={sc.imageUrl} alt={sc.title} />}
												<div className="flex items-start justify-between gap-2">
													<h3
														className="font-bold text-lg text-(--text) group-hover:text-(--accent) transition-colors truncate"
														style={{ fontFamily: 'var(--font-fredoka)' }}
													>
														{sc.title}
													</h3>
													{sc.tag && (
														<span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
															{sc.tag}
														</span>
													)}
												</div>
												{sc.description && <p className="text-sm text-(--text-muted) line-clamp-3">{sc.description}</p>}
											</div>
											{sc.href && (
												<div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-(--border)/10">
													<span className="inline-flex items-center gap-1.5 text-xs font-mono text-(--text-muted) truncate min-w-0">
														<Globe size={12} className="text-(--accent) shrink-0" />
														<span className="truncate">{sc.displayHost || sc.title}</span>
													</span>
													<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-(--accent)/15 text-(--accent) border border-(--accent)/25 text-[11px] font-bold group-hover:bg-(--accent) group-hover:text-(--accent-contrast) transition-colors shrink-0">
														<span>{t('common.sidebarnotifications.button5')}</span>
														<ExternalLink size={11} />
													</span>
												</div>
											)}
										</CardWrapper>
									);
								})}
							</div>
						</div>
					)}

					{bots.length > 0 && (
						<div className="flex flex-col gap-6">
							<div className="flex items-center gap-3">
								<h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('app.users.profile.publishedBots')}
								</h2>
								<span className="bg-(--accent)/15 text-(--accent) border border-(--accent)/25 text-xs font-bold px-2.5 py-0.5 rounded-full">{bots.length}</span>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{bots.map((bot) => {
									const avatarUrl =
										bot.discord?.avatarUrl ||
										(bot.discord?.avatar
											? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.discord.avatar}.png?size=128`
											: bot.avatar
												? String(bot.avatar).startsWith('http')
													? bot.avatar
													: `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png?size=128`
												: null);

									return (
										<Link
											href={`/bots/${bot.vanitySlug || bot.id}`}
											key={bot.id}
											className="flex flex-col p-5 rounded-3xl bg-(--foreground)/40 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/50 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_15%,transparent)] transition-all group"
										>
											<div className="flex items-center gap-4 mb-4">
												<SafeAvatar
													src={avatarUrl}
													alt={bot.name || t('app.bots.avatarAlt')}
													width={48}
													height={48}
													className="w-12 h-12 rounded-2xl shadow-sm border border-(--border)/20 object-cover shrink-0"
													fallback={
														<div className="w-12 h-12 rounded-2xl bg-(--background) border border-(--border)/20 flex items-center justify-center text-(--text-muted) shadow-sm shrink-0">
															<Bot className="w-6 h-6" />
														</div>
													}
												/>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-1">
														<h3
															className="font-bold text-lg text-(--text) group-hover:text-(--accent) transition-colors truncate"
															style={{ fontFamily: 'var(--font-fredoka)' }}
														>
															{bot.discord?.global_name || bot.discord?.username || bot.name || t('common.unknownBot')}
														</h3>
														{bot.verified && <ShieldCheck className="w-4 h-4 text-(--accent-green) shrink-0" />}
													</div>
													<div className="flex items-center gap-2 text-xs text-(--text-muted) mt-0.5">
														<span className="flex items-center gap-1">
															<Server className="w-3 h-3 text-(--accent)" />{' '}
															{(bot.guildCount ?? bot.stats?.guildCount ?? bot.latestStat?.guildCount ?? 0).toLocaleString()}
														</span>
														<span>•</span>
														<span className="flex items-center gap-1">
															<Users className="w-3 h-3 text-(--accent)" /> {(bot.userCount ?? bot.stats?.userCount ?? bot.latestStat?.userCount ?? 0).toLocaleString()}
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

					{organizations.length > 0 && (
						<div className="flex flex-col gap-6">
							<div className="flex items-center gap-3">
								<h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('app.users.profile.organizations')}
								</h2>
								<span className="bg-(--accent)/15 text-(--accent) border border-(--accent)/25 text-xs font-bold px-2.5 py-0.5 rounded-full">{organizations.length}</span>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{organizations.map((org) => {
									const iconSrc = org.iconUrl ? getEnvUrl(org.iconUrl) : org.icon || null;

									return (
										<Link
											href={`/organization/${org.vanitySlug || org._id}`}
											key={org._id}
											className="flex flex-col p-5 rounded-3xl bg-(--foreground)/40 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/50 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_15%,transparent)] transition-all group"
										>
											<div className="flex items-center gap-4 mb-4">
												<div className="w-12 h-12 rounded-2xl border border-(--border)/20 bg-(--background) overflow-hidden shadow-sm flex items-center justify-center shrink-0">
													<SafeAvatar
														src={iconSrc}
														alt={org.name}
														width={48}
														height={48}
														className="w-full h-full object-cover"
														fallback={<Building2 className="w-6 h-6 text-(--text-muted)" />}
													/>
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-1">
														<h3
															className="font-bold text-lg text-(--text) group-hover:text-(--accent) transition-colors truncate"
															style={{ fontFamily: 'var(--font-fredoka)' }}
														>
															{org.name}
														</h3>
														{org.verified && <ShieldCheck className="w-4 h-4 text-(--accent-green) shrink-0" />}
													</div>
												</div>
											</div>
											<p className="text-sm text-(--text-muted) line-clamp-2">{org.description || t('common.noDescription')}</p>
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
									{t('app.users.profile.officialServers')}
								</h2>
								<span className="bg-(--accent)/15 text-(--accent) border border-(--accent)/25 text-xs font-bold px-2.5 py-0.5 rounded-full">{servers.length}</span>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{servers.map((server) => {
									const iconSrc = server.iconUrl ? getEnvUrl(server.iconUrl) : server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=128` : null;

									return (
										<Link
											href={`/servers/${server.vanitySlug || server.id}`}
											key={server.id}
											className="flex flex-col p-5 rounded-3xl bg-(--foreground)/40 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/50 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_15%,transparent)] transition-all group"
										>
											<div className="flex items-center gap-4 mb-4">
												<div className="w-12 h-12 rounded-2xl border border-(--border)/20 bg-(--background) overflow-hidden shadow-sm flex items-center justify-center shrink-0">
													<SafeAvatar
														src={iconSrc}
														alt={server.name}
														width={48}
														height={48}
														className="w-full h-full object-cover"
														fallback={<Server className="w-6 h-6 text-(--text-muted)" />}
													/>
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-1">
														<h3
															className="font-bold text-lg text-(--text) group-hover:text-(--accent) transition-colors truncate"
															style={{ fontFamily: 'var(--font-fredoka)' }}
														>
															{server.name}
														</h3>
														{server.verified && <ShieldCheck className="w-4 h-4 text-(--accent-green) shrink-0" />}
													</div>
													<div className="flex items-center gap-2 text-xs text-(--text-muted) mt-0.5">
														<span className="flex items-center gap-1">
															<Users className="w-3 h-3 text-(--accent)" /> {(server.memberCount || 0).toLocaleString()}
														</span>
														<span>•</span>
														<span className="flex items-center gap-1">
															<Sparkles className="w-3 h-3 text-(--accent)" /> {t('app.users.profile.votesCount', { count: (server.voteCount || 0).toLocaleString() })}
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
				</div>

				{hasDetails && (
					<div className="lg:col-span-1 flex flex-col gap-6">
						<div className="bg-(--foreground)/30 backdrop-blur-md p-6 rounded-3xl border border-(--border)/10 shadow-sm flex flex-col gap-5 sticky top-8">
							<div className="flex items-center gap-2">
								<Sparkles className="w-5 h-5 text-(--accent)" />
								<h3 className="text-xl font-bold" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('app.users.profile.information')}
								</h3>
							</div>

							<div className="flex flex-col gap-3">
								{user?.pronouns && (
									<div className="flex items-center justify-between p-3 rounded-2xl bg-(--background)/50 border border-(--border)/10">
										<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-2">
											<User className="w-4 h-4 text-(--accent)" />
											{t('app.users.profile.pronouns')}
										</span>
										<span className="text-sm font-bold text-(--text)">{user.pronouns}</span>
									</div>
								)}
								{user?.timezone && (
									<div className="flex items-center justify-between p-3 rounded-2xl bg-(--background)/50 border border-(--border)/10">
										<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-2">
											<Clock className="w-4 h-4 text-(--accent)" />
											{t('app.users.profile.timezone')}
										</span>
										<span className="text-sm font-bold text-(--text) font-mono">{user.timezone}</span>
									</div>
								)}
								{(resolvedLevel > 1 || resolvedXp > 0) && (
									<div className="flex items-center justify-between p-3 rounded-2xl bg-(--background)/50 border border-(--border)/10">
										<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-2">
											<Award className="w-4 h-4 text-(--accent)" />
											{t('app.users.profile.level')}
										</span>
										<span className="text-sm font-bold text-(--text)">Lv. {resolvedLevel.toLocaleString()}</span>
									</div>
								)}
								{streakCount > 0 && (
									<div className="flex items-center justify-between p-3 rounded-2xl bg-(--background)/50 border border-(--border)/10">
										<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-2">
											<Flame className="w-4 h-4 text-(--accent)" />
											{t('app.users.profile.streak')}
										</span>
										<span className="text-sm font-bold text-(--text)">{formattedStreak}</span>
									</div>
								)}
							</div>

							{publicConnections.length > 0 && (
								<div className="flex flex-col gap-2 pt-3 border-t border-(--border)/10">
									<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('account.connections.title')}</span>
									<div className="flex flex-col gap-2">
										{publicConnections.map((conn) => {
											const IconComp = conn.icon;
											const RowTag: any = conn.href ? 'a' : 'div';
											const rowProps = conn.href ? { href: conn.href, target: '_blank', rel: 'noopener noreferrer' } : {};
											return (
												<RowTag
													key={conn.key}
													{...rowProps}
													className={`flex items-center justify-between p-2.5 rounded-2xl bg-(--background)/50 border border-(--border)/10 text-xs font-medium text-(--text) transition-all ${
														conn.href ? 'hover:border-(--accent)/40' : ''
													}`}
												>
													<span className="flex items-center gap-2 truncate min-w-0">
														<IconComp size={14} className="text-(--accent) shrink-0" />
														<span className="font-semibold shrink-0">{conn.label}:</span>
														<span className="truncate text-(--text-muted)">{conn.handle}</span>
														<CheckCircle2 size={12} className="text-(--accent-green) shrink-0" />
													</span>
													{conn.href && <ExternalLink size={12} className="text-(--text-muted) shrink-0" />}
												</RowTag>
											);
										})}
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
