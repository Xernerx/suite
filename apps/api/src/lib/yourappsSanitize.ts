/** @format */

import crypto from 'crypto';

export const ALLOWED_QUESTION_TYPES = ['short', 'paragraph', 'number', 'select', 'radio', 'multiselect', 'boolean', 'checkbox', 'user', 'role', 'channel', 'mentionable', 'file'] as const;
export const ALLOWED_CATEGORIES = ['staff', 'appeal', 'feedback', 'event', 'poll', 'custom'] as const;
const VALID_PATTERNS = new Set(['none', 'url', 'email', 'discord_id', 'regex']);
const VALID_OPERATORS = new Set(['equals', 'not_equals', 'contains']);

export function snowflakeCreatedAtMs(id: string): number | null {
	try {
		const clean = String(id || '').trim();
		if (!/^\d{16,21}$/.test(clean)) return null;
		const ms = Number((BigInt(clean) >> BigInt(22)) + BigInt('1420070400000'));
		return Number.isFinite(ms) && ms > 1420070400000 ? ms : null;
	} catch {
		return null;
	}
}

export const sanitizeRoleList = (val: unknown, limit = 25): string[] => (Array.isArray(val) ? Array.from(new Set(val.map((x) => String(x || '').trim()).filter(Boolean))).slice(0, limit) : []);

export function sanitizeQuestions(rawQuestions: unknown) {
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
			const type = allowedTypes.has(rawType) ? rawType : 'paragraph';
			const maxCap = type === 'short' ? 256 : 1000;
			const minLength = Math.max(0, Math.min(maxCap, Number(q?.minLength) || 0));
			const maxLength = Math.max(Math.max(1, minLength), Math.min(maxCap, Number(q?.maxLength) || maxCap));
			const supportsOptions = type === 'select' || type === 'radio' || type === 'multiselect';
			const optionLimit = type === 'select' ? 25 : 10;
			let options: string[] = [];

			if (supportsOptions && Array.isArray(q?.options)) {
				const seen = new Set<string>();
				for (const opt of q.options) {
					const clean = String(opt || '')
						.trim()
						.slice(0, 100);
					if (!clean) continue;
					const lower = clean.toLowerCase();
					if (seen.has(lower)) continue;
					seen.add(lower);
					options.push(clean);
					if (options.length >= optionLimit) break;
				}
			} else if (type === 'boolean' && Array.isArray(q?.options)) {
				const first = String(q.options[0] || '')
					.trim()
					.slice(0, 60);
				const second = String(q.options[1] || '')
					.trim()
					.slice(0, 60);
				if (first || second) {
					options = [first || 'Yes', second || 'No'];
				}
			}

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
		.filter(Boolean);
}

function parseOptionalDate(val: unknown): Date | null {
	if (!val) return null;
	const d = new Date(String(val));
	return Number.isNaN(d.getTime()) ? null : d;
}

export function sanitizePositionPayload(body: any, isPatch = false): Record<string, any> {
	const allowedCategories = new Set<string>(ALLOWED_CATEGORIES);
	const out: Record<string, any> = {};

	if (!isPatch || body?.name !== undefined) {
		out.name = String(body?.name || '')
			.trim()
			.slice(0, 80);
	}
	if (!isPatch || body?.description !== undefined) {
		out.description = String(body?.description || '')
			.trim()
			.slice(0, 1000);
	}
	if (!isPatch || body?.category !== undefined) {
		const cat = String(body?.category || 'staff').toLowerCase();
		out.category = allowedCategories.has(cat) ? cat : 'staff';
	}
	if (!isPatch || body?.state !== undefined) {
		out.state = body?.state === 'closed' ? 'closed' : 'open';
	}
	if (!isPatch || body?.questions !== undefined) {
		out.questions = sanitizeQuestions(body?.questions);
	}
	if (!isPatch || body?.pendingRoles !== undefined) out.pendingRoles = sanitizeRoleList(body?.pendingRoles);
	if (!isPatch || body?.rewardRoles !== undefined) out.rewardRoles = sanitizeRoleList(body?.rewardRoles);
	if (!isPatch || body?.removeRoles !== undefined) out.removeRoles = sanitizeRoleList(body?.removeRoles);
	if (!isPatch || body?.denyAddRoles !== undefined) out.denyAddRoles = sanitizeRoleList(body?.denyAddRoles);
	if (!isPatch || body?.denyRemoveRoles !== undefined) out.denyRemoveRoles = sanitizeRoleList(body?.denyRemoveRoles);
	if (!isPatch || body?.requiredRoles !== undefined) out.requiredRoles = sanitizeRoleList(body?.requiredRoles);
	if (!isPatch || body?.restrictedRoles !== undefined) out.restrictedRoles = sanitizeRoleList(body?.restrictedRoles);

	if (!isPatch || body?.cooldown !== undefined) out.cooldown = Math.max(0, Number(body?.cooldown) || 0);
	if (!isPatch || body?.minimumJoinTime !== undefined) out.minimumJoinTime = Math.max(0, Number(body?.minimumJoinTime) || 0);
	if (!isPatch || body?.minimumAccountAge !== undefined) out.minimumAccountAge = Math.max(0, Number(body?.minimumAccountAge) || 0);

	if (!isPatch || body?.opensAt !== undefined) out.opensAt = parseOptionalDate(body?.opensAt);
	if (!isPatch || body?.closesAt !== undefined) out.closesAt = parseOptionalDate(body?.closesAt);

	if (!isPatch || body?.maxSubmissions !== undefined) out.maxSubmissions = Math.max(0, Math.min(100000, Math.floor(Number(body?.maxSubmissions) || 0)));
	if (!isPatch || body?.maxApprovals !== undefined) out.maxApprovals = Math.max(0, Math.min(100000, Math.floor(Number(body?.maxApprovals) || 0)));
	if (!isPatch || body?.minVotesToApprove !== undefined) out.minVotesToApprove = Math.max(0, Math.min(50, Math.floor(Number(body?.minVotesToApprove) || 0)));
	if (!isPatch || body?.autoApproveVotes !== undefined) out.autoApproveVotes = Math.max(0, Math.min(50, Math.floor(Number(body?.autoApproveVotes) || 0)));
	if (!isPatch || body?.autoDenyVotes !== undefined) out.autoDenyVotes = Math.max(0, Math.min(50, Math.floor(Number(body?.autoDenyVotes) || 0)));
	if (!isPatch || body?.anonymousResponses !== undefined) out.anonymousResponses = Boolean(body?.anonymousResponses);

	if (!isPatch || body?.logChannelOverride !== undefined) {
		out.logChannelOverride = body?.logChannelOverride ? String(body.logChannelOverride).trim() : null;
	}
	if (!isPatch || body?.archiveChannelOverride !== undefined) {
		out.archiveChannelOverride = body?.archiveChannelOverride ? String(body.archiveChannelOverride).trim() : null;
	}
	if (!isPatch || body?.reviewRolesOverride !== undefined) out.reviewRolesOverride = sanitizeRoleList(body?.reviewRolesOverride);
	if (!isPatch || body?.submissionPingsOverride !== undefined) out.submissionPingsOverride = sanitizeRoleList(body?.submissionPingsOverride);
	if (!isPatch || body?.threadPerSubmissionOverride !== undefined) {
		out.threadPerSubmissionOverride = body?.threadPerSubmissionOverride === null || body?.threadPerSubmissionOverride === '' ? null : Boolean(body.threadPerSubmissionOverride);
	}
	if (!isPatch || body?.pollOnSubmissionOverride !== undefined) {
		out.pollOnSubmissionOverride = body?.pollOnSubmissionOverride === null || body?.pollOnSubmissionOverride === '' ? null : Boolean(body.pollOnSubmissionOverride);
	}

	if (!isPatch || body?.acceptMessage !== undefined) {
		out.acceptMessage = String(body?.acceptMessage || '')
			.trim()
			.slice(0, 1000);
	}
	if (!isPatch || body?.denyMessage !== undefined) {
		out.denyMessage = String(body?.denyMessage || '')
			.trim()
			.slice(0, 1000);
	}

	return out;
}

export function isQuestionActive(question: any, answers: Record<string, string>): boolean {
	const cond = question?.condition;
	if (!cond || !cond.questionId) return true;
	const refRaw = String(answers[String(cond.questionId)] ?? '').trim();
	const target = String(cond.value ?? '').trim();
	if (!target) return true;
	const refLower = refRaw.toLowerCase();
	const targetLower = target.toLowerCase();

	switch (cond.operator) {
		case 'not_equals':
			return refLower !== targetLower;
		case 'contains':
			return refLower.includes(targetLower);
		case 'equals':
		default:
			return refLower === targetLower;
	}
}

export function validateQuestionAnswer(q: any, val: string, questionNumber: number): string | null {
	const trimmed = String(val ?? '').trim();
	const label = `Question #${questionNumber} ("${q.question}")`;

	if (q.required !== false && (!trimmed || (q.type === 'checkbox' && trimmed !== 'Yes'))) {
		return q.type === 'checkbox' ? `${label} must be checked.` : `${label} is required.`;
	}

	if (!trimmed) return null;

	if (q.type === 'short' || q.type === 'paragraph') {
		const minLen = Number(q.minLength) || 0;
		const maxLen = Number(q.maxLength) || 0;
		if (minLen > 1 && trimmed.length < minLen) {
			return `${label} requires at least ${minLen} characters.`;
		}
		if (maxLen > 0 && trimmed.length > maxLen) {
			return `${label} must be ${maxLen} characters or fewer.`;
		}
	}

	if (q.type === 'number') {
		const num = Number(trimmed);
		if (Number.isNaN(num)) {
			return `${label} expects a valid number.`;
		}
		if (q.minValue !== null && q.minValue !== undefined && num < Number(q.minValue)) {
			return `${label} must be at least ${q.minValue}.`;
		}
		if (q.maxValue !== null && q.maxValue !== undefined && num > Number(q.maxValue)) {
			return `${label} must be ${q.maxValue} or less.`;
		}
	}

	const pattern = String(q.validationPattern || 'none');
	if (pattern === 'url' && !/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(trimmed)) {
		return `${label} must be a valid URL starting with http:// or https://.`;
	}
	if (pattern === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
		return `${label} must be a valid email address.`;
	}
	if (pattern === 'discord_id' && !/^\d{16,21}$/.test(trimmed)) {
		return `${label} must be a valid numeric Discord ID.`;
	}
	if (pattern === 'regex' && q.validationRegex) {
		try {
			const re = new RegExp(String(q.validationRegex));
			if (!re.test(trimmed)) {
				return `${label} does not match the required format.`;
			}
		} catch {
			// Ignore invalid custom regex
		}
	}

	return null;
}

export async function reconcileScheduledGuildPositions(FormModel: any, guildId: string): Promise<boolean> {
	if (!FormModel || !guildId) return false;
	const now = new Date();
	const [opened, closed] = await Promise.all([
		FormModel.updateMany(
			{
				guild: guildId,
				state: 'closed',
				opensAt: { $ne: null, $lte: now },
				$or: [{ closesAt: null }, { closesAt: { $gt: now } }],
			},
			{ $set: { state: 'open', opensAt: null } }
		).catch(() => ({ modifiedCount: 0 })),
		FormModel.updateMany(
			{
				guild: guildId,
				state: 'open',
				closesAt: { $ne: null, $lte: now },
			},
			{ $set: { state: 'closed', closesAt: null } }
		).catch(() => ({ modifiedCount: 0 })),
	]);

	return Boolean((opened?.modifiedCount || 0) > 0 || (closed?.modifiedCount || 0) > 0);
}
