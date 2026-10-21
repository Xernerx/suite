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

	// CDN Services
	{
		id: 'cdn-overview',
		slug: 'overview',
		category: 'cdn',
		categoryTitleKey: 'docs.home.categories.cdn.title',
		sectionTitleKey: 'docs.cdn.nav.overview',
		titleKey: 'docs.cdn.overview.title',
		descKey: 'docs.cdn.description',
		docPath: '/cdn#overview',
		quickLinks: [
			{ label: 'CDN Documentation', href: 'https://docs.xernerx.com/cdn#overview' },
			{ label: 'CDN Base Endpoint', href: 'https://cdn.xernerx.com', vanity: 'cdn.xernerx.com' },
		],
		keywords: ['cdn', 'media', 'storage', 'blob', 'overview', 'assets'],
	},
	{
		id: 'cdn-upload',
		slug: 'upload',
		category: 'cdn',
		categoryTitleKey: 'docs.home.categories.cdn.title',
		sectionTitleKey: 'docs.cdn.nav.uploadMedia',
		titleKey: 'docs.cdn.upload.title',
		descKey: 'docs.cdn.upload.description',
		method: 'POST',
		path: '/upload',
		docPath: '/cdn#upload',
		quickLinks: [{ label: 'Upload Media Reference', href: 'https://docs.xernerx.com/cdn#upload' }],
		keywords: ['cdn', 'upload', 'post', 'files', 'images', 'multipart', 'form-data', 'blob'],
	},
	{
		id: 'cdn-list',
		slug: 'list',
		category: 'cdn',
		categoryTitleKey: 'docs.home.categories.cdn.title',
		sectionTitleKey: 'docs.cdn.nav.listMedia',
		titleKey: 'docs.cdn.list.title',
		descKey: 'docs.cdn.list.description',
		method: 'GET',
		path: '/media',
		docPath: '/cdn#list',
		quickLinks: [{ label: 'List Media Records', href: 'https://docs.xernerx.com/cdn#list' }],
		keywords: ['cdn', 'media', 'list', 'get', 'records', 'assets'],
	},
	{
		id: 'cdn-manage',
		slug: 'manage',
		category: 'cdn',
		categoryTitleKey: 'docs.home.categories.cdn.title',
		sectionTitleKey: 'docs.cdn.nav.manageMedia',
		titleKey: 'docs.cdn.manage.title',
		descKey: 'docs.cdn.manage.description',
		method: 'PATCH',
		path: '/media/:id',
		docPath: '/cdn#manage',
		quickLinks: [{ label: 'Manage Media Reference', href: 'https://docs.xernerx.com/cdn#manage' }],
		keywords: ['cdn', 'manage', 'patch', 'delete', 'privacy', 'visibility', 'remove'],
	},
	{
		id: 'cdn-proxy',
		slug: 'proxy',
		category: 'cdn',
		categoryTitleKey: 'docs.home.categories.cdn.title',
		sectionTitleKey: 'docs.cdn.nav.secureProxy',
		titleKey: 'docs.cdn.proxy.title',
		descKey: 'docs.cdn.proxy.description',
		method: 'GET',
		path: '/raw/:id',
		docPath: '/cdn#proxy',
		quickLinks: [{ label: 'Streaming Media Proxy', href: 'https://docs.xernerx.com/cdn#proxy' }],
		keywords: ['cdn', 'raw', 'view', 'proxy', 'stream', 'fetch', 'download'],
	},

	// WebSocket Gateway
	{
		id: 'ws-overview',
		slug: 'overview',
		category: 'websocket',
		categoryTitleKey: 'docs.home.categories.websocket.title',
		sectionTitleKey: 'docs.websocket.nav.overview',
		titleKey: 'docs.websocket.overview.title',
		descKey: 'docs.websocket.hero.description',
		docPath: '/websocket#overview',
		quickLinks: [
			{ label: 'WebSocket Architecture Guide', href: 'https://docs.xernerx.com/websocket#overview' },
			{ label: 'Gateway Endpoint', href: 'wss://ws.xernerx.com', vanity: 'wss://ws.xernerx.com' },
		],
		keywords: ['websocket', 'gateway', 'realtime', 'overview', 'port 5000', 'events', 'socket'],
	},
	{
		id: 'ws-connecting',
		slug: 'connecting',
		category: 'websocket',
		categoryTitleKey: 'docs.home.categories.websocket.title',
		sectionTitleKey: 'docs.websocket.nav.connecting',
		titleKey: 'docs.websocket.nav.connecting',
		descKey: 'docs.websocket.overview.cards.socket.desc',
		docPath: '/websocket#connecting',
		quickLinks: [{ label: 'Connecting Guide', href: 'https://docs.xernerx.com/websocket#connecting' }],
		keywords: ['websocket', 'connecting', 'handshake', 'port 5000', 'reconnect', 'heartbeat'],
	},
	{
		id: 'ws-authentication',
		slug: 'authentication',
		category: 'websocket',
		categoryTitleKey: 'docs.home.categories.websocket.title',
		sectionTitleKey: 'docs.websocket.nav.authentication',
		titleKey: 'docs.websocket.nav.authentication',
		descKey: 'docs.websocket.overview.cards.auth.desc',
		docPath: '/websocket#authentication',
		quickLinks: [
			{ label: 'Authentication Spec', href: 'https://docs.xernerx.com/websocket#authentication' },
			{ label: 'Developer Portal Tokens', href: 'https://app.xernerx.com/portal' },
		],
		keywords: ['websocket', 'authentication', 'token', 'jwt', 'handshake', 'allowance'],
	},
	{
		id: 'ws-protocol',
		slug: 'protocol',
		category: 'websocket',
		categoryTitleKey: 'docs.home.categories.websocket.title',
		sectionTitleKey: 'docs.websocket.nav.rpcProtocol',
		titleKey: 'docs.websocket.nav.rpcProtocol',
		descKey: 'docs.websocket.overview.cards.proxy.desc',
		docPath: '/websocket#protocol',
		quickLinks: [{ label: 'RPC Protocol Spec', href: 'https://docs.xernerx.com/websocket#protocol' }],
		keywords: ['websocket', 'rpc', 'protocol', 'payload', 'service', 'action', 'json-rpc'],
	},
	{
		id: 'ws-services',
		slug: 'services',
		category: 'websocket',
		categoryTitleKey: 'docs.home.categories.websocket.title',
		sectionTitleKey: 'docs.websocket.nav.servicesAndActions',
		titleKey: 'docs.websocket.nav.servicesAndActions',
		descKey: 'docs.websocket.hero.description',
		docPath: '/websocket#services',
		quickLinks: [{ label: 'Available Services & Actions', href: 'https://docs.xernerx.com/websocket#services' }],
		keywords: ['websocket', 'services', 'actions', 'router', 'database', 'guilds', 'users'],
	},
	{
		id: 'ws-client',
		slug: 'client',
		category: 'websocket',
		categoryTitleKey: 'docs.home.categories.websocket.title',
		sectionTitleKey: 'docs.websocket.nav.clientExample',
		titleKey: 'docs.websocket.nav.clientExample',
		descKey: 'docs.websocket.hero.description',
		docPath: '/websocket#client',
		quickLinks: [
			{ label: 'TypeScript Client Example', href: 'https://docs.xernerx.com/websocket#client' },
			{ label: '@xernerx/websocket Package', href: 'https://docs.xernerx.com/packages/@xernerx/websocket' },
		],
		keywords: ['websocket', 'client', 'example', 'typescript', 'node', 'reconnect'],
	},

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
			{ label: 'WebSocket Client Docs', href: 'https://docs.xernerx.com/packages/@xernerx/websocket' },
			{ label: 'WebSocket Gateway Guide', href: 'https://docs.xernerx.com/websocket' },
		],
		keywords: ['npm', 'package', 'websocket', 'rpc', 'client', 'gateway', 'realtime'],
	},
	{
		id: 'pkg-xernerx-ui',
		slug: 'xernerx-ui',
		category: 'packages',
		categoryTitleKey: 'docs.home.categories.npm.title',
		sectionTitleKey: 'docs.packages.page.title',
		rawTitle: '@xernerx/ui',
		descKey: 'docs.packages.catalog.uiDesc',
		docPath: '/packages/@xernerx/ui',
		quickLinks: [
			{ label: 'UI Package Docs', href: 'https://docs.xernerx.com/packages/@xernerx/ui' },
			{ label: 'GitHub Monorepo', href: 'https://github.com/Xernerx/suite', external: true },
		],
		keywords: ['npm', 'package', 'ui', 'components', 'button', 'modal', 'input', 'selector', 'toggle'],
	},
	{
		id: 'pkg-xernerx-components',
		slug: 'xernerx-components',
		category: 'packages',
		categoryTitleKey: 'docs.home.categories.npm.title',
		sectionTitleKey: 'docs.packages.page.title',
		rawTitle: '@xernerx/components',
		descKey: 'docs.packages.catalog.componentsDesc',
		docPath: '/packages/@xernerx/components',
		quickLinks: [{ label: 'Components Docs', href: 'https://docs.xernerx.com/packages/@xernerx/components' }],
		keywords: ['npm', 'package', 'components', 'layout', 'applayout', 'header', 'sidebar', 'footer'],
	},
	{
		id: 'pkg-xernerx-lib',
		slug: 'xernerx-lib',
		category: 'packages',
		categoryTitleKey: 'docs.home.categories.npm.title',
		sectionTitleKey: 'docs.packages.page.title',
		rawTitle: '@xernerx/lib',
		descKey: 'docs.packages.catalog.libDesc',
		docPath: '/packages/@xernerx/lib',
		quickLinks: [{ label: 'Lib Documentation', href: 'https://docs.xernerx.com/packages/@xernerx/lib' }],
		keywords: ['npm', 'package', 'lib', 'mongoose', 'models', 'nextauth', 'i18n', 'database'],
	},
	{
		id: 'pkg-xernerx-styles',
		slug: 'xernerx-styles',
		category: 'packages',
		categoryTitleKey: 'docs.home.categories.npm.title',
		sectionTitleKey: 'docs.packages.page.title',
		rawTitle: '@xernerx/styles',
		descKey: 'docs.packages.catalog.stylesDesc',
		docPath: '/packages/@xernerx/styles',
		quickLinks: [{ label: 'Styles Documentation', href: 'https://docs.xernerx.com/packages/@xernerx/styles' }],
		keywords: ['npm', 'package', 'styles', 'tailwind', 'css', 'glassmorphism', 'tokens', 'theme'],
	},
];
