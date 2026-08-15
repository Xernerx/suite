/** @format */

'use client';

import { Key, Languages, Shield, Ticket, Users as UsersIcon } from 'lucide-react';
import { useDictionary, useEnvironment, useSidebar, useUser, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import ApplicationConfigs from '@/components/ApplicationConfigs';
import ApplicationReviews from '@/components/ApplicationReviews';
import { Loading } from '@xernerx/feedback';
import Roles from '@/components/Roles';
import Tokens from '@/components/Tokens';
import Translations from '@/components/Translations';
import Users from '@/components/Users';
import Settings from '@/components/Settings';
import { permissions } from '@xernerx/lib';
import { Server } from 'lucide-react';

export default function Home() {
	const { show, setNavItems, view, setView } = useSidebar();
	const { user, loading: userLoading } = useUser() as { user: any; loading: boolean };
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const { toast } = useToast();

	const [roleLoading, setRoleLoading] = useState(true);
	const [serverLoading, setServerLoading] = useState(true);
	const [adminServerId, setAdminServerId] = useState<string | null>(null);
	const [userRolePermissions, setUserRolePermissions] = useState<Record<string, boolean>>({});

	useEffect(() => {
		if (!isReady) return;
		async function fetchServer() {
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/settings/admin_server_id`), { credentials: 'include' });
				if (res.ok) {
					const data = await res.json();
					setAdminServerId(data.value || null);
				}
			} catch (err) {
				console.error('Failed to fetch admin server id', err);
			} finally {
				setServerLoading(false);
			}
		}
		fetchServer();
	}, [getEnvUrl, isReady]);

	useEffect(() => {
		if (!isReady) return;
		async function fetchPermissions() {
			const roleIds = user?.roles || (user?.role ? [user.role] : []);
			if (roleIds.length === 0) {
				setRoleLoading(false);
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

				setUserRolePermissions(mergedPermissions);
			} catch (err: any) {
				console.error('Failed to fetch role permissions:', err);
				toast({ type: 'error', title: 'Failed to fetch permissions', description: err.message });
			} finally {
				setRoleLoading(false);
			}
		}

		if (!userLoading) {
			fetchPermissions();
		}
	}, [user, userLoading, getEnvUrl, isReady]);

	useEffect(() => {
		if (userLoading || roleLoading || serverLoading) return;

		const items = [];

		const canTranslations = userRolePermissions.translations ?? permissions.find((p) => p.key === 'translations')?.defaultValue ?? false;
		const canUsers = userRolePermissions.users ?? permissions.find((p) => p.key === 'users')?.defaultValue ?? true;
		const canApplicationsReview = userRolePermissions.applications_review ?? permissions.find((p) => p.key === 'applications_review')?.defaultValue ?? false;
		const canApplicationsManage = userRolePermissions.applications_manage ?? permissions.find((p) => p.key === 'applications_manage')?.defaultValue ?? false;
		const canRoles = userRolePermissions.roles ?? permissions.find((p) => p.key === 'roles')?.defaultValue ?? false;
		const canTokens = userRolePermissions.tokens ?? permissions.find((p) => p.key === 'tokens')?.defaultValue ?? false;
		const canSettings = userRolePermissions.settings ?? permissions.find((p) => p.key === 'settings')?.defaultValue ?? false;

		const isServerSet = !!adminServerId;

		if (canTranslations && isServerSet) {
			items.push({
				category: t('common.nav.categories.translator'),
				label: t('common.nav.items.translations'),
				view: 'translations',
				icon: Languages,
			});
		}

		if (canUsers && isServerSet) {
			items.push({
				category: t('common.nav.categories.moderator'),
				label: t('common.nav.items.users'),
				view: 'users',
				icon: UsersIcon,
			});
		}

		if (canApplicationsReview && isServerSet) {
			items.push({
				category: t('common.nav.categories.moderator'),
				label: t('common.nav.items.applications_review'),
				view: 'applications_review',
				icon: Ticket,
			});
		}

		if (canApplicationsManage && isServerSet) {
			items.push({
				category: t('common.nav.categories.administrator'),
				label: t('common.nav.items.applications_manage'),
				view: 'applications_manage',
				icon: Ticket,
			});
		}

		if (canTokens && isServerSet) {
			items.push({
				category: t('common.nav.categories.administrator'),
				label: t('common.nav.items.tokens'),
				view: 'tokens',
				icon: Key,
			});
		}

		if (canRoles && isServerSet) {
			items.push({
				category: t('common.nav.categories.system'),
				label: t('common.nav.items.roles'),
				view: 'roles',
				icon: Shield,
			});
		}

		if (canSettings) {
			items.push({
				category: t('common.nav.categories.system'),
				label: t('common.nav.items.settings'),
				view: 'settings',
				icon: Server,
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
	}, [userLoading, roleLoading, serverLoading, adminServerId, userRolePermissions, view, setView, setNavItems, show, t]);

	if (userLoading || roleLoading || serverLoading) return <Loading />;

	const allowedViews = [];
	const canUsers = userRolePermissions.users ?? permissions.find((p) => p.key === 'users')?.defaultValue ?? true;
	const canRoles = userRolePermissions.roles ?? permissions.find((p) => p.key === 'roles')?.defaultValue ?? false;
	const canApplicationsReview = userRolePermissions.applications_review ?? permissions.find((p) => p.key === 'applications_review')?.defaultValue ?? false;
	const canApplicationsManage = userRolePermissions.applications_manage ?? permissions.find((p) => p.key === 'applications_manage')?.defaultValue ?? false;
	const canTokens = userRolePermissions.tokens ?? permissions.find((p) => p.key === 'tokens')?.defaultValue ?? false;
	const canTranslations = userRolePermissions.translations ?? permissions.find((p) => p.key === 'translations')?.defaultValue ?? false;
	const canSettings = userRolePermissions.settings ?? permissions.find((p) => p.key === 'settings')?.defaultValue ?? false;

	const isServerSet = !!adminServerId;

	if (canTranslations && isServerSet) allowedViews.push('translations');
	if (canUsers && isServerSet) allowedViews.push('users');
	if (canApplicationsReview && isServerSet) allowedViews.push('applications_review');
	if (canApplicationsManage && isServerSet) allowedViews.push('applications_manage');
	if (canRoles && isServerSet) allowedViews.push('roles');
	if (canTokens && isServerSet) allowedViews.push('tokens');
	if (canSettings) allowedViews.push('settings');

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
			{activeView === 'translations' && <Translations />}
			{activeView === 'users' && <Users />}
			{activeView === 'applications_review' && <ApplicationReviews />}
			{activeView === 'applications_manage' && <ApplicationConfigs />}
			{activeView === 'roles' && <Roles />}
			{activeView === 'tokens' && <Tokens />}
			{activeView === 'settings' && <Settings />}
		</div>
	);
}
