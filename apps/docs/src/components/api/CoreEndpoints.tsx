/** @format */
'use client';

import { Server, Shield, Globe, Key, Map, Lightbulb, Bug, HelpCircle, Code, Activity, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { CodeBlock } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { EndpointSection } from './EndpointSection';

export interface CoreEndpointsProps {
	activeGroup?: string;
	searchQuery?: string;
	methodFilter?: string;
	defaultExpanded?: boolean;
	onTryRoute?: (method: string, path: string) => void;
}

export function CoreEndpoints({ activeGroup = 'all', searchQuery = '', methodFilter = 'ALL', defaultExpanded = true, onTryRoute }: CoreEndpointsProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	const apiBase = getEnvUrl('https://api.xernerx.com');
	const appBase = getEnvUrl('https://app.xernerx.com');

	const renderEmbedExtra = (entityType: 'bots' | 'organizations' | 'guilds' | 'users', sampleId: string, profilePath: string, labelName: string) => {
		const baseEndpoint = `${apiBase}/core/${entityType}/${sampleId}`;
		const svgUrl = `${baseEndpoint}?type=svg`;
		const pngUrl = `${baseEndpoint}?type=png`;
		const iframeUrl = `${baseEndpoint}?type=iframe`;
		const profileUrl = `${appBase}${profilePath}`;

		return (
			<div className="p-6 border-t border-(--border)/10">
				<CodeBlock
					preview={<Image src={svgUrl} alt={labelName} width={420} height={172} unoptimized className="max-w-full h-auto rounded-2xl shadow-sm" />}
					tabs={[
						{
							id: 'iframe',
							label: t('app.widgets.formatIframe'),
							language: 'html',
							code: `<iframe\n  src="${iframeUrl}"\n  width="420"\n  height="172"\n  style="border:0;border-radius:20px;overflow:hidden"\n  loading="lazy"\n  title="${labelName}"\n></iframe>`,
						},
						{
							id: 'markdown',
							label: t('app.widgets.formatMarkdown'),
							language: 'markdown',
							code: `[![${labelName}](${svgUrl})](${profileUrl})`,
						},
						{
							id: 'html',
							label: t('app.widgets.formatHtmlImg'),
							language: 'html',
							code: `<a href="${profileUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${svgUrl}" alt="${labelName}" width="420" height="172" />\n</a>`,
						},
						{
							id: 'image',
							label: t('app.widgets.formatPngImage'),
							language: 'url',
							code: pngUrl,
						},
						{
							id: 'svg',
							label: t('app.widgets.formatDirectSvg'),
							language: 'url',
							code: svgUrl,
						},
						{
							id: 'json',
							label: t('app.widgets.formatDirectJson'),
							language: 'json',
							code: baseEndpoint,
						},
					]}
				/>
			</div>
		);
	};

	const sections = [
		{
			id: 'fetch-bot-embed',
			group: 'core-embeds',
			title: t('docs.api.core.fetchBotEmbed.title'),
			icon: Server,
			description: t('docs.api.core.fetchBotEmbed.description'),
			routes: [{ method: 'GET', path: '/core/bots/[id]?type=json|svg|png|iframe&theme=dark|light', auth: 'public' as const }],
			extra: renderEmbedExtra('bots', '1059956767103668244', '/bots/1059956767103668244', 'Virtue'),
		},
		{
			id: 'fetch-organization-embed',
			group: 'core-embeds',
			title: t('docs.api.core.fetchOrganizationEmbed.title'),
			icon: Shield,
			description: t('docs.api.core.fetchOrganizationEmbed.description'),
			routes: [{ method: 'GET', path: '/core/organizations/[id]?type=json|svg|png|iframe&theme=dark|light', auth: 'public' as const }],
			extra: renderEmbedExtra('organizations', 'xernerx', '/organization/xernerx', 'Xernerx Studios'),
		},
		{
			id: 'fetch-guild-embed',
			group: 'core-embeds',
			title: t('docs.api.core.fetchGuildEmbed.title'),
			icon: Globe,
			description: t('docs.api.core.fetchGuildEmbed.description'),
			routes: [{ method: 'GET', path: '/core/guilds/[id]?type=json|svg|png|iframe&theme=dark|light', auth: 'public' as const }],
			extra: renderEmbedExtra('guilds', '1020060643106795631', '/servers/1020060643106795631', 'Xernerx Community'),
		},
		{
			id: 'fetch-user-embed',
			group: 'core-embeds',
			title: t('docs.api.core.fetchUserEmbed.title'),
			icon: Server,
			description: t('docs.api.core.fetchUserEmbed.description'),
			routes: [{ method: 'GET', path: '/core/users/[id]?type=json|svg|png|iframe&theme=dark|light', auth: 'public' as const }],
			extra: renderEmbedExtra('users', '482513687417061376', '/users/482513687417061376', 'Dummi'),
		},
		{
			id: 'core-faq',
			group: 'core-faq',
			title: t('docs.api.core.infoFaq.title'),
			icon: HelpCircle,
			description: t('docs.api.core.infoFaq.description'),
			routes: [
				{ method: 'GET', path: '/core/faq?locale=en-GB&category=&q=&flat=false', auth: 'public' as const },
				{ method: 'GET', path: '/core/faq/categories?locale=en-GB', auth: 'public' as const },
				{ method: 'GET', path: '/core/faq/search?q=token&locale=en-GB', auth: 'public' as const },
				{ method: 'GET', path: '/core/faq/[category]?locale=en-GB', auth: 'public' as const },
				{ method: 'GET', path: '/core/faq/[category]/[id]?locale=en-GB', auth: 'public' as const },
			],
			extra: (
				<div className="p-6 border-t border-(--border)/10 space-y-4">
					<h3 className="font-semibold text-(--text) flex items-center gap-2 text-sm">
						<Code size={16} /> {t('docs.api.v1.common.fetchExamples')}
					</h3>
					<CodeBlock
						tabs={[
							{
								label: 'Discord.js Slash Command',
								language: 'typescript',
								code: `// Fetch a specific FAQ card (with pre-formatted discordEmbed)\nconst res = await fetch('https://api.xernerx.com/core/faq/bots/registration?locale=en-GB');\nconst item = await res.json();\n\nawait interaction.reply({\n    embeds: [item.discordEmbed]\n});`,
							},
							{
								label: 'Autocomplete / Search',
								language: 'typescript',
								code: `const res = await fetch(\`https://api.xernerx.com/core/faq/search?q=\${encodeURIComponent(focusedValue)}&locale=en-GB\`);\nconst { items } = await res.json();\n\nawait interaction.respond(\n    items.slice(0, 25).map((i: any) => ({\n        name: \`[\${i.categoryTitle}] \${i.question}\`.slice(0, 100),\n        value: \`\${i.categoryId}/\${i.slug}\`\n    }))\n);`,
							},
							{
								label: 'Response JSON',
								language: 'json',
								code: `{\n  "locale": "en-GB",\n  "id": "card2",\n  "slug": "registration",\n  "fullId": "bots.card2",\n  "categoryId": "bots",\n  "question": "How do I register my bot and sync stats or slash commands?",\n  "url": "https://info.xernerx.com/faq?category=bots&card=card2",\n  "discordEmbed": {\n    "title": "How do I register my bot and sync stats or slash commands?",\n    "url": "https://info.xernerx.com/faq?category=bots&card=card2",\n    "description": "First, generate a Bearer token on account.xernerx.com/tokens...",\n    "fields": [\n      {\n        "name": "Quick Links & Vanity Routes",\n        "value": "• [API Tokens](https://account.xernerx.com/?tab=tokens) (\`account.xernerx.com/tokens\`)"\n      }\n    ],\n    "footer": {\n      "text": "Xernerx FAQ • Bots, Servers & Virtue › Bots, Discovery & Portal"\n    }\n  }\n}`,
							},
						]}
					/>
				</div>
			),
		},
		{
			id: 'core-docs',
			group: 'core-faq',
			title: t('docs.api.core.infoDocs.title'),
			icon: BookOpen,
			description: t('docs.api.core.infoDocs.description'),
			routes: [
				{ method: 'GET', path: '/core/docs?locale=en-GB&category=&q=&flat=false', auth: 'public' as const },
				{ method: 'GET', path: '/core/docs/[id]?locale=en-GB', auth: 'public' as const },
				{ method: 'GET', path: '/core/changelog/reactions', auth: 'public' as const },
				{ method: 'POST', path: '/core/changelog/reactions', auth: 'token' as const },
				{ method: 'GET', path: '/core/downloads/app?channel=stable|canary', auth: 'public' as const },
			],
		},
		{
			id: 'info-status',
			group: 'core-info',
			title: t('docs.api.core.infoStatus.title'),
			icon: Activity,
			description: t('docs.api.core.infoStatus.description'),
			routes: [
				{ method: 'GET', path: '/info/status/bots?refresh=false', auth: 'public' as const },
				{ method: 'GET', path: '/info/status/history?refresh=false', auth: 'public' as const },
				{ method: 'GET', path: '/info/status/cron', auth: 'public' as const },
				{ method: 'POST', path: '/info/status/history', auth: 'public' as const },
			],
		},
		{
			id: 'info-roadmap',
			group: 'core-info',
			title: t('docs.api.core.infoRoadmap.title'),
			icon: Map,
			description: t('docs.api.core.infoRoadmap.description'),
			routes: [
				{ method: 'GET', path: '/info/roadmap', auth: 'public' as const },
				{ method: 'GET', path: '/info/roadmap/products', auth: 'public' as const },
				{ method: 'POST', path: '/info/roadmap/[id]/interact', auth: 'token' as const },
			],
		},
		{
			id: 'info-suggestions',
			group: 'core-info',
			title: t('docs.api.core.infoSuggestions.title'),
			icon: Lightbulb,
			description: t('docs.api.core.infoSuggestions.description'),
			routes: [
				{ method: 'GET', path: '/info/suggestions', auth: 'public' as const },
				{ method: 'POST', path: '/info/suggestions', auth: 'token' as const },
				{ method: 'POST', path: '/info/suggestions/[id]/vote', auth: 'token' as const },
			],
		},
		{
			id: 'info-issues',
			group: 'core-info',
			title: t('docs.api.core.infoIssues.title'),
			icon: Bug,
			description: t('docs.api.core.infoIssues.description'),
			routes: [
				{ method: 'GET', path: '/info/issues', auth: 'public' as const },
				{ method: 'POST', path: '/info/issues', auth: 'token' as const },
				{ method: 'GET', path: '/info/issues/metrics', auth: 'public' as const },
			],
		},
		{
			id: 'fetch-discord-profile',
			group: 'core-discord',
			title: t('docs.api.core.fetchDiscordProfile.title'),
			icon: Server,
			description: t('docs.api.core.fetchDiscordProfile.description'),
			routes: [{ method: 'GET', path: '/core/users/[id]/discord', auth: 'public' as const }],
		},
		{
			id: 'fetch-discord-guilds',
			group: 'core-discord',
			title: t('docs.api.core.fetchDiscordGuilds.title'),
			icon: Shield,
			description: t('docs.api.core.fetchDiscordGuilds.description'),
			routes: [{ method: 'GET', path: '/core/users/[id]/discord/guilds', auth: 'public' as const }],
		},
		{
			id: 'fetch-discord-guild',
			group: 'core-discord',
			title: t('docs.api.core.fetchDiscordGuild.title'),
			icon: Globe,
			description: t('docs.api.core.fetchDiscordGuild.description'),
			routes: [{ method: 'GET', path: '/core/guilds/[id]/discord', auth: 'public' as const }],
		},
		{
			id: 'fetch-discord-roles',
			group: 'core-discord',
			title: t('docs.api.core.fetchDiscordRoles.title'),
			icon: Key,
			description: t('docs.api.core.fetchDiscordRoles.description'),
			routes: [
				{ method: 'GET', path: '/core/guilds/[id]/discord/roles', auth: 'public' as const },
				{ method: 'GET', path: '/core/guilds/[id]/discord/channels', auth: 'public' as const },
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
					extra={(section as any).extra}
					defaultExpanded={defaultExpanded}
					searchQuery={searchQuery}
					methodFilter={methodFilter}
					onTryRoute={onTryRoute}
				/>
			))}
		</>
	);
}
