/** @format */

import { database } from '@xernerx/lib/core';

async function getModel(action: string) {
	const db = await database('xernerx');

	switch (action) {
		case 'users':
		case 'user':
		case 'profile':
		case 'profiles':
			return (db.models.users as any)?.User;

		case 'levels':
		case 'level':
			return (db.models.users as any)?.Level;

		case 'credits':
		case 'credit':
			return (db.models.users as any)?.Credit;

		case 'tokens':
		case 'token':
			return (db.models.users as any)?.Token;

		case 'appearance':
		case 'appearances':
			return (db.models.users as any)?.Appearance;

		case 'subscriptions':
		case 'subscription':
			return (db.models.users as any)?.Subscription;

		case 'guilds':
		case 'guild':
			return (db.models.guilds as any)?.Guild;

		case 'bots':
		case 'bot':
			return (db.models.bots as any)?.Bot;

		default:
			return null;
	}
}

function getFilter(action: string, body: any) {
	switch (action) {
		case 'levels':
		case 'level':
		case 'credits':
		case 'credit':
		case 'subscriptions':
		case 'subscription':
			return {
				ownerId: body.ownerId || body.id,
			};

		case 'users':
		case 'user':
		case 'profile':
		case 'profiles':
		case 'tokens':
		case 'token':
		case 'appearance':
		case 'appearances':
		case 'guilds':
		case 'guild':
		case 'bots':
		case 'bot':
			return {
				id: body.id,
			};

		default:
			throw new Error(`Unsupported action: ${action}`);
	}
}

export default async function Server(msg: any) {
	const model = await getModel(msg.action);

	if (!model) {
		throw new Error(`Unknown action: ${msg.action}`);
	}

	switch (msg.method) {
		case 'get':
			return model.findOne(getFilter(msg.action, msg.body)).lean();

		case 'create':
			try {
				const res = await model.create(msg.body);
				return res?.toObject ? res.toObject() : res;
			} catch (error: any) {
				if (error?.code === 11000) {
					return model.findOne(getFilter(msg.action, msg.body)).lean();
				}
				throw error;
			}

		case 'update':
			return model
				.findOneAndUpdate(
					getFilter(msg.action, msg.body),
					{
						$set: msg.body,
					},
					{
						returnDocument: 'after',
						runValidators: true,
						upsert: true,
					}
				)
				.lean();

		case 'delete':
			return model.findOneAndDelete(getFilter(msg.action, msg.body)).lean();

		default:
			throw new Error(`Unknown method: ${msg.method}`);
	}
}
