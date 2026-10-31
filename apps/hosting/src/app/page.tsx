/** @format */
'use client';

import { Cloud, Columns2, Server, Settings2, ShieldAlert } from 'lucide-react';
import { useDictionary, useEnvironment, useSession, useSidebar, useUser } from '@xernerx/providers';
import { useEffect, useRef, useState } from 'react';
import { Loading } from '@xernerx/feedback';
import HostingConsole, { DEFAULT_HOSTING_NODES, isVercelNode, type HostingNodeConfig } from '@/components/HostingConsole';
import ReturnPage from '@/components/ReturnPage';

export default function HostingPage() {
	const { data: session, status } = useSession();
	const { user, loading: userLoading } = useUser() as { user: any; loading: boolean };
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const { show, setNavItems, clearNavItems, view, setView } = useSidebar();

	const [nodes, setNodes] = useState<HostingNodeConfig[]>(DEFAULT_HOSTING_NODES);
	const [configModalOpen, setConfigModalOpen] = useState(false);
	const [roleLoading, setRoleLoading] = useState(true);
	const [userRolePermissions, setUserRolePermissions] = useState<Record<string, boolean>>({});
	const [dbError, setDbError] = useState<string | null>(null);
	const hasInitializedView = useRef(false);

	useEffect(() => {
		if (typeof document !== 'undefined') {
			const layoutDbError = document.querySelector('[data-db-error]')?.getAttribute('data-db-error');
			if (layoutDbError) {
				setDbError(layoutDbError);
			}
		}
	}, []);

	useEffect(() => {
		if (!isReady) return;
		async function fetchNodesAndPermissions() {
			const roleIds = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [];
			try {
				const [settingsRes, ...roleResponses] = await Promise.all([
					fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/hosting_nodes_config'), { credentials: 'include' }).catch(() => null),
					...roleIds.map((roleId: string) => fetch(getEnvUrl(`https://api.xernerx.com/secure/core/${roleId}`)).catch(() => null)),
				]);

				if (settingsRes && settingsRes.ok) {
					const settingDoc = await settingsRes.json().catch(() => null);
					if (settingDoc?.value) {
						try {
							const parsed = JSON.parse(settingDoc.value);
							if (Array.isArray(parsed) && parsed.length > 0) {
								const merged: HostingNodeConfig[] = parsed.map((n: HostingNodeConfig) => {
									const def = DEFAULT_HOSTING_NODES.find((d) => d.id === n.id);
									return {
										...def,
										...n,
										sshTarget: n.sshTarget || def?.sshTarget,
										sshPort: n.sshPort || def?.sshPort,
										provider: n.provider || def?.provider || (n.id === 'vercel' || n.url?.includes('vercel.com') ? 'vercel' : 'easypanel'),
									};
								});
								const defaultVercel = DEFAULT_HOSTING_NODES.find((d) => d.id === 'vercel');
								if (defaultVercel && !merged.some((n: HostingNodeConfig) => isVercelNode(n))) {
									merged.push(defaultVercel);
								}
								setNodes(merged);
							}
						} catch {}
					}
				}

				const mergedPermissions: Record<string, boolean> = {};
				for (const res of roleResponses) {
					if (res && res.ok) {
						const roleDoc = await res.json().catch(() => ({}));
						const perms = roleDoc?.permissions || {};
						for (const [k, v] of Object.entries(perms)) {
							if (v) mergedPermissions[k] = true;
							else if (mergedPermissions[k] === undefined) mergedPermissions[k] = false;
						}
					}
				}
				setUserRolePermissions(mergedPermissions);
			} catch (err: any) {
				console.warn('Failed to load hosting nodes or permissions:', err);
			} finally {
				setRoleLoading(false);
			}
		}

		if (!userLoading) {
			fetchNodesAndPermissions();
		}
	}, [getEnvUrl, isReady, user, userLoading]);

	useEffect(() => {
		if (!isReady || status === 'loading' || userLoading || roleLoading) return;
		if (!session || !userRolePermissions.access) return;

		show();

		const navItems: any[] = [
			...nodes.map((node) => ({
				category: t('hosting.nav.categories.nodes'),
				icon: isVercelNode(node) ? Cloud : Server,
				label: node.name,
				view: node.id,
			})),
			...(nodes.length > 1
				? [
						{
							category: t('hosting.nav.categories.workspace'),
							icon: Columns2,
							label: t('hosting.console.splitView'),
							view: 'split',
						},
					]
				: []),
			{
				category: t('hosting.nav.categories.workspace'),
				icon: Settings2,
				label: t('hosting.console.configureNodes'),
				onClick: () => setConfigModalOpen(true),
			},
			{
				category: t('hosting.nav.categories.workspace'),
				icon: ShieldAlert,
				label: t('lib.navigation.items.admin'),
				href: getEnvUrl('https://admin.xernerx.com'),
			},
		];

		setNavItems(navItems);

		if (!hasInitializedView.current) {
			hasInitializedView.current = true;
			const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
			const requestedView = params?.get('node') || params?.get('view');
			const validViews = [...nodes.map((n) => n.id), 'split'];
			const initial = requestedView && validViews.includes(requestedView) ? requestedView : nodes[0]?.id || 'one-dummi';
			setView(initial);
		}

		return () => clearNavItems();
	}, [isReady, status, userLoading, roleLoading, session, userRolePermissions.access, nodes, show, setNavItems, clearNavItems, setView, t, getEnvUrl]);

	useEffect(() => {
		if (!hasInitializedView.current || !view || typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		if (url.searchParams.get('node') !== view) {
			url.searchParams.delete('view');
			url.searchParams.set('node', view);
			window.history.replaceState(null, '', url.toString());
		}
	}, [view]);

	if (dbError) {
		return <ReturnPage session={session} dbError={dbError} />;
	}

	if (status === 'loading' || userLoading || roleLoading) {
		return <Loading />;
	}

	if (!session || !userRolePermissions.access) {
		return <ReturnPage session={session} />;
	}

	const activeView = view || nodes[0]?.id || 'one-dummi';

	return (
		<HostingConsole
			activeView={activeView}
			onSelectView={(nextView) => setView(nextView)}
			nodes={nodes}
			onNodesUpdated={(nextNodes) => setNodes(nextNodes)}
			configModalOpen={configModalOpen}
			setConfigModalOpen={setConfigModalOpen}
			canManageSettings={Boolean(userRolePermissions.settings || userRolePermissions.access)}
		/>
	);
}
