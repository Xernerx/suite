/** @format */
'use client';

interface AccountViewSkeletonProps {
	variant?: 'default' | 'list' | 'billing' | 'grid' | 'activity';
}

export function AccountViewSkeleton({ variant = 'default' }: AccountViewSkeletonProps) {
	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex flex-col gap-2">
					<div className="h-9 w-56 rounded-2xl bg-(--foreground)/40 border border-(--border)/10 animate-pulse" />
					<div className="h-4 w-80 max-w-full rounded-full bg-(--foreground)/30 border border-(--border)/10 animate-pulse" />
				</div>
				<div className="h-10 w-36 rounded-2xl bg-(--foreground)/30 border border-(--border)/10 animate-pulse" />
			</div>

			{(variant === 'billing' || variant === 'activity') && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--ui-gap)' }}>
					{[0, 1, 2, 3].map((idx) => (
						<div key={idx} className="h-24 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 animate-pulse p-5 flex items-center justify-between">
							<div className="flex flex-col gap-2">
								<div className="h-3 w-20 rounded-full bg-(--background)/60" />
								<div className="h-7 w-16 rounded-2xl bg-(--background)/60" />
							</div>
							<div className="h-11 w-11 rounded-2xl bg-(--background)/60" />
						</div>
					))}
				</div>
			)}

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
				<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<div className="h-44 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 animate-pulse p-6 flex flex-col justify-between">
						<div className="flex items-center gap-4">
							<div className="h-14 w-14 rounded-2xl bg-(--background)/60 shrink-0" />
							<div className="flex flex-col gap-2 flex-1">
								<div className="h-5 w-48 rounded-full bg-(--background)/60" />
								<div className="h-3.5 w-72 max-w-full rounded-full bg-(--background)/50" />
							</div>
						</div>
						<div className="h-10 w-full rounded-2xl bg-(--background)/50" />
					</div>
					{[0, 1, 2].map((idx) => (
						<div key={idx} className="h-24 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 animate-pulse p-5 flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="h-11 w-11 rounded-2xl bg-(--background)/60 shrink-0" />
								<div className="flex flex-col gap-2">
									<div className="h-4 w-44 rounded-full bg-(--background)/60" />
									<div className="h-3 w-28 rounded-full bg-(--background)/50" />
								</div>
							</div>
							<div className="h-8 w-24 rounded-full bg-(--background)/50" />
						</div>
					))}
				</div>
			)}
		</div>
	);
}
