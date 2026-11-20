/** @format */
'use client';

interface AdminSkeletonProps {
	variant?: 'shell' | 'home' | 'seo' | 'grid';
}

export function AdminSkeleton({ variant = 'home' }: AdminSkeletonProps) {
	return (
		<div
			className={`flex flex-col w-full ${variant === 'shell' ? 'max-w-(--page-width) mx-auto' : ''}`}
			style={variant === 'shell' ? { padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' } : { gap: 'var(--ui-gap)' }}
		>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-col gap-2">
					<div className="h-8 w-64 rounded-2xl bg-(--foreground)/40 border border-(--border)/10 animate-pulse" />
					<div className="h-4 w-96 max-w-full rounded-full bg-(--foreground)/30 border border-(--border)/10 animate-pulse" />
				</div>
				<div className="flex items-center gap-2">
					<div className="h-10 w-32 rounded-2xl bg-(--foreground)/30 border border-(--border)/10 animate-pulse" />
					<div className="h-10 w-32 rounded-2xl bg-(--foreground)/30 border border-(--border)/10 animate-pulse" />
				</div>
			</div>

			{variant === 'grid' ? (
				<>
					<div className="h-16 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 animate-pulse" />
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" style={{ gap: 'var(--ui-gap)' }}>
						{[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
							<div key={idx} className="h-56 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 animate-pulse p-4 flex flex-col justify-between">
								<div className="h-32 w-full rounded-2xl bg-(--background)/50" />
								<div className="flex flex-col gap-2">
									<div className="h-4 w-3/4 rounded-full bg-(--background)/60" />
									<div className="h-3 w-1/2 rounded-full bg-(--background)/50" />
								</div>
							</div>
						))}
					</div>
				</>
			) : (
				<>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--ui-gap)' }}>
						{[0, 1, 2, 3].map((idx) => (
							<div key={idx} className="h-28 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 animate-pulse p-5 flex flex-col justify-between">
								<div className="h-3 w-24 rounded-full bg-(--background)/60" />
								<div className="h-8 w-16 rounded-2xl bg-(--background)/60" />
								<div className="h-3 w-36 rounded-full bg-(--background)/50" />
							</div>
						))}
					</div>

					{variant !== 'seo' && (
						<div className="h-44 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 animate-pulse p-6 flex flex-col justify-between">
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-2xl bg-(--background)/60" />
								<div className="flex flex-col gap-1.5">
									<div className="h-4 w-48 rounded-full bg-(--background)/60" />
									<div className="h-3 w-64 rounded-full bg-(--background)/50" />
								</div>
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
								{[0, 1, 2, 3, 4, 5, 6].map((idx) => (
									<div key={idx} className="h-16 rounded-2xl bg-(--background)/50 border border-(--border)/10" />
								))}
							</div>
						</div>
					)}

					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
						{[0, 1, 2, 3, 4, 5].map((idx) => (
							<div key={idx} className="h-44 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 animate-pulse p-5 flex flex-col justify-between">
								<div className="flex items-center justify-between">
									<div className="h-5 w-36 rounded-full bg-(--background)/60" />
									<div className="h-6 w-16 rounded-full bg-(--background)/50" />
								</div>
								<div className="h-14 w-full rounded-2xl bg-(--background)/50" />
								<div className="h-8 w-full rounded-2xl bg-(--background)/50" />
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}
