/** @format */

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Xernerx Hosting',
		short_name: 'Xernerx Hosting',
		description: 'Staff-guarded server infrastructure and Easypanel multi-node console for one-dummi and two-dummi.',
		start_url: '/',
		display: 'standalone',
		background_color: '#09090b',
		theme_color: '#6366f1',
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
