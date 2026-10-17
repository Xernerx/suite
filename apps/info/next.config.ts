/** @format */
import { withXernerxConfig } from '@xernerx/lib/next.config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	poweredByHeader: false,
	outputFileTracingIncludes: {
		'/changelog': ['../../apps/*/CHANGELOG.md'],
	},
};

export default withXernerxConfig(nextConfig);
