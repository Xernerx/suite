/** @format */
'use client';

import { Suspense } from 'react';
import { useDictionary } from '@xernerx/providers';
import { QrApproveView } from '@/components/QrApproveView';

export default function ApproveLoginPage() {
	const { t } = useDictionary();
	return (
		<Suspense fallback={<div className="flex h-screen items-center justify-center">{t('account.login.description')}</div>}>
			<QrApproveView />
		</Suspense>
	);
}
