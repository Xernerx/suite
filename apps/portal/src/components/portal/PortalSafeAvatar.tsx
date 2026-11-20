/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Building2, Server, User } from 'lucide-react';

export type PortalFallbackKind = 'bot' | 'org' | 'server' | 'user' | 'initial';

interface PortalSafeAvatarProps {
	src?: string | null;
	alt: string;
	className?: string;
	fallbackClassName?: string;
	iconClassName?: string;
	fallbackKind?: PortalFallbackKind;
	initial?: string;
}

export function PortalSafeAvatar({
	src,
	alt,
	className = 'w-10 h-10 rounded-full object-cover shrink-0',
	fallbackClassName = 'w-10 h-10 rounded-full bg-(--background)/60 border border-(--border)/10 flex items-center justify-center text-(--text-muted) shrink-0',
	iconClassName = 'w-5 h-5 text-(--text-muted)',
	fallbackKind = 'bot',
	initial,
}: PortalSafeAvatarProps) {
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		setFailed(false);
	}, [src]);

	if (src && !failed) {
		return <img src={src} alt={alt} onError={() => setFailed(true)} className={className} />;
	}

	const letter = (initial || alt || '?').trim().charAt(0).toUpperCase();

	return (
		<div className={fallbackClassName} aria-label={alt}>
			{fallbackKind === 'initial' ? (
				<span>{letter}</span>
			) : fallbackKind === 'org' ? (
				<Building2 className={iconClassName} />
			) : fallbackKind === 'server' ? (
				<Server className={iconClassName} />
			) : fallbackKind === 'user' ? (
				<User className={iconClassName} />
			) : (
				<Bot className={iconClassName} />
			)}
		</div>
	);
}

interface PortalSafeBannerProps {
	src?: string | null;
	alt?: string;
	className?: string;
	fallbackClassName?: string;
}

export function PortalSafeBanner({ src, alt = '', className = 'w-full h-full object-cover', fallbackClassName }: PortalSafeBannerProps) {
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		setFailed(false);
	}, [src]);

	if (src && !failed) {
		return <img src={src} alt={alt} onError={() => setFailed(true)} className={className} />;
	}

	return fallbackClassName ? <div className={fallbackClassName} /> : null;
}

export function portalButtonLinkClass(variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'secondary', size: 'sm' | 'md' | 'lg' = 'md', extraClassName = ''): string {
	const base =
		'inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) active:scale-95';
	const variants = {
		primary:
			'bg-(--accent) text-(--accent-contrast) border border-(--border)/15 shadow-sm hover:bg-(--hover-accent) hover:shadow-[0_0_15px_color-mix(in_srgb,var(--accent-readable,var(--accent))_40%,transparent)]',
		secondary: 'border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-(--text) shadow-sm hover:bg-(--foreground)/50 hover:border-(--accent)/50',
		outline: 'border border-(--border)/10 bg-transparent text-(--text) hover:bg-(--foreground)/30 hover:backdrop-blur-md',
		ghost: 'bg-transparent text-(--text) hover:bg-(--foreground)/30 hover:backdrop-blur-md hover:text-(--text)',
	};
	const sizes = {
		sm: 'h-8 px-3 text-xs gap-1.5',
		md: 'h-10 px-4 text-sm gap-2',
		lg: 'h-12 px-6 text-base gap-2.5',
	};
	return `${base} ${variants[variant]} ${sizes[size]} ${extraClassName}`.trim();
}
