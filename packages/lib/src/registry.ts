/** @format */

import 'server-only';

import ApiSchema from './models/xernerx/tokens/Api';
import ApplicationSchema from './models/xernerx/content/Application';
import BotSchema from './models/xernerx/profiles/Bot';
import BotStatsSchema from './models/xernerx/stats/Bot';
import VoteSchema from './models/xernerx/stats/Vote';
import InviteSchema from './models/xernerx/tokens/Invite';
import NotificationSchema from './models/xernerx/content/Notification';
import RoleSchema from './models/xernerx/profiles/Role';
import UserSchema from './models/xernerx/profiles/User';
import GuildSchema from './models/xernerx/profiles/Guild';
import OrganizationSchema from './models/xernerx/profiles/Organization';

export const xernerxModels = {
	content: {
		applications: {
			schema: ApplicationSchema,
			modelName: 'Application',
			collection: 'applications',
		},
		notifications: {
			schema: NotificationSchema,
			modelName: 'Notification',
			collection: 'notifications',
		},
	},
	profiles: {
		bots: {
			schema: BotSchema,
			modelName: 'Bot',
			collection: 'bots',
		},
		users: {
			schema: UserSchema,
			modelName: 'User',
			collection: 'users',
		},
		roles: {
			schema: RoleSchema,
			modelName: 'Role',
			collection: 'roles',
		},
		guilds: {
			schema: GuildSchema,
			modelName: 'Guild',
			collection: 'guilds',
		},
		organizations: {
			schema: OrganizationSchema,
			modelName: 'Organization',
			collection: 'organizations',
		},
	},
	stats: {
		bots: {
			schema: BotStatsSchema,
			modelName: 'Bot',
			collection: 'bots',
		},
		votes: {
			schema: VoteSchema,
			modelName: 'Vote',
			collection: 'votes',
		},
	},
	tokens: {
		apis: {
			schema: ApiSchema,
			modelName: 'Api',
			collection: 'apis',
		},
		invites: {
			schema: InviteSchema,
			modelName: 'Invite',
			collection: 'invites',
		},
	},
};
