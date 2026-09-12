/** @format */
'use client';

import { useEffect, useRef } from 'react';
import { useEnvironment, useSession, useToast } from '@xernerx/providers';

export function VersionTracker() {
	const { data: session } = useSession();
	const { isDev, isCanary, getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();
	const hasChecked = useRef(false);

	useEffect(() => {
		// Only check once per session mount, and only if we are in production
		if (!isReady || !session?.user || isDev || isCanary || hasChecked.current) return;
		hasChecked.current = true;

		const checkVersion = async () => {
			try {
				// Parse the subdomain or app name from window.location.hostname
				const hostname = window.location.hostname;
				let appName = hostname.split('.')[0];

				// Handle root domains or www
				if (appName === 'www' || appName === 'xernerx' || hostname === 'localhost' || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
					appName = 'www'; // Fallback to 'www' for marketing site
				}

				const res = await fetch('/api/version');
				if (!res.ok) return;

				const data = await res.json();
				if (!data.version) return;

				const currentVersion = data.version;
				const user = session.user as any;
				const lastSeenMap = user.lastSeenVersions || {};
				const lastSeenVersion = lastSeenMap[appName];

				// Only prompt if there is a previously seen version AND it differs
				if (lastSeenVersion && lastSeenVersion !== currentVersion) {
					toast({
						title: `App Updated!`,
						description: `Xernerx ${appName.charAt(0).toUpperCase() + appName.slice(1)} has been updated to v${currentVersion}. Want to see what's new?`,
						action: {
							label: 'View Changelog',
							onClick: () => {
								window.location.href = getEnvUrl('https://www.xernerx.com/changelog');
							},
						},
						duration: 10000,
					});
				}

				// If it differs, or if we've never seen it before, update the backend
				if (lastSeenVersion !== currentVersion) {
					const updateRes = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${user.id}`), {
						method: 'PATCH',
						headers: {
							'Content-Type': 'application/json',
						},
						credentials: 'include',
						body: JSON.stringify({
							[`lastSeenVersions.${appName}`]: currentVersion,
						}),
					});

					// Also safely mutate the local session so it doesn't trigger again before a hard refresh
					if (updateRes.ok) {
						if (!user.lastSeenVersions) user.lastSeenVersions = {};
						user.lastSeenVersions[appName] = currentVersion;
					}
				}
			} catch (error) {
				console.error('Failed to check version:', error);
			}
		};

		checkVersion();
	}, [isReady, session, isDev, isCanary, getEnvUrl, toast]);

	return null; // Invisible component
}
