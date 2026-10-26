/** @format */
'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useEnvironment } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';

export default function PortalBotRedirectPage() {
	const params = useParams();
	const { getEnvUrl, isReady } = useEnvironment();
	const botId = params?.id as string;

	useEffect(() => {
		if (!isReady || !botId) return;
		const search = typeof window !== 'undefined' ? window.location.search : '';
		window.location.replace(getEnvUrl(`https://portal.xernerx.com/bots/${botId}${search}`));
	}, [botId, getEnvUrl, isReady]);

	return (
		<div className="flex-1 flex flex-col items-center justify-center py-20 text-(--text-muted)">
			<Loading variant="default" />
		</div>
	);
}
