/** @format */
'use client';

import { Loading } from '@xernerx/feedback';

export default function RouteLoading() {
	return (
		<div className="flex-1 flex flex-col items-center justify-center py-20 text-(--text-muted)">
			<Loading variant="default" />
		</div>
	);
}
