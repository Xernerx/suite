/** @format */

import { database } from '@xernerx/lib/core';

async function getModel(action: string) {
	switch (action) {
		// ================= VIRTUE SELF-SAVED ITEMS (virtue DB) =================
		case 'guilds':
		case 'settings': {
			const db = await database('virtue');
			return (db.models.profiles as any)?.Guild;
		}

		case 'text':
		case 'textLevels':
		case 'members': {
			const db = await database('virtue');
			return (db.models.profiles as any)?.Text;
		}

		case 'voice':
		case 'voiceLevels': {
			const db = await database('virtue');
			return (db.models.profiles as any)?.Voice;
		}

		default:
			return null;
	}
}

function getFilter(action: string, body: any) {
	switch (action) {
		case 'text':
		case 'textLevels':
		case 'voice':
		case 'voiceLevels':
		case 'members':
			return {
				id: body.id,
				guild: body.guild,
			};

		case 'guilds':
		case 'settings':
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
			throw new Error('Unknown method');
	}
}
