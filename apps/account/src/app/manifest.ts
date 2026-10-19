/** @format */

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Xernerx Account Hub',
		short_name: 'Account',
		description: 'Manage your Xernerx identity, profile preferences, developer tokens, and billing.',
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
