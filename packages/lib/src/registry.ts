/** @format */

import BotProfileSchema from './models/xernerx/bots/Profile';
import BotStatSchema from './models/xernerx/bots/Stat';
import BotVoteSchema from './models/xernerx/bots/Vote';

import CoreSettingSchema from './models/xernerx/core/Setting';
import CoreInviteSchema from './models/xernerx/core/Invite';
import CoreAppInviteSchema from './models/xernerx/core/AppInvite';
import CoreRoleSchema from './models/xernerx/core/Role';
import CoreAnnouncementSchema from './models/xernerx/core/Announcement';
import CoreMediaSchema from './models/xernerx/core/Media';

import DispatchApplicationSchema from './models/xernerx/dispatch/Application';
import DispatchApplicationConfigSchema from './models/xernerx/dispatch/ApplicationConfig';
import DispatchInviteSchema from './models/xernerx/dispatch/Invite';

import GuildMemberSchema from './models/xernerx/guilds/Member';
import GuildProfileSchema from './models/xernerx/guilds/Profile';
import GuildRoleSchema from './models/xernerx/guilds/Role';
import GuildStatSchema from './models/xernerx/guilds/Stat';
import GuildVoteSchema from './models/xernerx/guilds/Vote';

import OrgMemberSchema from './models/xernerx/organizations/Member';
import OrgProfileSchema from './models/xernerx/organizations/Profile';
import OrgRoleSchema from './models/xernerx/organizations/Role';

import UserAppearanceSchema from './models/xernerx/users/Appearance';
import UserCreditSchema from './models/xernerx/users/Credit';
import UserLevelSchema from './models/xernerx/users/Level';
import UserProfileSchema from './models/xernerx/users/Profile';
import UserSubscriptionSchema from './models/xernerx/users/Subscription';
import UserTokenSchema from './models/xernerx/users/Token';

export const xernerxModels = {
	bots: {
		Bot: { schema: BotProfileSchema, modelName: 'Bot', collection: 'profiles' },
		Stat: { schema: BotStatSchema, modelName: 'Stat', collection: 'stats' },
		Vote: { schema: BotVoteSchema, modelName: 'Vote', collection: 'votes' },
	},
	core: {
		Setting: { schema: CoreSettingSchema, modelName: 'Setting' },
		Invite: { schema: CoreInviteSchema, modelName: 'Invite' },
		AppInvite: { schema: CoreAppInviteSchema, modelName: 'AppInvite' },
		Role: { schema: CoreRoleSchema, modelName: 'Role' },
		Announcement: { schema: CoreAnnouncementSchema, modelName: 'Announcement' },
		Media: { schema: CoreMediaSchema, modelName: 'Media' },
	},
	dispatch: {
		Application: { schema: DispatchApplicationSchema, modelName: 'Application' },
		ApplicationConfig: { schema: DispatchApplicationConfigSchema, modelName: 'ApplicationConfig' },
		Invite: { schema: DispatchInviteSchema, modelName: 'Invite' },
	},
	guilds: {
		Member: { schema: GuildMemberSchema, modelName: 'Member' },
		Guild: { schema: GuildProfileSchema, modelName: 'Guild', collection: 'profiles' },
		Role: { schema: GuildRoleSchema, modelName: 'Role' },
		Stat: { schema: GuildStatSchema, modelName: 'Stat', collection: 'stats' },
		Vote: { schema: GuildVoteSchema, modelName: 'Vote', collection: 'votes' },
	},
	organizations: {
		Member: { schema: OrgMemberSchema, modelName: 'Member' },
		Organization: { schema: OrgProfileSchema, modelName: 'Organization', collection: 'profiles' },
		Role: { schema: OrgRoleSchema, modelName: 'Role' },
	},
	users: {
		Appearance: { schema: UserAppearanceSchema, modelName: 'Appearance' },
		Credit: { schema: UserCreditSchema, modelName: 'Credit' },
		Level: { schema: UserLevelSchema, modelName: 'Level' },
		User: { schema: UserProfileSchema, modelName: 'User', collection: 'profiles' },
		Subscription: { schema: UserSubscriptionSchema, modelName: 'Subscription' },
		Token: { schema: UserTokenSchema, modelName: 'Token' },
	},
};
