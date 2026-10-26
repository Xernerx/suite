/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true }, // Guild ID
		mode: {
			type: String,
			required: true,
			default: 'balanced',
			enum: ['easy', 'casual', 'balanced', 'hard', 'extreme'],
		},
		cycles: {
			monthly: { type: Boolean, default: false },
			weekly: { type: Boolean, default: false },
			daily: { type: Boolean, default: false },
		},
		roles: {
			ignored: { type: [String], default: [] },
			tracked: { type: [String], default: [] },
			levels: {
				type: [
					{
						level: { type: Number, required: true },
						roleId: { type: String, required: true },
					},
				],
				default: [],
			},
		},
		levelRoles: {
			type: [
				{
					level: { type: Number, required: true },
					roleId: { type: String, required: true },
				},
			],
			default: [],
		},
		serverRoles: {
			type: [
				{
					id: { type: String, required: true },
					name: { type: String, required: true },
					color: { type: Number, default: 0 },
					position: { type: Number, default: 0 },
					managed: { type: Boolean, default: false },
				},
			],
			default: [],
		},
		serverChannels: {
			type: [
				{
					id: { type: String, required: true },
					name: { type: String, required: true },
					type: { type: Number, default: 0 },
				},
			],
			default: [],
		},
		levelUp: { type: Boolean, default: true },
		levelMessage: { type: String, default: '[@mention] reached level [@level] :tada:!' },
		levelChannel: { type: String, default: null },
		autoDelete: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

export default schema;
