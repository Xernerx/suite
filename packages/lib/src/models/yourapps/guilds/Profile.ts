/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, unique: true, required: true }, // Discord Guild ID
		logChannel: { type: String, default: null },
		archiveChannel: { type: String, default: null },
		panelChannel: { type: String, default: null },
		submissionPings: { type: [String], default: [] },
		adminRoles: { type: [String], default: [] },
		reviewRoles: { type: [String], default: [] },
		blacklistRoles: { type: [String], default: [] },
		dmNotifications: { type: Boolean, default: true },
		threadPerSubmission: { type: Boolean, default: false },
		panels: {
			type: [
				{
					id: { type: String, required: true },
					channelId: { type: String, required: true },
					messageId: { type: String, required: true },
					title: { type: String, default: 'Server Applications' },
					description: { type: String, default: '' },
					buttonLabel: { type: String, default: 'Apply Now' },
					positionIds: { type: [String], default: [] },
					createdAt: { type: Date, default: Date.now },
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
	},
	{ timestamps: true }
);

export default schema;
