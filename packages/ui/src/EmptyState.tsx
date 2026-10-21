/** @format */
'use client';

import React from 'react';

export interface EmptyStateProps {
	icon?: React.ReactNode;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
	return (
		<div
			className={`flex flex-col items-center justify-center text-center rounded-3xl border border-dashed border-(--border)/15 bg-(--foreground)/30 backdrop-blur-md ${className}`}
			style={{
				padding: 'calc(var(--ui-gap) * 2.5) var(--ui-gap)',
				gap: 'calc(var(--ui-gap) * 0.65)',
			}}
		>
			{icon && <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-(--accent)/10 border border-(--accent)/20 text-(--accent) mb-1">{icon}</div>}
			<h2 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{title}
			</h2>
			{description && <p className="text-xs text-(--text-muted) max-w-md leading-relaxed">{description}</p>}
			{action && <div className="mt-2">{action}</div>}
		</div>
	);
}
