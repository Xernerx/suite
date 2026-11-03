/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { recordAuditLog, resolveCallerAuth } from '@/lib/auditAndNotify';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const db = await database('virtue');
		const UserModel = (db.models.profiles as any)?.User;

		if (!UserModel) {
			return NextResponse.json({ error: 'Virtue models not initialized' }, { status: 500 });
		}

		const profile = (await UserModel.findOne({ id }).lean()) as any;

		if (!profile) {
			return NextResponse.json({ id, language: null, locale: null, found: false }, { status: 200 });
		}

		const resolvedLang = profile.language || profile.locale || profile.preferences?.locale || profile.preferences?.language || 'en-GB';

		return NextResponse.json(
			{
				...profile,
				language: resolvedLang,
				locale: resolvedLang,
				found: true,
			},
			{ status: 200 }
		);
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const db = await database('virtue');
		const UserModel = (db.models.profiles as any)?.User;

		if (!UserModel) {
			return NextResponse.json({ error: 'Virtue models not initialized' }, { status: 500 });
		}

		const nextLang = body?.language || body?.locale || body?.preferences?.locale || body?.preferences?.language;
		const { _id: _omitId, __v: _omitV, createdAt: _omitCreated, updatedAt: _omitUpdated, preferences: _omitPrefs, ...cleanBody } = body || {};
		const setPayload: Record<string, any> = {
			...cleanBody,
			id,
		};

		if (nextLang) {
			setPayload.language = nextLang;
			setPayload.locale = nextLang;
			setPayload['preferences.locale'] = nextLang;
			setPayload['preferences.language'] = nextLang;
		}

		const updated = await UserModel.findOneAndUpdate({ id }, { $set: setPayload }, { returnDocument: 'after', upsert: true, runValidators: true }).lean();

		return NextResponse.json(updated, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const caller = await resolveCallerAuth(req, ['users']);
		const isStaffOrSystem = Boolean(caller.isSystemToken || caller.authorized);
		if (!isStaffOrSystem && caller.userId !== id) {
			return NextResponse.json({ error: 'Forbidden: You can only delete your own Virtue data.' }, { status: 403 });
		}

		const db = await database('virtue');
		const UserModel = (db.models.profiles as any)?.User;
		const LevelModel = (db.models.levels as any)?.Level;
		const TextModel = (db.models.levels as any)?.Text;
		const VoiceModel = (db.models.levels as any)?.Voice;
		const ProfileLevelModel = (db.models.profiles as any)?.Level;
		const ProfileTextModel = (db.models.profiles as any)?.Text;
		const ProfileVoiceModel = (db.models.profiles as any)?.Voice;

		let wasBlacklisted = false;
		let wasServicesOptOut = false;

		if (UserModel) {
			const existingVUser = (await UserModel.findOne({ id })
				.lean()
				.catch(() => null)) as any;
			if (existingVUser?.blacklisted) wasBlacklisted = true;
			if (existingVUser?.services === false) wasServicesOptOut = true;
		}

		try {
			const xernerxDb = await database('xernerx');
			const xUser = (await (xernerxDb.models.users as any)?.User?.findOne({ id })
				.select('blacklisted services')
				.lean()
				.catch(() => null)) as any;
			if (xUser?.blacklisted) wasBlacklisted = true;
			if (xUser?.services === false) wasServicesOptOut = true;
		} catch {}

		const modelsToDelete = Array.from(new Set([UserModel, LevelModel, TextModel, VoiceModel, ProfileLevelModel, ProfileTextModel, ProfileVoiceModel].filter(Boolean)));
		const results = await Promise.all(modelsToDelete.map((m: any) => m.deleteMany({ id }).catch(() => ({ deletedCount: 0 }))));
		const deletedCount = results.reduce((sum, r: any) => sum + (Number(r?.deletedCount) || 0), 0);

		if (wasBlacklisted || wasServicesOptOut) {
			const tombstone: Record<string, any> = {
				id,
				...(wasBlacklisted ? { blacklisted: true } : {}),
				...(wasServicesOptOut ? { services: false } : {}),
			};
			if (UserModel) {
				await UserModel.collection.replaceOne({ id }, tombstone, { upsert: true }).catch(() => null);
			}
			try {
				const xernerxDb = await database('xernerx');
				const XUserModel = (xernerxDb.models.users as any)?.User;
				if (XUserModel) {
					const existingX = await XUserModel.findOne({ id })
						.select('id')
						.lean()
						.catch(() => null);
					if (existingX) {
						await XUserModel.updateOne(
							{ id },
							{
								$set: {
									...(wasBlacklisted ? { blacklisted: true } : {}),
									...(wasServicesOptOut ? { services: false } : {}),
								},
							}
						).catch(() => null);
					} else {
						await XUserModel.collection.replaceOne({ id }, tombstone, { upsert: true }).catch(() => null);
					}
				}
			} catch {}
		}

		try {
			const xernerxDb = await database('xernerx');
			await (xernerxDb.models.users as any)?.Level?.updateMany({ ownerId: id }, { $set: { level: 1, xp: 0 } }).catch(() => null);
		} catch {}

		await recordAuditLog(req, {
			action: 'user.virtue.delete',
			targetType: 'user',
			targetId: id,
			summary: `Deleted Virtue leveling and profile data for user "${id}"${wasBlacklisted || wasServicesOptOut ? ' (tombstone persisted)' : ''}`,
			metadata: {
				deletedDocuments: deletedCount,
				tombstonePersisted: wasBlacklisted || wasServicesOptOut,
				...(wasBlacklisted ? { blacklisted: true } : {}),
				...(wasServicesOptOut ? { services: false } : {}),
			},
		});

		return NextResponse.json({ success: true, deletedCount, tombstonePersisted: wasBlacklisted || wasServicesOptOut }, { status: 200 });
	} catch (error: unknown) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
