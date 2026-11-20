/** @format */

import { Schema } from 'mongoose';

export const YOURAPPS_QUESTION_TYPES = ['short', 'paragraph', 'number', 'select', 'radio', 'multiselect', 'boolean', 'checkbox', 'user', 'role', 'channel', 'mentionable', 'file'] as const;

const QuestionConditionSchema = new Schema(
	{
		questionId: { type: String, default: null },
		operator: {
			type: String,
			enum: ['equals', 'not_equals', 'contains'],
			default: 'equals',
		},
		value: { type: String, default: '' },
	},
	{ _id: false }
);

const QuestionSchema = new Schema(
	{
		id: { type: String, required: true },
		question: { type: String, required: true },
		type: {
			type: String,
			enum: YOURAPPS_QUESTION_TYPES,
			default: 'paragraph',
		},
		placeholder: { type: String, default: '' },
		required: { type: Boolean, default: true },
		options: { type: [String], default: [] },
		minLength: { type: Number, default: 1 },
		maxLength: { type: Number, default: 1000 },
		minValue: { type: Number, default: null },
		maxValue: { type: Number, default: null },
		validationPattern: {
			type: String,
			enum: ['none', 'url', 'email', 'discord_id', 'regex'],
			default: 'none',
		},
		validationRegex: { type: String, default: '' },
		condition: { type: QuestionConditionSchema, default: null },
	},
	{ _id: false }
);

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		guild: { type: String, required: true, index: true },
		name: { type: String, required: true },
		description: { type: String, default: '' },
		category: {
			type: String,
			enum: ['staff', 'appeal', 'feedback', 'event', 'poll', 'custom'],
			default: 'staff',
		},
		state: {
			type: String,
			enum: ['open', 'closed'],
			default: 'open',
		},
		questions: {
			type: [QuestionSchema],
			default: [],
		},
		pendingRoles: { type: [String], default: [] },
		rewardRoles: { type: [String], default: [] },
		removeRoles: { type: [String], default: [] },
		denyAddRoles: { type: [String], default: [] },
		denyRemoveRoles: { type: [String], default: [] },
		requiredRoles: { type: [String], default: [] },
		restrictedRoles: { type: [String], default: [] },
		cooldown: { type: Number, default: 0 }, // seconds
		minimumJoinTime: { type: Number, default: 0 }, // seconds
		minimumAccountAge: { type: Number, default: 0 }, // seconds
		opensAt: { type: Date, default: null },
		closesAt: { type: Date, default: null },
		maxSubmissions: { type: Number, default: 0 },
		maxApprovals: { type: Number, default: 0 },
		minVotesToApprove: { type: Number, default: 0 },
		autoApproveVotes: { type: Number, default: 0 },
		autoDenyVotes: { type: Number, default: 0 },
		anonymousResponses: { type: Boolean, default: false },
		logChannelOverride: { type: String, default: null },
		archiveChannelOverride: { type: String, default: null },
		reviewRolesOverride: { type: [String], default: [] },
		submissionPingsOverride: { type: [String], default: [] },
		threadPerSubmissionOverride: { type: Boolean, default: null },
		pollOnSubmissionOverride: { type: Boolean, default: null },
		acceptMessage: { type: String, default: '' },
		denyMessage: { type: String, default: '' },
	},
	{ timestamps: true }
);

schema.index({ guild: 1, state: 1 });

export default schema;
