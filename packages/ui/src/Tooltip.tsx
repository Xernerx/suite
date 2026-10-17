/** @format */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TooltipProps {
	content: React.ReactNode;
	children: React.ReactNode;
	position?: 'top' | 'bottom';
	className?: string;
	contentClassName?: string;
	delay?: number;
}

export function Tooltip({ content, children, position = 'top', className = '', contentClassName = '', delay = 100 }: TooltipProps) {
	const [isOpen, setIsOpen] = useState(false);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const show = () => {
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => setIsOpen(true), delay);
	};

	const hide = () => {
		if (timerRef.current) clearTimeout(timerRef.current);
		setIsOpen(false);
	};

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	if (!content) return <>{children}</>;

	return (
		<div className={`relative inline-flex items-center ${className}`} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
			{children}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 4 : -4 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 4 : -4 }}
						transition={{ duration: 0.15, ease: 'easeOut' }}
						className={`absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none ${position === 'top' ? 'bottom-full mb-2.5' : 'top-full mt-2.5'}`}
					>
						<div
							className={`relative px-4 py-2 bg-(--background)/95 text-(--text) backdrop-blur-xl border border-(--border)/20 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] text-xs w-max max-w-[380px] sm:max-w-[460px] text-center text-balance leading-relaxed ${contentClassName}`}
						>
							{content}
							{position === 'top' ? (
								<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 bg-(--background)/95 border-r border-b border-(--border)/20" />
							) : (
								<div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 w-2 h-2 rotate-45 bg-(--background)/95 border-l border-t border-(--border)/20" />
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
