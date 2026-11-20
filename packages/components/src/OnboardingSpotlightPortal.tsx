/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface OnboardingSpotlightPortalProps {
	active: boolean;
	selectors: string[];
	label?: string;
	kbd?: string;
	preferPointerSide?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

interface TargetLayoutMeta {
	el: HTMLElement;
	isCompact: boolean;
	borderRadius: string;
	pointerSide: 'top' | 'bottom' | 'left' | 'right';
	horizontalAlign: 'left' | 'center' | 'right';
}

export function OnboardingSpotlightPortal({ active, selectors, label, kbd, preferPointerSide = 'auto' }: OnboardingSpotlightPortalProps) {
	const [mounted, setMounted] = useState(false);
	const [targetMeta, setTargetMeta] = useState<TargetLayoutMeta | null>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	const selectorsKey = selectors.filter(Boolean).join('|');

	useEffect(() => {
		if (!mounted || !active || !selectorsKey || typeof window === 'undefined' || typeof document === 'undefined') {
			setTargetMeta(null);
			return;
		}

		let pollTimer: ReturnType<typeof setInterval> | null = null;
		let trackedEl: HTMLElement | null = null;
		let prevInlinePosition = '';
		let prevInlineOverflow = '';
		let prevInlineZIndex = '';

		const restoreElementStyles = () => {
			if (!trackedEl) return;
			trackedEl.style.position = prevInlinePosition;
			trackedEl.style.overflow = prevInlineOverflow;
			trackedEl.style.zIndex = prevInlineZIndex;
			trackedEl = null;
		};

		const locateTarget = () => {
			let found: HTMLElement | null = null;
			for (const sel of selectors) {
				if (!sel) continue;
				const nodes = document.querySelectorAll<HTMLElement>(sel);
				for (let i = 0; i < nodes.length; i++) {
					const node = nodes[i];
					const r = node.getBoundingClientRect();
					const style = window.getComputedStyle(node);
					if (r.width > 2 && r.height > 2 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0.05) {
						found = node;
						break;
					}
				}
				if (found) break;
			}

			if (!found) {
				restoreElementStyles();
				setTargetMeta(null);
				return;
			}

			if (trackedEl !== found) {
				restoreElementStyles();
				trackedEl = found;
				prevInlinePosition = found.style.position;
				prevInlineOverflow = found.style.overflow;
				prevInlineZIndex = found.style.zIndex;

				const computed = window.getComputedStyle(found);
				if (computed.position === 'static') {
					found.style.position = 'relative';
				}
				if (computed.overflow !== 'visible') {
					found.style.overflow = 'visible';
				}
				if (!found.style.zIndex || found.style.zIndex === 'auto') {
					found.style.zIndex = '40';
				}
			}

			const r = found.getBoundingClientRect();
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const isCompact = r.width <= 220 && r.height <= 90;
			const computedRadius = window.getComputedStyle(found).borderRadius;
			const borderRadius = isCompact ? (computedRadius && computedRadius !== '0px' ? computedRadius : '9999px') : '24px';

			let pointerSide: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
			if (preferPointerSide !== 'auto') {
				pointerSide = preferPointerSide;
			} else if (r.top < 95 && r.height < 110) {
				pointerSide = 'bottom';
			} else if (r.left < 90 && r.width <= 360 && r.right + 190 < vw) {
				pointerSide = 'right';
			} else if (r.right > vw - 90 && r.width <= 360 && r.left > 190) {
				pointerSide = 'left';
			} else if (r.top > vh - 150 && r.height < 130) {
				pointerSide = 'top';
			} else if (r.top > 72) {
				pointerSide = 'top';
			}

			let horizontalAlign: 'left' | 'center' | 'right' = 'center';
			if (r.left < 150) {
				horizontalAlign = 'left';
			} else if (r.right > vw - 150) {
				horizontalAlign = 'right';
			}

			setTargetMeta((prev) => {
				if (prev && prev.el === found && prev.isCompact === isCompact && prev.borderRadius === borderRadius && prev.pointerSide === pointerSide && prev.horizontalAlign === horizontalAlign) {
					return prev;
				}
				return { el: found, isCompact, borderRadius, pointerSide, horizontalAlign };
			});
		};

		locateTarget();
		const t1 = setTimeout(locateTarget, 100);
		const t2 = setTimeout(locateTarget, 280);
		const t3 = setTimeout(locateTarget, 600);
		pollTimer = setInterval(locateTarget, 250);

		window.addEventListener('resize', locateTarget, { passive: true });

		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
			clearTimeout(t3);
			if (pollTimer) clearInterval(pollTimer);
			window.removeEventListener('resize', locateTarget);
			restoreElementStyles();
		};
	}, [mounted, active, selectorsKey, preferPointerSide]);

	if (!mounted || !active || !targetMeta || typeof document === 'undefined') return null;

	const { el, isCompact, borderRadius, pointerSide, horizontalAlign } = targetMeta;
	const rippleScaleOuter = isCompact ? 1.45 : 1.04;
	const rippleScaleMid = isCompact ? 1.24 : 1.02;

	const horizontalAnchorClass = horizontalAlign === 'left' ? 'left-0' : horizontalAlign === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2';

	const pointerPosClass =
		pointerSide === 'bottom'
			? `top-full mt-2.5 ${horizontalAnchorClass}`
			: pointerSide === 'top'
				? `bottom-full mb-2.5 ${horizontalAnchorClass}`
				: pointerSide === 'right'
					? 'left-full ml-3 top-1/2 -translate-y-1/2'
					: 'right-full mr-3 top-1/2 -translate-y-1/2';

	return createPortal(
		<span data-onboarding-relative-spotlight="true" className="pointer-events-none select-none absolute inset-0 z-[10001] overflow-visible block" aria-hidden="true">
			{/* Relative Spotlight Ring & Expanding Pulse Ripples (Anchored directly to target element) */}
			<motion.span
				key={`rel-ring-${selectorsKey}`}
				initial={{ opacity: 0, scale: 0.72 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.85 }}
				transition={{
					type: 'spring',
					stiffness: 380,
					damping: 22,
				}}
				style={{ borderRadius }}
				className={`block absolute ${
					isCompact ? '-inset-2' : '-inset-1'
				} border-2 border-(--accent) bg-(--accent)/[0.10] shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_75%,transparent),inset_0_0_14px_color-mix(in_srgb,var(--accent)_35%,transparent)]`}
			>
				{/* Expanding Pulse Ripple 1 */}
				<motion.span
					key={`rel-ripple-1-${selectorsKey}`}
					initial={{ scale: 1, opacity: 0.85 }}
					animate={{
						scale: [1, rippleScaleMid, rippleScaleOuter],
						opacity: [0.85, 0.4, 0],
					}}
					transition={{
						duration: 1.8,
						repeat: Infinity,
						ease: 'easeOut',
					}}
					style={{ borderRadius }}
					className="block absolute inset-0 border-2 border-(--accent)"
				/>

				{/* Expanding Pulse Ripple 2 (Staggered) */}
				<motion.span
					key={`rel-ripple-2-${selectorsKey}`}
					initial={{ scale: 1, opacity: 0.7 }}
					animate={{
						scale: [1, rippleScaleMid, rippleScaleOuter],
						opacity: [0.7, 0.3, 0],
					}}
					transition={{
						duration: 1.8,
						delay: 0.9,
						repeat: Infinity,
						ease: 'easeOut',
					}}
					style={{ borderRadius }}
					className="block absolute inset-0 border border-(--accent)/80"
				/>

				{/* Corner Accent Brackets for Larger Sections */}
				{!isCompact && (
					<>
						<span className="block absolute -top-1 -left-1 h-4 w-4 rounded-tl-xl border-t-3 border-l-3 border-white drop-shadow-[0_0_8px_var(--accent)]" />
						<span className="block absolute -top-1 -right-1 h-4 w-4 rounded-tr-xl border-t-3 border-r-3 border-white drop-shadow-[0_0_8px_var(--accent)]" />
						<span className="block absolute -bottom-1 -left-1 h-4 w-4 rounded-bl-xl border-b-3 border-l-3 border-white drop-shadow-[0_0_8px_var(--accent)]" />
						<span className="block absolute -bottom-1 -right-1 h-4 w-4 rounded-br-xl border-b-3 border-r-3 border-white drop-shadow-[0_0_8px_var(--accent)]" />
					</>
				)}
			</motion.span>

			{/* Relative Bouncing Directional Beacon Pill */}
			<AnimatePresence mode="wait">
				<motion.span
					key={`rel-beacon-${selectorsKey}-${pointerSide}-${horizontalAlign}`}
					initial={{ opacity: 0, scale: 0.85 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.85 }}
					transition={{ type: 'spring', stiffness: 360, damping: 24 }}
					className={`block absolute ${pointerPosClass} z-[10002] w-max`}
				>
					<motion.span
						animate={pointerSide === 'bottom' ? { y: [0, 6, 0] } : pointerSide === 'top' ? { y: [0, -6, 0] } : pointerSide === 'right' ? { x: [0, 6, 0] } : { x: [0, -6, 0] }}
						transition={{
							duration: 1.1,
							repeat: Infinity,
							ease: 'easeInOut',
						}}
						className="inline-flex items-center gap-1.5 rounded-full bg-(--accent) px-3 py-1 text-[11px] font-extrabold text-white border border-white/30 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_85%,transparent)] whitespace-nowrap"
					>
						{pointerSide === 'bottom' && horizontalAlign !== 'right' && <ChevronUp size={14} strokeWidth={3} className="shrink-0" />}
						{pointerSide === 'right' && <ChevronLeft size={14} strokeWidth={3} className="shrink-0" />}
						<Sparkles size={11} className="shrink-0" />
						{label && <span className="max-w-[190px] truncate">{label}</span>}
						{kbd && <span className="rounded-md bg-black/25 px-1.5 py-0.2 font-mono text-[10px]">{kbd}</span>}
						{pointerSide === 'bottom' && horizontalAlign === 'right' && <ChevronUp size={14} strokeWidth={3} className="shrink-0" />}
						{pointerSide === 'top' && <ChevronDown size={14} strokeWidth={3} className="shrink-0" />}
						{pointerSide === 'left' && <ChevronRight size={14} strokeWidth={3} className="shrink-0" />}
					</motion.span>
				</motion.span>
			</AnimatePresence>
		</span>,
		el
	);
}
