/** @format */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Environment = 'dev' | 'canary' | 'public';

interface EnvironmentContextType {
	environment: Environment;
	isDev: boolean;
	isCanary: boolean;
	isPublic: boolean;
	getEnvUrl: (baseUrl: string) => string;
	isReady: boolean;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

function getInitialEnvironment(): Environment {
	if (typeof window !== 'undefined') {
		const hostname = window.location.hostname;
		const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);

		if (hostname.includes('.dev.') || hostname === 'localhost' || isIp) {
			return 'dev';
		}
		if (hostname.includes('.canary.')) {
			return 'canary';
		}
	}
	const env = process.env.NEXT_PUBLIC_ENVIRONMENT?.toLowerCase();
	if (env === 'development' || env === 'dev') {
		return 'dev';
	}
	if (env === 'canary') {
		return 'canary';
	}
	return 'public';
}

export function EnvironmentProvider({ children, initialEnvironment }: { children: React.ReactNode; initialEnvironment?: Environment }) {
	const [environment, setEnvironment] = useState<Environment>(() => {
		if (initialEnvironment) return initialEnvironment;
		return getInitialEnvironment();
	});
	const [isReady, setIsReady] = useState(() => typeof window !== 'undefined');

	useEffect(() => {
		setEnvironment(getInitialEnvironment());
		setIsReady(true);
	}, []);

	const getEnvUrl = React.useCallback(
		(baseUrl: string) => {
			const domain = process.env.NEXT_PUBLIC_DOMAIN || '';
			const windowHostname = typeof window !== 'undefined' ? window.location.hostname : '';
			const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain) || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(windowHostname);
			const isLocalhost = domain === 'localhost' || domain === '127.0.0.1' || windowHostname === 'localhost' || windowHostname === '127.0.0.1';
			let transformedUrl = baseUrl;

			if (isIp || isLocalhost) {
				// Pure local development (IP or localhost) using port routing
				try {
					const url = new URL(baseUrl);
					switch (url.hostname) {
						case 'api.xernerx.com':
							url.port = '4001';
							break;
						case 'cdn.xernerx.com':
							url.port = '4002';
							break;
						case 'account.xernerx.com':
						case 'auth.xernerx.com':
							url.port = '4003';
							break;
						case 'app.xernerx.com':
							url.port = '4004';
							break;
						case 'docs.xernerx.com':
							url.port = '4005';
							break;
						case 'admin.xernerx.com':
							url.port = '4006';
							break;
						case 'info.xernerx.com':
							url.port = '4007';
							break;
						case 'store.xernerx.com':
							url.port = '4008';
							break;
						case 'portal.xernerx.com':
							url.port = '4009';
							break;
						case 'hosting.xernerx.com':
							url.port = '4010';
							break;
						case 'xernerx.com':
						case 'www.xernerx.com':
							url.port = '4000';
							break;
						default:
							url.port = '3000';
							break;
					}
					// In local port routing, use configured local domain/IP or window hostname (never public domain like xernerx.com)
					const localHost =
						domain === 'localhost' || domain === '127.0.0.1' || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain)
							? domain
							: typeof window !== 'undefined'
								? window.location.hostname
								: 'localhost';
					url.hostname = localHost;
					url.protocol = 'http:';
					transformedUrl = url.toString();
				} catch {
					// Fallback if baseUrl is somehow not a valid URL
					transformedUrl = baseUrl;
				}
			} else {
				// Advanced service manager or production/canary using subdomain routing
				const targetDomain = domain || 'xernerx.com';
				transformedUrl = baseUrl.replace(/xernerx\.com/g, targetDomain);

				if (environment !== 'public') {
					try {
						const url = new URL(transformedUrl);
						let hostname = url.hostname;

						hostname = hostname.replace(/\.(dev|canary)\./g, '.');

						if (hostname === targetDomain) {
							hostname = `www.${targetDomain}`;
						}

						if (hostname.endsWith(targetDomain)) {
							const parts = hostname.split('.');
							if (parts.length >= 3) {
								url.hostname = `${parts.slice(0, parts.length - 2).join('.')}.${environment}.${parts.slice(-2).join('.')}`;
							}
						}

						transformedUrl = url.toString();
					} catch {
						transformedUrl = baseUrl.replace(/xernerx\.com/g, targetDomain);
					}
				}
			}

			try {
				if (!baseUrl.endsWith('/') && transformedUrl.endsWith('/') && new URL(transformedUrl).pathname === '/') {
					return transformedUrl.slice(0, -1);
				}
			} catch {
				// Fallback to transformedUrl
			}

			return transformedUrl;
		},
		[environment]
	);

	const value = {
		environment,
		isDev: environment === 'dev',
		isCanary: environment === 'canary',
		isPublic: environment === 'public',
		getEnvUrl,
		isReady,
	};

	return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}

export function useEnvironment() {
	const context = useContext(EnvironmentContext);
	if (context === undefined) {
		throw new Error('useEnvironment must be used within an EnvironmentProvider');
	}
	return context;
}
