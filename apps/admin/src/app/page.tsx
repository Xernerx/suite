/** @format */

'use client';

import { Key, Languages, Shield, Users as UsersIcon } from 'lucide-react';
import { useDictionary, useEnvironment, useSidebar, useUser } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { Loading } from '@xernerx/feedback';
import Roles from '@/components/Roles';
import Tokens from '@/components/Tokens';
import Translations from '@/components/Translations';
import Users from '@/components/Users';
import { permissions } from '@xernerx/lib';

export default function Home() {
	const { show, setNavItems, view, setView } = useSidebar();
	const { user, loading: userLoading } = useUser() as { user: any; loading: boolean };
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();

	const [roleLoading, setRoleLoading] = useState(true);
	const [userRolePermissions, setUserRolePermissions] = useState<Record<string, boolean>>({});

	useEffect(() => {
		async function fetchPermissions() {
			const roleIds = user?.roles || (user?.role ? [user.role] : []);
			if (roleIds.length === 0) {
				setRoleLoading(false);
				return;
			}
			try {
				const roleDocs = await Promise.all(
					roleIds.map(async (roleId: string) => {
						const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/roles/${roleId}`));
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

				setUserRolePermissions(mergedPermissions);
			} catch (err) {
				console.error('Failed to fetch role permissions:', err);
			} finally {
				setRoleLoading(false);
			}
		}

		if (!userLoading) {
			fetchPermissions();
		}
	}, [user, userLoading, getEnvUrl]);

	useEffect(() => {
		if (userLoading || roleLoading) return;

		const items = [];

		const canTranslations = userRolePermissions.translations ?? permissions.find((p) => p.key === 'translations')?.defaultValue ?? false;
		const canUsers = userRolePermissions.users ?? permissions.find((p) => p.key === 'users')?.defaultValue ?? true;
		const canRoles = userRolePermissions.roles ?? permissions.find((p) => p.key === 'roles')?.defaultValue ?? false;
		const canTokens = userRolePermissions.tokens ?? permissions.find((p) => p.key === 'tokens')?.defaultValue ?? false;

		if (canTranslations) {
			items.push({
				category: t('common.nav.categories.translator'),
				label: t('common.nav.items.translations'),
				view: 'translations',
				icon: Languages,
			});
		}

		if (canUsers) {
			items.push({
				category: t('common.nav.categories.moderator'),
				label: t('common.nav.items.users'),
				view: 'users',
				icon: UsersIcon,
			});
		}
		if (canRoles) {
			items.push({
				category: t('common.nav.categories.administrator'),
				label: t('common.nav.items.roles'),
				view: 'roles',
				icon: Shield,
			});
		}
		if (canTokens) {
			items.push({
				category: t('common.nav.categories.administrator'),
				label: t('common.nav.items.tokens'),
				view: 'tokens',
				icon: Key,
			});
		}

		setNavItems(items);

		if (items.length > 0) {
			const isCurrentViewAllowed = items.some((item) => item.view === view);
			if (!isCurrentViewAllowed) {
				setView(items[0].view);
			}
		}

		show();
	}, [userLoading, roleLoading, userRolePermissions, view, setView, setNavItems, show, t]);

	if (userLoading || roleLoading) return <Loading />;

	const allowedViews = [];
	const canUsers = userRolePermissions.users ?? permissions.find((p) => p.key === 'users')?.defaultValue ?? true;
	const canRoles = userRolePermissions.roles ?? permissions.find((p) => p.key === 'roles')?.defaultValue ?? false;
	const canTokens = userRolePermissions.tokens ?? permissions.find((p) => p.key === 'tokens')?.defaultValue ?? false;
	const canTranslations = userRolePermissions.translations ?? permissions.find((p) => p.key === 'translations')?.defaultValue ?? false;

	if (canUsers) allowedViews.push('users');
	if (canRoles) allowedViews.push('roles');
	if (canTokens) allowedViews.push('tokens');
	if (canTranslations) allowedViews.push('translations');

	const activeView = allowedViews.includes(view!) ? view : allowedViews[0];

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{activeView === 'users' && <Users />}
			{activeView === 'roles' && <Roles />}
			{activeView === 'tokens' && <Tokens />}
			{activeView === 'translations' && <Translations />}
		</div>
	);
}
