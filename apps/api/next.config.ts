/** @format */
import { withXernerxConfig } from '@xernerx/lib/next.config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	outputFileTracingIncludes: {
		'/v1/changelog/rss.xml': ['../../apps/*/CHANGELOG.md', '../*/CHANGELOG.md', './CHANGELOG.md'],
	},
};

export default withXernerxConfig(nextConfig);
