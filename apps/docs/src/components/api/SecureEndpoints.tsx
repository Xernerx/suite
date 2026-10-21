/** @format */
'use client';

import { Server, Key, Shield, Link as LinkIcon, Megaphone, Languages, FileText, Settings2, Bot, Globe, Building2, ShoppingBag, Bell, Bug } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { EndpointSection } from './EndpointSection';

export interface SecureEndpointsProps {
	activeGroup?: string;
	searchQuery?: string;
	methodFilter?: string;
	defaultExpanded?: boolean;
	onTryRoute?: (method: string, path: string) => void;
}

export function SecureEndpoints({ activeGroup = 'all', searchQuery = '', methodFilter = 'ALL', defaultExpanded = true, onTryRoute }: SecureEndpointsProps) {
	const { t } = useDictionary();

	const sections = [
		{
			id: 'manage-users',
			group: 'secure-entities',
			title: t('docs.api.secure.manageUsers.title'),
			icon: Server,
			description: t('docs.api.secure.manageUsers.description'),
			routes: [
				{ method: 'GET', path: '/secure/users', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/users/[id]', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/users/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/users/[id]', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/users/[id]/activity', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/users/[id]/activity', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/users/[id]/credits/claim', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/users/[id]/discord', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/users/[id]/discord/roles', auth: 'secure' as const },
				{ method: 'PUT', path: '/secure/users/[id]/discord/roles', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/users/[id]/discord/roles', auth: 'secure' as const },
			],
		},
		{
			id: 'manage-bots',
			group: 'secure-entities',
			title: t('docs.api.secure.manageBots.title'),
			icon: Bot,
			description: t('docs.api.secure.manageBots.description'),
			routes: [
				{ method: 'GET', path: '/secure/bots', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/bots', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/bots/tags', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/bots/[id]/profile', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/bots/[id]/profile', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/bots/[id]/profile', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/bots/[id]/stats', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/bots/[id]/stats', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/bots/[id]/stats', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/bots/[id]/stats', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/bots/[id]/vote', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/bots/[id]/hooks', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/bots/[id]/hooks', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/bots/[id]/hooks/test', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/bots/[id]/reviews', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/bots/[id]/reviews', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/bots/[id]/reviews/[reviewId]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/bots/[id]/reviews/[reviewId]', auth: 'secure' as const },
			],
		},
		{
			id: 'manage-guilds',
			group: 'secure-entities',
			title: t('docs.api.secure.manageGuilds.title'),
			icon: Globe,
			description: t('docs.api.secure.manageGuilds.description'),
			routes: [
				{ method: 'GET', path: '/secure/guilds', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/guilds', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/guilds/[id]', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/guilds/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/guilds/[id]', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/guilds/[id]/virtue', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/guilds/[id]/virtue', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/guilds/[id]/vote', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/servers/[id]/vote', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/guilds/[id]/discord/roles', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/guilds/[id]/discord/roles', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/guilds/[id]/discord/roles/[roleId]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/guilds/[id]/discord/roles/[roleId]', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/guilds/[id]/discord/channels/[channelId]', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/guilds/[id]/discord/channels/[channelId]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/guilds/[id]/discord/channels/[channelId]', auth: 'secure' as const },
				{ method: 'PUT', path: '/secure/guilds/[id]/discord/join/[userId]', auth: 'secure' as const },
			],
		},
		{
			id: 'manage-organizations',
			group: 'secure-entities',
			title: t('docs.api.secure.manageOrganizations.title'),
			icon: Building2,
			description: t('docs.api.secure.manageOrganizations.description'),
			routes: [
				{ method: 'GET', path: '/secure/organizations', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/organizations', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/organizations/[id]', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/organizations/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/organizations/[id]', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/organizations/[id]/members', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/organizations/[id]/members', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/organizations/[id]/members', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/organizations/[id]/members', auth: 'secure' as const },
			],
		},
		{
			id: 'manage-store',
			group: 'secure-commerce',
			title: t('docs.api.secure.manageStore.title'),
			icon: ShoppingBag,
			description: t('docs.api.secure.manageStore.description'),
			routes: [
				{ method: 'GET', path: '/secure/store/catalog', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/store/categories', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/store/categories', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/store/categories/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/store/categories/[id]', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/store/items', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/store/items', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/store/items/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/store/items/[id]', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/store/checkout', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/store/[id]/product', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/store/[id]/cancel', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/store/[id]/gift', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/webhooks/stripe', auth: 'secure' as const },
			],
		},
		{
			id: 'manage-tokens',
			group: 'secure-commerce',
			title: t('docs.api.secure.manageTokens.title'),
			icon: Key,
			description: t('docs.api.secure.manageTokens.description'),
			routes: [
				{ method: 'GET', path: '/secure/tokens', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/tokens', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/tokens/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/tokens/[id]', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/validate/token', auth: 'secure' as const },
			],
		},
		{
			id: 'manage-roles',
			group: 'secure-moderation',
			title: t('docs.api.secure.manageRoles.title'),
			icon: Shield,
			description: t('docs.api.secure.manageRoles.description'),
			routes: [
				{ method: 'GET', path: '/secure/core', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/core', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/core/[id]', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/core/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/core/[id]', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/core/roles/reorder', auth: 'secure' as const },
			],
		},
		{
			id: 'manage-invites',
			group: 'secure-moderation',
			title: t('docs.api.secure.manageInvites.title'),
			icon: LinkIcon,
			description: t('docs.api.secure.manageInvites.description'),
			routes: [
				{ method: 'GET', path: '/secure/invites', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/invites', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/invites/[id]', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/invites/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/invites/[id]', auth: 'secure' as const },
			],
		},
		{
			id: 'manage-announcements',
			group: 'secure-moderation',
			title: t('docs.api.secure.manageAnnouncements.title'),
			icon: Megaphone,
			description: t('docs.api.secure.manageAnnouncements.description'),
			routes: [
				{ method: 'GET', path: '/secure/announcements', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/announcements', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/announcements/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/announcements/[id]', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/announcements/create-webhook', auth: 'secure' as const },
				{ method: 'GET', path: '/api/cron/announcements', auth: 'secure' as const },
			],
		},
		{
			id: 'manage-applications',
			group: 'secure-moderation',
			title: t('docs.api.secure.manageApplications.title'),
			icon: FileText,
			description: t('docs.api.secure.manageApplications.description'),
			routes: [
				{ method: 'GET', path: '/secure/applications', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/applications/open', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/applications/open/[id]', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/applications/submit', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/dispatch/applications', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/dispatch/applications', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/dispatch/applications/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/dispatch/applications/[id]', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/dispatch/applications/reviews', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/dispatch/applications/reviews/[id]', auth: 'secure' as const },
			],
		},
		{
			id: 'manage-dispatch',
			group: 'secure-moderation',
			title: t('docs.api.secure.manageDispatch.title'),
			icon: Bell,
			description: t('docs.api.secure.manageDispatch.description'),
			routes: [
				{ method: 'GET', path: '/secure/dispatch', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/dispatch', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/dispatch/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/dispatch/[id]', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/dispatch/email', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/dispatch/webhook', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/downloads/app', auth: 'secure' as const },
			],
		},
		{
			id: 'manage-translations',
			group: 'secure-system',
			title: t('docs.api.secure.manageTranslations.title'),
			icon: Languages,
			description: t('docs.api.secure.manageTranslations.description'),
			routes: [
				{ method: 'GET', path: '/secure/dictionary/[language]', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/dictionary/[language]', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/dictionary/[language]', auth: 'secure' as const },
			],
		},
		{
			id: 'manage-feedback-admin',
			group: 'secure-system',
			title: t('docs.api.secure.manageFeedbackAdmin.title'),
			icon: Bug,
			description: t('docs.api.secure.manageFeedbackAdmin.description'),
			routes: [
				{ method: 'GET', path: '/secure/core/issues', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/core/issues/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/core/issues/[id]', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/core/roadmap', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/core/roadmap', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/core/roadmap/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/core/roadmap/[id]', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/core/suggestions', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/core/suggestions/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/core/suggestions/[id]', auth: 'secure' as const },
			],
		},
		{
			id: 'system-settings',
			group: 'secure-system',
			title: t('docs.api.secure.systemSettings.title'),
			icon: Settings2,
			description: t('docs.api.secure.systemSettings.description'),
			routes: [
				{ method: 'GET', path: '/secure/core/settings', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/core/settings', auth: 'secure' as const },
				{ method: 'PATCH', path: '/secure/core/settings/[id]', auth: 'secure' as const },
				{ method: 'DELETE', path: '/secure/core/settings/[id]', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/core/settings/sister_servers/sync', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/core/versions', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/core/lighthouse', auth: 'secure' as const },
				{ method: 'GET', path: '/secure/core/audit', auth: 'secure' as const },
				{ method: 'POST', path: '/secure/core/audit', auth: 'secure' as const },
			],
		},
	].filter((s) => activeGroup === 'all' || s.group === activeGroup);

	return (
		<>
			{sections.map((section) => (
				<EndpointSection
					key={section.id}
					id={section.id}
					title={section.title}
					icon={section.icon}
					description={section.description}
					routes={section.routes}
					defaultExpanded={defaultExpanded}
					searchQuery={searchQuery}
					methodFilter={methodFilter}
					onTryRoute={onTryRoute}
				/>
			))}
		</>
	);
}
