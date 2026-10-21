/** @format */
import { withXernerxConfig } from '@xernerx/lib/next.config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	poweredByHeader: false,
	outputFileTracingIncludes: {
		'/changelog': ['../../apps/*/CHANGELOG.md'],
	},
	async redirects() {
		return [
			{
				source: '/bugs',
				destination: '/issues',
				permanent: false,
			},
			{
				source: '/help',
				destination: '/faq',
				permanent: false,
			},
		];
	},
};

export default withXernerxConfig(nextConfig);
