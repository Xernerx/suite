/** @format */

'use client';

import { Key, Shield, Users as UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEnvironment, useSidebar, useUser } from '@xernerx/providers';

import { Loading } from '@xernerx/feedback';
import Roles from '@/components/Roles';
import Tokens from '@/components/Tokens';
import Users from '@/components/Users';
import { permissions } from '@xernerx/lib';

export default function Home() {
	const { show, setNavItems, view, setView } = useSidebar();
	const { user } = useUser();
	const { getEnvUrl } = useEnvironment();

	const [loading, setLoading] = useState(true);
	const [userRolePermissions, setUserRolePermissions] = useState<Record<string, boolean>>({});

	useEffect(() => {
		async function fetchPermissions() {
			if (!user?.role) {
				setLoading(false);
				return;
			}
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/roles/${user.role}`));
				if (res.ok) {
					const roleDoc = await res.json();
					setUserRolePermissions(roleDoc.permissions || {});
				}
			} catch (err) {
				console.error('Failed to fetch role permissions:', err);
			} finally {
				setLoading(false);
			}
		}

		fetchPermissions();
	}, [user, getEnvUrl]);

	useEffect(() => {
		if (loading) return;

		const items = [];

		const canUsers = userRolePermissions.users ?? permissions.find((p) => p.key === 'users')?.defaultValue ?? true;
		const canRoles = userRolePermissions.roles ?? permissions.find((p) => p.key === 'roles')?.defaultValue ?? false;
		const canTokens = userRolePermissions.tokens ?? permissions.find((p) => p.key === 'tokens')?.defaultValue ?? false;

		if (canUsers) {
			items.push({
				category: 'Moderator',
				label: 'Users',
				view: 'users',
				icon: UsersIcon,
			});
		}
		if (canRoles) {
			items.push({
				category: 'Administrator',
				label: 'Roles',
				view: 'roles',
				icon: Shield,
			});
		}
		if (canTokens) {
			items.push({
				category: 'Administrator',
				label: 'Tokens',
				view: 'tokens',
				icon: Key,
			});
		}

		setNavItems(items);

		if (items.length > 0) {
			setView(items[0].view);
		}

		show();
	}, [loading, userRolePermissions, setView, setNavItems, show]);

	if (loading) return <Loading />;

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{view === 'users' && <Users />}
			{view === 'roles' && <Roles />}
			{view === 'tokens' && <Tokens />}
		</div>
	);
}
