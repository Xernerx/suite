/** @format */

import React, { Suspense } from 'react';
import { Loading } from '@xernerx/feedback';
import CompareStudioClient from '@/components/CompareStudioClient';

export default function ComparePage() {
	return (
		<Suspense fallback={<Loading />}>
			<CompareStudioClient />
		</Suspense>
	);
}
