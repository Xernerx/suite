/** @format */

import type { InviteOptionsConfig } from '@xernerx/lib';

export type OfficialInviteDictionaryKey = 'virtue' | 'yourapps' | 'metamorphosis' | 'zodiac' | 'todo' | 'xernerx';

export interface DefaultOfficialInvite {
	id: string;
	aliases: string[];
	vanitySlug: string;
	dictionaryKey: OfficialInviteDictionaryKey;
	name: string;
	clientId: string;
	permissions: string;
	scopes: string[];
	redirect: boolean;
	options: InviteOptionsConfig;
	defaultAvatarUrl: string;
}

export const DEFAULT_OFFICIAL_INVITES: DefaultOfficialInvite[] = [
	{
		id: 'virtue',
		aliases: [],
		vanitySlug: 'virtue',
		dictionaryKey: 'virtue',
		name: 'Virtue',
		clientId: '1484880634844287138',
		permissions: '4503599895923776',
		scopes: ['bot', 'applications.commands'],
		redirect: true,
		options: {
			essential: {
				enabled: true,
				permissions: '4503599895923776',
			},
			optional: {
				enabled: false,
				permissions: '4503599895923776',
			},
			advanced: {
				enabled: true,
				permissions: '0',
			},
		},
		defaultAvatarUrl: '/bots/virtue/icon.png',
	},
	{
		id: 'yourapps',
		aliases: [],
		vanitySlug: 'yourapps',
		dictionaryKey: 'yourapps',
		name: 'YourApps',
		clientId: '619328560141697036',
		permissions: '268485632',
		scopes: ['bot', 'applications.commands'],
		redirect: true,
		options: {
			essential: {
				enabled: true,
				permissions: '268485632',
			},
			optional: {
				enabled: false,
				permissions: '268485632',
			},
			advanced: {
				enabled: true,
				permissions: '0',
			},
		},
		defaultAvatarUrl: '/bots/yourapps/icon.png',
	},
	{
		id: 'meta',
		aliases: ['metamorphosis'],
		vanitySlug: 'metamorphosis',
		dictionaryKey: 'metamorphosis',
		name: 'Metamorphosis',
		clientId: '881678826906730547',
		permissions: '412854119424',
		scopes: ['bot', 'applications.commands'],
		redirect: true,
		options: {
			essential: {
				enabled: true,
				permissions: '412854119424',
			},
			optional: {
				enabled: true,
				permissions: '412854254656',
			},
			advanced: {
				enabled: true,
				permissions: '0',
			},
		},
		defaultAvatarUrl: '/bots/metamorphosis/icon.png',
	},
	{
		id: 'zodiac',
		aliases: [],
		vanitySlug: 'zodiac',
		dictionaryKey: 'zodiac',
		name: 'Zodiac',
		clientId: '950251264095162418',
		permissions: '380641863681',
		scopes: ['bot', 'applications.commands'],
		redirect: true,
		options: {
			essential: {
				enabled: true,
				permissions: '380641863681',
			},
			optional: {
				enabled: false,
				permissions: '380641863749',
			},
			advanced: {
				enabled: true,
				permissions: '0',
			},
		},
		defaultAvatarUrl: '/bots/zodiac/icon.png',
	},
	{
		id: 'tdl',
		aliases: ['todo', 'todolistbot'],
		vanitySlug: 'todolistbot',
		dictionaryKey: 'todo',
		name: 'To-Do List Bot',
		clientId: '782105629572464652',
		permissions: '335924305',
		scopes: ['applications.commands', 'bot'],
		redirect: true,
		options: {
			essential: {
				enabled: true,
				permissions: '335924305',
			},
			optional: {
				enabled: false,
				permissions: '335924305',
			},
			advanced: {
				enabled: false,
				permissions: '0',
			},
		},
		defaultAvatarUrl: '/bots/todo/icon.png',
	},
	{
		id: 'xernerx',
		aliases: [],
		vanitySlug: 'xernerx',
		dictionaryKey: 'xernerx',
		name: 'Xernerx',
		clientId: '1319029435655000234',
		permissions: '0',
		scopes: ['bot', 'applications.commands'],
		redirect: true,
		options: {
			essential: {
				enabled: true,
				permissions: '0',
			},
			optional: {
				enabled: false,
				permissions: '0',
			},
			advanced: {
				enabled: false,
				permissions: '0',
			},
		},
		defaultAvatarUrl: '/logo.png',
	},
];

export function findDefaultOfficialInvite(idOrSlug: string): DefaultOfficialInvite | null {
	const key = String(idOrSlug || '')
		.trim()
		.toLowerCase();
	if (!key) return null;
	return DEFAULT_OFFICIAL_INVITES.find((inv) => inv.id === key || inv.clientId === key || inv.vanitySlug === key || inv.aliases.includes(key)) || null;
}
