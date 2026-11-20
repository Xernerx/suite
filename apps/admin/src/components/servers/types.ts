/** @format */

import type { UserYourAppsDraftItem, UserYourAppsSubmissionItem } from '../users/types';

export interface AdminServerSummary {
	id: string;
	name?: string;
	icon?: string | null;
	banner?: string | null;
	vanitySlug?: string;
	vanityUnlocked?: boolean;
	verified?: boolean;
	bot?: boolean;
	privacy?: 'public' | 'limited' | 'private' | string;
	widgets?: boolean;
	owner?: string | null;
	organization?: string | null;
	description?: string;
	info?: string;
	voteCount?: number;
	memberCount?: number;
	promotedUntil?: string | null;
	boostedUntil?: string | null;
	links?: Record<string, string>;
	botProfiles?: {
		bots: ('virtue' | 'yourapps')[];
		virtueMembers?: number;
		yourappsSubmissions?: number;
	};
}

export interface ServerYourAppsFormSummary {
	id: string;
	name: string;
	category: string;
	state: 'open' | 'closed';
	questionsCount: number;
}

export interface ServerYourAppsApplicantEntry {
	userId: string;
	displayName: string;
	username: string | null;
	submissions: UserYourAppsSubmissionItem[];
	drafts: UserYourAppsDraftItem[];
}

export interface ServerBotProfilesResponse {
	guildId: string;
	bots: ('virtue' | 'yourapps')[];
	virtue: {
		hasData: boolean;
		configured: boolean;
		membersCount: number;
		config: {
			mode: 'easy' | 'casual' | 'balanced' | 'hard' | 'extreme';
			xpMultiplier: number;
			boosterMultiplier: number;
			stackRoles: boolean;
			levelUp: boolean;
			levelChannel: string | null;
			levelMessage: string;
			autoDelete: number;
			cycles: {
				daily: boolean;
				weekly: boolean;
				monthly: boolean;
			};
			dynamicRolesEnabled: boolean;
			levelRolesCount: number;
		};
	};
	yourapps: {
		hasData: boolean;
		configured: boolean;
		config: {
			dmNotifications: boolean;
			threadPerSubmission: boolean;
			logChannel: string | null;
			archiveChannel: string | null;
			panelChannel: string | null;
			panelsCount: number;
			adminRolesCount: number;
			reviewRolesCount: number;
		};
		forms: ServerYourAppsFormSummary[];
		applicants: ServerYourAppsApplicantEntry[];
	};
}
