/** @format */
'use client';

import React from 'react';

export function BlogGridSkeleton() {
	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }} aria-busy="true">
			{/* Featured Card Shimmer */}
			<div
				className="flex flex-col justify-between rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm animate-pulse"
				style={{ padding: 'calc(var(--ui-gap) * 1.25)', gap: 'calc(var(--ui-gap) * 0.75)' }}
			>
				<div className="flex items-center justify-between gap-3">
					<div className="h-6 w-28 rounded-full bg-(--background)/60 border border-(--border)/10" />
					<div className="h-4 w-32 rounded-full bg-(--background)/50" />
				</div>
				<div className="flex flex-col gap-3">
					<div className="h-8 w-4/5 rounded-2xl bg-(--background)/60" />
					<div className="h-4 w-full max-w-2xl rounded-full bg-(--background)/50" />
					<div className="h-4 w-2/3 rounded-full bg-(--background)/50" />
				</div>
				<div className="flex items-center justify-between pt-3 border-t border-(--border)/10">
					<div className="flex items-center gap-2.5">
						<div className="h-7 w-7 rounded-full bg-(--background)/60" />
						<div className="h-4 w-28 rounded-full bg-(--background)/50" />
					</div>
					<div className="h-4 w-24 rounded-full bg-(--accent)/20" />
				</div>
			</div>

			{/* Article Grid Shimmer */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
				{[0, 1, 2].map((idx) => (
					<div
						key={idx}
						className="flex flex-col justify-between rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm animate-pulse"
						style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
					>
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between gap-2">
								<div className="h-6 w-24 rounded-full bg-(--background)/60 border border-(--border)/10" />
								<div className="h-4 w-20 rounded-full bg-(--background)/50" />
							</div>
							<div className="h-6 w-5/6 rounded-2xl bg-(--background)/60" />
							<div className="h-4 w-full rounded-full bg-(--background)/50" />
							<div className="h-4 w-3/4 rounded-full bg-(--background)/50" />
						</div>
						<div className="flex items-center justify-between pt-3 border-t border-(--border)/10">
							<div className="flex items-center gap-2">
								<div className="h-6 w-6 rounded-full bg-(--background)/60" />
								<div className="h-3.5 w-24 rounded-full bg-(--background)/50" />
							</div>
							<div className="h-3.5 w-16 rounded-full bg-(--accent)/20" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export function BlogHomeSkeleton() {
	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }} aria-busy="true">
			<div className="flex flex-col gap-4 pt-2 animate-pulse">
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
					<div className="flex flex-col gap-2">
						<div className="h-10 w-64 rounded-2xl bg-(--foreground)/35 border border-(--border)/10" />
						<div className="h-4 w-96 max-w-full rounded-full bg-(--foreground)/30" />
					</div>
					<div className="h-10 w-full md:w-72 rounded-2xl bg-(--foreground)/30 border border-(--border)/10" />
				</div>
				<div className="flex flex-wrap items-center gap-2 border-b border-(--border)/10 pb-4">
					{[0, 1, 2, 3, 4, 5].map((i) => (
						<div key={i} className="h-7 w-24 rounded-full bg-(--foreground)/30 border border-(--border)/10" />
					))}
				</div>
			</div>
			<BlogGridSkeleton />
		</div>
	);
}

export function BlogArticleSkeleton() {
	return (
		<div className="min-h-screen px-6 py-16 lg:py-24" aria-busy="true">
			<div className="max-w-(--page-width) mx-auto w-full grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-16">
				<aside className="hidden lg:flex flex-col gap-6 animate-pulse">
					<div className="h-4 w-28 rounded-full bg-(--foreground)/30" />
					<div className="flex flex-col gap-3 pt-4">
						{[0, 1, 2, 3].map((i) => (
							<div key={i} className="h-4 w-44 rounded-full bg-(--foreground)/30" />
						))}
					</div>
				</aside>
				<div className="space-y-10 min-w-0">
					<div className="rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 p-8 sm:p-10 shadow-sm animate-pulse flex flex-col items-center gap-4">
						<div className="h-6 w-32 rounded-full bg-(--accent)/20" />
						<div className="h-10 w-4/5 rounded-2xl bg-(--background)/60" />
						<div className="h-4 w-3/4 rounded-full bg-(--background)/50" />
						<div className="w-full pt-5 mt-2 border-t border-(--border)/10 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="h-9 w-9 rounded-full bg-(--background)/60" />
								<div className="h-4 w-32 rounded-full bg-(--background)/50" />
							</div>
							<div className="h-4 w-36 rounded-full bg-(--background)/50" />
						</div>
					</div>
					<div className="rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 p-8 sm:p-10 shadow-sm animate-pulse space-y-4">
						{[0, 1, 2, 3, 4, 5].map((i) => (
							<div key={i} className="h-4 w-full rounded-full bg-(--background)/50" />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
