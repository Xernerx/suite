/** @format */

import 'server-only';

import TokenSchema from './models/xernerx/tokens/Api';
import UserSchema from './models/xernerx/profiles/User';

export const xernerxModels = {
	profiles: {
		users: { schema: UserSchema, collection: 'users' },
	},
	stats: {},
	tokens: {
		apis: { schema: TokenSchema, collection: 'apis' },
	},
};
