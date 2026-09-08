'use client';

import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import Image from 'next/image';
import { User, ShieldCheck, ChevronRight, Server, Users, TrendingUp, Shield, Image as ImageIcon } from 'lucide-react';

export default function Profile({ organization, bots, servers }: { organization: any; bots: any[]; servers: any[] }) {
	const totalServers = bots.reduce((acc, bot) => acc + (bot.stats?.guildCount || 0), 0);
	const totalUsers = bots.reduce((acc, bot) => acc + (bot.stats?.userCount || 0), 0);
	const totalValuation = bots.reduce((acc, bot) => {
		const baseline = (bot.stats?.guildCount || 0) * 0.1 + (bot.stats?.userCount || 0) * 0.001;
		return acc + baseline;
	}, 0);

	return (
		<div className="flex flex-col gap-8">
			{/* Organization Info Markdown - Now at the top */}
			{organization.info && (
				<div className="prose max-w-none prose-headings:font-fredoka bg-(--foreground)/30 p-8 rounded-3xl border border-(--border)/10 shadow-sm mb-4">
					<ReactMarkdown>{organization.info}</ReactMarkdown>
				</div>
			)}

			{!organization.info && bots.length === 0 && servers.length === 0 && (
				<div className="bg-(--foreground)/30 p-8 rounded-3xl border border-(--border)/10 text-center text-(--text-muted) py-12">
					This organization has not provided any details or published any resources yet.
				</div>
			)}

			{/* Aggregated Top Stats */}
			{(bots.length > 0 || servers.length > 0) && (
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
					<div className="bg-(--foreground)/50 border border-(--border)/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-sm">
						<Server className="w-8 h-8 text-(--accent)" />
						<div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{totalServers.toLocaleString()}
						</div>
						<div className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">Total Servers</div>
					</div>
					<div className="bg-(--foreground)/50 border border-(--border)/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-sm">
						<Users className="w-8 h-8 text-(--accent)" />
						<div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{totalUsers.toLocaleString()}
						</div>
						<div className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">Total Users</div>
					</div>
					<div className="bg-(--foreground)/50 border border-(--border)/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-sm">
						<TrendingUp className="w-8 h-8 text-(--accent)" />
						<div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-fredoka)' }}>
							${Math.round(totalValuation).toLocaleString()}
						</div>
						<div className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">Est. Network Value</div>
					</div>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 flex flex-col gap-10">
					{bots.length > 0 && (
						<div className="flex flex-col gap-6">
							<div className="flex items-center gap-3">
								<h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
									Published Bots
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
													<Image src={avatarUrl} alt={bot.name || 'Bot Avatar'} width={48} height={48} className="rounded-xl shadow-sm border border-(--border)/20" />
												) : (
													<div className="w-12 h-12 rounded-xl bg-(--background) border border-(--border)/20 flex items-center justify-center text-(--text-muted) shadow-sm">
														<User className="w-6 h-6" />
													</div>
												)}
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-1">
														<h3 className="font-bold text-lg text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
															{bot.discord?.global_name || bot.discord?.username || bot.name || 'Unknown Bot'}
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
											<p className="text-sm text-(--text-muted) line-clamp-2">{bot.description || 'No description provided.'}</p>
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
									Official Servers
								</h2>
								<span className="bg-(--accent)/10 text-(--accent) text-xs font-bold px-2 py-1 rounded-md">{servers.length}</span>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{servers.map((server) => {
									const avatarUrl = server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=128` : null;

									return (
										<Link
											href={`/servers/${server.id}`}
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
											<p className="text-sm text-(--text-muted) line-clamp-2">{server.description || 'No description provided.'}</p>
										</Link>
									);
								})}
							</div>
						</div>
					)}
				</div>

				{/* Right Sidebar: Team Members */}
				<div className="lg:col-span-1 flex flex-col gap-6">
					<div className="bg-(--foreground)/30 p-6 rounded-3xl border border-(--border)/10 shadow-sm flex flex-col gap-4 sticky top-8">
						<div className="flex items-center gap-2 mb-2">
							<Shield className="w-5 h-5 text-(--accent)" />
							<h3 className="text-xl font-bold" style={{ fontFamily: 'var(--font-fredoka)' }}>
								The Team
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
											<div className="text-xs font-bold text-(--text-muted) uppercase tracking-widest px-2">Owner</div>
											<Link
												href={`/users/${owner.id}`}
												className="flex items-center gap-3 p-3 rounded-2xl hover:bg-(--background) border border-transparent hover:border-(--border)/10 transition-colors group"
											>
												<Image
													src={
														owner.avatar
															? `https://cdn.discordapp.com/avatars/${owner.id}/${owner.avatar}.png?size=64`
															: `https://cdn.discordapp.com/embed/avatars/${Number(owner.discriminator || 0) % 5}.png`
													}
													alt={owner.global_name || owner.username}
													width={40}
													height={40}
													className="rounded-full shadow-sm group-hover:ring-2 group-hover:ring-(--accent)/50 transition-all"
												/>
												<div className="flex flex-col min-w-0">
													<span className="text-sm font-bold text-(--text) truncate">{owner.global_name || owner.username}</span>
												</div>
											</Link>
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
												<Link
													href={`/users/${member.id}`}
													key={member.id}
													className="flex items-center gap-3 p-3 rounded-2xl hover:bg-(--background) border border-transparent hover:border-(--border)/10 transition-colors group"
												>
													<Image
														src={
															member.avatar
																? `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=64`
																: `https://cdn.discordapp.com/embed/avatars/${Number(member.discriminator || 0) % 5}.png`
														}
														alt={member.global_name || member.username}
														width={40}
														height={40}
														className="rounded-full shadow-sm group-hover:ring-2 group-hover:ring-(--accent)/50 transition-all"
													/>
													<div className="flex flex-col min-w-0">
														<span className="text-sm font-bold text-(--text) truncate">{member.global_name || member.username}</span>
													</div>
												</Link>
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
											<div className="text-xs font-bold text-(--text-muted) uppercase tracking-widest px-2">Members</div>
											{unassignedMembers.map((member: any) => (
												<Link
													href={`/users/${member.id}`}
													key={member.id}
													className="flex items-center gap-3 p-3 rounded-2xl hover:bg-(--background) border border-transparent hover:border-(--border)/10 transition-colors group"
												>
													<Image
														src={
															member.avatar
																? `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=64`
																: `https://cdn.discordapp.com/embed/avatars/${Number(member.discriminator || 0) % 5}.png`
														}
														alt={member.global_name || member.username}
														width={40}
														height={40}
														className="rounded-full shadow-sm group-hover:ring-2 group-hover:ring-(--accent)/50 transition-all"
													/>
													<div className="flex flex-col min-w-0">
														<span className="text-sm font-bold text-(--text) truncate">{member.global_name || member.username}</span>
													</div>
												</Link>
											))}
										</div>
									);
								})()}
							</div>
						) : (
							<div className="text-sm text-(--text-muted)">No team members to display.</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
