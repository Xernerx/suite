/** @format */
'use client';
import { useDictionary, useSidebar } from '@xernerx/providers';
import { useEffect, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function SidebarTrigger() {
	const { show } = useSidebar();
	const { t } = useDictionary();

	useIsomorphicLayoutEffect(() => {
		show();
	}, [show]);

	return null;
}
