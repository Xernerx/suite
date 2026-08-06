/** @format */

import 'server-only';

import RoleSchema from './models/xernerx/profiles/Role';
import TokenSchema from './models/xernerx/tokens/Api';
import UserSchema from './models/xernerx/profiles/User';

export const xernerxModels = {
	profiles: {
		users: { schema: UserSchema, collection: 'users' },
		roles: { schema: RoleSchema, collection: 'roles' },
	},
	stats: {},
	tokens: {
		apis: { schema: TokenSchema, collection: 'apis' },
	},
};
