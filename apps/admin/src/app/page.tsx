/** @format */
'use client';

import { Activity, AlertTriangle, Gauge, Key, Languages, Shield, Ticket, Users as UsersIcon, Link, Megaphone, Image, Map, Inbox, Bug, ShoppingBag, Server, ScrollText } from 'lucide-react';
import { useDictionary, useEnvironment, useSidebar, useUser, useToast } from '@xernerx/providers';
import { useEffect, useRef, useState } from 'react';

import ApplicationConfigs from '@/components/ApplicationConfigs';
import ApplicationReviews from '@/components/ApplicationReviews';
import AuditLogs from '@/components/AuditLogs';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';
import HomeOverview from '@/components/HomeOverview';
import Overview from '@/components/Overview';
import Roles from '@/components/Roles';
import Tokens from '@/components/Tokens';
import Translations from '@/components/Translations';
import Users from '@/components/Users';
import Settings from '@/components/Settings';
import Invites from '@/components/Invites';
import Announcements from '@/components/Announcements';
import Suggestions from '@/components/Suggestions';
import Roadmap from '@/components/Roadmap';
import Issues from '@/components/Issues';
import Media from '@/components/Media';
import StoreManagement from '@/components/StoreManagement';
import { permissions } from '@xernerx/lib';

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
	const [dbError, setDbError] = useState<string | null>(null);
	const [triageQuery, setTriageQuery] = useState<string>('');
	const hasInitializedView = useRef(false);

	const handleNavigateFromOverview = (targetView: string, query?: string) => {
		setTriageQuery(query || '');
		setView(targetView);
	};

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
		async function fetchServer() {
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/settings/admin_server_id`), { credentials: 'include' });
				if (res.ok) {
					const data = await res.json();
					setAdminServerId(data.value || null);
				} else {
					const errData = await res.json().catch(() => ({}));
					if (errData?.error) setDbError((prev) => prev || `DatabaseError: ${errData.error}`);
				}
			} catch (err: any) {
				console.warn('Failed to fetch admin server id', err);
			} finally {
				setServerLoading(false);
			}
		}
		fetchServer();
	}, [getEnvUrl, isReady]);

	useEffect(() => {
		if (!isReady) return;
		async function fetchPermissions() {
			const roleIds = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [];
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
						} else {
							const errData = await res.json().catch(() => ({}));
							if (errData?.error) setDbError((prev) => prev || `DatabaseError: ${errData.error}`);
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
				console.warn('Failed to fetch role permissions:', err);
				toast({ type: 'error', title: t('admin.dashboard.toasts.fetchPermissionsError'), description: err.message });
			} finally {
				setRoleLoading(false);
			}
		}

		if (!userLoading) {
			fetchPermissions();
		}
	}, [user, userLoading, getEnvUrl, isReady]);

	useEffect(() => {
		if ((userLoading || roleLoading || serverLoading) && !dbError) return;

		const items = [];
		const hasDbFallback = Boolean(dbError);

		const canTranslations = hasDbFallback || (userRolePermissions.translations ?? permissions.find((p) => p.key === 'translations')?.defaultValue ?? false);
		const canUsers = hasDbFallback || (userRolePermissions.users ?? permissions.find((p) => p.key === 'users')?.defaultValue ?? true);
		const canApplicationsReview = hasDbFallback || (userRolePermissions.applications_review ?? permissions.find((p) => p.key === 'applications_review')?.defaultValue ?? false);
		const canApplicationsManage = hasDbFallback || (userRolePermissions.applications_manage ?? permissions.find((p) => p.key === 'applications_manage')?.defaultValue ?? false);
		const canRoles = hasDbFallback || (userRolePermissions.roles ?? permissions.find((p) => p.key === 'roles')?.defaultValue ?? false);
		const canTokens = hasDbFallback || (userRolePermissions.tokens ?? permissions.find((p) => p.key === 'tokens')?.defaultValue ?? false);
		const canSettings = hasDbFallback || (userRolePermissions.settings ?? permissions.find((p) => p.key === 'settings')?.defaultValue ?? false);
		const canInvites = hasDbFallback || (userRolePermissions.invites ?? permissions.find((p) => p.key === 'invites')?.defaultValue ?? false);
		const canAnnouncements = hasDbFallback || (userRolePermissions.announcements ?? permissions.find((p) => p.key === 'announcements')?.defaultValue ?? false);
		const canManageMedia = hasDbFallback || (userRolePermissions.manageMedia ?? permissions.find((p) => p.key === 'manageMedia')?.defaultValue ?? false);
		const canUploadMedia = hasDbFallback || (userRolePermissions.uploadMedia ?? permissions.find((p) => p.key === 'uploadMedia')?.defaultValue ?? true);
		const canManageRoadmap = hasDbFallback || (userRolePermissions.manageRoadmap ?? permissions.find((p) => p.key === 'manageRoadmap')?.defaultValue ?? false);
		const canManageSuggestions = hasDbFallback || (userRolePermissions.manageSuggestions ?? permissions.find((p) => p.key === 'manageSuggestions')?.defaultValue ?? false);
		const canManageIssues = hasDbFallback || (userRolePermissions.manageIssues ?? permissions.find((p) => p.key === 'manageIssues')?.defaultValue ?? false);
		const canManageStore = hasDbFallback || (userRolePermissions.manageStore ?? userRolePermissions.store ?? permissions.find((p) => p.key === 'manageStore')?.defaultValue ?? false);
		const canMedia = canManageMedia || canUploadMedia;

		const isServerSet = hasDbFallback || !!adminServerId;

		items.push({
			category: t('common.nav.categories.system'),
			label: t('admin.dashboard.nav.overview'),
			view: 'overview',
			icon: Activity,
		});

		items.push({
			category: t('common.nav.categories.system'),
			label: t('admin.dashboard.nav.seo'),
			view: 'seo',
			icon: Gauge,
		});

		if (canMedia) {
			items.push({
				category: t('admin.dashboard.nav.media'),
				label: t('admin.dashboard.nav.mediaLibrary'),
				view: 'media',
				icon: Image,
			});
		}

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

		if (canInvites) {
			items.push({
				category: t('common.nav.categories.administrator'),
				label: t('admin.dashboard.nav.invites'),
				view: 'invites',
				icon: Link,
			});
		}

		if (canAnnouncements) {
			items.push({
				category: t('common.nav.categories.administrator'),
				label: t('admin.dashboard.nav.announcements'),
				view: 'announcements',
				icon: Megaphone,
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

		items.push({
			category: t('common.nav.categories.system'),
			label: t('admin.dashboard.nav.auditLogs'),
			view: 'audit',
			icon: ScrollText,
		});

		if (canManageRoadmap) {
			items.push({
				category: t('common.nav.categories.product'),
				label: t('common.nav.items.roadmap'),
				view: 'roadmap',
				icon: Map,
			});
		}
		if (canManageSuggestions) {
			items.push({
				category: t('common.nav.categories.product'),
				label: t('common.nav.items.suggestions'),
				view: 'suggestions',
				icon: Inbox,
			});
		}
		if (canManageIssues) {
			items.push({
				category: t('common.nav.categories.product'),
				label: t('common.nav.items.issues'),
				view: 'issues',
				icon: Bug,
			});
		}
		if (canManageStore) {
			items.push({
				category: t('common.nav.categories.product'),
				label: t('admin.dashboard.nav.store'),
				view: 'store',
				icon: ShoppingBag,
			});
		}

		setNavItems(items);

		if (items.length > 0) {
			if (!hasInitializedView.current) {
				hasInitializedView.current = true;
				const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
				const urlQuery = searchParams ? searchParams.get('q') : null;
				if (urlQuery) setTriageQuery(urlQuery);
				const urlView = searchParams ? searchParams.get('tab') || searchParams.get('view') : null;
				const storedView = typeof window !== 'undefined' ? localStorage.getItem('xernerx_sidebar_view_/') : null;
				const targetView = urlView || view || storedView;
				const isTargetAllowed = Boolean(targetView && items.some((item) => item.view === targetView));
				if (isTargetAllowed && targetView) {
					if (view !== targetView) setView(targetView);
				} else {
					setView(items[0].view);
				}
			} else if (!view || !items.some((item) => item.view === view)) {
				setView(items[0].view);
			}
		}

		show();
	}, [userLoading, roleLoading, serverLoading, adminServerId, userRolePermissions, dbError, view, setView, setNavItems, show, t]);

	useEffect(() => {
		if (!hasInitializedView.current || !view || typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		if (params.get('tab') !== view) {
			params.set('tab', view);
			params.delete('view');
			window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
		}
	}, [view]);

	if ((userLoading || roleLoading || serverLoading) && !dbError) return <Loading />;

	if (dbError) {
		return (
			<div
				className="flex flex-col items-center justify-center min-h-[60vh] max-w-7xl mx-auto w-full"
				style={{
					padding: 'var(--ui-gap)',
					gap: 'var(--ui-gap)',
					fontSize: 'var(--text-scale, 14px)',
				}}
			>
				<div
					className="flex flex-col items-center text-center max-w-lg w-full rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
						<AlertTriangle size={32} />
					</div>
					<div className="flex flex-col w-full" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h1 className="text-xl font-bold text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							Database Error
						</h1>
						<p className="text-sm text-(--text-muted)">{t('feedback.error.description')}</p>
						<div className="mt-4 p-4 bg-(--background) rounded-xl border border-(--border)/10 text-left w-full overflow-auto">
							<p className="text-xs font-mono text-red-400 font-bold mb-1">{t('feedback.error.details')}</p>
							<p className="text-xs font-mono text-(--text-muted) break-words">{dbError}</p>
						</div>
					</div>
					<Button onClick={() => window.location.reload()}>{t('feedback.error.retry')}</Button>
				</div>
			</div>
		);
	}

	const allowedViews = [];
	const canUsers = userRolePermissions.users ?? permissions.find((p) => p.key === 'users')?.defaultValue ?? true;
	const canRoles = userRolePermissions.roles ?? permissions.find((p) => p.key === 'roles')?.defaultValue ?? false;
	const canApplicationsReview = userRolePermissions.applications_review ?? permissions.find((p) => p.key === 'applications_review')?.defaultValue ?? false;
	const canApplicationsManage = userRolePermissions.applications_manage ?? permissions.find((p) => p.key === 'applications_manage')?.defaultValue ?? false;
	const canTokens = userRolePermissions.tokens ?? permissions.find((p) => p.key === 'tokens')?.defaultValue ?? false;
	const canTranslations = userRolePermissions.translations ?? permissions.find((p) => p.key === 'translations')?.defaultValue ?? false;
	const canSettings = userRolePermissions.settings ?? permissions.find((p) => p.key === 'settings')?.defaultValue ?? false;
	const canInvites = userRolePermissions.invites ?? permissions.find((p) => p.key === 'invites')?.defaultValue ?? false;
	const canAnnouncements = userRolePermissions.announcements ?? permissions.find((p) => p.key === 'announcements')?.defaultValue ?? false;
	const canManageMedia = userRolePermissions.manageMedia ?? permissions.find((p) => p.key === 'manageMedia')?.defaultValue ?? false;
	const canUploadMedia = userRolePermissions.uploadMedia ?? permissions.find((p) => p.key === 'uploadMedia')?.defaultValue ?? true;
	const canMedia = canManageMedia || canUploadMedia;
	const canManageRoadmap = userRolePermissions.manageRoadmap ?? permissions.find((p) => p.key === 'manageRoadmap')?.defaultValue ?? false;
	const canManageSuggestions = userRolePermissions.manageSuggestions ?? permissions.find((p) => p.key === 'manageSuggestions')?.defaultValue ?? false;
	const canManageIssues = userRolePermissions.manageIssues ?? permissions.find((p) => p.key === 'manageIssues')?.defaultValue ?? false;
	const canManageStore = userRolePermissions.manageStore ?? userRolePermissions.store ?? permissions.find((p) => p.key === 'manageStore')?.defaultValue ?? false;

	const isServerSet = !!adminServerId;

	allowedViews.push('overview');
	allowedViews.push('seo');
	allowedViews.push('audit');
	if (canMedia) allowedViews.push('media');
	if (canTranslations && isServerSet) allowedViews.push('translations');
	if (canUsers && isServerSet) allowedViews.push('users');
	if (canApplicationsReview && isServerSet) allowedViews.push('applications_review');
	if (canApplicationsManage && isServerSet) allowedViews.push('applications_manage');
	if (canRoles && isServerSet) allowedViews.push('roles');
	if (canTokens && isServerSet) allowedViews.push('tokens');
	if (canSettings) allowedViews.push('settings');
	if (canInvites) allowedViews.push('invites');
	if (canAnnouncements) allowedViews.push('announcements');
	if (canManageRoadmap) allowedViews.push('roadmap');
	if (canManageSuggestions) allowedViews.push('suggestions');
	if (canManageIssues) allowedViews.push('issues');
	if (canManageStore) allowedViews.push('store');

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
			{activeView === 'overview' && (
				<HomeOverview
					permissions={{
						canUsers,
						canRoles,
						canApplicationsReview,
						canApplicationsManage,
						canTokens,
						canTranslations,
						canSettings,
						canInvites,
						canAnnouncements,
						canMedia,
						canManageRoadmap,
						canManageSuggestions,
						canManageIssues,
						canManageStore,
						isServerSet,
						adminServerId,
					}}
					onNavigate={handleNavigateFromOverview}
				/>
			)}
			{activeView === 'seo' && <Overview />}
			{activeView === 'audit' && <AuditLogs initialSearch={triageQuery} />}
			{activeView === 'media' && <Media />}
			{activeView === 'translations' && <Translations initialLocale={triageQuery} />}
			{activeView === 'users' && <Users initialSearch={triageQuery} onViewAuditLogs={(userId) => handleNavigateFromOverview('audit', userId)} />}
			{activeView === 'applications_review' && <ApplicationReviews initialSearch={triageQuery} />}
			{activeView === 'applications_manage' && <ApplicationConfigs />}
			{activeView === 'roles' && <Roles />}
			{activeView === 'tokens' && <Tokens initialSearch={triageQuery} onViewAuditLogs={(tokenId) => handleNavigateFromOverview('audit', tokenId)} />}
			{activeView === 'settings' && <Settings />}
			{activeView === 'invites' && <Invites initialSearch={triageQuery} />}
			{activeView === 'announcements' && <Announcements />}
			{activeView === 'roadmap' && <Roadmap />}
			{activeView === 'suggestions' && <Suggestions initialSearch={triageQuery} />}
			{activeView === 'issues' && <Issues initialSearch={triageQuery} />}
			{activeView === 'store' && <StoreManagement />}
		</div>
	);
}
