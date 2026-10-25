/** @format */
// Force recompile

import BotProfileSchema from './models/xernerx/bots/Profile';
import BotStatSchema from './models/xernerx/bots/Stat';
import BotVoteSchema from './models/xernerx/bots/Vote';
import BotReviewSchema from './models/xernerx/bots/Review';
import BotHookSchema from './models/xernerx/bots/Hook';
import BotCommandSchema from './models/xernerx/bots/Command';

import CoreSettingSchema from './models/xernerx/core/Setting';
import CoreInviteSchema from './models/xernerx/core/Invite';
import CoreAppInviteSchema from './models/xernerx/core/AppInvite';
import CoreRoleSchema from './models/xernerx/core/Role';
import CoreAnnouncementSchema from './models/xernerx/core/Announcement';
import CoreMediaSchema from './models/xernerx/core/Media';
import CoreSuggestionSchema from './models/xernerx/core/Suggestion';
import CoreRoadmapItemSchema from './models/xernerx/core/RoadmapItem';
import CoreIssueSchema from './models/xernerx/core/Issue';
import CoreAuditLogSchema from './models/xernerx/core/AuditLog';
import CoreSupportChannelSchema from './models/xernerx/core/SupportChannel';
import CoreSupportBotSchema from './models/xernerx/core/SupportBot';
import CoreSupportTicketSchema from './models/xernerx/core/SupportTicket';

import StoreCategorySchema from './models/xernerx/store/Category';
import StoreItemSchema from './models/xernerx/store/Item';
import StoreCouponSchema from './models/xernerx/store/Coupon';

import DispatchApplicationSchema from './models/xernerx/dispatch/Application';
import DispatchApplicationConfigSchema from './models/xernerx/dispatch/ApplicationConfig';
import DispatchInviteSchema from './models/xernerx/dispatch/Invite';

import GuildMemberSchema from './models/xernerx/guilds/Member';
import GuildProfileSchema from './models/xernerx/guilds/Profile';
import GuildReviewSchema from './models/xernerx/guilds/Review';
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
		Review: { schema: BotReviewSchema, modelName: 'Review', collection: 'reviews' },
		Hook: { schema: BotHookSchema, modelName: 'Hook', collection: 'hooks' },
		Command: { schema: BotCommandSchema, modelName: 'Command', collection: 'commands' },
	},
	core: {
		Setting: { schema: CoreSettingSchema, modelName: 'Setting' },
		Invite: { schema: CoreInviteSchema, modelName: 'Invite' },
		AppInvite: { schema: CoreAppInviteSchema, modelName: 'AppInvite' },
		Role: { schema: CoreRoleSchema, modelName: 'Role' },
		Announcement: { schema: CoreAnnouncementSchema, modelName: 'Announcement' },
		Media: { schema: CoreMediaSchema, modelName: 'Media' },
		Suggestion: { schema: CoreSuggestionSchema, modelName: 'Suggestion' },
		RoadmapItem: { schema: CoreRoadmapItemSchema, modelName: 'RoadmapItem' },
		Issue: { schema: CoreIssueSchema, modelName: 'Issue' },
		AuditLog: { schema: CoreAuditLogSchema, modelName: 'AuditLog', collection: 'audit_logs' },
		SupportChannel: { schema: CoreSupportChannelSchema, modelName: 'SupportChannel', collection: 'support_channels' },
		SupportBot: { schema: CoreSupportBotSchema, modelName: 'SupportBot', collection: 'support_bots' },
		SupportTicket: { schema: CoreSupportTicketSchema, modelName: 'SupportTicket', collection: 'support_tickets' },
	},
	store: {
		Category: { schema: StoreCategorySchema, modelName: 'Category', collection: 'categories' },
		Item: { schema: StoreItemSchema, modelName: 'Item', collection: 'items' },
		Coupon: { schema: StoreCouponSchema, modelName: 'Coupon', collection: 'coupons' },
	},
	dispatch: {
		Application: { schema: DispatchApplicationSchema, modelName: 'Application' },
		ApplicationConfig: { schema: DispatchApplicationConfigSchema, modelName: 'ApplicationConfig' },
		Invite: { schema: DispatchInviteSchema, modelName: 'Invite' },
	},
	guilds: {
		Member: { schema: GuildMemberSchema, modelName: 'Member' },
		Guild: { schema: GuildProfileSchema, modelName: 'Guild', collection: 'profiles' },
		Review: { schema: GuildReviewSchema, modelName: 'Review', collection: 'reviews' },
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

import VirtueGuildSchema from './models/virtue/profiles/Guild';
import VirtueUserSchema from './models/virtue/profiles/User';
import VirtueTextLevelSchema from './models/virtue/levels/Text';
import VirtueVoiceLevelSchema from './models/virtue/levels/Voice';

export const virtueModels = {
	profiles: {
		Guild: { schema: VirtueGuildSchema, modelName: 'Guild', collection: 'guilds' },
		User: { schema: VirtueUserSchema, modelName: 'User', collection: 'users' },
		Text: { schema: VirtueTextLevelSchema, modelName: 'Text', collection: 'text' },
		Voice: { schema: VirtueVoiceLevelSchema, modelName: 'Voice', collection: 'voice' },
	},
	levels: {
		Text: { schema: VirtueTextLevelSchema, modelName: 'Text', collection: 'text' },
		Voice: { schema: VirtueVoiceLevelSchema, modelName: 'Voice', collection: 'voice' },
	},
};
