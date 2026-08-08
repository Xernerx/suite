/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, required: true, unique: true }, // Standard UUID
		userId: { type: String, required: true, index: true }, // Discord/User ID receiving the notification
		title: { type: String, required: true }, // Short title (e.g., "Application Approved")
		message: { type: String, required: true }, // The main body text
		type: { type: String, enum: ['success', 'error', 'info', 'warning'], default: 'info' }, // Determines the UI icon/color
		read: { type: Boolean, default: false }, // Unread state for the notification bell
		link: { type: String, default: null }, // Optional URL to redirect to when clicked
	},
	{ timestamps: true }
);

// Optimize querying for a user's unread notifications (which happens on every page load via the Provider)
schema.index({ userId: 1, read: 1 });

export default schema;
