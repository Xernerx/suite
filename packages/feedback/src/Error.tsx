/** @format */
'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { useDictionary } from '@xernerx/providers';
export function Error({
	error,
	reset,
}: {
	error: Error & {
		digest?: string;
	};
	reset: () => void;
}) {
	useEffect(() => {
		console.error('Route Error:', error);
	}, [error]);
	return (
		<div
			className="flex h-full min-h-[50vh] flex-col items-center justify-center text-center"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
			}}
		>
			<div className="rounded-2xl bg-red-500/10 p-4">
				<AlertTriangle size={32} className="text-red-500" />
			</div>
			<div
				className="flex flex-col"
				style={{
					gap: 'calc(var(--ui-gap) * 0.25)',
				}}
			>
				<h2 className="text-xl font-bold text-(--text)">Something went wrong!</h2>
				<p className="max-w-md text-sm text-(--text-muted)">An unexpected error occurred while loading this page. Please try again or contact support if the issue persists.</p>
				<div className="mt-4 p-4 bg-(--background) rounded-xl border border-(--border)/10 text-left w-full max-w-lg overflow-auto">
					<p className="text-xs font-mono text-red-400 font-bold mb-1">Error Details:</p>
					<p className="text-xs font-mono text-(--text-muted) break-words">{error.message || 'Unknown Error'}</p>
					{error.digest && <p className="text-xs font-mono text-(--text-muted) mt-2">Digest: {error.digest}</p>}
				</div>
			</div>
			<button
				onClick={() => reset()}
				className="rounded-xl bg-(--foreground) border border-(--border)/10 font-medium text-(--text) transition-colors hover:bg-(--background) shadow-sm"
				style={{
					padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
					marginTop: 'calc(var(--ui-gap) * 0.5)',
				}}
			>
				Try again
			</button>
		</div>
	);
}
