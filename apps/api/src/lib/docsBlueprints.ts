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

	// Developer Packages (All-in-One `xernerx` & Modular `@xernerx/*`)
	{
		id: 'pkg-xernerx',
		slug: 'xernerx',
		category: 'packages',
		categoryTitleKey: 'docs.home.categories.npm.title',
		sectionTitleKey: 'docs.packages.page.title',
		rawTitle: 'xernerx (All-in-One SDK)',
		descKey: 'docs.packages.catalog.xernerxDesc',
		docPath: '/packages/xernerx',
		quickLinks: [
			{ label: 'xernerx Documentation', href: 'https://docs.xernerx.com/packages/xernerx' },
			{ label: 'NPM Registry', href: 'https://www.npmjs.com/package/xernerx', external: true },
		],
		keywords: ['npm', 'package', 'xernerx', 'collection', 'bundle', 'sdk', 'framework', 'commands', 'stats', 'terminal', 'websocket'],
	},
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
		id: 'pkg-xernerx-commands',
		slug: 'xernerx-commands',
		category: 'packages',
		categoryTitleKey: 'docs.home.categories.npm.title',
		sectionTitleKey: 'docs.packages.page.title',
		rawTitle: '@xernerx/commands',
		descKey: 'docs.packages.catalog.commandsDesc',
		docPath: '/packages/@xernerx/commands',
		quickLinks: [
			{ label: 'Commands Documentation', href: 'https://docs.xernerx.com/packages/@xernerx/commands' },
			{ label: 'NPM Registry', href: 'https://www.npmjs.com/package/@xernerx/commands', external: true },
		],
		keywords: ['npm', 'package', 'commands', 'slash', 'ping', 'evaluate', 'haste', 'git', 'source', 'debug', 'repeat', 'sudo', 'su', 'jsk', 'jishaku', 'sync', 'discord.js'],
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
	{
		id: 'pkg-xernerx-terminal',
		slug: 'xernerx-terminal',
		category: 'packages',
		categoryTitleKey: 'docs.home.categories.npm.title',
		sectionTitleKey: 'docs.packages.page.title',
		rawTitle: '@xernerx/terminal',
		descKey: 'docs.packages.catalog.terminalDesc',
		docPath: '/packages/@xernerx/terminal',
		quickLinks: [
			{ label: 'Terminal Documentation', href: 'https://docs.xernerx.com/packages/@xernerx/terminal' },
			{ label: 'NPM Registry', href: 'https://www.npmjs.com/package/@xernerx/terminal', external: true },
		],
		keywords: ['npm', 'package', 'terminal', 'logger', 'spinner', 'ansi', 'cli'],
	},
	{
		id: 'pkg-xernerx-websocket',
		slug: 'xernerx-websocket',
		category: 'packages',
		categoryTitleKey: 'docs.home.categories.npm.title',
		sectionTitleKey: 'docs.packages.page.title',
		rawTitle: '@xernerx/websocket',
		descKey: 'docs.packages.catalog.websocketDesc',
		docPath: '/packages/@xernerx/websocket',
		quickLinks: [
			{ label: 'WebSocket Package Docs', href: 'https://docs.xernerx.com/packages/@xernerx/websocket' },
			{ label: 'WebSocket Gateway Guide', href: 'https://docs.xernerx.com/websocket' },
			{ label: 'NPM Registry', href: 'https://www.npmjs.com/package/@xernerx/websocket', external: true },
		],
		keywords: ['npm', 'package', 'websocket', 'rpc', 'gateway', 'client', 'virtue', 'xernerx'],
	},
	{
		id: 'pkg-xernerx-hooks',
		slug: 'xernerx-hooks',
		category: 'packages',
		categoryTitleKey: 'docs.home.categories.npm.title',
		sectionTitleKey: 'docs.packages.page.title',
		rawTitle: '@xernerx/hooks',
		descKey: 'docs.packages.catalog.hooksDesc',
		docPath: '/packages/@xernerx/hooks',
		quickLinks: [
			{ label: 'Hooks Package Docs', href: 'https://docs.xernerx.com/packages/@xernerx/hooks' },
			{ label: 'NPM Registry', href: 'https://www.npmjs.com/package/@xernerx/hooks', external: true },
		],
		keywords: ['npm', 'package', 'hooks', 'webhooks', 'voted', 'reviewed', 'tipped', 'hmac', 'sha256', 'xernerxhooks', 'hooksclient'],
	},
	{
		id: 'pkg-xernerx-extension-builder',
		slug: 'xernerx-extension-builder',
		category: 'packages',
		categoryTitleKey: 'docs.home.categories.npm.title',
		sectionTitleKey: 'docs.packages.page.title',
		rawTitle: '@xernerx/extension-builder',
		descKey: 'docs.packages.catalog.extensionBuilderDesc',
		docPath: '/packages/@xernerx/extension-builder',
		quickLinks: [
			{ label: 'Extension Builder Docs', href: 'https://docs.xernerx.com/packages/@xernerx/extension-builder' },
			{ label: 'NPM Registry', href: 'https://www.npmjs.com/package/@xernerx/extension-builder', external: true },
		],
		keywords: ['npm', 'package', 'extension', 'builder', 'extensionbuilder', 'lifecycle', 'defer', 'main', 'framework'],
	},
];
