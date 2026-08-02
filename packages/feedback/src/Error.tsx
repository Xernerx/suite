/** @format */
'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error('Route Error:', error);
	}, [error]);

	return (
		<div className='flex h-full min-h-[50vh] flex-col items-center justify-center text-center' style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className='rounded-2xl bg-red-500/10 p-4'>
				<AlertTriangle size={32} className='text-red-500' />
			</div>
			<div className='flex flex-col' style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h2 className='text-xl font-bold text-(--text)'>Something went wrong!</h2>
				<p className='max-w-md text-sm text-(--text-muted)'>We encountered a problem loading this section.</p>
			</div>
			<button
				onClick={() => reset()}
				className='rounded-xl bg-(--foreground) border border-(--border)/10 font-medium text-(--text) transition-colors hover:bg-(--background) shadow-sm'
				style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)', marginTop: 'calc(var(--ui-gap) * 0.5)' }}>
				Try again
			</button>
		</div>
	);
}
