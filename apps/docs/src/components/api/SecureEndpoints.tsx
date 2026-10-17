/** @format */
'use client';

import { Server, Key, Shield, Link as LinkIcon, Megaphone, Languages, FileText, Settings2 } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { EndpointSection } from './EndpointSection';

export function SecureEndpoints() {
	const { t } = useDictionary();

	const sections = [
		{
			id: 'manage-users',
			title: t('docs.api.secure.manageUsers.title'),
			icon: Server,
			description: t('docs.api.secure.manageUsers.description'),
			routes: [
				{ method: 'GET', path: '/secure/users', color: 'blue' },
				{ method: 'GET', path: '/secure/users/[id]', color: 'blue' },
				{ method: 'PATCH', path: '/secure/users/[id]', color: 'orange' },
				{ method: 'DELETE', path: '/secure/users/[id]', color: 'red' },
			],
		},
		{
			id: 'manage-tokens',
			title: t('docs.api.secure.manageTokens.title'),
			icon: Key,
			description: t('docs.api.secure.manageTokens.description'),
			routes: [
				{ method: 'GET', path: '/secure/tokens', color: 'blue' },
				{ method: 'POST', path: '/secure/tokens', color: 'green' },
				{ method: 'PATCH', path: '/secure/tokens/[id]', color: 'orange' },
				{ method: 'DELETE', path: '/secure/tokens/[id]', color: 'red' },
			],
		},
		{
			id: 'manage-roles',
			title: t('docs.api.secure.manageRoles.title'),
			icon: Shield,
			description: t('docs.api.secure.manageRoles.description'),
			routes: [
				{ method: 'GET', path: '/secure/core', color: 'blue' },
				{ method: 'POST', path: '/secure/core', color: 'green' },
				{ method: 'GET', path: '/secure/core/[id]', color: 'blue' },
				{ method: 'PATCH', path: '/secure/core/[id]', color: 'orange' },
				{ method: 'DELETE', path: '/secure/core/[id]', color: 'red' },
				{ method: 'POST', path: '/secure/core/roles/reorder', color: 'green' },
			],
		},
		{
			id: 'manage-invites',
			title: t('docs.api.secure.manageInvites.title'),
			icon: LinkIcon,
			description: t('docs.api.secure.manageInvites.description'),
			routes: [
				{ method: 'GET', path: '/secure/invites', color: 'blue' },
				{ method: 'POST', path: '/secure/invites', color: 'green' },
				{ method: 'GET', path: '/secure/invites/[id]', color: 'blue' },
				{ method: 'PATCH', path: '/secure/invites/[id]', color: 'orange' },
				{ method: 'DELETE', path: '/secure/invites/[id]', color: 'red' },
			],
		},
		{
			id: 'manage-announcements',
			title: t('docs.api.secure.manageAnnouncements.title'),
			icon: Megaphone,
			description: t('docs.api.secure.manageAnnouncements.description'),
			routes: [
				{ method: 'GET', path: '/secure/announcements', color: 'blue' },
				{ method: 'POST', path: '/secure/announcements', color: 'green' },
				{ method: 'PATCH', path: '/secure/announcements/[id]', color: 'orange' },
				{ method: 'DELETE', path: '/secure/announcements/[id]', color: 'red' },
				{ method: 'POST', path: '/secure/announcements/create-webhook', color: 'green' },
			],
		},
		{
			id: 'manage-translations',
			title: t('docs.api.secure.manageTranslations.title'),
			icon: Languages,
			description: t('docs.api.secure.manageTranslations.description'),
			routes: [
				{ method: 'GET', path: '/secure/dictionary/[language]', color: 'blue' },
				{ method: 'POST', path: '/secure/dictionary/[language]', color: 'green' },
				{ method: 'PATCH', path: '/secure/dictionary/[language]', color: 'orange' },
			],
		},
		{
			id: 'manage-applications',
			title: t('docs.api.secure.manageApplications.title'),
			icon: FileText,
			description: t('docs.api.secure.manageApplications.description'),
			routes: [
				{ method: 'GET', path: '/secure/dispatch/applications', color: 'blue' },
				{ method: 'POST', path: '/secure/dispatch/applications', color: 'green' },
				{ method: 'PATCH', path: '/secure/dispatch/applications/[id]', color: 'orange' },
				{ method: 'DELETE', path: '/secure/dispatch/applications/[id]', color: 'red' },
				{ method: 'GET', path: '/secure/dispatch/applications/reviews', color: 'blue' },
				{ method: 'POST', path: '/secure/dispatch/applications/reviews/[id]', color: 'green' },
			],
		},
		{
			id: 'system-settings',
			title: t('docs.api.secure.systemSettings.title'),
			icon: Settings2,
			description: t('docs.api.secure.systemSettings.description'),
			routes: [
				{ method: 'GET', path: '/secure/core/settings', color: 'blue' },
				{ method: 'POST', path: '/secure/core/settings', color: 'green' },
				{ method: 'PATCH', path: '/secure/core/settings/[id]', color: 'orange' },
				{ method: 'DELETE', path: '/secure/core/settings/[id]', color: 'red' },
			],
		},
	];

	return (
		<>
			{sections.map((section) => (
				<EndpointSection key={section.id} id={section.id} title={section.title} icon={section.icon} description={section.description} routes={section.routes} />
			))}
		</>
	);
}
