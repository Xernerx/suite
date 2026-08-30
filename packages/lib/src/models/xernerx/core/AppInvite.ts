import { Schema } from 'mongoose';
const schema = new Schema(
	{
		id: { type: String, unique: true, required: true },
		clientId: { type: String, required: true },
		name: { type: String, required: true },
		permissions: { type: String, required: true },
		scopes: { type: Array, default: ['bot', 'applications.commands'] },
	},
	{ timestamps: true }
);
export default schema;
