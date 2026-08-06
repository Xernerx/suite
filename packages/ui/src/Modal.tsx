/** @format */
'use client';

import React, { useEffect, useRef } from 'react';

import { Button } from './Button';
import { X } from 'lucide-react';

export interface ModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	description?: string;
	children: React.ReactNode;
	maxWidth?: string;
}

export function Modal({ open, onOpenChange, title, description, children, maxWidth = 'max-w-md' }: ModalProps) {
	const ref = useRef<HTMLDivElement>(null);

	// Close on escape key
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape' && open) {
				onOpenChange(false);
			}
		}
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [open, onOpenChange]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
			<div
				ref={ref}
				className={`flex flex-col w-full ${maxWidth} rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-xl animate-in zoom-in-95 duration-200`}
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				{(title || description) && (
					<div className="flex items-start justify-between" style={{ gap: 'var(--ui-gap)' }}>
						<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
							{title && <h2 className="text-lg font-bold text-(--text)">{title}</h2>}
							{description && <p className="text-xs text-(--text-muted) leading-relaxed">{description}</p>}
						</div>
						<Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close">
							<X size={16} />
						</Button>
					</div>
				)}

				<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					{children}
				</div>
			</div>
		</div>
	);
}
