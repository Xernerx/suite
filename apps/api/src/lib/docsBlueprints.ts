/** @format */

import type { DocsQuickLinkItem } from './docsCatalog';
import { API_DOCS_BLUEPRINTS } from './docsBlueprintsApi';

export interface RawDocBlueprint {
	id: string;
	slug: string;
	category: 'api' | 'cdn' | 'websocket' | 'packages';
	categoryTitleKey: string;
	sectionTitleKey: string;
	titleKey?: string;
	rawTitle?: string;
	descKey?: string;
	rawDescription?: string;
	path?: string;
	method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
	docPath: string;
	quickLinks?: DocsQuickLinkItem[];
	keywords: string[];
}

export const DOCS_BLUEPRINTS: RawDocBlueprint[] = [
	...API_DOCS_BLUEPRINTS,

	// Developer Packages
	{
		id: 'pkg-xernerx-framework',
		slug: 'xernerx-framework',
		category: 'packages',
		categoryTitleKey: 'docs.home.categories.npm.title',
		sectionTitleKey: 'docs.packages.page.title',
		rawTitle: '@xernerx/framework',
		descKey: 'docs.packages.catalog.frameworkDesc',
		docPath: '/packages/@xernerx/framework',
		quickLinks: [
			{ label: 'Framework Documentation', href: 'https://docs.xernerx.com/packages/@xernerx/framework' },
			{ label: 'NPM Registry', href: 'https://www.npmjs.com/package/@xernerx/framework', external: true },
		],
		keywords: ['npm', 'package', 'framework', 'discord.js', 'commands', 'inhibitors', 'events', 'sharding'],
	},
	{
		id: 'pkg-xernerx-stats',
		slug: 'xernerx-stats',
		category: 'packages',
		categoryTitleKey: 'docs.home.categories.npm.title',
		sectionTitleKey: 'docs.packages.page.title',
		rawTitle: '@xernerx/stats',
		descKey: 'docs.packages.catalog.statsDesc',
		docPath: '/packages/@xernerx/stats',
		quickLinks: [
			{ label: 'Stats Documentation', href: 'https://docs.xernerx.com/packages/@xernerx/stats' },
			{ label: 'NPM Registry', href: 'https://www.npmjs.com/package/@xernerx/stats', external: true },
		],
		keywords: ['npm', 'package', 'stats', 'telemetry', 'guildcount', 'sync', 'daemon'],
	},
];
