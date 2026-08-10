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
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

function getInitialEnvironment(): Environment {
	if (typeof window !== 'undefined') {
		const hostname = window.location.hostname;
		if (hostname.includes('.dev.') || hostname === 'localhost') {
			return 'dev';
		}
		if (hostname.includes('.canary.')) {
			return 'canary';
		}
	}
	return 'public';
}

export function EnvironmentProvider({ children, initialEnvironment }: { children: React.ReactNode; initialEnvironment?: Environment }) {
	// Initialize with server-provided environment if available, preventing mismatch
	const [environment, setEnvironment] = useState<Environment>(() => {
		if (initialEnvironment) return initialEnvironment;
		return getInitialEnvironment();
	});

	useEffect(() => {
		setEnvironment(getInitialEnvironment());
	}, []);

	const getEnvUrl = React.useCallback(
		(baseUrl: string) => {
			let transformedUrl = baseUrl;

			if (environment !== 'public') {
				try {
					const url = new URL(baseUrl);
					let hostname = url.hostname;

					hostname = hostname.replace(/\.(dev|canary)\./g, '.');

					if (hostname === 'xernerx.com') {
						hostname = 'www.xernerx.com';
					}

					if (hostname.endsWith('xernerx.com')) {
						const parts = hostname.split('.');
						if (parts.length === 3) {
							url.hostname = `${parts[0]}.${environment}.${parts[1]}.${parts[2]}`;
						}
					}

					transformedUrl = url.toString();
				} catch {
					transformedUrl = baseUrl;
				}
			}

			if (!baseUrl.endsWith('/') && transformedUrl.endsWith('/') && new URL(transformedUrl).pathname === '/') {
				return transformedUrl.slice(0, -1);
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
