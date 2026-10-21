/** @format */

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Xernerx CDN & Media Pipeline',
		short_name: 'Xernerx CDN',
		description: 'Official Xernerx Studios content delivery network, high-speed media pipeline, and asset storage.',
		start_url: '/',
		display: 'standalone',
		background_color: '#0e1015',
		theme_color: '#5865f2',
		icons: [
			{
				src: '/logo.png',
				sizes: '512x512',
				type: 'image/png',
			},
			{
				src: '/icon.png',
				sizes: '192x192',
				type: 'image/png',
			},
		],
	};
}
