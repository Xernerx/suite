/** @format */
'use client';

import { useState } from 'react';
import { useDictionary, useEnvironment, useToast, useSession, useTheme } from '@xernerx/providers';
import { getHighestMilestoneBadge } from '@xernerx/lib';
import { XernerxDotLogo, type DotLogoVariant } from '@xernerx/feedback';
import { Button, CopyButton, Tooltip } from '@xernerx/ui';
import { User, Share2, Settings, Sparkles, Coins, Cpu, Crown, Gem, Flame, Zap, Bot, Bug, Lightbulb, Trophy, Heart, Award, Rocket } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import TipCreditsModal from '@/components/users/TipCreditsModal';

const DOT_MATRIX_CYCLE: DotLogoVariant[] = ['orbit', 'vortex', 'helix', 'prism', 'infinity', 'wavegrid', 'full', 'icon'];

const VANITY_BADGE_ICONS: Record<string, any> = {
	dot_matrix_banner: Cpu,
	credit_patron: Coins,
	high_roller: Gem,
	vault_sovereign: Crown,
	streak_master_7: Flame,
	streak_master_30: Zap,
	streak_master_100: Trophy,
	top_voter_10: Heart,
	top_voter_50: Award,
	ecosystem_builder: Rocket,
};

export default function Header({ user, discordUser, bots = [], id, isPrivate = false }: { user: any; discordUser: any; bots?: any[]; id: string; isPrivate?: boolean }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { data: session } = useSession();
	const { preferences } = useTheme();
	const [tipModalOpen, setTipModalOpen] = useState(false);

	const isOwnProfile = (session as any)?.user?.id === id;
	const activeVanityBadges: string[] = Array.isArray(user?.credits?.activeBadges) ? user.credits.activeBadges : [];
	const hasDotMatrixBanner = activeVanityBadges.includes('dot_matrix_banner');
	const savedDotVariant = ((user?.credits?.dotMatrixVariant as DotLogoVariant) || 'orbit') as DotLogoVariant;
	const [overrideDotVariant, setOverrideDotVariant] = useState<DotLogoVariant | null>(null);
	const activeDotVariant = overrideDotVariant || savedDotVariant;
	const currentStreak = user?.credits?.streak ?? 0;
	const verifiedIssues = user?.communityStats?.verifiedIssuesCount || 0;
	const approvedSuggestions = user?.communityStats?.approvedSuggestionsCount || 0;

	const clanBadgeUrl =
		preferences.showDiscordCollectibles && discordUser?.clan?.badge && discordUser?.clan?.identity_guild_id
			? `https://cdn.discordapp.com/clan-badges/${discordUser.clan.identity_guild_id}/${discordUser.clan.badge}.png`
			: null;

	const maxGuildBot =
		bots.length > 0
			? bots.reduce((best, b) => {
					const bGuilds = Number(b?.stats?.guildCount ?? b?.guildCount ?? 0) || 0;
					const bestGuilds = Number(best?.stats?.guildCount ?? best?.guildCount ?? 0) || 0;
					return bGuilds > bestGuilds ? b : best;
				}, bots[0])
			: null;

	const maxUserBot =
		bots.length > 0
			? bots.reduce((best, b) => {
					const bUsers = Number(b?.stats?.userCount ?? b?.userCount ?? 0) || 0;
					const bestUsers = Number(best?.stats?.userCount ?? best?.userCount ?? 0) || 0;
					return bUsers > bestUsers ? b : best;
				}, bots[0])
			: null;

	const maxGuildCount = Number(maxGuildBot?.stats?.guildCount ?? maxGuildBot?.guildCount ?? 0) || 0;
	const maxUserCount = Number(maxUserBot?.stats?.userCount ?? maxUserBot?.userCount ?? 0) || 0;
	const serverMilestone = bots.length > 0 ? getHighestMilestoneBadge(maxGuildCount, 'servers') : null;
	const memberMilestone = bots.length > 0 ? getHighestMilestoneBadge(maxUserCount, 'members') : null;

	const avatarUrl =
		discordUser?.avatarUrl ||
		(discordUser?.avatar
			? `https://cdn.discordapp.com/avatars/${id}/${discordUser.avatar}.png?size=256`
			: user?.avatar
				? `https://cdn.discordapp.com/avatars/${id}/${user.avatar}.png?size=256`
				: null);

	const bannerUrl = discordUser?.bannerUrl || (discordUser?.banner ? `https://cdn.discordapp.com/banners/${id}/${discordUser.banner}.png?size=1024` : null);
	const displayName = discordUser?.global_name || discordUser?.username || user?.username || t('app.users.unknownUser');
	const username = discordUser?.username || user?.username;

	const handleShareProfile = () => {
		if (typeof window === 'undefined') return;
		navigator.clipboard.writeText(window.location.href);
		toast({ title: t('app.users.profileLinkCopied'), type: 'success' });
	};

	return (
		<div
			className={`flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 p-8 rounded-3xl bg-(--foreground)/50 border backdrop-blur-md shadow-sm mt-8 relative ${
				hasDotMatrixBanner ? 'border-(--accent)/35 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)]' : 'border-(--border)/10'
			}`}
		>
			<div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
				{bannerUrl && <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
				{hasDotMatrixBanner && (
					<div className="absolute inset-0 opacity-70">
						<XernerxDotLogo variant={activeDotVariant} backgroundMode ripple={true} vivid={true} />
					</div>
				)}
			</div>
			{hasDotMatrixBanner && (
				<div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
					<Tooltip content={t('app.users.profile.cycleDotMatrixFormation')}>
						<button
							type="button"
							onClick={() => {
								const idx = DOT_MATRIX_CYCLE.indexOf(activeDotVariant);
								const next = DOT_MATRIX_CYCLE[(idx + 1) % DOT_MATRIX_CYCLE.length];
								setOverrideDotVariant(next);
							}}
							className="inline-flex items-center gap-1.5 rounded-full bg-(--background)/75 hover:bg-(--accent)/20 backdrop-blur-md border border-(--accent)/35 px-2.5 py-1 text-[11px] font-bold text-(--accent) transition-all cursor-pointer shadow-xs"
						>
							<Cpu size={12} />
							<span>{t(`account.appearance.dotMatrix.types.${activeDotVariant}`)}</span>
						</button>
					</Tooltip>
				</div>
			)}
			{avatarUrl ? (
				<Image
					src={avatarUrl}
					alt={displayName}
					width={128}
					height={128}
					className="rounded-2xl shadow-lg border-2 border-(--border)/20 relative z-10 object-cover pointer-events-auto"
					unoptimized
				/>
			) : (
				<div className="w-32 h-32 rounded-2xl bg-(--background) border-2 border-(--border)/20 flex items-center justify-center text-(--text-muted) shadow-lg relative z-10">
					<User className="w-12 h-12" />
				</div>
			)}

			<div className="flex-1 relative z-10 pointer-events-none">
				<div className="flex flex-wrap items-center gap-2.5 mb-2 pointer-events-auto">
					<h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{displayName}
					</h1>
					{username && <span className="text-sm font-semibold text-(--text-muted)">@{username}</span>}
					<CopyButton value={id} label={id} toastTitle={t('app.users.idCopied')} />
					{discordUser?.clan?.tag && (
						<span className="bg-(--foreground)/50 text-(--text) text-xs font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-(--border)/10">
							{clanBadgeUrl ? <Image src={clanBadgeUrl} alt="" width={13} height={13} unoptimized /> : <Zap size={12} className="text-(--accent-orange)" />}
							{discordUser.clan.tag}
						</span>
					)}
					{currentStreak > 0 && (
						<Tooltip content={`${t('app.users.profile.streak')}: ${t('app.users.profile.days', { count: currentStreak })}`}>
							<span className="inline-flex items-center gap-1 text-(--accent-orange) text-xs font-extrabold bg-(--accent-orange)/10 px-2.5 py-1 rounded-lg border border-(--accent-orange)/25">
								<Flame size={13} className="fill-(--accent-orange)" />
								{currentStreak}
							</span>
						</Tooltip>
					)}
					{serverMilestone && maxGuildBot && (
						<Tooltip
							content={`${serverMilestone.unlocked ? t('app.users.profile.milestones.tierUnlocked', { tier: serverMilestone.tier }) : t('app.users.profile.milestones.starterTier')} • ${serverMilestone.label}`}
						>
							<Link
								href={`/bots/${maxGuildBot.id}`}
								aria-label={serverMilestone.label}
								className="h-7 w-7 rounded-lg bg-(--foreground)/50 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/35 flex items-center justify-center transition-colors shrink-0"
							>
								<Image src={serverMilestone.badgeSvg} alt={serverMilestone.label} width={18} height={18} unoptimized className="h-4.5 w-4.5 object-contain" />
							</Link>
						</Tooltip>
					)}
					{memberMilestone && maxUserBot && (
						<Tooltip
							content={`${memberMilestone.unlocked ? t('app.users.profile.milestones.tierUnlocked', { tier: memberMilestone.tier }) : t('app.users.profile.milestones.starterTier')} • ${memberMilestone.label}`}
						>
							<Link
								href={`/bots/${maxUserBot.id}`}
								aria-label={memberMilestone.label}
								className="h-7 w-7 rounded-lg bg-(--foreground)/50 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/35 flex items-center justify-center transition-colors shrink-0"
							>
								<Image src={memberMilestone.badgeSvg} alt={memberMilestone.label} width={18} height={18} unoptimized className="h-4.5 w-4.5 object-contain" />
							</Link>
						</Tooltip>
					)}
					{activeVanityBadges.map((badgeId) => {
						const BadgeIcon = VANITY_BADGE_ICONS[badgeId] || Sparkles;
						return (
							<Tooltip key={badgeId} content={t(`account.profile.showcases.badges.${badgeId}`)}>
								<span className="h-7 w-7 rounded-lg bg-(--accent)/20 text-(--accent) border border-(--accent)/35 flex items-center justify-center shrink-0">
									<BadgeIcon size={13} />
								</span>
							</Tooltip>
						);
					})}
					{bots.length > 0 && (
						<Tooltip content={t('app.users.profile.badges.botDeveloper')}>
							<span className="h-7 w-7 rounded-lg bg-(--accent)/15 text-(--accent) border border-(--accent)/25 flex items-center justify-center shrink-0">
								<Bot size={13} />
							</span>
						</Tooltip>
					)}
					{verifiedIssues > 0 && (
						<Tooltip content={`${t('app.users.profile.badges.bugHunter')} (${verifiedIssues})`}>
							<span className="h-7 w-7 rounded-lg bg-(--accent)/15 text-(--accent) border border-(--accent)/25 flex items-center justify-center shrink-0">
								<Bug size={13} />
							</span>
						</Tooltip>
					)}
					{approvedSuggestions > 0 && (
						<Tooltip content={`${t('app.users.profile.badges.contributor')} (${approvedSuggestions})`}>
							<span className="h-7 w-7 rounded-lg bg-(--accent)/15 text-(--accent) border border-(--accent)/25 flex items-center justify-center shrink-0">
								<Lightbulb size={13} />
							</span>
						</Tooltip>
					)}
				</div>
				{!isPrivate && <p className="text-lg text-(--text-muted) max-w-2xl">{user?.description || t('common.noDescription')}</p>}
			</div>

			<div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0 relative z-10 flex flex-wrap items-center gap-2">
				{isOwnProfile ? (
					<Button variant="primary" onClick={() => window.open(`${getEnvUrl('https://account.xernerx.com/')}?tab=profile`, '_blank')}>
						<Settings className="w-4 h-4 mr-1.5" />
						{t('app.users.editProfile')}
					</Button>
				) : (
					<Button variant="primary" onClick={() => setTipModalOpen(true)}>
						<Coins className="w-4 h-4 mr-1.5" />
						{t('app.tip.tipUserBtn')}
					</Button>
				)}
				<Button variant="secondary" onClick={handleShareProfile} title={t('app.users.shareProfile')}>
					<Share2 className="w-4 h-4 mr-1.5" />
					{t('app.users.shareProfile')}
				</Button>
			</div>
			<TipCreditsModal isOpen={tipModalOpen} onClose={() => setTipModalOpen(false)} recipientId={id} recipientName={displayName} />
		</div>
	);
}
