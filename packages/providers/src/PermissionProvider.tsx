/** @format */
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDictionary } from './DictionaryProvider';
import { useEnvironment } from './EnvironmentProvider';
import { useUser } from './UserProvider';
import { useToast } from './ToastProvider';
import { permissions as defaultPermissions } from '@xernerx/lib';

type PermissionContextType = {
	permissions: Record<string, boolean>;
	hasPermission: (key: string) => boolean;
	loading: boolean;
};

const PermissionContext = createContext<PermissionContextType | null>(null);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
	const { user, loading: userLoading } = useUser() as { user: any; loading: boolean };
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();

	const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});
	const [loading, setLoading] = useState(true);

	const roleIdsKey = useMemo(() => {
		const rawRoles = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [];
		return rawRoles
			.map((r: any) => (typeof r === 'string' ? r : r?.id))
			.filter((id: any): id is string => typeof id === 'string' && id.trim().length > 0)
			.sort()
			.join(',');
	}, [user?.roles, user?.role]);

	useEffect(() => {
		if (!isReady || userLoading) return;
		let cancelled = false;

		async function fetchPermissions() {
			const roleIds = roleIdsKey ? roleIdsKey.split(',').filter(Boolean) : [];

			if (roleIds.length === 0) {
				setRolePermissions({});
				if (!cancelled) setLoading(false);
				return;
			}
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core'), {
					credentials: 'include',
				}).catch(() => null);

				if (cancelled) return;

				const allRoles = res?.ok ? await res.json().catch(() => []) : [];
				const roleDocs = Array.isArray(allRoles) ? allRoles.filter((r: any) => r?.id && roleIds.includes(r.id)).map((r: any) => r?.permissions || {}) : [];

				const mergedPermissions = roleDocs.reduce(
					(acc, curr) => {
						for (const [k, v] of Object.entries(curr)) {
							if (v) acc[k] = true;
							else if (acc[k] === undefined) acc[k] = false;
						}
						return acc;
					},
					{} as Record<string, boolean>
				);

				setRolePermissions(mergedPermissions);
			} catch (err: any) {
				if (!cancelled) {
					toast({ type: 'error', title: t('common.permissionprovider.fetchFailed'), description: err?.message || t('common.toast.error') });
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		fetchPermissions();
		return () => {
			cancelled = true;
		};
	}, [getEnvUrl, isReady, roleIdsKey, userLoading, toast, t]);

	const hasPermission = useCallback(
		(key: string) => {
			return rolePermissions[key] ?? defaultPermissions.find((p) => p.key === key)?.defaultValue ?? false;
		},
		[rolePermissions]
	);

	const contextValue = useMemo(() => ({ permissions: rolePermissions, hasPermission, loading: loading || userLoading }), [rolePermissions, hasPermission, loading, userLoading]);

	return <PermissionContext.Provider value={contextValue}>{children}</PermissionContext.Provider>;
}

export function usePermissions() {
	const context = useContext(PermissionContext);
	if (!context) {
		throw new Error('usePermissions must be used within a PermissionProvider');
	}
	return context;
}
