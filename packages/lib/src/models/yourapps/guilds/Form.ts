/** @format */

import { Schema } from 'mongoose';

export const YOURAPPS_QUESTION_TYPES = ['short', 'paragraph', 'number', 'select', 'radio', 'multiselect', 'boolean', 'checkbox', 'user', 'role', 'channel', 'mentionable', 'file'] as const;

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
			enum: ['staff', 'appeal', 'feedback', 'event', 'custom'],
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
		rewardRoles: { type: [String], default: [] },
		removeRoles: { type: [String], default: [] },
		requiredRoles: { type: [String], default: [] },
		restrictedRoles: { type: [String], default: [] },
		cooldown: { type: Number, default: 0 }, // seconds
		minimumJoinTime: { type: Number, default: 0 }, // seconds
		acceptMessage: { type: String, default: '' },
		denyMessage: { type: String, default: '' },
	},
	{ timestamps: true }
);

schema.index({ guild: 1, state: 1 });

export default schema;
