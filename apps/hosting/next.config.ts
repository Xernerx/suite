/** @format */
import { withXernerxConfig } from '@xernerx/lib/next.config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	poweredByHeader: false,
};

export default withXernerxConfig(nextConfig);
