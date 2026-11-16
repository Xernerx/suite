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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; positionId: string }> }) {
	try {
		const { id, positionId } = await params;
		const body = await req.json();
		const db = await database('yourapps');
		const FormModel = (db.models.guilds as any)?.Form;
		if (!FormModel) return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });

		const allowedCategories = new Set(['staff', 'appeal', 'feedback', 'event', 'custom']);
		const updateData: Record<string, any> = {};

		if (body.name !== undefined) {
			const name = String(body.name || '')
				.trim()
				.slice(0, 80);
			if (!name) return NextResponse.json({ error: 'Position name cannot be empty.' }, { status: 400 });
			updateData.name = name;
		}
		if (body.description !== undefined)
			updateData.description = String(body.description || '')
				.trim()
				.slice(0, 1000);
		if (body.category !== undefined) {
			const cat = String(body.category || '').toLowerCase();
			if (allowedCategories.has(cat)) updateData.category = cat;
		}
		if (body.state !== undefined) updateData.state = body.state === 'closed' ? 'closed' : 'open';
		if (body.questions !== undefined) updateData.questions = sanitizeQuestions(body.questions);
		if (body.rewardRoles !== undefined) updateData.rewardRoles = sanitizeRoleList(body.rewardRoles);
		if (body.removeRoles !== undefined) updateData.removeRoles = sanitizeRoleList(body.removeRoles);
		if (body.requiredRoles !== undefined) updateData.requiredRoles = sanitizeRoleList(body.requiredRoles);
		if (body.restrictedRoles !== undefined) updateData.restrictedRoles = sanitizeRoleList(body.restrictedRoles);
		if (body.cooldown !== undefined) updateData.cooldown = Math.max(0, Number(body.cooldown) || 0);
		if (body.minimumJoinTime !== undefined) updateData.minimumJoinTime = Math.max(0, Number(body.minimumJoinTime) || 0);
		if (body.acceptMessage !== undefined)
			updateData.acceptMessage = String(body.acceptMessage || '')
				.trim()
				.slice(0, 1000);
		if (body.denyMessage !== undefined)
			updateData.denyMessage = String(body.denyMessage || '')
				.trim()
				.slice(0, 1000);

		const updated = await FormModel.findOneAndUpdate({ id: positionId, guild: id }, { $set: updateData }, { returnDocument: 'after', runValidators: true }).lean();
		if (!updated) {
			return NextResponse.json({ error: 'Position not found' }, { status: 404 });
		}

		return NextResponse.json(updated, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; positionId: string }> }) {
	try {
		const { id, positionId } = await params;
		const db = await database('yourapps');
		const FormModel = (db.models.guilds as any)?.Form;
		const DraftModel = (db.models.guilds as any)?.Draft;
		if (!FormModel) return NextResponse.json({ error: 'YourApps models not initialized' }, { status: 500 });

		const deleted = await FormModel.findOneAndDelete({ id: positionId, guild: id }).lean();
		if (!deleted) {
			return NextResponse.json({ error: 'Position not found' }, { status: 404 });
		}

		if (DraftModel) {
			await DraftModel.deleteMany({ guild: id, positionId }).catch(() => null);
		}

		return NextResponse.json({ success: true, id: positionId }, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
