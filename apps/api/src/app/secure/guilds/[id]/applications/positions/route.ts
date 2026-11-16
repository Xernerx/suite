/** @format */

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

function sanitizeQuestions(rawQuestions: unknown) {
	if (!Array.isArray(rawQuestions)) return [];
	const allowedTypes = new Set(['short', 'paragraph', 'number', 'select', 'radio', 'multiselect', 'boolean', 'checkbox', 'user', 'role', 'channel', 'mentionable', 'file']);
	return rawQuestions
		.slice(0, 25)
		.map((q: any, idx: number) => {
			const question = String(q?.question || '')
				.trim()
				.slice(0, 256);
			if (!question) return null;
			const rawType = String(q?.type || 'paragraph').toLowerCase();
			const type = allowedTypes.has(rawType) ? rawType : 'paragraph';
			const maxCap = type === 'short' ? 256 : 1000;
			const minLength = Math.max(0, Math.min(maxCap, Number(q?.minLength) || 0));
			const maxLength = Math.max(Math.max(1, minLength), Math.min(maxCap, Number(q?.maxLength) || maxCap));
			const supportsOptions = type === 'select' || type === 'radio' || type === 'multiselect' || type === 'boolean';
			const optionLimit = type === 'select' ? 25 : type === 'boolean' ? 2 : 10;
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
		.filter(Boolean);
}

const sanitizeRoleList = (val: unknown): string[] => (Array.isArray(val) ? Array.from(new Set(val.map((x) => String(x || '').trim()).filter(Boolean))).slice(0, 25) : []);

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('yourapps');
		const FormModel = (db.models.guilds as any)?.Form;
		if (!FormModel) return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });

		const forms = await FormModel.find({ guild: id }).sort({ createdAt: 1 }).lean();
		return NextResponse.json({ items: forms }, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = await database('yourapps');
		const FormModel = (db.models.guilds as any)?.Form;
		if (!FormModel) return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });

		const existingCount = await FormModel.countDocuments({ guild: id });
		if (existingCount >= 25) {
			return NextResponse.json({ error: 'Maximum of 25 positions reached for this server.' }, { status: 400 });
		}

		const name = String(body?.name || '')
			.trim()
			.slice(0, 80);
		if (!name) {
			return NextResponse.json({ error: 'Position name is required.' }, { status: 400 });
		}

		const allowedCategories = new Set(['staff', 'appeal', 'feedback', 'event', 'custom']);
		const rawCategory = String(body?.category || 'staff').toLowerCase();

		const created = await FormModel.create({
			id: `pos_${crypto.randomBytes(4).toString('hex')}`,
			guild: id,
			name,
			description: String(body?.description || '')
				.trim()
				.slice(0, 1000),
			category: allowedCategories.has(rawCategory) ? rawCategory : 'staff',
			state: body?.state === 'closed' ? 'closed' : 'open',
			questions: sanitizeQuestions(body?.questions),
			rewardRoles: sanitizeRoleList(body?.rewardRoles),
			removeRoles: sanitizeRoleList(body?.removeRoles),
			requiredRoles: sanitizeRoleList(body?.requiredRoles),
			restrictedRoles: sanitizeRoleList(body?.restrictedRoles),
			cooldown: Math.max(0, Number(body?.cooldown) || 0),
			minimumJoinTime: Math.max(0, Number(body?.minimumJoinTime) || 0),
			acceptMessage: String(body?.acceptMessage || '')
				.trim()
				.slice(0, 1000),
			denyMessage: String(body?.denyMessage || '')
				.trim()
				.slice(0, 1000),
		});

		return NextResponse.json(created?.toObject ? created.toObject() : created, { status: 201 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
