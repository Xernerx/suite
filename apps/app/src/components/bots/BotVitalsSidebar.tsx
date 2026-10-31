/** @format */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
	Activity,
	Award,
	Calendar,
	Check,
	ChevronRight,
	Code2,
	Copy,
	ExternalLink,
	FileText,
	Globe,
	LayoutDashboard,
	LifeBuoy,
	Link as LinkIcon,
	MessageSquare,
	Server,
	Shield,
	ShieldCheck,
	Sparkles,
	Terminal,
	Trophy,
	Users,
} from 'lucide-react';
import { evaluateBotMilestones, formatMilestoneCount } from '@xernerx/lib';
import { useDictionary, useToast } from '@xernerx/providers';
import { Button } from '@xernerx/ui';

interface BotVitalsSidebarProps {
	bot: any;
	id: string;
	onSelectView: (view: string) => void;
}

function decodeDiscordSnowflakeDate(snowflake?: string): Date | null {
	if (!snowflake || !/^\d{17,21}$/.test(snowflake)) return null;
	try {
		const ms = Number(BigInt(snowflake) >> BigInt(22)) + 1420070400000;
		const d = new Date(ms);
		return Number.isNaN(d.getTime()) ? null : d;
	} catch {
		return null;
	}
}

export function BotVitalsSidebar({ bot, id, onSelectView }: BotVitalsSidebarProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [copiedVanity, setCopiedVanity] = useState(false);

	const discordCreated = decodeDiscordSnowflakeDate(bot.id || id);
	const xernerxListed = bot.createdAt ? new Date(bot.createdAt) : null;

	const commands = Array.isArray(bot.commands) ? bot.commands : [];
	const slashCount = commands.filter((c: any) => {
		const raw = String(c?.type ?? c?.body?.type ?? '1').toUpperCase();
		return raw === '1' || raw === 'CHAT_INPUT' || raw === '';
	}).length;
	const contextCount = Math.max(0, commands.length - slashCount);

	const configuredLinks = Object.entries(bot.links || {}).filter(([key, val]) => key !== 'invite' && Boolean(val && String(val).trim()));

	const peakGuilds = Math.max(Number(bot.peakStats?.guildCount) || 0, Number(bot.guildCount) || 0, Number(bot.latestStat?.guildCount) || 0);
	const peakUsers = Math.max(Number(bot.peakStats?.userCount) || 0, Number(bot.userCount) || 0, Number(bot.latestStat?.userCount) || 0);
	const serverMilestoneEval = evaluateBotMilestones(peakGuilds, bot.latestStat ? [bot.latestStat] : [], 'servers');
	const memberMilestoneEval = evaluateBotMilestones(peakUsers, bot.latestStat ? [bot.latestStat] : [], 'members');
	const totalUnlockedMilestones = serverMilestoneEval.milestones.filter((m) => m.unlocked).length + memberMilestoneEval.milestones.filter((m) => m.unlocked).length;

	const vanityPath = `/bots/${bot.vanitySlug || bot.id || id}`;
	const fullProfileUrl = typeof window !== 'undefined' ? `${window.location.origin}${vanityPath}` : `https://app.xernerx.com${vanityPath}`;

	const handleCopyVanity = () => {
		navigator.clipboard.writeText(fullProfileUrl).then(() => {
			setCopiedVanity(true);
			toast({ type: 'success', title: t('app.bots.overview.vanityCopied'), description: fullProfileUrl });
			setTimeout(() => setCopiedVanity(false), 2000);
		});
	};

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{/* 1. Bot Vitals & Metadata Card */}
			<div
				className="flex flex-col rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
			>
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-extrabold text-(--text) flex items-center gap-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<Activity className="w-5 h-5 text-(--accent)" />
						{t('app.bots.overview.vitalsTitle')}
					</h2>
					{bot.verified && (
						<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30">
							<ShieldCheck size={12} />
							{t('app.bots.verifiedBadge')}
						</span>
					)}
				</div>

				<div className="flex flex-col gap-3">
					{bot.activity && (
						<div className="flex flex-col gap-1 p-3 rounded-2xl bg-(--background)/50 border border-(--border)/10">
							<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t('app.bots.overview.activityLabel')}</span>
							<span className="text-xs font-mono font-bold text-(--accent) truncate">{bot.activity}</span>
						</div>
					)}

					<div className="grid grid-cols-2 gap-2.5">
						{discordCreated && (
							<div className="flex flex-col gap-1 p-3 rounded-2xl bg-(--background)/50 border border-(--border)/10">
								<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-1">
									<Calendar size={11} className="text-(--accent)" />
									{t('app.bots.overview.discordCreatedLabel')}
								</span>
								<span className="text-xs font-extrabold text-(--text)">{discordCreated.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
							</div>
						)}
						{xernerxListed && !Number.isNaN(xernerxListed.getTime()) && (
							<div className="flex flex-col gap-1 p-3 rounded-2xl bg-(--background)/50 border border-(--border)/10">
								<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-1">
									<Sparkles size={11} className="text-(--accent)" />
									{t('app.bots.overview.listedOnXernerxLabel')}
								</span>
								<span className="text-xs font-extrabold text-(--text)">{xernerxListed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
							</div>
						)}
					</div>

					<div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-(--background)/50 border border-(--border)/10">
						<div className="flex flex-col min-w-0">
							<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t('app.bots.overview.commandBreakdownLabel')}</span>
							<span className="text-xs font-extrabold text-(--text) flex items-center gap-1.5 mt-0.5">
								<Terminal size={13} className="text-(--accent)" />
								{t('app.bots.overview.slashAndContextCount', { slash: slashCount, context: contextCount })}
							</span>
						</div>
						{commands.length > 0 && (
							<button
								type="button"
								onClick={() => onSelectView('commands')}
								className="px-2.5 py-1 rounded-full bg-(--accent)/15 hover:bg-(--accent)/25 text-(--accent) text-xs font-bold transition-colors cursor-pointer shrink-0"
							>
								<ChevronRight size={14} />
							</button>
						)}
					</div>

					<div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-(--background)/50 border border-(--border)/10">
						<div className="flex flex-col min-w-0">
							<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t('app.bots.overview.vanityUrlLabel')}</span>
							<span className="text-xs font-mono font-bold text-(--accent) truncate mt-0.5">{vanityPath}</span>
						</div>
						<button
							type="button"
							onClick={handleCopyVanity}
							className="p-2 rounded-xl bg-(--foreground)/60 hover:bg-(--foreground) border border-(--border)/10 text-(--text-muted) hover:text-(--text) transition-colors cursor-pointer shrink-0"
							title={t('app.bots.overview.vanityUrlLabel')}
						>
							{copiedVanity ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} className="text-(--accent)" />}
						</button>
					</div>

					{configuredLinks.length > 0 && (
						<div className="flex flex-col gap-2 pt-2 border-t border-(--border)/10">
							<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t('app.bots.overview.linksTitle')}</span>
							<div className="flex flex-col gap-1.5">
								{configuredLinks.map(([key, rawUrl]) => {
									const urlStr = String(rawUrl);
									let Icon: any = LinkIcon;
									if (key === 'website') Icon = Globe;
									else if (key === 'support') Icon = LifeBuoy;
									else if (key === 'github') Icon = Code2;
									else if (key === 'community') Icon = MessageSquare;
									else if (key === 'privacy') Icon = Shield;
									else if (key === 'terms') Icon = FileText;
									else if (key === 'dashboard') Icon = LayoutDashboard;
									else Icon = ExternalLink;

									let displayHost = urlStr;
									try {
										const parsed = new URL(urlStr);
										displayHost = parsed.hostname.replace(/^www\./, '');
									} catch {}

									return (
										<a
											key={key}
											href={urlStr}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-(--background)/50 hover:bg-(--background) border border-(--border)/10 hover:border-(--accent)/35 transition-all group"
										>
											<span className="flex items-center gap-2 text-xs font-bold text-(--text) capitalize">
												<Icon className="w-3.5 h-3.5 text-(--accent)" />
												{key}
											</span>
											<span className="flex items-center gap-1 text-[11px] font-mono text-(--text-muted) group-hover:text-(--accent) truncate max-w-[140px]">
												{displayHost}
												<ExternalLink size={11} className="shrink-0" />
											</span>
										</a>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* 2. Milestone Badges Card */}
			<div
				className="flex flex-col rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
			>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<Award className="w-5 h-5 text-(--accent)" />
						<h2 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('app.bots.overview.milestonesCardTitle')}
						</h2>
					</div>
					<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-extrabold text-(--accent)">
						<Trophy size={11} />
						{totalUnlockedMilestones}/32
					</span>
				</div>
				<p className="text-xs text-(--text-muted) -mt-2">{t('app.bots.overview.milestonesCardSubtitle')}</p>

				<div className="grid grid-cols-2 gap-3">
					{[
						{
							key: 'servers',
							label: t('app.bots.overview.serverTierLabel'),
							icon: Server,
							current: peakGuilds,
							evalData: serverMilestoneEval,
						},
						{
							key: 'members',
							label: t('app.bots.overview.memberTierLabel'),
							icon: Users,
							current: peakUsers,
							evalData: memberMilestoneEval,
						},
					].map(({ key, label, current, evalData }) => {
						const unlocked = evalData.highestUnlocked;
						const next = evalData.nextMilestone;
						const remaining = next ? Math.max(0, next.threshold - current) : 0;
						return (
							<div key={key} className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10 gap-2">
								<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{label}</span>
								<div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-(--foreground)/50 border border-(--accent)/25 p-2">
									<Image
										src={unlocked ? unlocked.badgeSvg : evalData.fallbackBadgeSvg}
										alt={unlocked ? unlocked.label : label}
										width={44}
										height={44}
										unoptimized
										className={`h-10 w-10 object-contain ${unlocked ? '' : 'opacity-45 grayscale'}`}
									/>
								</div>
								<span className="text-xs font-extrabold text-(--text)">
									{unlocked ? `${formatMilestoneCount(unlocked.threshold)} (#${unlocked.tier})` : t('app.bots.overview.unrankedTier')}
								</span>
								<div className="w-full h-1.5 rounded-full bg-(--foreground)/60 overflow-hidden">
									<div className="h-full rounded-full bg-(--accent)" style={{ width: `${Math.max(6, evalData.progressPercent)}%` }} />
								</div>
								<span className="text-[10px] font-mono text-(--text-muted) truncate w-full">
									{next
										? t('app.bots.overview.nextTierProgress', { target: formatMilestoneCount(next.threshold), percent: evalData.progressPercent })
										: t('app.bots.overview.maxTierUnlocked')}
								</span>
								{next && remaining > 0 && (
									<span className="text-[10px] font-bold text-(--accent) bg-(--accent)/10 border border-(--accent)/20 px-2 py-0.5 rounded-full truncate max-w-full">
										{t('app.bots.overview.remainingToNextTier', {
											remaining: remaining.toLocaleString(),
											target: formatMilestoneCount(next.threshold),
										})}
									</span>
								)}
							</div>
						);
					})}
				</div>

				<Button variant="outline" onClick={() => onSelectView('milestones')} className="w-full text-xs">
					{t('app.bots.overview.viewAllMilestones')}
					<ChevronRight className="w-3.5 h-3.5 ml-1" />
				</Button>
			</div>
		</div>
	);
}
