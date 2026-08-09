/** @format */

import NextAuth, { DefaultSession } from 'next-auth';

export {};

declare global {
	interface Window {
		electron?: {
			minimize: () => void;
			maximize: () => void;
			close: () => void;
			isMaximized: () => Promise<boolean>;
			version: string;
			metadata: any;
		};
	}
}

declare module 'next-auth' {
	interface Session extends DefaultSession {
		[index: string]: any;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		[index: string]: any;
	}
}
