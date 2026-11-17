/** @format */

import type { InviteOptionsConfig } from '@xernerx/lib';

export interface DefaultOfficialInvite {
	id: string;
	name: string;
	clientId: string;
	permissions: string;
	scopes: string[];
	redirect: boolean;
	options: InviteOptionsConfig;
	defaultAvatarUrl: string;
}

const DEFAULT_BOT_OPTIONS = (essentialPerms: string, optionalPerms: string): InviteOptionsConfig => ({
	essential: {
		enabled: true,
		permissions: essentialPerms,
	},
	optional: {
		enabled: true,
		permissions: optionalPerms,
	},
	advanced: {
		enabled: true,
		permissions: '0',
	},
});

export const DEFAULT_OFFICIAL_INVITES: DefaultOfficialInvite[] = [
	{
		id: 'virtue',
		name: 'Virtue',
		clientId: '1484880634844287138',
		permissions: '268486656',
		scopes: ['bot', 'applications.commands'],
		redirect: true,
		options: DEFAULT_BOT_OPTIONS('268486656', '268823616'),
		defaultAvatarUrl: 'https://cdn.discordapp.com/avatars/1484880634844287138/bb9495686b0bab5efa38119c8e2f0bb3.png?size=512',
	},
	{
		id: 'yourapps',
		name: 'YourApps',
		clientId: '619328560141697036',
		permissions: '268486656',
		scopes: ['bot', 'applications.commands'],
		redirect: true,
		options: DEFAULT_BOT_OPTIONS('268486656', '268823616'),
		defaultAvatarUrl: 'https://cdn.discordapp.com/avatars/619328560141697036/bceef453d5f2e3cc94e0ce573111ba4f.png?size=512',
	},
	{
		id: 'metamorphosis',
		name: 'Metamorphosis',
		clientId: '881678826906730547',
		permissions: '285263888',
		scopes: ['bot', 'applications.commands'],
		redirect: true,
		options: DEFAULT_BOT_OPTIONS('285263888', '285600848'),
		defaultAvatarUrl: 'https://cdn.discordapp.com/avatars/881678826906730547/25511e2ef0b8c1b29b487116a9461739.png?size=512',
	},
	{
		id: 'zodiac',
		name: 'Zodiac',
		clientId: '950251264095162418',
		permissions: '51200',
		scopes: ['bot', 'applications.commands'],
		redirect: true,
		options: DEFAULT_BOT_OPTIONS('51200', '379904'),
		defaultAvatarUrl: 'https://cdn.discordapp.com/avatars/950251264095162418/07a9e067135a204bb0fdc796b44bda63.png?size=512',
	},
	{
		id: 'todo',
		name: 'To-Do List Bot',
		clientId: '782105629572464652',
		permissions: '51200',
		scopes: ['bot', 'applications.commands'],
		redirect: true,
		options: DEFAULT_BOT_OPTIONS('51200', '379904'),
		defaultAvatarUrl: 'https://cdn.discordapp.com/avatars/782105629572464652/d6d658830d9dc233d1a5fda2260d63bd.png?size=512',
	},
];

export function findDefaultOfficialInvite(idOrSlug: string): DefaultOfficialInvite | null {
	const key = String(idOrSlug || '')
		.trim()
		.toLowerCase();
	if (!key) return null;
	return DEFAULT_OFFICIAL_INVITES.find((inv) => inv.id === key || inv.clientId === key) || null;
}
