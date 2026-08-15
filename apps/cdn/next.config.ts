/** @format */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: '/_next/:path*',
				headers: [
					{
						key: 'Cache-Control',
						value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
					},
				],
			},
		];
	},
	reactCompiler: true,
	images: {
		unoptimized: true,
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.discordapp.com',
				pathname: '/**',
			},
		],
	},
	allowedDevOrigins: process.env.DOMAIN ? ['*.dev.xernerx.com', 'localhost', process.env.DOMAIN] : ['*.dev.xernerx.com', 'localhost'],
	turbopack: {
		rules: {
			'*.svg': {
				loaders: ['@svgr/webpack'],
				as: '*.js',
			},
		},
	},
	transpilePackages: ['@xernerx/styles', '@xernerx/components', '@xernerx/ui', '@xernerx/providers'],
};

export default nextConfig;
