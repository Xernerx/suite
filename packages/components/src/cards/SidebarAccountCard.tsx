/** @format */
'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { User as UserIcon } from 'lucide-react';

export interface SidebarAccountCardProps {
	isCollapsed?: boolean;
	title: string;
	subtitle: string;
	avatarUrl?: string | null;
	avatarAlt?: string;
	avatarShape?: 'squircle' | 'circle';
	avatarFallback?: ReactNode;
	statusBadge?: ReactNode;
	badge?: ReactNode;
	subtitleIcon?: ReactNode;
	backgroundUrl?: string | null;
	tooltip?: string;
	onClick?: () => void;
	actions?: ReactNode;
}

export function SidebarAccountActionButton({
	hasBackdrop = false,
	active = false,
	disabled = false,
	tooltip,
	onClick,
	children,
}: {
	hasBackdrop?: boolean;
	active?: boolean;
	disabled?: boolean;
	tooltip: string;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			aria-label={tooltip}
			title={tooltip}
			disabled={disabled}
			onClick={onClick}
			className={`shrink-0 flex items-center justify-center rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${
				hasBackdrop ? 'hover:bg-(--background)/30 text-white drop-shadow-md' : 'hover:bg-(--background) text-(--text-muted) hover:text-(--text)'
			} ${active ? (hasBackdrop ? 'bg-(--background)/40 text-white' : 'bg-(--background) text-(--text)') : ''}`}
			style={{ padding: 'calc(var(--ui-gap) * 0.5)' }}
		>
			{children}
		</button>
	);
}

export function SidebarAccountCard({
	isCollapsed = false,
	title,
	subtitle,
	avatarUrl,
	avatarAlt,
	avatarShape = 'squircle',
	avatarFallback,
	statusBadge,
	badge,
	subtitleIcon,
	backgroundUrl,
	tooltip,
	onClick,
	actions,
}: SidebarAccountCardProps) {
	const avatarRounding = avatarShape === 'circle' ? 'rounded-full' : 'rounded-xl';

	return (
		<div
			className={`group relative overflow-hidden flex w-full items-center rounded-2xl border border-(--border)/10 transition-all ${
				backgroundUrl ? 'shadow-inner' : 'bg-(--foreground)/30 hover:bg-(--foreground)/45 backdrop-blur-md'
			} ${isCollapsed ? 'flex-col justify-center' : 'justify-between'}`}
			style={{ padding: 'calc(var(--ui-gap) * 0.75)', gap: 'var(--ui-gap)' }}
		>
			{backgroundUrl && (
				<>
					<Image src={backgroundUrl} alt="" fill unoptimized className="object-cover z-0 pointer-events-none opacity-90" />
					<div className="absolute inset-0 bg-(--background)/15 z-0 pointer-events-none" />
				</>
			)}

			<button
				type="button"
				aria-label={tooltip || title}
				title={tooltip || title}
				onClick={onClick}
				className={`relative z-10 flex ${isCollapsed ? 'justify-center' : 'flex-1 min-w-0'} items-center overflow-hidden text-left rounded-lg ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
				style={isCollapsed ? undefined : { gap: 'var(--ui-gap)' }}
			>
				<div className="relative shrink-0">
					{avatarUrl ? (
						<div className="relative h-9 w-9">
							<Image src={avatarUrl} alt={avatarAlt || title} fill unoptimized draggable={false} className={`${avatarRounding} border border-(--border)/35 object-cover`} />
						</div>
					) : (
						<div className={`flex h-9 w-9 items-center justify-center ${avatarRounding} border border-(--border)/20 bg-(--background)/60 text-(--text-muted)`}>
							{avatarFallback || <UserIcon size={16} />}
						</div>
					)}
					{statusBadge}
				</div>

				<div
					className={`flex flex-col overflow-hidden transition-all duration-300 relative ${isCollapsed ? 'w-0 opacity-0 hidden' : 'flex-1 min-w-0 opacity-100'}`}
					style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}
				>
					<span className={`flex items-center gap-1.5 truncate text-sm font-bold tracking-wide ${backgroundUrl ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-(--text)'}`}>
						<span className="truncate">{title}</span>
						{badge}
					</span>
					<span className={`flex items-center gap-1 truncate text-xs ${backgroundUrl ? 'text-white/80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' : 'text-(--text-muted)'}`}>
						<span className="truncate">{subtitle || '\u00A0'}</span>
						{subtitleIcon}
					</span>
				</div>
			</button>

			{actions && <div className={`relative z-10 flex ${isCollapsed ? 'flex-col' : 'items-center'} gap-1 shrink-0`}>{actions}</div>}
		</div>
	);
}
