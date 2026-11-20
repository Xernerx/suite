/** @format */

export function StoreCatalogSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
			{[0, 1, 2].map((idx) => (
				<div key={idx} className="h-96 rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md animate-pulse p-6 flex flex-col justify-between">
					<div className="flex flex-col gap-3">
						<div className="h-5 w-28 rounded-full bg-(--background)/60" />
						<div className="h-8 w-48 rounded-2xl bg-(--background)/60" />
						<div className="h-4 w-full rounded-2xl bg-(--background)/50" />
						<div className="h-12 w-32 rounded-2xl bg-(--background)/60 mt-3" />
					</div>
					<div className="h-11 w-full rounded-2xl bg-(--background)/60" />
				</div>
			))}
		</div>
	);
}
