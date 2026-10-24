/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		if (!id) {
			return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
		}

		const { models } = await database('xernerx');
		const User = models.users.User as any;
		const Issue = models.core.Issue as any;
		const Suggestion = models.core.Suggestion as any;
		const Application = models.dispatch.Application as any;
		const ApplicationConfig = models.dispatch.ApplicationConfig as any;

		const [profile, issues, suggestions, applications, appConfigs] = await Promise.all([
			User.findOne({ id })
				.lean()
				.catch(() => null),
			Issue.find({ authorId: id })
				.sort({ createdAt: -1 })
				.lean()
				.catch(() => []),
			Suggestion.find({ $or: [{ authorId: id }, { 'author.id': id }] })
				.sort({ createdAt: -1 })
				.lean()
				.catch(() => []),
			Application.find({ ownerId: id })
				.sort({ createdAt: -1 })
				.lean()
				.catch(() => []),
			ApplicationConfig.find({})
				.lean()
				.catch(() => []),
		]);

		const configMap = new Map<string, any>();
		for (const cfg of appConfigs) {
			if (cfg.id) configMap.set(String(cfg.id), cfg);
			if (cfg._id) configMap.set(String(cfg._id), cfg);
		}

		const enrichedApplications = applications.map((app: any) => {
			const cfg = configMap.get(String(app.targetId));
			return {
				...app,
				configTitle: cfg?.name || cfg?.title || app.targetId || 'Application',
				configDescription: cfg?.description || '',
				questions: Array.isArray(cfg?.questions) ? cfg.questions : [],
			};
		});

		return NextResponse.json({
			profile: profile || { id },
			issues,
			suggestions,
			applications: enrichedApplications,
			exportedAt: new Date().toISOString(),
		});
	} catch (error: any) {
		console.error('[API] Failed to fetch user activity:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
