/** @format */
'use client';
import { useSidebar } from '@xernerx/providers';
import { useEffect, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function SidebarTrigger() {
	const { show } = useSidebar();

	useIsomorphicLayoutEffect(() => {
		show();
	}, [show]);

	return null;
}
