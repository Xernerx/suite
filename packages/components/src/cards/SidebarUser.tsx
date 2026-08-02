/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Copy, Globe, LogOut, Monitor, Pencil, Smartphone, Tablet, UserCircle, UserIcon, Zap } from 'lucide-react';
import { useEnvironment, usePlatform } from '@xernerx/providers';

import Image from 'next/image';
import Link from 'next/link';

const deviceIcons = {
	desktop: Monitor,
	mobile: Smartphone,
	tablet: Tablet,
} as const;

export default function SidebarUserCard({ activeUser, isCollapsed }: { activeUser: any; isCollapsed: boolean }) {
	const { getEnvUrl } = useEnvironment();
	const { device } = usePlatform();

	// 1. Dynamically resolve Discord CDN URLs based on the real payload
	const bannerUrl = activeUser?.banner ? `https://cdn.discordapp.com/banners/${activeUser.id}/${activeUser.banner}.${activeUser.banner.startsWith('a_') ? 'gif' : 'png'}?size=600` : null;
	const avatarUrl = activeUser?.avatar
		? `https://cdn.discordapp.com/avatars/${activeUser.id}/${activeUser.avatar}.${activeUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
		: activeUser?.image;

	// 2. Resolve Avatar Decoration (using the asset ID from avatar_decoration_data)
	const decorationUrl = activeUser?.avatar_decoration_data?.asset ? `https://cdn.discordapp.com/avatar-decoration-presets/${activeUser.avatar_decoration_data.asset}.png` : null;

	// 3. Resolve Clan Badge (Guild Identity)
	const clanBadgeUrl =
		activeUser?.clan?.badge && activeUser?.clan?.identity_guild_id ? `https://cdn.discordapp.com/clan-badges/${activeUser.clan.identity_guild_id}/${activeUser.clan.badge}.png` : null;

	const copyUserId = () => {
		if (activeUser?.id) {
			navigator.clipboard.writeText(activeUser.id);
		}
	};

	const DeviceIcon = deviceIcons[device?.toLowerCase() as keyof typeof deviceIcons];
	const iconStyles = 'text-(--accent-green) absolute bottom-0 right-0 h-[22px] w-[22px] border-(--foreground) border-[4px] rounded-full bg-(--foreground)';

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 8 }}
			transition={{ duration: 0.15, ease: 'easeOut' }}
			className={`bg-(--foreground) absolute bottom-full mb-3 z-50 flex flex-col rounded-[24px] shadow-2xl overflow-hidden text-left border border-white/5
                ${isCollapsed ? 'left-1 w-56 origin-bottom-left' : 'left-0 right-0 origin-bottom'}
            `}
			style={{ fontSize: 'var(--text-scale, 14px)' }}
		>
			{/* Banner Area */}
			<div className="h-[120px] w-full relative overflow-hidden bg-black/20">
				{bannerUrl && <Image src={bannerUrl} alt="User Banner" fill className="object-cover" unoptimized draggable={false} />}
			</div>

			{/* Profile Content */}
			<div className="relative flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}>
				{/* Avatar */}
				<div className="flex justify-between items-start">
					<div className="bg-(--foreground) border-(--foreground) relative -mt-[42px] rounded-full border-[6px] shrink-0">
						{avatarUrl ? (
							<div className="relative h-[80px] w-[80px]">
								<Image src={avatarUrl} alt="User Profile" fill className="rounded-full object-cover" unoptimized draggable={false} />
								{decorationUrl && (
									<Image
										src={decorationUrl}
										alt="Avatar Decoration"
										fill
										className="absolute -inset-[15%] max-w-[130%] max-h-[130%] scale-[1.15] z-10"
										unoptimized
										draggable={false}
									/>
								)}
							</div>
						) : (
							<div className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-black/40">
								<UserIcon size={40} className="text-white/50" />
							</div>
						)}
						{/* Status Indicator */}
						{DeviceIcon ? <DeviceIcon className={iconStyles} /> : <div className={`${iconStyles} border-[4px] rounded-full`} />}
					</div>
				</div>

				{/* Names */}
				<div className="overflow-hidden" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center gap-2">
						<h2 className="text-[20px] font-black text-white tracking-wide drop-shadow-sm truncate">{activeUser?.global_name || activeUser?.name}</h2>
					</div>
					<p className="text-xs text-white/70 font-medium truncate" style={{ marginTop: 'calc(var(--ui-gap) * 0.25)' }}>
						@{activeUser?.username || activeUser?.name?.toLowerCase().replace(/\s/g, '')}
					</p>
				</div>

				{/* Dynamic Badges Row */}
				{activeUser?.clan?.tag && (
					<div className="flex items-center">
						<div className="bg-black/30 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1.5 border border-white/5">
							{clanBadgeUrl ? <Image src={clanBadgeUrl} alt="Clan Badge" width={12} height={12} unoptimized /> : <Zap size={10} className="text-yellow-500" fill="currentColor" />}
							{activeUser.clan.tag}
						</div>
					</div>
				)}

				{/* Action Menu (Top & Bottom Wrapper) */}
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<div className="bg-black/20 rounded-xl flex flex-col overflow-hidden text-sm font-semibold text-white/80 border border-white/5">
						<Link
							href={getEnvUrl('https://auth.xernerx.com')}
							className="flex items-center transition-colors hover:bg-white/10 hover:text-white"
							style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
						>
							<Pencil size={16} className="shrink-0" /> <span className="truncate">Edit Profile</span>
						</Link>
					</div>

					<div className="bg-black/20 rounded-xl flex flex-col overflow-hidden text-sm font-semibold text-white/80 border border-white/5">
						<button
							onClick={copyUserId}
							className="flex items-center transition-colors hover:bg-white/10 hover:text-white text-left w-full"
							style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
						>
							<Copy size={16} className="shrink-0" /> <span className="truncate">Copy User ID</span>
						</button>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
