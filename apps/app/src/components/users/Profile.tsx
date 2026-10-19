/** @format */
'use client';

import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import Image from 'next/image';
import { User, ShieldCheck, Server, Users, Building2, Sparkles, Clock, Award, Flame } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';

export default function Profile({ user, bots, organizations }: { user: any; bots: any[]; organizations: any[] }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	const totalServers = bots.reduce((acc, bot) => acc + (bot.stats?.guildCount || 0), 0);
	const totalUsers = bots.reduce((acc, bot) => acc + (bot.stats?.userCount || 0), 0);

	const hasDetails = Boolean(user?.pronouns || user?.timezone || user?.level || user?.credits?.streak);

	return (
		<div className="flex flex-col gap-8">
			{user?.info && (
				<div className="prose max-w-none prose-headings:font-fredoka bg-(--foreground)/30 p-8 rounded-3xl border border-(--border)/10 shadow-sm mb-4">
					<ReactMarkdown>{user.info}</ReactMarkdown>
				</div>
			)}

			{!user?.info && bots.length === 0 && organizations.length === 0 && (
				<div className="bg-(--foreground)/30 p-8 rounded-3xl border border-(--border)/10 text-center text-(--text-muted) py-12">{t('app.users.profile.noDetails')}</div>
			)}

			{bots.length > 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
					<div className="bg-(--foreground)/50 border border-(--border)/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-sm">
						<Server className="w-8 h-8 text-(--accent)" />
						<div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{totalServers.toLocaleString()}
						</div>
						<div className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">{t('app.users.profile.totalServers')}</div>
					</div>
					<div className="bg-(--foreground)/50 border border-(--border)/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-sm">
						<Users className="w-8 h-8 text-(--accent)" />
						<div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{totalUsers.toLocaleString()}
						</div>
						<div className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">{t('app.users.profile.totalUsers')}</div>
					</div>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 flex flex-col gap-10">
					{bots.length > 0 && (
						<div className="flex flex-col gap-6">
							<div className="flex items-center gap-3">
								<h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('app.users.profile.publishedBots')}
								</h2>
								<span className="bg-(--accent)/10 text-(--accent) text-xs font-bold px-2 py-1 rounded-md">{bots.length}</span>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{bots.map((bot) => {
									const avatarUrl = bot.discord?.avatar
										? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.discord.avatar}.png?size=128`
										: bot.avatar
											? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png?size=128`
											: null;

									return (
										<Link
											href={`/bots/${bot.id}`}
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
														{bot.verified && <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />}
													</div>
													<div className="flex items-center gap-2 text-xs text-(--text-muted) mt-0.5">
														<span className="flex items-center gap-1">
															<Server className="w-3 h-3" /> {(bot.stats?.guildCount || 0).toLocaleString()}
														</span>
														<span>•</span>
														<span className="flex items-center gap-1">
															<Users className="w-3 h-3" /> {(bot.stats?.userCount || 0).toLocaleString()}
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
								<span className="bg-(--accent)/10 text-(--accent) text-xs font-bold px-2 py-1 rounded-md">{organizations.length}</span>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{organizations.map((org) => {
									const iconSrc = org.iconUrl ? getEnvUrl(org.iconUrl) : org.icon || null;

									return (
										<Link
											href={`/organization/${org._id}`}
											key={org._id}
											className="flex flex-col p-5 rounded-3xl bg-(--foreground)/50 border border-(--border)/10 hover:border-(--accent)/50 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_15%,transparent)] transition-all group"
										>
											<div className="flex items-center gap-4 mb-4">
												<div className="w-12 h-12 rounded-xl border border-(--border)/20 bg-(--background) overflow-hidden shadow-sm flex items-center justify-center shrink-0">
													{iconSrc ? (
														<Image src={iconSrc} alt={org.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
													) : (
														<Building2 className="w-6 h-6 text-(--text-muted)" />
													)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-1">
														<h3 className="font-bold text-lg text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
															{org.name}
														</h3>
														{org.verified && <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />}
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
				</div>

				{hasDetails && (
					<div className="lg:col-span-1 flex flex-col gap-6">
						<div className="bg-(--foreground)/30 p-6 rounded-3xl border border-(--border)/10 shadow-sm flex flex-col gap-4 sticky top-8">
							<div className="flex items-center gap-2 mb-2">
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
								{typeof user?.level === 'number' && user.level > 0 && (
									<div className="flex items-center justify-between p-3 rounded-2xl bg-(--background)/50 border border-(--border)/10">
										<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-2">
											<Award className="w-4 h-4 text-(--accent)" />
											{t('app.users.profile.level')}
										</span>
										<span className="text-sm font-bold text-(--text)">{user.level}</span>
									</div>
								)}
								{typeof user?.credits?.streak === 'number' && user.credits.streak > 0 && (
									<div className="flex items-center justify-between p-3 rounded-2xl bg-(--background)/50 border border-(--border)/10">
										<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-2">
											<Flame className="w-4 h-4 text-orange-500" />
											{t('app.users.profile.streak')}
										</span>
										<span className="text-sm font-bold text-(--text)">{t('app.users.profile.days', { count: user.credits.streak })}</span>
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
