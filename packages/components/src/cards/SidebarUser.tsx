/** @format */
'use client';

import { Coins, Copy, Flame, Gift, Monitor, Pencil, ShieldAlert, ShieldCheck, Smartphone, Tablet, UserIcon, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, usePlatform, useUser, useToast } from '@xernerx/providers';

import { Button } from '@xernerx/ui';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

interface Role {
	id: string;
	name?: string;
	role?: string;
	permissions?: any;
}

const deviceIcons = {
	desktop: Monitor,
	mobile: Smartphone,
	tablet: Tablet,
} as const;

export default function SidebarUserCard({ activeUser, isCollapsed }: { activeUser: any; isCollapsed: boolean }) {
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const { device } = usePlatform();
	const { mutate } = useUser();
	const { toast } = useToast();
	const [roles, setRoles] = useState<Role[]>([]);
	const [claiming, setClaiming] = useState(false);
	const [timeLeft, setTimeLeft] = useState<string>('');

	// Fetch system roles to resolve role names and admin access permissions from IDs
	useEffect(() => {
		fetch(getEnvUrl('https://api.xernerx.com/secure/core'), { credentials: 'include', cache: 'no-store' })
			.then((res) => (res.ok ? res.json() : []))
			.then((data) => setRoles(data))
			.catch(() => {});
	}, [getEnvUrl]);

	// Live countdown timer logic
	const giftInTime = activeUser?.credits?.giftIn ? new Date(activeUser.credits.giftIn).getTime() : 0;

	useEffect(() => {
		const updateCountdown = () => {
			const now = Date.now();
			const difference = giftInTime - now;

			if (difference <= 0) {
				setTimeLeft('00:00:00');
				return;
			}

			const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((difference % (1000 * 60)) / 1000);

			const formatted = [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');

			setTimeLeft(formatted);
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);
		return () => clearInterval(interval);
	}, [giftInTime]);

	// 1. Dynamically resolve Discord CDN URLs based on the real payload
	const bannerUrl = activeUser?.banner ? `https://cdn.discordapp.com/banners/${activeUser.id}/${activeUser.banner}.${activeUser.banner.startsWith('a_') ? 'gif' : 'png'}?size=600` : null;
	const avatarUrl = activeUser?.avatar
		? `https://cdn.discordapp.com/avatars/${activeUser.id}/${activeUser.avatar}.${activeUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
		: activeUser?.image;

	// 2. Resolve Avatar Decoration
	const decorationUrl = activeUser?.avatar_decoration_data?.asset ? `https://cdn.discordapp.com/avatar-decoration-presets/${activeUser.avatar_decoration_data.asset}.png` : null;

	// 3. Resolve Clan Badge
	const clanBadgeUrl =
		activeUser?.clan?.badge && activeUser?.clan?.identity_guild_id ? `https://cdn.discordapp.com/clan-badges/${activeUser.clan.identity_guild_id}/${activeUser.clan.badge}.png` : null;

	const copyUserId = () => {
		if (activeUser?.id) {
			navigator.clipboard.writeText(activeUser.id);
		}
	};

	const handleClaimDaily = async () => {
		setClaiming(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/${activeUser.id}/gift`), {
				method: 'POST',
				credentials: 'include',
			});
			if (res.ok) {
				confetti({
					particleCount: 100,
					angle: 270,
					spread: 180,
					origin: { x: 0.5, y: 0 },
				});
				await mutate();
				toast({ type: 'success', title: t('components.cards.sidebaruser.giftClaimedTitle') });
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || t('components.cards.sidebaruser.giftFailedTitle'));
			}
		} catch (err: any) {
			console.error('Failed to claim daily reward:', err);
			toast({ type: 'error', title: t('components.cards.sidebaruser.giftFailedTitle'), description: err.message });
		} finally {
			setClaiming(false);
		}
	};

	const DeviceIcon = deviceIcons[device?.toLowerCase() as keyof typeof deviceIcons];
	const iconStyles = 'text-(--accent-green) absolute bottom-0 right-0 h-[22px] w-[22px] border-(--foreground) border-[4px] rounded-full bg-(--foreground)/30 backdrop-blur-md';

	const hasActiveSub = activeUser?.staffSubscription || (Array.isArray(activeUser?.subscriptions) && activeUser.subscriptions.some((s: any) => s.status === 'active'));
	const userRoleIds = Array.isArray(activeUser?.roles) ? activeUser.roles : [];
	const activeRoles = roles.filter((r) => userRoleIds.includes(r.id));

	// Check if any of the user's roles grant admin dashboard access (permissions.access === true)
	const hasAdminAccess = activeRoles.some((r) => r.permissions?.access === true);

	const now = Date.now();
	const isReadyToClaim = now >= giftInTime;
	const currentStreak = activeUser?.credits?.streak ?? 0;

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 8 }}
			transition={{ duration: 0.15, ease: 'easeOut' }}
			className={`bg-(--foreground)/30 backdrop-blur-md absolute bottom-full mb-3 z-50 flex flex-col rounded-[24px] shadow-2xl overflow-hidden text-left border border-(--border)/5
                ${isCollapsed ? 'left-1 w-56 origin-bottom-left' : 'left-0 right-0 origin-bottom'}
            `}
			style={{ fontSize: 'var(--text-scale, 14px)' }}
		>
			{/* Banner Area */}
			<div className="h-[120px] w-full relative overflow-hidden" style={{ backgroundColor: activeUser?.banner_color || 'var(--foreground)' }}>
				{bannerUrl && <Image src={bannerUrl} alt={t('components.cards.sidebaruser.alt1')} fill className="object-cover" unoptimized draggable={false} />}
			</div>

			{/* Profile Content */}
			<div className="relative flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}>
				{/* Avatar */}
				<div className="flex justify-between items-start">
					<div className="bg-(--foreground)/30 backdrop-blur-md border-(--foreground) relative -mt-[42px] rounded-full border-[6px] shrink-0">
						{avatarUrl ? (
							<div className="relative h-[80px] w-[80px]">
								<Image src={avatarUrl} alt={t('components.cards.sidebaruser.alt2')} fill className="rounded-full object-cover" unoptimized draggable={false} />
								{decorationUrl && (
									<Image
										src={decorationUrl}
										alt={t('components.cards.sidebaruser.alt3')}
										fill
										className="absolute -inset-[15%] max-w-[130%] max-h-[130%] scale-[1.15] z-10"
										unoptimized
										draggable={false}
									/>
								)}
							</div>
						) : (
							<div className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-(--foreground)/30 backdrop-blur-md/40">
								<UserIcon size={40} className="text-(--text)" />
							</div>
						)}
						{DeviceIcon ? <DeviceIcon className={iconStyles} /> : <div className={`${iconStyles} border-[4px] rounded-full`} />}
					</div>

					{hasActiveSub && (
						<div className="flex items-center gap-1 bg-(--accent)/10 text-(--accent) text-[10px] font-bold px-2.5 py-1 rounded-full border border-(--accent)/20 mt-1">
							<ShieldCheck size={12} />
							<span>{activeUser?.staffSubscription ? 'Staff' : 'Pro'}</span>
						</div>
					)}
				</div>

				{/* Names */}
				<div className="overflow-hidden" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h2 className="text-[20px] font-black text-(--text) tracking-wide drop-shadow-sm truncate">{activeUser?.global_name || activeUser?.name}</h2>
					<p className="text-xs text-(--text-muted) font-medium truncate" style={{ marginTop: 'calc(var(--ui-gap) * 0.25)' }}>
						@{activeUser?.username || activeUser?.name?.toLowerCase().replace(/\s/g, '')}
					</p>
				</div>

				{/* Discord Badges / Clan Tag & Streak Badge Row */}
				{(activeUser?.clan?.tag || clanBadgeUrl || currentStreak > 0) && (
					<div className="flex flex-wrap items-center gap-1.5">
						{activeUser?.clan?.tag && (
							<div className="bg-(--foreground)/30 backdrop-blur-md/30 text-(--text) text-[10px] font-extrabold px-2 py-1 rounded-lg flex items-center gap-1.5 border border-(--border)/5">
								{clanBadgeUrl ? (
									<Image src={clanBadgeUrl} alt={t('components.cards.sidebaruser.alt4')} width={12} height={12} unoptimized />
								) : (
									<Zap size={10} className="text-yellow-500" fill="currentColor" />
								)}
								{activeUser.clan.tag}
							</div>
						)}
						{currentStreak > 0 && (
							<div className="flex items-center gap-1 text-orange-400 text-[10px] font-extrabold bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20">
								<Flame size={12} className="fill-orange-400" />
								<span>{currentStreak}</span>
							</div>
						)}
					</div>
				)}

				{/* Resolved Roles Display */}
				{activeRoles.length > 0 && (
					<div className="flex flex-wrap items-center gap-1">
						{activeRoles.map((r) => (
							<span key={r.id} className="text-[10px] px-2 py-0.5 rounded-md bg-(--accent)/10 text-(--accent) font-semibold truncate">
								{r.name || 'Unnamed Role'}
							</span>
						))}
					</div>
				)}

				{/* Credits Balance Display */}
				<div className="flex items-center justify-between bg-(--foreground)/30 backdrop-blur-md/30 px-3 py-2 rounded-xl border border-(--border)/5">
					<span className="text-xs text-(--text-muted) font-medium">{t('components.cards.sidebaruser.text1')}</span>
					<div className="flex items-center gap-1.5 text-emerald-400 text-xs font-extrabold">
						<Coins size={14} />
						<span>{activeUser?.credits?.balance?.toLocaleString() ?? 0}</span>
					</div>
				</div>

				{/* Daily Present Action Widget */}
				<div className="w-full">
					{isReadyToClaim ? (
						<button
							type="button"
							onClick={handleClaimDaily}
							disabled={claiming}
							className="w-full flex items-center justify-center gap-2 bg-(--accent) text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-md hover:opacity-90 transition-all animate-pulse"
						>
							<Gift size={16} />
							<span>{claiming ? t('components.cards.sidebaruser.openingGift') : t('components.cards.sidebaruser.claimGift')}</span>
						</button>
					) : (
						<div className="w-full flex items-center justify-between bg-(--foreground)/30 backdrop-blur-md/20 text-(--text-muted) text-xs px-3 py-2 rounded-xl border border-(--border)/5">
							<span className="flex items-center gap-1.5 font-medium">
								<Gift size={14} className="opacity-50" />
								{t('components.cards.sidebaruser.text2')}
							</span>
							<span className="text-[11px] font-mono font-bold text-(--text) opacity-90">{timeLeft || '00:00:00'}</span>
						</div>
					)}
				</div>

				{/* Action Menu */}
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<div className="bg-(--foreground)/30 backdrop-blur-md/20 rounded-xl flex flex-col overflow-hidden text-sm font-semibold text-(--text-muted) border border-(--border)/5">
						<Button>
							<Link href={getEnvUrl('https://account.xernerx.com')} className="flex" style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}>
								<Pencil size={16} className="shrink-0" /> <span className="truncate">{t('components.cards.sidebaruser.text3')}</span>
							</Link>
						</Button>
					</div>

					{/* Conditional Admin Panel Button */}
					{hasAdminAccess && (
						<div className="bg-(--foreground)/30 backdrop-blur-md/20 rounded-xl flex flex-col overflow-hidden text-sm font-semibold text-(--text-muted) border border-(--border)/5">
							<Button>
								<Link href={getEnvUrl('https://admin.xernerx.com')} className="flex" style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}>
									<ShieldAlert size={16} className="shrink-0" /> <span className="truncate">{t('components.cards.sidebaruser.text4')}</span>
								</Link>
							</Button>
						</div>
					)}

					<div className="bg-(--foreground)/30 backdrop-blur-md/20 rounded-xl flex flex-col overflow-hidden text-sm font-semibold text-(--text-muted) border border-(--border)/5">
						<Button onClick={copyUserId} className="flex">
							<Copy size={16} className="shrink-0" /> <span className="truncate">{t('components.cards.sidebaruser.text5')}</span>
						</Button>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
