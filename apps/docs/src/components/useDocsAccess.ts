/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useEnvironment, useUser } from '@xernerx/providers';

export function useDocsAccess() {
	const { user, loading: userLoading } = useUser() as any;
	const { getEnvUrl } = useEnvironment();

	const [isAdmin, setIsAdmin] = useState(false);
	const [hasWebsocket, setHasWebsocket] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (userLoading) return;

		let cancelled = false;

		const verifyAccess = async () => {
			if (!user?.id) {
				if (!cancelled) {
					setIsAdmin(false);
					setHasWebsocket(false);
					setLoading(false);
				}
				return;
			}

			try {
				const hasDirectAdmin =
					user?.permissions?.admin === true ||
					user?.permissions?.secure === true ||
					(Array.isArray(user?.permissions) && (user.permissions.includes('admin') || user.permissions.includes('secure')));

				const hasDirectWebsocket = hasDirectAdmin || user?.permissions?.websocket === true || (Array.isArray(user?.permissions) && user.permissions.includes('websocket'));

				const rolePromises = Array.isArray(user?.roles)
					? user.roles.map(async (roleItem: any) => {
							const roleId = typeof roleItem === 'string' ? roleItem : roleItem.id;
							if (!roleId) return null;
							const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/${roleId}`), { credentials: 'include' });
							if (!res.ok) return null;
							return res.json();
						})
					: [];

				const tokensPromise = fetch(getEnvUrl('https://api.xernerx.com/secure/tokens'), { credentials: 'include' })
					.then(async (res) => {
						if (!res.ok) return [];
						const list = await res.json();
						if (!Array.isArray(list)) return [];
						return Promise.all(
							list.map(async (tokenItem: any) => {
								if (tokenItem?.permissions) return tokenItem;
								if (!tokenItem?.id) return tokenItem;
								const detailRes = await fetch(getEnvUrl(`https://api.xernerx.com/secure/tokens/${tokenItem.id}`), { credentials: 'include' });
								return detailRes.ok ? detailRes.json() : tokenItem;
							})
						);
					})
					.catch(() => []);

				const [fetchedRoles, fetchedTokens] = await Promise.all([Promise.all(rolePromises), tokensPromise]);

				const hasRoleAdmin = fetchedRoles.some(
					(role: any) =>
						role?.permissions?.admin === true ||
						role?.permissions?.secure === true ||
						role?.permissions?.settings === true ||
						role?.permissions?.tokens === true ||
						role?.permissions?.access === true
				);

				const activeTokens = fetchedTokens.filter((token: any) => token?.status !== 'suspended' && token?.status !== 'inactive');

				const hasSecureToken = activeTokens.some((token: any) => token?.permissions?.secure === true || token?.permissions?.admin === true);
				const hasWebsocketToken = activeTokens.some((token: any) => token?.permissions?.websocket === true || token?.permissions?.admin === true);

				if (!cancelled) {
					setIsAdmin(hasDirectAdmin || hasRoleAdmin || hasSecureToken);
					setHasWebsocket(hasDirectWebsocket || hasRoleAdmin || hasWebsocketToken);
					setLoading(false);
				}
			} catch (err) {
				console.error('Failed to verify documentation access permissions:', err);
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		verifyAccess();

		return () => {
			cancelled = true;
		};
	}, [user?.id, user?.roles, user?.permissions, userLoading, getEnvUrl]);

	return { isAdmin, hasWebsocket, loading };
}
