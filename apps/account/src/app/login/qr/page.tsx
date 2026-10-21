/** @format */
'use client';

import { Loading } from '@xernerx/feedback';
import { QrApproveView } from '../../../components/QrApproveView';
import { Suspense } from 'react';

export default function QrPage() {
	return (
		<Suspense fallback={<Loading />}>
			<QrApproveView />
		</Suspense>
	);
}
