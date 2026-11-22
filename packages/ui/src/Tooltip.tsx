/** @format */
'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface TooltipProps {
	content: React.ReactNode;
	children: React.ReactNode;
	position?: 'top' | 'bottom';
	className?: string;
	contentClassName?: string;
	delay?: number;
}

export function Tooltip({ content, children, position = 'top', className = '', contentClassName = '', delay = 100 }: TooltipProps) {
	const [mounted, setMounted] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [coords, setCoords] = useState<{ centerX: number; anchorY: number; arrowOffset: number; effectivePos: 'top' | 'bottom' } | null>(null);
	const triggerRef = useRef<HTMLDivElement>(null);
	const popupRef = useRef<HTMLDivElement>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	const updatePosition = useCallback(() => {
		const el = triggerRef.current;
		if (!el || typeof window === 'undefined') return;
		const rect = el.getBoundingClientRect();
		const scale = el.offsetWidth > 0 ? rect.width / el.offsetWidth : 1;
		const vw = window.innerWidth / scale;
		const vh = window.innerHeight / scale;
		const rTop = rect.top / scale;
		const rBottom = rect.bottom / scale;
		const rLeft = rect.left / scale;
		const rWidth = rect.width / scale;

		let effectivePos = position;
		if (position === 'top' && rTop < 64 && vh - rBottom > rTop) {
			effectivePos = 'bottom';
		} else if (position === 'bottom' && vh - rBottom < 64 && rTop > vh - rBottom) {
			effectivePos = 'top';
		}

		const rawCenter = rLeft + rWidth / 2;
		const popupRect = popupRef.current?.getBoundingClientRect();
		const popupWidth = popupRect && popupRect.width > 0 ? popupRect.width / scale : 0;
		const edgeMargin = 12;
		const halfW = popupWidth > 0 ? popupWidth / 2 : 24;
		const centerX = popupWidth > 0 && popupWidth + edgeMargin * 2 < vw ? Math.max(halfW + edgeMargin, Math.min(vw - halfW - edgeMargin, rawCenter)) : Math.max(24, Math.min(vw - 24, rawCenter));
		const maxArrowShift = popupWidth > 0 ? Math.max(0, halfW - 14) : 0;
		const arrowOffset = Math.max(-maxArrowShift, Math.min(maxArrowShift, rawCenter - centerX));
		const anchorY = effectivePos === 'top' ? vh - rTop + 10 : rBottom + 10;
		setCoords((prev) => {
			if (prev && Math.abs(prev.centerX - centerX) < 0.5 && Math.abs(prev.anchorY - anchorY) < 0.5 && Math.abs(prev.arrowOffset - arrowOffset) < 0.5 && prev.effectivePos === effectivePos) {
				return prev;
			}
			return { centerX, anchorY, arrowOffset, effectivePos };
		});
	}, [position]);

	useIsomorphicLayoutEffect(() => {
		if (!isOpen) return;
		updatePosition();
		window.addEventListener('scroll', updatePosition, true);
		window.addEventListener('resize', updatePosition);
		return () => {
			window.removeEventListener('scroll', updatePosition, true);
			window.removeEventListener('resize', updatePosition);
		};
	}, [isOpen, updatePosition]);

	const hasCoords = Boolean(coords);
	useIsomorphicLayoutEffect(() => {
		if (!isOpen || !hasCoords) return;
		updatePosition();
	}, [isOpen, hasCoords, updatePosition]);

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

	const effectivePos = coords?.effectivePos ?? position;

	return (
		<div ref={triggerRef} className={`relative inline-flex items-center ${className}`} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
			{children}
			{mounted &&
				typeof document !== 'undefined' &&
				createPortal(
					<AnimatePresence>
						{isOpen && coords && (
							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: effectivePos === 'top' ? 4 : -4 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: effectivePos === 'top' ? 4 : -4 }}
								transition={{ duration: 0.15, ease: 'easeOut' }}
								className="fixed z-[100060] -translate-x-1/2 pointer-events-none font-sans antialiased"
								style={{
									left: `${coords.centerX}px`,
									top: effectivePos === 'bottom' ? `${coords.anchorY}px` : undefined,
									bottom: effectivePos === 'top' ? `${coords.anchorY}px` : undefined,
								}}
							>
								<div
									ref={popupRef}
									className={`relative px-4 py-2 bg-(--background)/95 text-(--text) backdrop-blur-xl border border-(--border)/20 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] text-xs w-max max-w-[380px] sm:max-w-[460px] text-center text-balance leading-relaxed ${contentClassName}`}
								>
									{content}
									{effectivePos === 'top' ? (
										<div
											style={{ left: `calc(50% + ${coords.arrowOffset}px)` }}
											className="absolute top-full -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 bg-(--background)/95 border-r border-b border-(--border)/20"
										/>
									) : (
										<div
											style={{ left: `calc(50% + ${coords.arrowOffset}px)` }}
											className="absolute bottom-full -translate-x-1/2 -mb-1 w-2 h-2 rotate-45 bg-(--background)/95 border-l border-t border-(--border)/20"
										/>
									)}
								</div>
							</motion.div>
						)}
					</AnimatePresence>,
					document.body
				)}
		</div>
	);
}
