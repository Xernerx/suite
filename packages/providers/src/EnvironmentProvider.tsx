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

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
	const [environment, setEnvironment] = useState<Environment>('public');

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const hostname = window.location.hostname;

			if (hostname.includes('.dev.') || hostname === 'localhost') {
				setEnvironment('dev');
			} else if (hostname.includes('.canary.')) {
				setEnvironment('canary');
			} else {
				setEnvironment('public');
			}
		}
	}, []);

	const getEnvUrl = (baseUrl: string) => {
		if (environment === 'public') return baseUrl;

		try {
			const url = new URL(baseUrl);
			let hostname = url.hostname;

			// 1. Strip any existing environment segments to ensure a clean slate
			hostname = hostname.replace(/\.(dev|canary)\./g, '.');

			// 2. Ensure it starts with www if it's the root domain
			if (hostname === 'xernerx.com') {
				hostname = 'www.xernerx.com';
			}

			// 3. Inject the correct nested environment segment (e.g., www.xernerx.com -> www.dev.xernerx.com)
			if (hostname.endsWith('xernerx.com')) {
				const parts = hostname.split('.'); // ['www', 'xernerx', 'com']
				if (parts.length === 3) {
					url.hostname = `${parts[0]}.${environment}.${parts[1]}.${parts[2]}`;
				}
			}

			return url.toString();
		} catch {
			return baseUrl;
		}
	};

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
