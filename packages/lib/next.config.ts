import type { NextConfig } from 'next';

export function withXernerxConfig(appConfig: NextConfig = {}): NextConfig {
	return {
		...appConfig,
		async headers() {
			const appHeaders = appConfig.headers ? await appConfig.headers() : [];
			return [
				...appHeaders,
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
		async redirects() {
			const appRedirects = appConfig.redirects ? await appConfig.redirects() : [];
			return [
				...appRedirects,
				{
					source: '/support',
					destination: 'https://discord.gg/yrm8gqTuXa',
					permanent: false,
				},
				{
					source: '/discord',
					destination: 'https://discord.gg/yrm8gqTuXa',
					permanent: false,
				},
			];
		},
		reactCompiler: appConfig.reactCompiler ?? true,
		images: {
			unoptimized: true,
			remotePatterns: [
				{
					protocol: 'https',
					hostname: 'cdn.discordapp.com',
					pathname: '/**',
				},
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
				...(appConfig.images?.remotePatterns || []),
			],
			...appConfig.images,
		},
		allowedDevOrigins: appConfig.allowedDevOrigins || (process.env.DOMAIN ? ['*.dev.xernerx.com', 'localhost', process.env.DOMAIN] : ['*.dev.xernerx.com', 'localhost']),
		turbopack: {
			rules: {
				'*.svg': {
					loaders: ['@svgr/webpack'],
					as: '*.js',
				},
				...(appConfig.turbopack?.rules || {}),
			},
			...appConfig.turbopack,
		},
		transpilePackages: ['@xernerx/styles', '@xernerx/components', '@xernerx/ui', '@xernerx/providers', ...(appConfig.transpilePackages || [])],
	};
}
