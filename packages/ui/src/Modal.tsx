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
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

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

	if (!open || !mounted) return null;

	const modalContent = (
		<div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/30 backdrop-blur-sm animate-in fade-in duration-200 font-sans antialiased text-(--text)">
			<div className="flex flex-col min-h-full items-center p-4 sm:p-8">
				{/* Spacer to push down */}
				<div className="flex-grow shrink-0 h-12 sm:h-16"></div>

				<div
					ref={ref}
					className={`flex flex-col w-full shrink-0 ${maxWidth} rounded-3xl border border-(--border)/10 bg-(--background)/95 backdrop-blur-xl shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_10%,transparent)] animate-in zoom-in-95 duration-200 relative text-left`}
					style={{ padding: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
						{(title || description) && (
							<div className="flex items-start justify-between shrink-0" style={{ gap: 'var(--ui-gap)' }}>
								<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
									{title && (
										<h2 className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{title}
										</h2>
									)}
									{description && <p className="text-xs text-(--text-muted) leading-relaxed">{description}</p>}
								</div>
								<Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close" className="shrink-0">
									<X size={16} />
								</Button>
							</div>
						)}

						<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
							{children}
						</div>
					</div>
				</div>

				{/* Spacer to push up */}
				<div className="flex-grow shrink-0 h-12 sm:h-16"></div>
			</div>
		</div>
	);

	return React.useMemo(() => {
		if (typeof document !== 'undefined') {
			const { createPortal } = require('react-dom');
			return createPortal(modalContent, document.body);
		}
		return null;
	}, [modalContent]);
}
