/** @format */
'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Infinite scroll hook tailored for Xernerx Suite's `#main-scroll-container`.
 * Avoids `IntersectionObserver` premature triggers caused by CSS `zoom` on `html`
 * and Framer Motion layout shifts, firing strictly when the user scrolls to the
 * very bottom of `#main-scroll-container`.
 */
export function useInfiniteScroll(hasMore: boolean, loading: boolean, onLoadMore: () => void) {
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const lastTriggerRef = useRef(0);
	const onLoadMoreRef = useRef(onLoadMore);
	useEffect(() => {
		onLoadMoreRef.current = onLoadMore;
	}, [onLoadMore]);

	const tryLoadMore = useCallback((requirePositiveScroll: boolean) => {
		const now = Date.now();
		if (now - lastTriggerRef.current < 650) return;

		const scrollEl = document.getElementById('main-scroll-container');
		if (scrollEl) {
			const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
			if (requirePositiveScroll && maxScroll > 8 && scrollEl.scrollTop <= 0) {
				return;
			}
			const distanceFromBottom = maxScroll - scrollEl.scrollTop;
			if (distanceFromBottom <= 16) {
				lastTriggerRef.current = now;
				onLoadMoreRef.current();
			}
			return;
		}

		// Fallback to window scroll if outside AppLayout
		const doc = document.documentElement;
		const maxScroll = doc.scrollHeight - window.innerHeight;
		if (requirePositiveScroll && maxScroll > 8 && window.scrollY <= 0) return;
		if (maxScroll - window.scrollY <= 16) {
			lastTriggerRef.current = now;
			onLoadMoreRef.current();
		}
	}, []);

	useEffect(() => {
		if (!hasMore || loading || typeof window === 'undefined') return;

		const scrollEl = document.getElementById('main-scroll-container');
		const target: HTMLElement | Window = scrollEl || window;

		const handleScroll = () => {
			tryLoadMore(true);
		};

		const handleWheel = (e: Event) => {
			const wheelEvent = e as WheelEvent;
			if (wheelEvent.deltaY > 0) {
				tryLoadMore(false);
			}
		};

		target.addEventListener('scroll', handleScroll, { passive: true });
		target.addEventListener('wheel', handleWheel, { passive: true });

		return () => {
			target.removeEventListener('scroll', handleScroll);
			target.removeEventListener('wheel', handleWheel);
		};
	}, [hasMore, loading, tryLoadMore]);

	const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
		sentinelRef.current = node;
	}, []);

	return loadMoreRef;
}
