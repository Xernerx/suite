/** @format */
'use client';

import React from 'react';

export interface PackageVisualMeta {
	slug: string;
	scope: string;
	colorName: string;
	bannerPath: string;
	iconPath: string;
	accentColor: string;
	borderHoverClass: string;
	badgeClass: string;
}

const PACKAGE_VISUAL_MAP: Record<string, PackageVisualMeta> = {
	xernerx: {
		slug: 'xernerx',
		scope: 'XRX',
		colorName: 'purple',
		bannerPath: '/packages/banners/xernerx.svg',
		iconPath: '/packages/icons/xernerx.svg',
		accentColor: '#8b7cf6',
		borderHoverClass: 'hover:border-violet-400/60',
		badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-400/35',
	},
	'@xernerx/framework': {
		slug: 'framework',
		scope: 'XF',
		colorName: 'indigo',
		bannerPath: '/packages/banners/framework.svg',
		iconPath: '/packages/icons/framework.svg',
		accentColor: '#6366f1',
		borderHoverClass: 'hover:border-indigo-400/60',
		badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/35',
	},
	'@xernerx/commands': {
		slug: 'commands',
		scope: 'XC',
		colorName: 'cyan',
		bannerPath: '/packages/banners/commands.svg',
		iconPath: '/packages/icons/commands.svg',
		accentColor: '#06b6d4',
		borderHoverClass: 'hover:border-cyan-400/60',
		badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/35',
	},
	'@xernerx/extension-builder': {
		slug: 'extension-builder',
		scope: 'XE',
		colorName: 'gold',
		bannerPath: '/packages/banners/extension-builder.svg',
		iconPath: '/packages/icons/extension-builder.svg',
		accentColor: '#f59e0b',
		borderHoverClass: 'hover:border-amber-400/60',
		badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/35',
	},
	'@xernerx/hooks': {
		slug: 'hooks',
		scope: 'XH',
		colorName: 'emerald',
		bannerPath: '/packages/banners/hooks.svg',
		iconPath: '/packages/icons/hooks.svg',
		accentColor: '#10b981',
		borderHoverClass: 'hover:border-emerald-400/60',
		badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35',
	},
	'@xernerx/stats': {
		slug: 'stats',
		scope: 'XS',
		colorName: 'coral',
		bannerPath: '/packages/banners/stats.svg',
		iconPath: '/packages/icons/stats.svg',
		accentColor: '#f43f5e',
		borderHoverClass: 'hover:border-rose-400/60',
		badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-400/35',
	},
	'@xernerx/terminal': {
		slug: 'terminal',
		scope: 'XT',
		colorName: 'magenta',
		bannerPath: '/packages/banners/terminal.svg',
		iconPath: '/packages/icons/terminal.svg',
		accentColor: '#d946ef',
		borderHoverClass: 'hover:border-fuchsia-400/60',
		badgeClass: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/35',
	},
	'@xernerx/websocket': {
		slug: 'websocket',
		scope: 'XW',
		colorName: 'blue',
		bannerPath: '/packages/banners/websocket.svg',
		iconPath: '/packages/icons/websocket.svg',
		accentColor: '#3b82f6',
		borderHoverClass: 'hover:border-blue-400/60',
		badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-400/35',
	},
};

export function getPackageVisualMeta(pkgName: string): PackageVisualMeta {
	return (
		PACKAGE_VISUAL_MAP[pkgName] || {
			slug: 'xernerx',
			scope: 'XRX',
			colorName: 'purple',
			bannerPath: '/packages/banners/xernerx.svg',
			iconPath: '/packages/icons/xernerx.svg',
			accentColor: '#8b7cf6',
			borderHoverClass: 'hover:border-(--accent)/50',
			badgeClass: 'bg-(--accent)/15 text-(--accent) border-(--accent)/30',
		}
	);
}

export function PackageBanner({ pkgName, className = '' }: { pkgName: string; className?: string }) {
	const meta = getPackageVisualMeta(pkgName);

	return (
		<div className={`relative w-full overflow-hidden rounded-xl border border-(--border)/15 bg-black/40 shadow-inner ${className}`.trim()}>
			<img
				src={meta.bannerPath}
				alt={`${pkgName} architecture banner`}
				loading="eager"
				decoding="async"
				className="w-full h-auto block select-none object-cover transition-transform duration-500 group-hover/pkg:scale-[1.015]"
			/>
		</div>
	);
}
