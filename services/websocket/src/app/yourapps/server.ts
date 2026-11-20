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

function sanitizeForViewer<T extends Record<string, any> | null | undefined>(doc: T, viewerScope?: string): T {
	if (!doc || typeof doc !== 'object') return doc;
	const plain: any = withDocId(doc);
	if (viewerScope === 'applicant') {
		const { internalNotes: _notes, votes: _votes, ...publicFields } = plain;
		return publicFields;
	}
	return plain;
}

const ALLOWED_QUESTION_TYPES = ['short', 'paragraph', 'number', 'select', 'radio', 'multiselect', 'boolean', 'checkbox', 'user', 'role', 'channel', 'mentionable', 'file'] as const;
const VALID_SUBMISSION_STATUSES = ['pending', 'interview', 'needs_info', 'approved', 'denied', 'withdrawn'] as const;
const VALID_PATTERNS = new Set(['none', 'url', 'email', 'discord_id', 'regex']);
const VALID_OPERATORS = new Set(['equals', 'not_equals', 'contains']);

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
	minValue: number | null;
	maxValue: number | null;
	validationPattern: string;
	validationRegex: string;
	condition: { questionId: string | null; operator: string; value: string } | null;
}> {
	if (!Array.isArray(rawQuestions)) return [];
	const allowedTypes = new Set<string>(ALLOWED_QUESTION_TYPES);
	const earlierIds = new Set<string>();

	return rawQuestions
		.slice(0, 25)
		.map((q: any, idx: number) => {
			const question = String(q?.question || '')
				.trim()
				.slice(0, 256);
			if (!question) return null;
			const id = String(q?.id || `q_${idx + 1}_${crypto.randomBytes(2).toString('hex')}`).trim();
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

			const minValue = q?.minValue !== undefined && q?.minValue !== null && q?.minValue !== '' && !Number.isNaN(Number(q.minValue)) ? Number(q.minValue) : null;
			const maxValue = q?.maxValue !== undefined && q?.maxValue !== null && q?.maxValue !== '' && !Number.isNaN(Number(q.maxValue)) ? Number(q.maxValue) : null;
			const rawPattern = String(q?.validationPattern || 'none').toLowerCase();
			const validationPattern = VALID_PATTERNS.has(rawPattern) ? rawPattern : 'none';
			const validationRegex =
				validationPattern === 'regex'
					? String(q?.validationRegex || '')
							.trim()
							.slice(0, 200)
					: '';

			let condition: { questionId: string | null; operator: string; value: string } | null = null;
			if (q?.condition && typeof q.condition === 'object' && q.condition.questionId) {
				const refId = String(q.condition.questionId).trim();
				if (earlierIds.has(refId)) {
					const rawOp = String(q.condition.operator || 'equals').toLowerCase();
					condition = {
						questionId: refId,
						operator: VALID_OPERATORS.has(rawOp) ? rawOp : 'equals',
						value: String(q.condition.value ?? '')
							.trim()
							.slice(0, 200),
					};
				}
			}

			earlierIds.add(id);

			return {
				id,
				question,
				type,
				placeholder: String(q?.placeholder || '')
					.trim()
					.slice(0, 100),
				required: q?.required !== false,
				options,
				minLength,
				maxLength,
				minValue,
				maxValue,
				validationPattern,
				validationRegex,
				condition,
			};
		})
		.filter(Boolean) as any[];
}

function stripImmutableFields(body: Record<string, any>) {
	const { _id: _a, __v: _b, createdAt: _c, updatedAt: _d, docId: _e, ...rest } = body || {};
	return rest;
}

async function reconcileScheduledForms(FormModel: any, guildId?: string): Promise<string[]> {
	if (!FormModel) return [];
	const now = new Date();
	const baseFilter = guildId ? { guild: String(guildId) } : {};

	const [toOpen, toClose] = await Promise.all([
		FormModel.find({
			...baseFilter,
			state: 'closed',
			opensAt: { $ne: null, $lte: now },
			$or: [{ closesAt: null }, { closesAt: { $gt: now } }],
		})
			.select('id guild')
			.lean()
			.catch(() => []),
		FormModel.find({
			...baseFilter,
			state: 'open',
			closesAt: { $ne: null, $lte: now },
		})
			.select('id guild')
			.lean()
			.catch(() => []),
	]);

	const changedGuilds = new Set<string>();

	if (toOpen.length > 0) {
		const openIds = toOpen.map((f: any) => String(f.id));
		for (const f of toOpen) if (f?.guild) changedGuilds.add(String(f.guild));
		await FormModel.updateMany({ id: { $in: openIds } }, { $set: { state: 'open', opensAt: null } }).catch(() => null);
	}

	if (toClose.length > 0) {
		const closeIds = toClose.map((f: any) => String(f.id));
		for (const f of toClose) if (f?.guild) changedGuilds.add(String(f.guild));
		await FormModel.updateMany({ id: { $in: closeIds } }, { $set: { state: 'closed', closesAt: null } }).catch(() => null);
	}

	return Array.from(changedGuilds);
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

		case 'schedules': {
			const changedGuilds = await reconcileScheduledForms(FormModel, body.guild ? String(body.guild) : undefined);
			return { changedGuilds };
		}

		case 'forms':
		case 'form':
		case 'positions':
		case 'position': {
			if (!FormModel) throw new Error('YourApps Form model unavailable');

			if (msg.method === 'get') {
				if (body.guild) {
					await reconcileScheduledForms(FormModel, String(body.guild));
				}

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
			const viewerScope = body.viewerScope ? String(body.viewerScope) : undefined;

			if (msg.method === 'get') {
				if (body.id) {
					const filter: Record<string, any> = { id: String(body.id) };
					if (body.guild) filter.guild = String(body.guild);
					const doc = await SubmissionModel.findOne(filter).lean();
					return sanitizeForViewer(doc, viewerScope) || null;
				}

				if (body.latestForUser && body.guild && body.positionId && body.userId) {
					const latest = await SubmissionModel.findOne({
						guild: String(body.guild),
						positionId: String(body.positionId),
						userId: String(body.userId),
					})
						.sort({ createdAt: -1 })
						.lean();
					return sanitizeForViewer(latest, viewerScope) || null;
				}

				if (body.countForPosition && body.guild && body.positionId) {
					const posFilter = { guild: String(body.guild), positionId: String(body.positionId) };
					const [activeCount, approvedCount] = await Promise.all([
						SubmissionModel.countDocuments({ ...posFilter, status: { $ne: 'withdrawn' } }),
						SubmissionModel.countDocuments({ ...posFilter, status: 'approved' }),
					]);
					return { activeCount, approvedCount };
				}

				const query: Record<string, any> = {};
				if (body.guild) query.guild = String(body.guild);
				if (body.positionId) query.positionId = String(body.positionId);
				if (body.userId) query.userId = String(body.userId);
				if (body.status === 'reviewable') {
					query.status = { $in: ['pending', 'interview', 'needs_info'] };
				} else if (body.status && (VALID_SUBMISSION_STATUSES as readonly string[]).includes(String(body.status))) {
					query.status = String(body.status);
				}

				const limit = Math.min(200, Math.max(1, Number(body.limit) || 100));
				const rawItems = await SubmissionModel.find(query).sort({ createdAt: -1 }).limit(limit).lean();
				const items = viewerScope === 'applicant' ? rawItems.map((it: any) => sanitizeForViewer(it, 'applicant')) : rawItems;

				let counts = undefined;
				if (body.guild && body.includeCounts) {
					const baseGuild = { guild: String(body.guild) };
					const [pending, interview, needsInfo, approved, denied, withdrawn, total] = await Promise.all([
						SubmissionModel.countDocuments({ ...baseGuild, status: 'pending' }),
						SubmissionModel.countDocuments({ ...baseGuild, status: 'interview' }),
						SubmissionModel.countDocuments({ ...baseGuild, status: 'needs_info' }),
						SubmissionModel.countDocuments({ ...baseGuild, status: 'approved' }),
						SubmissionModel.countDocuments({ ...baseGuild, status: 'denied' }),
						SubmissionModel.countDocuments({ ...baseGuild, status: 'withdrawn' }),
						SubmissionModel.countDocuments(baseGuild),
					]);
					counts = { pending, interview, needsInfo, approved, denied, withdrawn, total };
				}

				return { items, total: items.length, ...(counts ? { counts } : {}) };
			}

			if (msg.method === 'create') {
				if (!body.guild || !body.positionId || !body.userId) {
					throw new Error('Missing guild, positionId, or userId');
				}
				const targetUserId = String(body.userId);
				const guildId = String(body.guild);
				const positionId = String(body.positionId);

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

				const [formDoc, priorSubmissionsCount] = await Promise.all([
					FormModel
						? FormModel.findOne({ id: positionId, guild: guildId })
								.lean()
								.catch(() => null)
						: null,
					SubmissionModel.countDocuments({ guild: guildId, userId: targetUserId }).catch(() => 0),
				]);

				const clean = stripImmutableFields(body);
				clean.id = clean.id ? String(clean.id).trim() : makeId('app');
				clean.guild = guildId;
				clean.positionId = positionId;
				clean.positionName = String(body.positionName || (formDoc as any)?.name || 'Application')
					.trim()
					.slice(0, 80);
				clean.userId = targetUserId;
				clean.anonymous = Boolean(body.anonymous ?? (formDoc as any)?.anonymousResponses);
				clean.status = 'pending';
				clean.answers = Array.isArray(body.answers)
					? body.answers.slice(0, 25).map((a: any) => ({
							questionId: String(a?.questionId || ''),
							question: String(a?.question || '').slice(0, 256),
							type: String(a?.type || 'paragraph'),
							answer: String(a?.answer ?? '').slice(0, 2000),
						}))
					: [];

				clean.applicantMeta = {
					accountCreatedAt: body.applicantMeta?.accountCreatedAt ? new Date(body.applicantMeta.accountCreatedAt) : null,
					guildJoinedAt: body.applicantMeta?.guildJoinedAt ? new Date(body.applicantMeta.guildJoinedAt) : null,
					rolesSnapshot: Array.isArray(body.applicantMeta?.rolesSnapshot) ? body.applicantMeta.rolesSnapshot.map(String).slice(0, 40) : [],
					priorSubmissionsCount: Number(priorSubmissionsCount) || 0,
				};

				const created = await SubmissionModel.create(clean);
				await ensureUserBonusAndDefaults(targetUserId).catch(() => null);
				if (DraftModel) {
					await DraftModel.deleteOne({ id: `${clean.guild}:${targetUserId}:${clean.positionId}` }).catch(() => null);
				}

				let formAutoClosed = false;
				const maxSubs = Number((formDoc as any)?.maxSubmissions) || 0;
				if (FormModel && maxSubs > 0) {
					const activeTotal = await SubmissionModel.countDocuments({ guild: guildId, positionId, status: { $ne: 'withdrawn' } }).catch(() => 0);
					if (activeTotal >= maxSubs && (formDoc as any)?.state === 'open') {
						await FormModel.updateOne({ id: positionId, guild: guildId }, { $set: { state: 'closed' } }).catch(() => null);
						formAutoClosed = true;
					}
				}

				const out: any = withDocId(created);
				return { ...out, formAutoClosed };
			}

			if (msg.method === 'update') {
				if (!body.id) throw new Error('Missing submission id');
				const filter: Record<string, any> = { id: String(body.id) };
				if (body.guild) filter.guild = String(body.guild);

				const op = body.op ? String(body.op) : '';

				if (op === 'vote') {
					const existing: any = await SubmissionModel.findOne(filter).lean();
					if (!existing) return null;
					const voterId = String(body.voterId || '').trim();
					const voterTag = String(body.voterTag || '').trim();
					const voteDir = body.vote === 'down' ? 'down' : 'up';
					if (!voterId) throw new Error('Missing voterId');

					const currentVotes: any[] = Array.isArray(existing.votes) ? [...existing.votes] : [];
					const idx = currentVotes.findIndex((v) => String(v.userId) === voterId);
					if (idx >= 0) {
						if (currentVotes[idx].vote === voteDir) {
							currentVotes.splice(idx, 1);
						} else {
							currentVotes[idx] = { userId: voterId, userTag: voterTag || currentVotes[idx].userTag || '', vote: voteDir, createdAt: new Date() };
						}
					} else {
						currentVotes.push({ userId: voterId, userTag: voterTag, vote: voteDir, createdAt: new Date() });
					}

					const updated: any = await SubmissionModel.findOneAndUpdate(filter, { $set: { votes: currentVotes } }, { returnDocument: 'after' }).lean();
					const upvotes = currentVotes.filter((v) => v.vote === 'up').length;
					const downvotes = currentVotes.filter((v) => v.vote === 'down').length;
					return { ...(withDocId(updated) as any), upvotes, downvotes, netVotes: upvotes - downvotes };
				}

				if (op === 'addNote') {
					const content = String(body.content || '')
						.trim()
						.slice(0, 1000);
					const authorId = String(body.authorId || '').trim();
					if (!content || !authorId) throw new Error('Missing note content or authorId');

					const noteEntry = {
						id: makeId('note'),
						authorId,
						authorTag: String(body.authorTag || '').trim(),
						content,
						createdAt: new Date(),
					};
					const updated = await SubmissionModel.findOneAndUpdate(filter, { $push: { internalNotes: { $each: [noteEntry], $slice: -50 } } }, { returnDocument: 'after' }).lean();
					return withDocId(updated) || null;
				}

				if (op === 'requestClarification') {
					const prompt = String(body.prompt || '')
						.trim()
						.slice(0, 1000);
					const requestedBy = String(body.requestedBy || '').trim();
					if (!prompt || !requestedBy) throw new Error('Missing clarification prompt or requestedBy');

					const clarEntry = {
						id: makeId('clar'),
						prompt,
						requestedBy,
						requestedByTag: String(body.requestedByTag || '').trim(),
						requestedAt: new Date(),
						response: null,
						respondedAt: null,
					};
					const updated = await SubmissionModel.findOneAndUpdate(
						filter,
						{
							$set: { status: 'needs_info' },
							$push: { clarifications: { $each: [clarEntry], $slice: -20 } },
						},
						{ returnDocument: 'after' }
					).lean();
					return withDocId(updated) || null;
				}

				if (op === 'respondClarification') {
					const existing: any = await SubmissionModel.findOne(filter).lean();
					if (!existing) return null;
					if (body.userId && String(existing.userId) !== String(body.userId)) {
						throw new Error('Only the applicant can respond to this clarification.');
					}
					const responseText = String(body.response || '')
						.trim()
						.slice(0, 2000);
					if (!responseText) throw new Error('Response cannot be empty.');

					const clarifications: any[] = Array.isArray(existing.clarifications) ? [...existing.clarifications] : [];
					for (let i = clarifications.length - 1; i >= 0; i--) {
						if (!clarifications[i].response) {
							clarifications[i] = {
								...clarifications[i],
								response: responseText,
								respondedAt: new Date(),
							};
							break;
						}
					}

					const updated = await SubmissionModel.findOneAndUpdate(
						filter,
						{
							$set: {
								status: 'pending',
								clarifications,
							},
						},
						{ returnDocument: 'after' }
					).lean();
					return withDocId(updated) || null;
				}

				if (op === 'withdraw') {
					const existing: any = await SubmissionModel.findOne(filter).lean();
					if (!existing) return null;
					if (body.userId && String(existing.userId) !== String(body.userId)) {
						throw new Error('Only the applicant can withdraw this application.');
					}
					if (!['pending', 'needs_info', 'interview'].includes(String(existing.status))) {
						throw new Error(`Cannot withdraw an application that is already ${existing.status}.`);
					}
					const updated = await SubmissionModel.findOneAndUpdate(filter, { $set: { status: 'withdrawn' } }, { returnDocument: 'after' }).lean();
					return withDocId(updated) || null;
				}

				const clean = stripImmutableFields(body);
				delete clean.id;
				delete clean.guild;
				delete clean.op;

				const updated: any = await SubmissionModel.findOneAndUpdate(filter, { $set: clean }, { returnDocument: 'after', runValidators: true }).lean();
				if (!updated) return null;

				let formAutoClosed = false;
				if (clean.status === 'approved' && FormModel) {
					const formDoc: any = await FormModel.findOne({ id: updated.positionId, guild: updated.guild })
						.lean()
						.catch(() => null);
					const maxApprovals = Number(formDoc?.maxApprovals) || 0;
					if (maxApprovals > 0 && formDoc?.state === 'open') {
						const approvedTotal = await SubmissionModel.countDocuments({ guild: updated.guild, positionId: updated.positionId, status: 'approved' }).catch(() => 0);
						if (approvedTotal >= maxApprovals) {
							await FormModel.updateOne({ id: updated.positionId, guild: updated.guild }, { $set: { state: 'closed' } }).catch(() => null);
							formAutoClosed = true;
						}
					}
				}

				return { ...(withDocId(updated) as any), formAutoClosed };
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
			const [positionsTotal, positionsOpen, submissionsTotal, pending, interview, needsInfo, approved, denied, withdrawn] = await Promise.all([
				FormModel ? FormModel.countDocuments(guildQuery) : 0,
				FormModel ? FormModel.countDocuments({ ...guildQuery, state: 'open' }) : 0,
				SubmissionModel ? SubmissionModel.countDocuments(guildQuery) : 0,
				SubmissionModel ? SubmissionModel.countDocuments({ ...guildQuery, status: 'pending' }) : 0,
				SubmissionModel ? SubmissionModel.countDocuments({ ...guildQuery, status: 'interview' }) : 0,
				SubmissionModel ? SubmissionModel.countDocuments({ ...guildQuery, status: 'needs_info' }) : 0,
				SubmissionModel ? SubmissionModel.countDocuments({ ...guildQuery, status: 'approved' }) : 0,
				SubmissionModel ? SubmissionModel.countDocuments({ ...guildQuery, status: 'denied' }) : 0,
				SubmissionModel ? SubmissionModel.countDocuments({ ...guildQuery, status: 'withdrawn' }) : 0,
			]);
			return {
				positionsTotal,
				positionsOpen,
				submissionsTotal,
				pending,
				interview,
				needsInfo,
				approved,
				denied,
				withdrawn,
			};
		}

		default:
			throw new Error(`Unsupported YourApps action: ${action}`);
	}
}
