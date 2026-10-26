/** @format */

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Xernerx Portal',
		short_name: 'Xernerx Portal',
		description: 'Developer organizations, Discord bot studio, webhooks, releases, and telemetry for Xernerx Studios.',
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
