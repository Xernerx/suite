/** @format */
'use client';

import Link from 'next/link';

export default function NotFound() {
	return (
		<div className="flex h-full w-full items-center justify-center">
			<div className="w-full max-w-2xl px-[calc(var(--ui-gap)*2)] py-[calc(var(--ui-gap)*2.25)] text-center">
				<div
					className="mx-auto mb-[calc(var(--ui-gap)*1.25)] flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold"
					style={{
						background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
						color: 'var(--accent)',
					}}
				>
					404
				</div>

				<h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>

				<p className="mx-auto mt-3 max-w-md text-sm" style={{ color: 'var(--text-muted)' }}>
					The page you are looking for does not exist or is no longer available.
				</p>

				<div className="mt-[calc(var(--ui-gap)*1.5)] flex items-center justify-center gap-(--ui-gap)">
					<Link
						href="/"
						className="rounded-xl px-4 py-2 text-sm font-medium transition"
						style={{
							background: 'var(--accent)',
							color: 'white',
						}}
					>
						Home
					</Link>
				</div>
			</div>
		</div>
	);
}
