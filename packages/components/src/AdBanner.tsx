'use client';

import { useEffect } from 'react';

interface AdBannerProps {
	dataAdSlot: string;
	dataAdFormat?: string;
	dataFullWidthResponsive?: boolean;
}

export function AdBanner({ dataAdSlot, dataAdFormat = 'auto', dataFullWidthResponsive = true }: AdBannerProps) {
	useEffect(() => {
		try {
			// @ts-ignore
			(window.adsbygoogle = window.adsbygoogle || []).push({});
		} catch (err) {
			console.error('AdSense error', err);
		}
	}, []);

	return (
		<ins
			className="adsbygoogle"
			style={{ display: 'block' }}
			data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
			data-ad-slot={dataAdSlot}
			data-ad-format={dataAdFormat}
			data-full-width-responsive={dataFullWidthResponsive}
			data-ad-test={process.env.NODE_ENV === 'development' ? 'on' : undefined}
		/>
	);
}
