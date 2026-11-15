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

	// CDN & Media Pipeline (`cdn.xernerx.com`)
	{
		id: 'cdn-overview',
		slug: 'cdn-overview',
		category: 'cdn',
		categoryTitleKey: 'docs.cdn.title',
		sectionTitleKey: 'docs.api.common.nav.overviewAndAuth',
		titleKey: 'docs.cdn.title',
		descKey: 'docs.cdn.description',
		docPath: '/cdn#overview',
		quickLinks: [
			{ label: 'CDN Documentation', href: 'https://docs.xernerx.com/cdn#overview' },
			{ label: 'CDN Gateway', href: 'https://cdn.xernerx.com', vanity: 'cdn.xernerx.com' },
		],
		keywords: ['cdn', 'media', 'overview', 'blob', 'storage', 'privacy', 'public', 'limited', 'private'],
	},
	{
		id: 'cdn-upload',
		slug: 'upload',
		category: 'cdn',
		categoryTitleKey: 'docs.cdn.title',
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
		categoryTitleKey: 'docs.cdn.title',
		sectionTitleKey: 'docs.cdn.nav.listMedia',
		titleKey: 'docs.cdn.list.title',
		descKey: 'docs.cdn.list.description',
		method: 'GET',
		path: '/media',
		docPath: '/cdn#list',
		quickLinks: [{ label: 'List Media Reference', href: 'https://docs.xernerx.com/cdn#list' }],
		keywords: ['cdn', 'list', 'media', 'get', 'assets', 'files'],
	},
	{
		id: 'cdn-manage',
		slug: 'manage',
		category: 'cdn',
		categoryTitleKey: 'docs.cdn.title',
		sectionTitleKey: 'docs.cdn.nav.manageMedia',
		titleKey: 'docs.cdn.manage.title',
		descKey: 'docs.cdn.manage.description',
		method: 'PATCH',
		path: '/media/:id',
		docPath: '/cdn#manage',
		quickLinks: [{ label: 'Manage Media Reference', href: 'https://docs.xernerx.com/cdn#manage' }],
		keywords: ['cdn', 'manage', 'patch', 'delete', 'media', 'privacy', 'shared'],
	},
	{
		id: 'cdn-proxy',
		slug: 'proxy',
		category: 'cdn',
		categoryTitleKey: 'docs.cdn.title',
		sectionTitleKey: 'docs.cdn.nav.secureProxy',
		titleKey: 'docs.cdn.proxy.title',
		descKey: 'docs.cdn.proxy.description',
		method: 'GET',
		path: '/raw/:id',
		docPath: '/cdn#proxy',
		quickLinks: [{ label: 'Streaming Media Proxy', href: 'https://docs.xernerx.com/cdn#proxy' }],
		keywords: ['cdn', 'raw', 'view', 'proxy', 'stream', 'fetch', 'download'],
	},

	// WebSocket Gateway (`ws.xernerx.com`)
	{
		id: 'ws-overview',
		slug: 'ws-overview',
		category: 'websocket',
		categoryTitleKey: 'docs.websocket.hero.title',
		sectionTitleKey: 'docs.websocket.nav.overview',
		titleKey: 'docs.websocket.hero.title',
		descKey: 'docs.websocket.hero.description',
		docPath: '/websocket#overview',
		quickLinks: [
			{ label: 'WebSocket Architecture Guide', href: 'https://docs.xernerx.com/websocket#overview' },
			{ label: '@xernerx/websocket SDK', href: 'https://docs.xernerx.com/packages/@xernerx/websocket' },
		],
		keywords: ['websocket', 'gateway', 'realtime', 'overview', 'port 5000', 'events', 'socket', 'ws'],
	},
	{
		id: 'ws-connecting',
		slug: 'connecting',
		category: 'websocket',
		categoryTitleKey: 'docs.websocket.hero.title',
		sectionTitleKey: 'docs.websocket.nav.connecting',
		titleKey: 'docs.websocket.nav.connecting',
		rawDescription: 'Connect to the Xernerx bidirectional WebSocket gateway over TLS and maintain heartbeat keep-alives.',
		docPath: '/websocket#connecting',
		quickLinks: [{ label: 'Connecting Guide', href: 'https://docs.xernerx.com/websocket#connecting' }],
		keywords: ['websocket', 'connecting', 'handshake', 'heartbeat', 'ping', 'pong', 'reconnect'],
	},
	{
		id: 'ws-authentication',
		slug: 'ws-authentication',
		category: 'websocket',
		categoryTitleKey: 'docs.websocket.hero.title',
		sectionTitleKey: 'docs.websocket.nav.authentication',
		titleKey: 'docs.websocket.nav.authentication',
		rawDescription: 'Authenticate WebSocket connections using Bearer tokens to unlock service-level RPC dispatch and event streams.',
		docPath: '/websocket#authentication',
		quickLinks: [{ label: 'WebSocket Auth Spec', href: 'https://docs.xernerx.com/websocket#authentication' }],
		keywords: ['websocket', 'auth', 'authentication', 'token', 'bearer', 'identify'],
	},
	{
		id: 'ws-protocol',
		slug: 'protocol',
		category: 'websocket',
		categoryTitleKey: 'docs.websocket.hero.title',
		sectionTitleKey: 'docs.websocket.nav.rpcProtocol',
		titleKey: 'docs.websocket.nav.rpcProtocol',
		rawDescription: 'Bidirectional JSON-RPC envelope schema ({ id, service, action, payload }) for real-time event dispatch and queries.',
		docPath: '/websocket#protocol',
		quickLinks: [{ label: 'RPC Protocol Spec', href: 'https://docs.xernerx.com/websocket#protocol' }],
		keywords: ['websocket', 'rpc', 'protocol', 'payload', 'service', 'action', 'json-rpc'],
	},
	{
		id: 'ws-services',
		slug: 'services',
		category: 'websocket',
		categoryTitleKey: 'docs.websocket.hero.title',
		sectionTitleKey: 'docs.websocket.nav.servicesAndActions',
		titleKey: 'docs.websocket.nav.servicesAndActions',
		rawDescription: 'Registered WebSocket microservice routers and actions across Virtue, Xernerx Suite, and real-time overlays.',
		docPath: '/websocket#services',
		quickLinks: [{ label: 'Services & Actions Reference', href: 'https://docs.xernerx.com/websocket#services' }],
		keywords: ['websocket', 'services', 'actions', 'virtue', 'xernerx', 'overlay', 'levels'],
	},

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
