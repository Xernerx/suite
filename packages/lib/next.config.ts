/** @format */

import type { NextConfig } from 'next';

export function withXernerxConfig(appConfig: NextConfig = {}): NextConfig {
	return {
		poweredByHeader: false,
		cacheMaxMemorySize: 16 * 1024 * 1024,
		onDemandEntries: {
			maxInactiveAge: 15 * 1000,
			pagesBufferLength: 2,
			...appConfig.onDemandEntries,
		},
		...appConfig,
		experimental: {
			turbopackFileSystemCacheForDev: false,
			turbopackMemoryEviction: 'full',
			turbopackGc: {
				minProgressMs: 100,
				rootTtlMs: 60 * 1000,
			},
			turbopackPluginRuntimeStrategy: 'forceWorkerThreads',
			workerThreads: true,
			cpus: 2,
			memoryBasedWorkersCount: true,
			webpackMemoryOptimizations: true,
			preloadEntriesOnStart: false,
			optimizePackageImports: ['lucide-react', 'react-icons', 'recharts', 'framer-motion', '@xernerx/ui', '@xernerx/components', '@xernerx/providers', '@xernerx/feedback'],
			...appConfig.experimental,
		},
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
				{
					source: '/github',
					destination: 'https://github.com/xernerx',
					permanent: false,
				},
				{
					source: '/npm',
					destination: 'https://www.npmjs.com/package/xernerx',
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
		transpilePackages: ['@xernerx/styles', '@xernerx/components', '@xernerx/ui', '@xernerx/providers', '@xernerx/lib', ...(appConfig.transpilePackages || [])],
	};
}
