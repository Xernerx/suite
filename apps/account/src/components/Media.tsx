/** @format */
'use client';

import { MediaManager } from '@xernerx/components';
import { useLoading } from '@xernerx/providers';
import { AccountViewSkeleton } from './AccountViewSkeleton';

export default function Media() {
	const { isLoading } = useLoading();

	return (
		<>
			{isLoading && <AccountViewSkeleton variant="grid" />}
			<div className={isLoading ? 'sr-only h-0 overflow-hidden pointer-events-none' : 'w-full'}>
				<MediaManager scope="self" />
			</div>
		</>
	);
}
