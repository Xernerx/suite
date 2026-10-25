/** @format */

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Xernerx Studios',
		short_name: 'Xernerx',
		description: '1 Account, 1 Place, 1 Setup. Unified dashboard and bot suite for Virtue, Metamorphosis, Zodiac, Discord bot stats, public bot listings, and developer frameworks.',
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
