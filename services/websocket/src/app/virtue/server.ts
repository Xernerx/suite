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
			if (!msg.body?.id && ['guilds', 'guild', 'settings'].includes(msg.action)) {
				const query = Array.isArray(msg.body?.ids) && msg.body.ids.length > 0 ? { id: { $in: msg.body.ids } } : {};
				return model.find(query).lean();
			}

			if (!msg.body?.id && msg.body?.guild && ['levels', 'level', 'members', 'member', 'text', 'textLevels', 'voice', 'voiceLevels'].includes(msg.action)) {
				const limit = Math.min(200, Math.max(1, Number(msg.body?.limit) || 100));
				const docs = await model.find({ guild: msg.body.guild }).sort({ level: -1, xp: -1, messages: -1, timeSpent: -1 }).limit(limit).lean();
				if (Array.isArray(docs) && docs.length > 0) return docs;
				if (fallback && fallback !== model) {
					return fallback.find({ guild: msg.body.guild }).sort({ level: -1, xp: -1, messages: -1, timeSpent: -1 }).limit(limit).lean();
				}
				return [];
			}

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
			if (msg.body?.guild && msg.body?.resetGuild === true && !msg.body?.id && ['levels', 'level', 'members', 'member', 'text', 'textLevels', 'voice', 'voiceLevels'].includes(msg.action)) {
				await model.updateMany({ guild: msg.body.guild }, { $set: { level: 0, xp: 0, messages: 0, timeSpent: 0 } });
				if (fallback && fallback !== model) {
					await fallback.updateMany({ guild: msg.body.guild }, { $set: { level: 0, xp: 0, messages: 0, timeSpent: 0 } }).catch(() => null);
				}
				return { success: true, guild: msg.body.guild };
			}

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
