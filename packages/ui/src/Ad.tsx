/** @format */
'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

export interface AdProps {
	type?: 'square' | 'rectangle';
	className?: string;
}

const AD_CLIENT = 'ca-pub-4242117068384423';
const AD_SLOTS: Record<'square' | 'rectangle', string> = {
	square: '3694236068',
	rectangle: '3598975090',
};

export function Ad({ type = 'rectangle', className = '' }: AdProps) {
	const pushedRef = useRef(false);

	useEffect(() => {
		if (pushedRef.current) return;
		pushedRef.current = true;
		try {
			((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
		} catch {}
	}, [type]);

	return (
		<div className={`rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md overflow-hidden p-2 ${className}`.trim()}>
			<Script
				id="xernerx-adsense-script"
				strategy="afterInteractive"
				async
				src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
				crossOrigin="anonymous"
			/>
			<ins
				className="adsbygoogle"
				style={{ display: 'block' }}
				data-ad-client={AD_CLIENT}
				data-ad-slot={AD_SLOTS[type]}
				data-ad-format="auto"
				data-full-width-responsive="true"
			/>
		</div>
	);
}

export default Ad;
