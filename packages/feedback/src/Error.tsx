/** @format */
'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error('Route Error:', error);
	}, [error]);

	return (
		<div className="flex h-full min-h-[50vh] flex-col items-center justify-center p-8 text-center">
			<div className="rounded-full bg-red-500/10 p-4 mb-4">
				<AlertTriangle size={32} className="text-red-500" />
			</div>
			<h2 className="text-xl font-bold text-(--text)">Something went wrong!</h2>
			<p className="mt-2 max-w-md text-sm text-(--text-muted)">We encountered a problem loading this section.</p>
			<button onClick={() => reset()} className="mt-6 rounded-xl bg-(--foreground) border border-(--border)/10 px-4 py-2 font-medium text-(--text) transition-colors hover:bg-(--background) shadow-sm">
				Try again
			</button>
		</div>
	);
}
