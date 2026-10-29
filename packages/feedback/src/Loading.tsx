/** @format */
'use client';

import { useEffect, useId } from 'react';
import { useLoading } from '@xernerx/providers';
import { XernerxDotLogo } from './XernerxDotLogo';

export function Loading({ message, variant = 'default' }: { message?: string; variant?: 'default' | 'small' }) {
	const isSmall = variant === 'small';
	const loaderId = useId();
	const { registerLoader, unregisterLoader } = useLoading();

	useEffect(() => {
		if (isSmall) return;
		registerLoader(loaderId, message);
		return () => {
			unregisterLoader(loaderId);
		};
	}, [isSmall, loaderId, message, registerLoader, unregisterLoader]);

	if (isSmall) {
		return (
			<div className="flex h-full w-full flex-col items-center justify-center" style={{ padding: 0, gap: 'var(--ui-gap)' }}>
				<div className="relative block w-[52px] max-w-[52px] shrink-0 select-none" style={{ width: '52px', height: '38px' }}>
					<XernerxDotLogo variant="icon" width={208} height={152} cols={36} showAmbientField={false} ripple={true} className="w-full h-full" />
				</div>
				{message && <div className="font-medium text-(--accent) text-xs">{message}</div>}
			</div>
		);
	}

	// Default full loading state is housed centrally inside AppLayout (Page.tsx)
	return (
		<div className="flex h-full min-h-[60dvh] w-full flex-col items-center justify-center" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			{message && <div className="font-medium text-(--accent) text-sm mt-44">{message}</div>}
		</div>
	);
}
