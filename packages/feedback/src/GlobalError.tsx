/** @format */
'use client';

import { AlertTriangle } from 'lucide-react';

export function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<html lang="en">
			<body className="flex min-h-screen flex-col items-center justify-center bg-(--background) text-(--text)">
				<div className="rounded-full bg-red-500/10 p-4 mb-4">
					<AlertTriangle size={48} className="text-red-500" />
				</div>
				<h2 className="text-2xl font-bold">Fatal Application Error</h2>
				<p className="mt-2 text-(--text-muted)">The core layout failed to load.</p>
				<button onClick={() => reset()} className="mt-6 rounded-xl bg-(--accent) px-4 py-2 font-medium text-white transition-colors hover:bg-opacity-90">
					Restart Application
				</button>
			</body>
		</html>
	);
}
