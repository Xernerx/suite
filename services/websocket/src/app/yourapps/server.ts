/** @format */

import crypto from 'crypto';
import { database } from '@xernerx/lib/core';
import { canUseUserServices, ensureUserBonusAndDefaults } from '../xernerx/server';

function makeId(prefix: string): string {
	return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
}

function withDocId<T extends Record<string, any> | null | undefined>(doc: T): T {
	if (!doc || typeof doc !== 'object') return doc;
	const plain = typeof (doc as any).toObject === 'function' ? (doc as any).toObject() : doc;
	if (typeof plain.id === 'string' && plain.id) {
		return { ...plain, docId: plain.id };
	}
	return plain;
}

const ALLOWED_QUESTION_TYPES = ['short', 'paragraph', 'number', 'select', 'radio', 'multiselect', 'boolean', 'checkbox', 'user', 'role', 'channel', 'mentionable', 'file'] as const;

type AllowedQuestionType = (typeof ALLOWED_QUESTION_TYPES)[number];

function sanitizeQuestions(rawQuestions: unknown): Array<{
	id: string;
	question: string;
	type: AllowedQuestionType;
	placeholder: string;
	required: boolean;
	options: string[];
	minLength: number;
	maxLength: number;
}> {
	if (!Array.isArray(rawQuestions)) return [];
	const allowedTypes = new Set<string>(ALLOWED_QUESTION_TYPES);
	return rawQuestions
		.slice(0, 25)
		.map((q: any, idx: number) => {
			const question = String(q?.question || '')
				.trim()
				.slice(0, 256);
			if (!question) return null;
			const rawType = String(q?.type || 'paragraph').toLowerCase();
			const type = (allowedTypes.has(rawType) ? rawType : 'paragraph') as AllowedQuestionType;
			const maxCap = type === 'short' ? 256 : 1000;
			const minLength = Math.max(0, Math.min(maxCap, Number(q?.minLength) || 0));
			const maxLength = Math.max(Math.max(1, minLength), Math.min(maxCap, Number(q?.maxLength) || maxCap));
			const supportsOptions = type === 'select' || type === 'radio' || type === 'multiselect' || type === 'boolean';
			const optionLimit = type === 'select' ? 25 : type === 'boolean' ? 2 : 10;
			const options =
				supportsOptions && Array.isArray(q?.options)
					? q.options
							.map((opt: any) =>
								String(opt || '')
									.trim()
									.slice(0, 100)
							)
							.filter(Boolean)
							.slice(0, optionLimit)
					: [];
			return {
				id: String(q?.id || `q_${idx + 1}_${crypto.randomBytes(2).toString('hex')}`).trim(),
				question,
				type,
				placeholder: String(q?.placeholder || '')
					.trim()
					.slice(0, 100),
				required: q?.required !== false,
				options,
				minLength,
				maxLength,
			};
		})
		.filter(Boolean) as any[];
}

function stripImmutableFields(body: Record<string, any>) {
	const { _id: _a, __v: _b, createdAt: _c, updatedAt: _d, docId: _e, ...rest } = body || {};
	return rest;
}

export default async function Server(msg: { method: string; action?: string; body: any }) {
	const db = await database('yourapps');
	const ProfileModel = (db.models.guilds as any)?.Profile;
	const FormModel = (db.models.guilds as any)?.Form;
	const SubmissionModel = (db.models.guilds as any)?.Submission;
	const DraftModel = (db.models.guilds as any)?.Draft;

	const action = String(msg.action || '').trim();
	const body = msg.body || {};

	switch (action) {
		case 'profiles':
		case 'profile':
		case 'guilds':
		case 'guild':
		case 'settings': {
			if (!ProfileModel) throw new Error('YourApps Profile model unavailable');

			if (msg.method === 'get') {
				if (body.id) {
					const doc = await ProfileModel.findOne({ id: String(body.id) }).lean();
					return withDocId(doc) || null;
				}
				const query = Array.isArray(body.ids) && body.ids.length > 0 ? { id: { $in: body.ids.map(String) } } : {};
				const items = await ProfileModel.find(query).lean();
				return { items };
			}

			if (msg.method === 'create') {
				if (!body.id) throw new Error('Missing guild id');
				const clean = stripImmutableFields(body);
				clean.id = String(body.id);
				try {
					const created = await ProfileModel.create(clean);
					return withDocId(created);
				} catch (err: any) {
					if (err?.code === 11000) {
						const refresh: Record<string, any> = {};
						if (Array.isArray(clean.serverRoles)) refresh.serverRoles = clean.serverRoles;
						if (Array.isArray(clean.serverChannels)) refresh.serverChannels = clean.serverChannels;
						if (Object.keys(refresh).length > 0) {
							return withDocId(await ProfileModel.findOneAndUpdate({ id: clean.id }, { $set: refresh }, { returnDocument: 'after' }).lean()) || null;
						}
						return withDocId(await ProfileModel.findOne({ id: clean.id }).lean()) || null;
					}
					throw err;
				}
			}

			if (msg.method === 'update') {
				if (!body.id) throw new Error('Missing guild id');
				const clean = stripImmutableFields(body);
				clean.id = String(body.id);
				return withDocId(
					await ProfileModel.findOneAndUpdate({ id: clean.id }, { $set: clean }, { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true }).lean()
				);
			}

			if (msg.method === 'delete') {
				if (!body.id) throw new Error('Missing guild id');
				const guildId = String(body.id);
				const deleted = await ProfileModel.findOneAndDelete({ id: guildId }).lean();
				if (body.cascade) {
					await Promise.all([
						FormModel?.deleteMany({ guild: guildId }).catch(() => null),
						SubmissionModel?.deleteMany({ guild: guildId }).catch(() => null),
						DraftModel?.deleteMany({ guild: guildId }).catch(() => null),
					]);
				}
				return { success: true, deleted: deleted || null };
			}

			throw new Error(`Unsupported method for ${action}: ${msg.method}`);
		}

		case 'forms':
		case 'form':
		case 'positions':
		case 'position': {
			if (!FormModel) throw new Error('YourApps Form model unavailable');

			if (msg.method === 'get') {
				if (body.id) {
					const filter: Record<string, any> = { id: String(body.id) };
					if (body.guild) filter.guild = String(body.guild);
					const doc = await FormModel.findOne(filter).lean();
					return withDocId(doc) || null;
				}

				const query: Record<string, any> = {};
				if (body.guild) query.guild = String(body.guild);
				if (body.state && ['open', 'closed'].includes(String(body.state))) {
					query.state = String(body.state);
				}
				if (body.search && typeof body.search === 'string' && body.search.trim()) {
					const escaped = body.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
					query.name = { $regex: escaped, $options: 'i' };
				}

				const limit = Math.min(100, Math.max(1, Number(body.limit) || 100));
				const items = await FormModel.find(query).sort({ createdAt: 1 }).limit(limit).lean();
				return { items, total: items.length };
			}

			if (msg.method === 'create') {
				if (!body.guild) throw new Error('Missing guild id');
				const name = String(body.name || '')
					.trim()
					.slice(0, 80);
				if (!name) throw new Error('Form name is required');

				const clean = stripImmutableFields(body);
				clean.id = clean.id ? String(clean.id).trim() : makeId('pos');
				clean.guild = String(body.guild);
				clean.name = name;
				clean.description = String(body.description || '')
					.trim()
					.slice(0, 1000);
				clean.state = body.state === 'closed' ? 'closed' : 'open';
				clean.questions = sanitizeQuestions(body.questions);

				const created = await FormModel.create(clean);
				return withDocId(created);
			}

			if (msg.method === 'update') {
				if (!body.id) throw new Error('Missing form id');
				const filter: Record<string, any> = { id: String(body.id) };
				if (body.guild) filter.guild = String(body.guild);

				const clean = stripImmutableFields(body);
				delete clean.id;
				delete clean.guild;
				if (clean.name !== undefined) {
					clean.name = String(clean.name || '')
						.trim()
						.slice(0, 80);
					if (!clean.name) delete clean.name;
				}
				if (clean.description !== undefined) {
					clean.description = String(clean.description || '')
						.trim()
						.slice(0, 1000);
				}
				if (clean.questions !== undefined) {
					clean.questions = sanitizeQuestions(clean.questions);
				}

				const updated = await FormModel.findOneAndUpdate(filter, { $set: clean }, { returnDocument: 'after', runValidators: true }).lean();
				return withDocId(updated) || null;
			}

			if (msg.method === 'delete') {
				if (!body.id) throw new Error('Missing form id');
				const filter: Record<string, any> = { id: String(body.id) };
				if (body.guild) filter.guild = String(body.guild);

				const deleted = await FormModel.findOneAndDelete(filter).lean();
				if (deleted && DraftModel) {
					await DraftModel.deleteMany({ positionId: String(body.id) }).catch(() => null);
				}
				return { success: Boolean(deleted), deleted: deleted || null };
			}

			throw new Error(`Unsupported method for ${action}: ${msg.method}`);
		}

		case 'submissions':
		case 'submission': {
			if (!SubmissionModel) throw new Error('YourApps Submission model unavailable');

			if (msg.method === 'get') {
				if (body.id) {
					const filter: Record<string, any> = { id: String(body.id) };
					if (body.guild) filter.guild = String(body.guild);
					const doc = await SubmissionModel.findOne(filter).lean();
					return withDocId(doc) || null;
				}

				if (body.latestForUser && body.guild && body.positionId && body.userId) {
					const latest = await SubmissionModel.findOne({
						guild: String(body.guild),
						positionId: String(body.positionId),
						userId: String(body.userId),
					})
						.sort({ createdAt: -1 })
						.lean();
					return withDocId(latest) || null;
				}

				const query: Record<string, any> = {};
				if (body.guild) query.guild = String(body.guild);
				if (body.positionId) query.positionId = String(body.positionId);
				if (body.userId) query.userId = String(body.userId);
				if (body.status && ['pending', 'approved', 'denied', 'withdrawn'].includes(String(body.status))) {
					query.status = String(body.status);
				}

				const limit = Math.min(200, Math.max(1, Number(body.limit) || 100));
				const items = await SubmissionModel.find(query).sort({ createdAt: -1 }).limit(limit).lean();

				let counts = undefined;
				if (body.guild && body.includeCounts) {
					const baseGuild = { guild: String(body.guild) };
					const [pending, approved, denied, total] = await Promise.all([
						SubmissionModel.countDocuments({ ...baseGuild, status: 'pending' }),
						SubmissionModel.countDocuments({ ...baseGuild, status: 'approved' }),
						SubmissionModel.countDocuments({ ...baseGuild, status: 'denied' }),
						SubmissionModel.countDocuments(baseGuild),
					]);
					counts = { pending, approved, denied, total };
				}

				return { items, total: items.length, ...(counts ? { counts } : {}) };
			}

			if (msg.method === 'create') {
				if (!body.guild || !body.positionId || !body.userId) {
					throw new Error('Missing guild, positionId, or userId');
				}
				const targetUserId = String(body.userId);
				const serviceCheck = await canUseUserServices(targetUserId);
				if (!serviceCheck.allowed) {
					return {
						id: '',
						docId: '',
						servicesDisabled: true,
						blacklisted: serviceCheck.blacklisted,
						services: serviceCheck.services,
					};
				}

				const clean = stripImmutableFields(body);
				clean.id = clean.id ? String(clean.id).trim() : makeId('app');
				clean.guild = String(body.guild);
				clean.positionId = String(body.positionId);
				clean.positionName = String(body.positionName || 'Application')
					.trim()
					.slice(0, 80);
				clean.userId = targetUserId;
				clean.status = 'pending';
				clean.answers = Array.isArray(body.answers)
					? body.answers.slice(0, 25).map((a: any) => ({
							questionId: String(a?.questionId || ''),
							question: String(a?.question || '').slice(0, 256),
							type: String(a?.type || 'paragraph'),
							answer: String(a?.answer ?? '').slice(0, 2000),
						}))
					: [];

				const created = await SubmissionModel.create(clean);
				await ensureUserBonusAndDefaults(targetUserId).catch(() => null);
				if (DraftModel) {
					await DraftModel.deleteOne({ id: `${clean.guild}:${targetUserId}:${clean.positionId}` }).catch(() => null);
				}
				return withDocId(created);
			}

			if (msg.method === 'update') {
				if (!body.id) throw new Error('Missing submission id');
				const filter: Record<string, any> = { id: String(body.id) };
				if (body.guild) filter.guild = String(body.guild);

				const clean = stripImmutableFields(body);
				delete clean.id;
				delete clean.guild;

				const updated = await SubmissionModel.findOneAndUpdate(filter, { $set: clean }, { returnDocument: 'after', runValidators: true }).lean();
				return withDocId(updated) || null;
			}

			if (msg.method === 'delete') {
				if (!body.id) throw new Error('Missing submission id');
				const filter: Record<string, any> = { id: String(body.id) };
				if (body.guild) filter.guild = String(body.guild);

				const deleted = await SubmissionModel.findOneAndDelete(filter).lean();
				return { success: Boolean(deleted), deleted: deleted || null };
			}

			throw new Error(`Unsupported method for ${action}: ${msg.method}`);
		}

		case 'drafts':
		case 'draft': {
			if (!DraftModel) throw new Error('YourApps Draft model unavailable');

			const resolvedId = body.id ? String(body.id) : body.guild && body.userId && body.positionId ? `${body.guild}:${body.userId}:${body.positionId}` : '';

			if (msg.method === 'get') {
				if (resolvedId) {
					const doc = await DraftModel.findOne({ id: resolvedId }).lean();
					return withDocId(doc) || null;
				}
				const query: Record<string, any> = {};
				if (body.guild) query.guild = String(body.guild);
				if (body.userId) query.userId = String(body.userId);
				const items = await DraftModel.find(query).sort({ updatedAt: -1 }).limit(25).lean();
				return { items };
			}

			if (msg.method === 'create' || msg.method === 'update') {
				if (!resolvedId || !body.guild || !body.userId || !body.positionId) {
					throw new Error('Missing draft identifiers');
				}
				const payload = {
					id: resolvedId,
					guild: String(body.guild),
					userId: String(body.userId),
					positionId: String(body.positionId),
					currentStep: Math.max(0, Number(body.currentStep) || 0),
					answers: Array.isArray(body.answers)
						? body.answers.slice(0, 25).map((a: any) => ({
								questionId: String(a?.questionId || ''),
								question: String(a?.question || '').slice(0, 256),
								type: String(a?.type || 'paragraph'),
								answer: String(a?.answer ?? '').slice(0, 2000),
							}))
						: [],
				};
				return withDocId(await DraftModel.findOneAndUpdate({ id: resolvedId }, { $set: payload }, { returnDocument: 'after', upsert: true, runValidators: true }).lean());
			}

			if (msg.method === 'delete') {
				if (!resolvedId) throw new Error('Missing draft id');
				await DraftModel.deleteOne({ id: resolvedId });
				return { success: true };
			}

			throw new Error(`Unsupported method for ${action}: ${msg.method}`);
		}

		case 'stats': {
			if (msg.method !== 'get') throw new Error('Stats only supports GET');
			const guildQuery = body.guild ? { guild: String(body.guild) } : {};
			const [positionsTotal, positionsOpen, submissionsTotal, pending, approved, denied] = await Promise.all([
				FormModel ? FormModel.countDocuments(guildQuery) : 0,
				FormModel ? FormModel.countDocuments({ ...guildQuery, state: 'open' }) : 0,
				SubmissionModel ? SubmissionModel.countDocuments(guildQuery) : 0,
				SubmissionModel ? SubmissionModel.countDocuments({ ...guildQuery, status: 'pending' }) : 0,
				SubmissionModel ? SubmissionModel.countDocuments({ ...guildQuery, status: 'approved' }) : 0,
				SubmissionModel ? SubmissionModel.countDocuments({ ...guildQuery, status: 'denied' }) : 0,
			]);
			return {
				positionsTotal,
				positionsOpen,
				submissionsTotal,
				pending,
				approved,
				denied,
			};
		}

		default:
			throw new Error(`Unsupported YourApps action: ${action}`);
	}
}
