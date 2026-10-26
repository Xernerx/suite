/** @format */
import { withXernerxConfig } from '@xernerx/lib/next.config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	poweredByHeader: false,
	async redirects() {
		return [
			{
				source: '/organizations',
				destination: '/',
				permanent: false,
			},
			{
				source: '/orgs',
				destination: '/',
				permanent: false,
			},
			{
				source: '/portal',
				destination: '/',
				permanent: false,
			},
			{
				source: '/portal/bots/:id',
				destination: '/bots/:id',
				permanent: false,
			},
		];
	},
};

export default withXernerxConfig(nextConfig);
