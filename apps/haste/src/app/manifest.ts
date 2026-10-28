/** @format */

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Xernerx Haste',
		short_name: 'Xernerx Haste',
		description: 'Fast code and text pastebin with TTL expirations, raw streaming, and 3-tier privacy for Xernerx Studios.',
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
