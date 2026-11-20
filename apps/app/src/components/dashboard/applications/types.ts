/** @format */

export const QUESTION_TYPES = ['short', 'paragraph', 'number', 'select', 'radio', 'multiselect', 'boolean', 'checkbox', 'user', 'role', 'channel', 'mentionable', 'file'] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];
export type PositionCategory = 'staff' | 'appeal' | 'feedback' | 'event' | 'poll' | 'custom';
export type SubmissionStatus = 'pending' | 'interview' | 'needs_info' | 'approved' | 'denied' | 'withdrawn';
export type ValidationPattern = 'none' | 'url' | 'email' | 'discord_id' | 'regex';
export type ConditionOperator = 'equals' | 'not_equals' | 'contains';

export interface YourAppsQuestionCondition {
	questionId: string | null;
	operator: ConditionOperator;
	value: string;
}

export interface YourAppsQuestion {
	id: string;
	question: string;
	type: QuestionType;
	placeholder?: string;
	required: boolean;
	options: string[];
	minLength?: number;
	maxLength?: number;
	minValue?: number | null;
	maxValue?: number | null;
	validationPattern?: ValidationPattern;
	validationRegex?: string;
	condition?: YourAppsQuestionCondition | null;
}

export interface YourAppsPosition {
	id: string;
	guild: string;
	name: string;
	description: string;
	category: PositionCategory;
	state: 'open' | 'closed';
	questions: YourAppsQuestion[];
	pendingRoles?: string[];
	rewardRoles: string[];
	removeRoles: string[];
	denyAddRoles?: string[];
	denyRemoveRoles?: string[];
	requiredRoles: string[];
	restrictedRoles: string[];
	cooldown: number;
	minimumJoinTime: number;
	minimumAccountAge?: number;
	opensAt?: string | null;
	closesAt?: string | null;
	maxSubmissions?: number;
	maxApprovals?: number;
	submissionsCount?: number;
	approvalsCount?: number;
	minVotesToApprove?: number;
	autoApproveVotes?: number;
	autoDenyVotes?: number;
	anonymousResponses?: boolean;
	logChannelOverride?: string | null;
	archiveChannelOverride?: string | null;
	reviewRolesOverride?: string[];
	submissionPingsOverride?: string[];
	threadPerSubmissionOverride?: boolean | null;
	pollOnSubmissionOverride?: boolean | null;
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

export interface YourAppsVote {
	userId: string;
	userTag?: string;
	vote: 'up' | 'down';
	createdAt?: string;
}

export interface YourAppsInternalNote {
	id: string;
	authorId: string;
	authorTag?: string;
	content: string;
	createdAt?: string;
}

export interface YourAppsClarification {
	id: string;
	prompt: string;
	requestedBy: string;
	requestedByTag?: string;
	requestedAt?: string;
	response?: string | null;
	respondedAt?: string | null;
}

export interface YourAppsApplicantMeta {
	accountCreatedAt?: string | null;
	guildJoinedAt?: string | null;
	rolesSnapshot?: string[];
	priorSubmissionsCount?: number;
}

export interface YourAppsSubmission {
	id: string;
	guild: string;
	positionId: string;
	positionName: string;
	userId: string;
	userTag: string;
	userAvatar?: string;
	anonymous?: boolean;
	status: SubmissionStatus;
	answers: YourAppsAnswer[];
	votes?: YourAppsVote[];
	internalNotes?: YourAppsInternalNote[];
	clarifications?: YourAppsClarification[];
	applicantMeta?: YourAppsApplicantMeta | null;
	interviewChannelId?: string | null;
	interviewMode?: string | null;
	pollMessageId?: string | null;
	reviewedBy?: string | null;
	reviewedByTag?: string | null;
	reviewReason?: string | null;
	reviewedAt?: string | null;
	createdAt?: string;
}

export interface YourAppsPanel {
	id: string;
	channelId: string;
	messageId: string;
	title: string;
	description: string;
	buttonLabel: string;
	positionIds: string[];
	autoSync?: boolean;
	createdAt?: string;
	updatedAt?: string;
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
	selfReviewAllowed: boolean;
	pollOnSubmission: boolean;
	pollDurationHours: number;
	interviewMode: 'thread' | 'channel';
	interviewCategoryId: string;
}

export interface YourAppsProfile extends YourAppsConfigSnapshot {
	id: string;
	found: boolean;
	botPresent: boolean;
	applicationId: string | null;
	positions: YourAppsPosition[];
	panels?: YourAppsPanel[];
	stats: {
		positionsTotal: number;
		positionsOpen: number;
		submissionsTotal: number;
		pending: number;
		interview?: number;
		needsInfo?: number;
		approved: number;
		denied: number;
		withdrawn?: number;
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
		.filter((c: any) => c && c.id && (Number(c.type) === 0 || Number(c.type) === 4 || Number(c.type) === 5 || Number(c.type) === 15))
		.sort((a: any, b: any) => (Number(a.position) || 0) - (Number(b.position) || 0))
		.map((c: any) => ({
			id: String(c.id),
			name: String(c.name),
			type: Number(c.type) || 0,
		}));
}
