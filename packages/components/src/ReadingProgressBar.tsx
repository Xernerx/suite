/** @format */
'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function ReadingProgressBar() {
	const [slot, setSlot] = useState<HTMLElement | null>(null);
	const barRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setSlot(document.getElementById('page-progress-slot'));
	}, []);

	// Fallback for browsers without native CSS scroll-driven animations
	useEffect(() => {
		if (!slot) return;
		if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timeline', 'scroll()')) {
			return;
		}
		if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
			return;
		}

		const scroller = document.getElementById('main-scroll-container');
		if (!scroller) return;

		let rafId = 0;
		const updateProgress = () => {
			rafId = 0;
			const bar = barRef.current;
			if (!bar) return;
			const scrollable = scroller.scrollHeight - scroller.clientHeight;
			const progress = scrollable > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / scrollable)) : 0;
			bar.style.transform = `scaleX(${progress})`;
		};

		const onScroll = () => {
			if (!rafId) rafId = window.requestAnimationFrame(updateProgress);
		};

		updateProgress();
		scroller.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });
		return () => {
			scroller.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			if (rafId) window.cancelAnimationFrame(rafId);
		};
	}, [slot]);

	if (!slot) return null;

	return createPortal(
		<div aria-hidden="true" className="xrx-reading-progress-track pointer-events-none h-[3px] w-full bg-(--border)/10">
			<div ref={barRef} className="xrx-reading-progress-bar h-full w-full bg-(--accent) shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_65%,transparent)]" />
		</div>,
		slot
	);
}
