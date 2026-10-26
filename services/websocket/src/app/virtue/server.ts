/** @format */

import { database } from '@xernerx/lib/core';

async function getModels(action: string) {
	const db = await database('virtue');

	switch (action) {
		case 'guilds':
		case 'guild':
		case 'settings':
			return {
				primary: (db.models.profiles as any)?.Guild,
				fallback: null,
			};

		case 'users':
		case 'user':
		case 'profiles':
		case 'profile':
			return {
				primary: (db.models.profiles as any)?.User,
				fallback: null,
			};

		case 'levels':
		case 'level':
		case 'members':
		case 'member':
			return {
				primary: (db.models.levels as any)?.Level || (db.models.profiles as any)?.Level,
				fallback: (db.models.profiles as any)?.Level || (db.models.profiles as any)?.Text || null,
			};

		case 'text':
		case 'textLevels':
			return {
				primary: (db.models.levels as any)?.Text || (db.models.profiles as any)?.Text,
				fallback: (db.models.profiles as any)?.Text || null,
			};

		case 'voice':
		case 'voiceLevels':
			return {
				primary: (db.models.levels as any)?.Voice || (db.models.profiles as any)?.Voice,
				fallback: (db.models.profiles as any)?.Voice || null,
			};

		default:
			return { primary: null, fallback: null };
	}
}

function getFilter(action: string, body: any) {
	switch (action) {
		case 'levels':
		case 'level':
		case 'members':
		case 'member':
		case 'text':
		case 'textLevels':
		case 'voice':
		case 'voiceLevels':
			return {
				id: body.id,
				guild: body.guild,
			};

		case 'guilds':
		case 'guild':
		case 'settings':
		case 'users':
		case 'user':
		case 'profiles':
		case 'profile':
			return {
				id: body.id,
			};

		default:
			throw new Error(`Unsupported action: ${action}`);
	}
}

export default async function Server(msg: any) {
	const { primary: model, fallback } = await getModels(msg.action);

	if (!model) {
		throw new Error('Unknown action');
	}

	const filter = getFilter(msg.action, msg.body);

	switch (msg.method) {
		case 'get': {
			const doc = await model.findOne(filter).lean();
			if (doc) return doc;
			if (fallback && fallback !== model) {
				return fallback.findOne(filter).lean();
			}
			return null;
		}

		case 'create':
			try {
				const res = await model.create(msg.body);
				return res?.toObject ? res.toObject() : res;
			} catch (error: any) {
				if (error?.code === 11000) {
					return model.findOne(filter).lean();
				}

				throw error;
			}

		case 'update':
			return model
				.findOneAndUpdate(
					filter,
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
			return model.findOneAndDelete(filter).lean();

		default:
			throw new Error('Unknown method');
	}
}
