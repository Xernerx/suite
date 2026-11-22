/** @format */
import { withXernerxConfig } from '@xernerx/lib/next.config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	poweredByHeader: false,
	async headers() {
		return [
			{
				source: '/invites/:id/:option',
				headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
			},
			{
				source: '/invite/:id/:option',
				headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
			},
		];
	},
	async redirects() {
		return [
			{
				source: '/:path*',
				has: [{ type: 'host', value: 'xernerx.com' }],
				destination: 'https://www.xernerx.com/:path*',
				statusCode: 301,
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
				source: '/invite/:slug/:option',
				destination: '/invites/:slug/:option',
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
			{
				source: '/dev-policy',
				destination: '/developer-policy',
				permanent: false,
			},
			{
				source: '/internal-developer-policy',
				destination: '/developer-policy',
				permanent: false,
			},
		];
	},
};

export default withXernerxConfig(nextConfig);
