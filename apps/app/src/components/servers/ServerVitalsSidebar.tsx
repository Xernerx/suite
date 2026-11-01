/** @format */
'use client';

import { Building2, ChevronRight, ChevronUp, Code2, ExternalLink, FileText, Globe, LifeBuoy, Link as LinkIcon, MessageSquare, Rocket, Shield, ShieldCheck, Sparkles, Tag, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useDictionary } from '@xernerx/providers';
import { Button } from '@xernerx/ui';

export function ServerVitalsSidebar({ server, organizationData }: { server: any; organizationData: any }) {
	const { t } = useDictionary();

	const configuredLinks = Object.entries(server?.links || {}).filter(([, val]) => Boolean(val && String(val).trim()));
	const tags = Array.isArray(server?.tags) ? server.tags.filter(Boolean) : [];
	const activeBoostUntil = server?.boostedUntil || server?.promotedUntil;
	const isBoosted = Boolean(activeBoostUntil && new Date(activeBoostUntil).getTime() > Date.now());

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<div
				className="flex flex-col rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
			>
				<h2 className="text-lg font-extrabold flex items-center gap-2 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
					<Sparkles className="w-5 h-5 text-(--accent)" /> {t('app.servers.overview.vitalsTitle')}
				</h2>

				<div className="flex flex-col gap-3 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
					<div className="flex items-center justify-between gap-2 text-xs">
						<span className="font-bold text-(--text-muted) uppercase tracking-wider">{t('app.servers.information')}</span>
						{server.verified ? (
							<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/30 font-bold">
								<ShieldCheck className="w-3.5 h-3.5" /> {t('app.servers.overview.verifiedServer')}
							</span>
						) : (
							<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--foreground) text-(--text-muted) border border-(--border)/15 font-bold">
								{t('app.servers.overview.standardServer')}
							</span>
						)}
					</div>

					<div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-(--border)/10">
						<span className="font-bold text-(--text-muted) uppercase tracking-wider">{t('app.servers.overview.privacyTier')}</span>
						<span className="px-2.5 py-0.5 rounded-full bg-(--accent)/15 text-(--accent) border border-(--accent)/30 font-bold uppercase">{server.privacy || 'public'}</span>
					</div>

					{isBoosted && (
						<div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-(--border)/10">
							<span className="font-bold text-(--text-muted) uppercase tracking-wider">{t('app.boost.spotlightBadge')}</span>
							<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--accent)/20 text-(--accent) border border-(--accent)/35 font-bold">
								<Rocket className="w-3 h-3" /> Active
							</span>
						</div>
					)}
				</div>

				{organizationData?.name && (
					<div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
						<span className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">{t('app.servers.publishedBy')}</span>
						{(organizationData.privacy || organizationData.config?.privacy) !== 'private' ? (
							<Link
								href={`/organization/${organizationData.vanitySlug || organizationData._id}`}
								className="flex items-center justify-between gap-2 text-sm font-bold text-(--accent) hover:underline"
							>
								<span className="flex items-center gap-2 truncate">
									<Building2 className="w-4 h-4 shrink-0" />
									<span className="truncate">{organizationData.name}</span>
								</span>
								<ChevronRight className="w-4 h-4 shrink-0" />
							</Link>
						) : (
							<span className="flex items-center gap-2 text-sm font-medium text-(--text)">
								<Building2 className="w-4 h-4 shrink-0 text-(--text-muted)" />
								<span>{organizationData.name}</span>
							</span>
						)}
					</div>
				)}

				{tags.length > 0 && (
					<div className="flex flex-col gap-2">
						<span className="text-xs font-bold text-(--text-muted) uppercase tracking-wider flex items-center gap-1.5">
							<Tag className="w-3.5 h-3.5 text-(--accent)" /> {t('app.servers.overview.tagsHeading')}
						</span>
						<div className="flex flex-wrap gap-1.5">
							{tags.map((tag: string) => (
								<span key={tag} className="px-3 py-1 rounded-full text-xs font-bold bg-(--accent)/10 text-(--accent) border border-(--accent)/25">
									{tag}
								</span>
							))}
						</div>
					</div>
				)}

				{configuredLinks.length > 0 && (
					<div className="flex flex-col gap-2.5 pt-2 border-t border-(--border)/10">
						<span className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">{t('app.servers.overview.linksHeading')}</span>
						<div className="flex flex-col gap-2">
							{configuredLinks.map(([key, rawUrl]) => {
								const urlStr = String(rawUrl);
								let Icon: any = LinkIcon;
								if (key === 'website') Icon = Globe;
								else if (key === 'support') Icon = LifeBuoy;
								else if (key === 'github') Icon = Code2;
								else if (key === 'community' || key === 'invite') Icon = MessageSquare;
								else if (key === 'privacy') Icon = Shield;
								else if (key === 'terms') Icon = FileText;
								else Icon = ExternalLink;

								let displayUrl = urlStr;
								try {
									const parsed = new URL(urlStr);
									displayUrl = parsed.hostname + (parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '');
								} catch {}

								return (
									<a
										key={key}
										href={urlStr}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-(--background)/50 hover:bg-(--background) border border-(--border)/10 hover:border-(--accent)/35 transition-all group"
									>
										<div className="flex items-center gap-2.5 min-w-0">
											<div className="w-7 h-7 rounded-xl bg-(--accent)/15 text-(--accent) flex items-center justify-center shrink-0">
												<Icon className="w-3.5 h-3.5" />
											</div>
											<div className="min-w-0">
												<div className="text-xs font-bold text-(--text) capitalize">{key}</div>
												<div className="text-[11px] text-(--text-muted) truncate">{displayUrl}</div>
											</div>
										</div>
										<ExternalLink className="w-3.5 h-3.5 text-(--text-muted) group-hover:text-(--accent) shrink-0" />
									</a>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export function ServerDiscoveryRow({ similarServers }: { similarServers: any[] }) {
	const { t } = useDictionary();
	if (similarServers.length === 0) return null;

	return (
		<div className="flex flex-col rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('app.servers.overview.discoverSimilarTitle')}
					</h3>
					<p className="text-xs text-(--text-muted)">{t('app.servers.overview.discoverSimilarSubtitle')}</p>
				</div>
				<Link href="/servers">
					<Button variant="outline" className="text-xs">
						{t('app.servers.overview.exploreAllServers')}
						<ChevronRight className="w-3.5 h-3.5 ml-1" />
					</Button>
				</Link>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{similarServers.map((sim) => {
					const simIcon = sim.iconUrl || (sim.icon ? `https://cdn.discordapp.com/icons/${sim.id}/${sim.icon}.png?size=128` : null);
					const simMembers = Array.isArray(sim.stats) && sim.stats.length > 0 ? Number(sim.stats[sim.stats.length - 1]?.members || 0) : Number(sim.memberCount || 0);
					return (
						<Link
							key={sim.id}
							href={`/servers/${sim.vanitySlug || sim.id}`}
							className="flex flex-col justify-between gap-3 p-4 rounded-2xl bg-(--background)/50 hover:bg-(--background)/80 border border-(--border)/10 hover:border-(--accent)/40 transition-all group"
						>
							<div className="flex items-center gap-3">
								{simIcon ? (
									<Image src={simIcon} alt={sim.name} width={44} height={44} unoptimized className="w-11 h-11 rounded-2xl object-cover shrink-0 border border-(--border)/15" />
								) : (
									<div className="w-11 h-11 rounded-2xl bg-(--foreground) border border-(--border)/15 flex items-center justify-center font-bold text-(--text-muted) shrink-0">
										{String(sim.name || 'S').charAt(0)}
									</div>
								)}
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-1.5">
										<span className="font-bold text-sm text-(--text) group-hover:text-(--accent) transition-colors truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{sim.name}
										</span>
										{sim.verified && <ShieldCheck className="w-4 h-4 text-(--accent-green) shrink-0" />}
									</div>
									<div className="flex items-center gap-3 text-xs text-(--text-muted) mt-0.5">
										<span className="inline-flex items-center gap-1">
											<Users className="w-3 h-3 text-(--accent)" /> {simMembers.toLocaleString()}
										</span>
										<span className="inline-flex items-center gap-1">
											<ChevronUp className="w-3.5 h-3.5 text-(--accent)" /> {Number(sim.voteCount || 0).toLocaleString()}
										</span>
									</div>
								</div>
							</div>
							<p className="text-xs text-(--text-muted) line-clamp-2">{sim.description || t('common.noDescription')}</p>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
