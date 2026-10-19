/** @format */

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Xernerx Dashboard',
		short_name: 'Xernerx App',
		description: 'Manage your Discord servers, bots, and Virtue settings on the Xernerx Dashboard.',
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
