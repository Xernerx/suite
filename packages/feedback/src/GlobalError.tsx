/** @format */
'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	// Initialize preferences from cookies in case the root layout crashed before setting them
	useEffect(() => {
		try {
			const getCookie = (name: string) => {
				const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
				return match ? match[2] : null;
			};

			const zoom = getCookie('uiZoom');
			if (zoom) document.documentElement.style.zoom = String(parseInt(zoom, 10) / 100);

			const gap = getCookie('uiGap');
			if (gap) document.documentElement.style.setProperty('--ui-gap', `${gap}px`);

			const textScale = getCookie('textScale');
			if (textScale) document.documentElement.style.setProperty('--text-scale', `${textScale}px`);
		} catch {}
	}, []);

	return (
		<html lang='en'>
			<body className='flex min-h-screen flex-col items-center justify-center text-center bg-(--background) text-(--text)' style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className='rounded-2xl bg-red-500/10 p-4'>
					<AlertTriangle size={48} className='text-red-500' />
				</div>
				<div className='flex flex-col items-center' style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h2 className='text-2xl font-bold'>Fatal Application Error</h2>
					<p className='text-sm text-(--text-muted) max-w-md'>The core layout failed to load.</p>
				</div>
				<button
					onClick={() => reset()}
					className='rounded-xl bg-(--accent) font-medium text-white transition-colors hover:bg-(--accent-hover) shadow-sm'
					style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}>
					Restart Application
				</button>
			</body>
		</html>
	);
}
