/** @format */
import { withXernerxConfig } from '@xernerx/lib/next.config';
import type { NextConfig } from 'next';

const ACCOUNT_TAB_REDIRECTS = ['profile', 'activity', 'connections', 'devices', 'appearance', 'preferences', 'language', 'notifications', 'billing', 'tokens', 'media'];

const nextConfig: NextConfig = {
	poweredByHeader: false,
	async redirects() {
		return ACCOUNT_TAB_REDIRECTS.map((tab) => ({
			source: `/${tab}`,
			destination: `/?tab=${tab}`,
			permanent: false,
		}));
	},
};

export default withXernerxConfig(nextConfig);
