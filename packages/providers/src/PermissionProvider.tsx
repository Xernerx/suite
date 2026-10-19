/** @format */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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

	const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!isReady || userLoading) return;
		let cancelled = false;

		async function fetchPermissions() {
			const rawRoles = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [];
			const roleIds = rawRoles.map((r: any) => (typeof r === 'string' ? r : r?.id)).filter((id: any): id is string => typeof id === 'string' && id.trim().length > 0);

			if (roleIds.length === 0) {
				if (!cancelled) setLoading(false);
				return;
			}
			try {
				const roleDocs = await Promise.all(
					roleIds.map(async (roleId: string) => {
						try {
							const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/${encodeURIComponent(roleId)}`), {
								credentials: 'include',
							});
							if (res.ok) {
								const roleDoc = await res.json();
								return roleDoc?.permissions || {};
							}
						} catch {
							// Ignore transient or aborted fetch errors during navigation/HMR
						}
						return {};
					})
				);

				if (cancelled) return;

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
					toast({ type: 'error', title: 'Failed to fetch permissions', description: err?.message || 'Unknown error' });
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		fetchPermissions();
		return () => {
			cancelled = true;
		};
	}, [getEnvUrl, isReady, user, userLoading, toast]);

	const hasPermission = (key: string) => {
		return rolePermissions[key] ?? defaultPermissions.find((p) => p.key === key)?.defaultValue ?? false;
	};

	return <PermissionContext.Provider value={{ permissions: rolePermissions, hasPermission, loading: loading || userLoading }}>{children}</PermissionContext.Provider>;
}

export function usePermissions() {
	const context = useContext(PermissionContext);
	if (!context) {
		throw new Error('usePermissions must be used within a PermissionProvider');
	}
	return context;
}
