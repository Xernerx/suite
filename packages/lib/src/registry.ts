/** @format */

import 'server-only';

import ApplicationSchema from './models/xernerx/content/Application';
import NotificationSchema from './models/xernerx/content/Notification';
import RoleSchema from './models/xernerx/profiles/Role';
import TokenSchema from './models/xernerx/tokens/Api';
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
			schema: TokenSchema,
			modelName: 'Token',
			collection: 'apis',
		},
	},
};
