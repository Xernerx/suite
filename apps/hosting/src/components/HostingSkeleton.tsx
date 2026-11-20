/** @format */
'use client';

export function HostingSkeleton() {
	return (
		<div
			className="flex flex-col flex-1 w-full max-w-(--page-width) mx-auto h-[calc(100dvh-50px-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] overflow-hidden"
			style={{ padding: 'calc(var(--ui-gap) * 0.75)', gap: 'calc(var(--ui-gap) * 0.75)' }}
		>
			<div className="flex flex-wrap items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md animate-pulse px-4 py-3 gap-3 shrink-0">
				<div className="flex items-center gap-2">
					<div className="h-8 w-28 rounded-2xl bg-(--background)/60" />
					<div className="h-8 w-28 rounded-2xl bg-(--background)/50" />
					<div className="h-8 w-28 rounded-2xl bg-(--background)/50" />
				</div>
				<div className="flex items-center gap-2">
					<div className="h-8 w-32 rounded-2xl bg-(--background)/50" />
					<div className="h-8 w-24 rounded-2xl bg-(--background)/50" />
				</div>
			</div>

			<div className="flex-1 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md animate-pulse p-6 flex flex-col gap-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{[0, 1, 2, 3].map((idx) => (
						<div key={idx} className="h-24 rounded-2xl bg-(--background)/50 border border-(--border)/10" />
					))}
				</div>
				<div className="flex-1 rounded-2xl bg-(--background)/50 border border-(--border)/10" />
			</div>
		</div>
	);
}
