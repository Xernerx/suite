/** @format */
import { withXernerxConfig } from '@xernerx/lib/next.config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	poweredByHeader: false,
	async redirects() {
		return [
			{
				source: '/:path*',
				has: [{ type: 'host', value: 'xernerx.com' }],
				destination: 'https://www.xernerx.com/:path*',
				permanent: true,
			},
			{
				source: '/invite',
				destination: '/invites',
				permanent: false,
			},
			{
				source: '/invite/:slug',
				destination: '/invites/:slug',
				permanent: false,
			},
			{
				source: '/careers',
				destination: '/applications',
				permanent: false,
			},
			{
				source: '/jobs',
				destination: '/applications',
				permanent: false,
			},
			{
				source: '/desktop',
				destination: '/download',
				permanent: false,
			},
		];
	},
};

export default withXernerxConfig(nextConfig);
