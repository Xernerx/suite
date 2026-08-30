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
				hostname: '**.xernerx.com',
				pathname: '/**',
			},
			{
				protocol: 'http',
				hostname: 'localhost',
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
};

export default nextConfig;
