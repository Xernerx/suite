/** @format */
'use client';

import { useEffect } from 'react';
import { useEnvironment } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';

export default function PortalRedirectPage() {
	const { getEnvUrl, isReady } = useEnvironment();

	useEffect(() => {
		if (!isReady) return;
		const search = typeof window !== 'undefined' ? window.location.search : '';
		window.location.replace(getEnvUrl(`https://portal.xernerx.com${search}`));
	}, [getEnvUrl, isReady]);

	return (
		<div className="flex-1 flex flex-col items-center justify-center py-20 text-(--text-muted)">
			<Loading variant="default" />
		</div>
	);
}
