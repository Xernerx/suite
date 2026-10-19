/** @format */

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Xernerx Info & Support Hub',
		short_name: 'Xernerx Info',
		description: 'System status, product roadmap, bug tracker, feature suggestions, changelog, and FAQ for Xernerx Studios.',
		start_url: '/',
		display: 'standalone',
		background_color: '#09090b',
		theme_color: '#6366f1',
		icons: [
			{
				src: '/favicon.ico',
				sizes: 'any',
				type: 'image/x-icon',
			},
		],
	};
}
