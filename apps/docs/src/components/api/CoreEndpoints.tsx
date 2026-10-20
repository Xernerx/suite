/** @format */
'use client';

import { Server, Shield, Globe, Key } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { EndpointSection } from './EndpointSection';

export function CoreEndpoints() {
	const { t } = useDictionary();

	const sections = [
		{
			id: 'fetch-discord-profile',
			title: t('docs.api.core.fetchDiscordProfile.title'),
			icon: Server,
			description: t('docs.api.core.fetchDiscordProfile.description'),
			routes: [{ method: 'GET', path: '/core/users/[id]/discord', color: 'blue' }],
		},
		{
			id: 'fetch-discord-guilds',
			title: t('docs.api.core.fetchDiscordGuilds.title'),
			icon: Shield,
			description: t('docs.api.core.fetchDiscordGuilds.description'),
			routes: [{ method: 'GET', path: '/core/users/[id]/discord/guilds', color: 'blue' }],
		},
		{
			id: 'fetch-discord-guild',
			title: t('docs.api.core.fetchDiscordGuild.title'),
			icon: Globe,
			description: t('docs.api.core.fetchDiscordGuild.description'),
			routes: [{ method: 'GET', path: '/core/guilds/[id]/discord', color: 'blue' }],
		},
		{
			id: 'fetch-discord-roles',
			title: t('docs.api.core.fetchDiscordRoles.title'),
			icon: Key,
			description: t('docs.api.core.fetchDiscordRoles.description'),
			routes: [{ method: 'GET', path: '/core/guilds/[id]/discord/roles', color: 'blue' }],
		},
		{
			id: 'fetch-bot-embed',
			title: t('docs.api.core.fetchBotEmbed.title'),
			icon: Server,
			description: t('docs.api.core.fetchBotEmbed.description'),
			routes: [{ method: 'GET', path: '/core/bots/[id]', color: 'blue' }],
		},
		{
			id: 'fetch-organization-embed',
			title: t('docs.api.core.fetchOrganizationEmbed.title'),
			icon: Shield,
			description: t('docs.api.core.fetchOrganizationEmbed.description'),
			routes: [{ method: 'GET', path: '/core/organizations/[id]', color: 'blue' }],
		},
		{
			id: 'fetch-guild-embed',
			title: t('docs.api.core.fetchGuildEmbed.title'),
			icon: Globe,
			description: t('docs.api.core.fetchGuildEmbed.description'),
			routes: [{ method: 'GET', path: '/core/guilds/[id]', color: 'blue' }],
		},
		{
			id: 'fetch-user-embed',
			title: t('docs.api.core.fetchUserEmbed.title'),
			icon: Server,
			description: t('docs.api.core.fetchUserEmbed.description'),
			routes: [{ method: 'GET', path: '/core/users/[id]', color: 'blue' }],
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
