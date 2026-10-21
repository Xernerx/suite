/** @format */
import { withXernerxConfig } from '@xernerx/lib/next.config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	poweredByHeader: false,
	async redirects() {
		return [
			{
				source: '/organizations',
				destination: '/portal',
				permanent: false,
			},
			{
				source: '/orgs',
				destination: '/portal',
				permanent: false,
			},
			{
				source: '/leaderboards',
				destination: '/leaderboard',
				permanent: false,
			},
		];
	},
};

export default withXernerxConfig(nextConfig);
