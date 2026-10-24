/** @format */
'use client';

import React from 'react';

export interface BadgeProps {
	children: React.ReactNode;
	variant?: 'accent' | 'success' | 'warning' | 'danger' | 'muted' | 'outline';
	size?: 'sm' | 'md';
	icon?: React.ReactNode;
	dot?: boolean;
	className?: string;
}

export function Badge({ children, variant = 'accent', size = 'sm', icon, dot = false, className = '' }: BadgeProps) {
	const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
		accent: 'bg-(--accent)/10 text-(--accent) border-(--accent)/25 backdrop-blur-md',
		success: 'bg-(--accent-green)/10 text-(--accent-green) border-(--accent-green)/25 backdrop-blur-md',
		warning: 'bg-(--accent-orange)/10 text-(--accent-orange) border-(--accent-orange)/25 backdrop-blur-md',
		danger: 'bg-(--accent-red)/10 text-(--accent-red) border-(--accent-red)/25 backdrop-blur-md',
		muted: 'bg-(--foreground)/30 text-(--text-muted) border-(--border)/10 backdrop-blur-md',
		outline: 'bg-(--foreground)/30 text-(--text) border-(--border)/20 backdrop-blur-md',
	};

	const dotClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
		accent: 'bg-(--accent)',
		success: 'bg-(--accent-green)',
		warning: 'bg-(--accent-orange)',
		danger: 'bg-(--accent-red)',
		muted: 'bg-(--text-muted)',
		outline: 'bg-(--text)',
	};

	const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

	return (
		<span className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider shrink-0 ${variantClasses[variant]} ${sizeClasses} ${className}`}>
			{dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses[variant]}`} />}
			{icon && <span className="shrink-0 flex items-center">{icon}</span>}
			<span>{children}</span>
		</span>
	);
}
