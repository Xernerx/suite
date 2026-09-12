'use client';
import { useSidebar } from '@xernerx/providers';
import { useEffect } from 'react';

export default function SidebarTrigger() {
	const { show } = useSidebar();
	const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? require('react').useLayoutEffect : useEffect;

	useIsomorphicLayoutEffect(() => {
		show();
	}, [show]);

	return null;
}
