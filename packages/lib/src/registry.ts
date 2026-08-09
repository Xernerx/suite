/** @format */

import 'server-only';

import ApiSchema from './models/xernerx/tokens/Api';
import ApplicationSchema from './models/xernerx/content/Application';
import InviteSchema from './models/xernerx/tokens/Invite';
import NotificationSchema from './models/xernerx/content/Notification';
import RoleSchema from './models/xernerx/profiles/Role';
import UserSchema from './models/xernerx/profiles/User';

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
	},
	stats: {},
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
