/** @format */

export const QUESTION_TYPES = ['short', 'paragraph', 'number', 'select', 'radio', 'multiselect', 'boolean', 'checkbox', 'user', 'role', 'channel', 'mentionable', 'file'] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface YourAppsQuestion {
	id: string;
	question: string;
	type: QuestionType;
	placeholder?: string;
	required: boolean;
	options: string[];
	minLength?: number;
	maxLength?: number;
}

export interface YourAppsPosition {
	id: string;
	guild: string;
	name: string;
	description: string;
	category: 'staff' | 'appeal' | 'feedback' | 'event' | 'custom';
	state: 'open' | 'closed';
	questions: YourAppsQuestion[];
	rewardRoles: string[];
	removeRoles: string[];
	requiredRoles: string[];
	restrictedRoles: string[];
	cooldown: number;
	minimumJoinTime: number;
	acceptMessage: string;
	denyMessage: string;
	createdAt?: string;
}

export interface YourAppsAnswer {
	questionId: string;
	question: string;
	type: string;
	answer: string;
}

export interface YourAppsSubmission {
	id: string;
	guild: string;
	positionId: string;
	positionName: string;
	userId: string;
	userTag: string;
	userAvatar?: string;
	status: 'pending' | 'approved' | 'denied' | 'withdrawn';
	answers: YourAppsAnswer[];
	reviewedBy?: string | null;
	reviewedByTag?: string | null;
	reviewReason?: string | null;
	reviewedAt?: string | null;
	createdAt?: string;
}

export interface YourAppsConfigSnapshot {
	logChannel: string;
	archiveChannel: string;
	panelChannel: string;
	submissionPings: string[];
	adminRoles: string[];
	reviewRoles: string[];
	blacklistRoles: string[];
	dmNotifications: boolean;
	threadPerSubmission: boolean;
}

export interface YourAppsProfile extends YourAppsConfigSnapshot {
	id: string;
	found: boolean;
	botPresent: boolean;
	applicationId: string | null;
	positions: YourAppsPosition[];
	stats: {
		positionsTotal: number;
		positionsOpen: number;
		submissionsTotal: number;
		pending: number;
		approved: number;
		denied: number;
	};
	serverRoles?: DiscordRoleItem[];
	serverChannels?: DiscordChannelItem[];
}

export interface DiscordRoleItem {
	id: string;
	name: string;
	color: number;
	position: number;
	managed?: boolean;
}

export interface DiscordChannelItem {
	id: string;
	name: string;
	type: number;
}

export function normalizeRoles(raw: unknown, guildId?: string): DiscordRoleItem[] {
	const arr = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.roles) ? (raw as any).roles : [];
	return arr
		.filter((r: any) => r && r.id && r.id !== guildId && !r.managed)
		.sort((a: any, b: any) => (Number(b.position) || 0) - (Number(a.position) || 0))
		.map((r: any) => ({
			id: String(r.id),
			name: String(r.name),
			color: Number(r.color) || 0,
			position: Number(r.position) || 0,
			managed: Boolean(r.managed),
		}));
}

export function normalizeChannels(raw: unknown): DiscordChannelItem[] {
	const arr = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.channels) ? (raw as any).channels : [];
	return arr
		.filter((c: any) => c && c.id && (Number(c.type) === 0 || Number(c.type) === 5 || Number(c.type) === 15))
		.sort((a: any, b: any) => (Number(a.position) || 0) - (Number(b.position) || 0))
		.map((c: any) => ({
			id: String(c.id),
			name: String(c.name),
			type: Number(c.type) || 0,
		}));
}
