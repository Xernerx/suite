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
				fallback: (db.models.levels as any)?.Text || (db.models.profiles as any)?.Level || (db.models.profiles as any)?.Text || null,
				extra: [(db.models.levels as any)?.Voice, (db.models.profiles as any)?.Level, (db.models.profiles as any)?.Text, (db.models.profiles as any)?.Voice].filter(Boolean),
			};

		case 'text':
		case 'textLevels':
			return {
				primary: (db.models.levels as any)?.Text || (db.models.profiles as any)?.Text,
				fallback: (db.models.profiles as any)?.Text || null,
				extra: [],
			};

		case 'voice':
		case 'voiceLevels':
			return {
				primary: (db.models.levels as any)?.Voice || (db.models.profiles as any)?.Voice,
				fallback: (db.models.profiles as any)?.Voice || null,
				extra: [],
			};

		default:
			return { primary: null, fallback: null, extra: [] };
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
	const { primary: model, fallback, extra = [] } = await getModels(msg.action);

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
				const candidateModels = Array.from(new Set([model, fallback, ...extra].filter(Boolean)));
				const results = await Promise.all(
					candidateModels.map((m: any) =>
						m
							.find({ guild: msg.body.guild })
							.sort({ level: -1, xp: -1, messages: -1, timeSpent: -1 })
							.limit(limit)
							.lean()
							.catch(() => [])
					)
				);
				const mergedByUser = new Map<string, any>();
				for (const arr of results) {
					for (const doc of arr || []) {
						const uid = String(doc?.id || doc?.ownerId || doc?.userId || '');
						if (!uid) continue;
						const existing = mergedByUser.get(uid);
						if (
							!existing ||
							(Number(doc.level) || 0) > (Number(existing.level) || 0) ||
							((Number(doc.level) || 0) === (Number(existing.level) || 0) && (Number(doc.xp) || 0) > (Number(existing.xp) || 0))
						) {
							mergedByUser.set(uid, doc);
						}
					}
				}
				return Array.from(mergedByUser.values())
					.sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0) || (Number(b.xp) || 0) - (Number(a.xp) || 0))
					.slice(0, limit);
			}

			const doc = await model.findOne(filter).lean();
			if (doc && ((Number((doc as any).level) || 0) > 0 || (Number((doc as any).xp) || 0) > 0 || !['levels', 'level', 'members', 'member'].includes(msg.action))) {
				return doc;
			}
			if (fallback && fallback !== model) {
				const fbDoc = await fallback.findOne(filter).lean();
				if (fbDoc) return fbDoc;
			}
			return doc || null;
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
