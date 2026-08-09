/** @format */

import { Schema } from 'mongoose';

const schema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		userId: { type: String, required: true }, // Discord/User ID of the person applying
		type: { type: String, required: true }, // Role they are requesting
		status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' }, // Current state
		metadata: { type: Schema.Types.Mixed, default: {} }, // Flexible data (e.g., { locale: 'nl-NL' })
		reviewedBy: { type: String, default: null }, // User ID of the admin who processed the request
		reviewNote: { type: String, default: null }, // Note from staff (e.g., denial reason)
	},
	{ timestamps: true }
);

// Prevent users from spamming the same application type.
// This index ensures a user can only have exactly ONE 'pending' application per type at any given time.
schema.index(
	{ userId: 1, type: 1 },
	{
		unique: true,
		partialFilterExpression: { status: 'pending' },
	}
);

export default schema;
