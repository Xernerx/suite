/** @format */

import type { NextConfig } from 'next';

export const config: NextConfig = {
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
	allowedDevOrigins: ['*.dev.xernerx.com'],
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
