/** @format */
'use client';

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useEnvironment } from './EnvironmentProvider';

export interface MailOptions {
	to: string;
	subject: string;
	templateId: string;
	data?: Record<string, any>;
}

export interface WebhookOptions {
	url: string;
	content?: string;
	embeds?: any[];
}

export interface DispatchContextType {
	mail: (options: MailOptions) => Promise<void>;
	webhook: (options: WebhookOptions) => Promise<void>;
}

const DispatchContext = createContext<DispatchContextType | undefined>(undefined);

export function DispatchProvider({ children }: { children: ReactNode }) {
	const { getEnvUrl } = useEnvironment();

	const mail = useCallback(
		async (options: MailOptions) => {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/dispatch/email'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(options),
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({ error: res.statusText }));
				throw new Error(error.error || 'Failed to dispatch email');
			}
		},
		[getEnvUrl]
	);

	const webhook = useCallback(
		async (options: WebhookOptions) => {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/dispatch/webhook'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(options),
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({ error: res.statusText }));
				throw new Error(error.error || 'Failed to dispatch webhook');
			}
		},
		[getEnvUrl]
	);

	return <DispatchContext.Provider value={{ mail, webhook }}>{children}</DispatchContext.Provider>;
}

export function useDispatch() {
	const context = useContext(DispatchContext);
	if (context === undefined) {
		throw new Error('useDispatch must be used within a DispatchProvider');
	}
	return context;
}
