/** @format */
'use client';

import { Suspense } from 'react';
import { Loading } from '@xernerx/feedback';
import { MobileOAuthHandoffView } from '@/components/MobileOAuthHandoffView';

export default function MobileLoginPage() {
	return (
		<Suspense fallback={<Loading />}>
			<MobileOAuthHandoffView />
		</Suspense>
	);
}
