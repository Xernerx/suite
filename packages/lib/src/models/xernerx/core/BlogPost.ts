/** @format */

import { Schema } from 'mongoose';

const AuthorSchema = new Schema(
	{
		id: { type: String, default: 'system' },
		username: { type: String, default: 'Xernerx Studios' },
		globalName: { type: String, default: 'Xernerx Studios' },
		avatar: { type: String, default: null },
		role: { type: String, default: 'Core Engineering' },
	},
	{ _id: false }
);

const ReactionsSchema = new Schema(
	{
		rocket: { type: [String], default: [] },
		heart: { type: [String], default: [] },
		sparkles: { type: [String], default: [] },
		shield: { type: [String], default: [] },
		fire: { type: [String], default: [] },
	},
	{ _id: false }
);

const BlogPostSchema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		slug: { type: String, required: true, unique: true, index: true },
		title: { type: String, required: true },
		subtitle: { type: String, default: '' },
		content: { type: String, required: true },
		coverImage: { type: String, default: null },
		coverGradient: { type: String, default: 'accent' },
		category: {
			type: String,
			enum: ['announcements', 'security', 'product', 'engineering', 'community'],
			default: 'announcements',
			index: true,
		},
		audience: {
			type: String,
			enum: ['end-user', 'developer', 'all'],
			default: 'all',
			index: true,
		},
		tags: { type: [String], default: [] },
		privacy: {
			type: String,
			enum: ['public', 'limited', 'private'],
			default: 'public',
			index: true,
		},
		featured: { type: Boolean, default: false },
		readingTimeMinutes: { type: Number, default: 3 },
		author: { type: AuthorSchema, default: () => ({}) },
		publishedAt: { type: Date, default: () => new Date(), index: true },
		views: { type: Number, default: 0 },
		reactions: { type: ReactionsSchema, default: () => ({}) },
		linkedAnnouncementId: { type: String, default: null },
	},
	{ timestamps: true }
);

export default BlogPostSchema;
