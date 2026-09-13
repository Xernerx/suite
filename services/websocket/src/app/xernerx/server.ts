/** @format */

import { database } from '@xernerx/lib/core';

async function getModel(action: string) {
	switch (action) {
		case 'globalLevel':
		case 'levels': {
			const db = await database('xernerx');
			return (db.models.users as any)?.Level;
		}

		case 'user':
		case 'users':
		case 'globalUser': {
			const db = await database('xernerx');
			return (db.models.users as any)?.User;
		}

		case 'globalGuild': {
			const db = await database('xernerx');
			return (db.models.guilds as any)?.Guild;
		}

		default:
			return null;
	}
}

function getFilter(action: string, body: any) {
	switch (action) {
		case 'globalLevel':
		case 'levels':
			return {
				ownerId: body.ownerId || body.id,
			};

		case 'user':
		case 'users':
		case 'globalUser':
		case 'globalGuild':
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
		throw new Error('Unknown action');
	}

	switch (msg.method) {
		case 'get':
			return model.findOne(getFilter(msg.action, msg.body));

		case 'create':
			try {
				return await model.create(msg.body);
			} catch (error: any) {
				if (error?.code === 11000) {
					return model.findOne(getFilter(msg.action, msg.body));
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
					returnDocument: 'after',
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
