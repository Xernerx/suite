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
		async function fetchPermissions() {
			const roleIds = user?.roles || (user?.role ? [user.role] : []);
			if (roleIds.length === 0) {
				setLoading(false);
				return;
			}
			try {
				const roleDocs = await Promise.all(
					roleIds.map(async (roleId: string) => {
						const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/${roleId}`));
						if (res.ok) {
							const roleDoc = await res.json();
							return roleDoc.permissions || {};
						}
						return {};
					})
				);

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
				console.error('Failed to fetch role permissions:', err);
				toast({ type: 'error', title: 'Failed to fetch permissions', description: err.message });
			} finally {
				setLoading(false);
			}
		}

		fetchPermissions();
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
