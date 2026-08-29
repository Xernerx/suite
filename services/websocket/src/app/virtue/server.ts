/** @format */

import mongoose from 'mongoose';

const models = {
	guilds: () => mongoose.models.guilds,
	users: () => mongoose.models.users,
	members: () => mongoose.models.members,
};

function getFilter(action: string, body: any) {
	switch (action) {
		case 'members':
			return {
				id: body.id,
				guild: body.guild,
			};

		case 'users':
		case 'guilds':
			return {
				id: body.id,
			};

		default:
			throw new Error(`Unsupported action: ${action}`);
	}
}

export default async function Server(msg: any) {
	const getModel = models[msg.action as keyof typeof models];

	if (!getModel) {
		throw new Error('Unknown action');
	}

	const model = getModel();

	switch (msg.method) {
		case 'get':
			return model.findOne(msg.body);

		case 'create':
			try {
				return await model.create(msg.body);
			} catch (error: any) {
				if (error?.code === 11000) {
					return model.findOne(msg.body);
				}

				throw error;
			}

		case 'update':
			return model.findOneAndUpdate(
				getFilter(msg.action, msg.body),
				{
					$set: msg.body,
				},
				{
					new: true,
					runValidators: true,
					upsert: false,
				}
			);

		case 'delete':
			return model.findOneAndDelete(getFilter(msg.action, msg.body));

		default:
			throw new Error('Unknown method');
	}
}
