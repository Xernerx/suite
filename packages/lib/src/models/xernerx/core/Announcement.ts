import { Schema } from 'mongoose';

const EmbedSchema = new Schema(
	{
		title: { type: String },
		description: { type: String },
		url: { type: String },
		color: { type: Number },
		footer: {
			text: { type: String },
			icon_url: { type: String },
		},
		timestamp: { type: String },
		image: { url: { type: String } },
		thumbnail: { url: { type: String } },
		author: {
			name: { type: String },
			url: { type: String },
			icon_url: { type: String },
		},
		fields: [
			{
				name: { type: String, required: true },
				value: { type: String, required: true },
				inline: { type: Boolean, default: false },
			},
		],
	},
	{ _id: false }
);

const ComponentButtonSchema = new Schema(
	{
		type: { type: Number, required: true, default: 2 },
		style: { type: Number, required: true },
		label: { type: String },
		url: { type: String },
		custom_id: { type: String },
		disabled: { type: Boolean, default: false },
	},
	{ _id: false }
);

const ActionRowSchema = new Schema(
	{
		type: { type: Number, required: true, default: 1 },
		components: [ComponentButtonSchema],
	},
	{ _id: false }
);

const AnnouncementSchema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		title: { type: String, required: true }, // Internal title for the dashboard
		channelId: { type: String }, // Discord Channel ID (optional, for filtering/tracking history)
		webhookUrl: { type: String, required: true },
		message: {
			content: { type: String, default: '' },
			embeds: [EmbedSchema],
			components: [ActionRowSchema],
		},
		scheduledFor: { type: Date, default: null }, // Null means send immediately
		sentAt: { type: Date, default: null }, // Null means not sent yet
		discordMessageId: { type: String, default: null }, // Used to PATCH edit the message later
	},
	{ timestamps: true }
);

export default AnnouncementSchema;
