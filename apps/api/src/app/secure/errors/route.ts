/** @format */

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { resolveCallerAuth } from '@/lib/auditAndNotify';

export const dynamic = 'force-dynamic';

function extractFilepathFromStack(stack?: string | null): string | null {
	if (!stack || typeof stack !== 'string') return null;
	const lines = stack
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l.startsWith('at '));
	const appLine = lines.find((l) => !l.includes('node:internal') && !l.includes('node_modules')) || lines[0];
	if (!appLine) return null;
	const match = appLine.match(/at\s+(?:.*\()?(.+?):(\d+):(\d+)\)?$/);
	if (!match) return null;
	const cleanFile = match[1].replace(/^file:\/\/\/?/i, '').replace(/\\/g, '/');
	const shortPath = cleanFile.includes('/src/')
		? `src/${cleanFile.split('/src/').pop()}`
		: cleanFile.includes('/dist/')
			? `dist/${cleanFile.split('/dist/').pop()}`
			: cleanFile.split('/').slice(-3).join('/');
	return `${shortPath}:${match[2]}:${match[3]}`;
}

export async function GET(req: Request) {
	try {
		const caller = await resolveCallerAuth(req, ['access', 'hosting']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Staff access permission required.' }, { status: caller.authenticated ? 403 : 401 });
		}

		const db = await database('xernerx');
		const ErrorLogModel = (db.models.core as any)?.ErrorLog;
		if (!ErrorLogModel) {
			return NextResponse.json({ data: [], stats: { total: 0, open: 0, resolved: 0, fatal: 0, occurrences: 0, byService: {} }, services: [] });
		}

		const url = new URL(req.url);
		const serviceParam = url.searchParams.get('service');
		const envParam = url.searchParams.get('environment');
		const levelParam = url.searchParams.get('level');
		const statusParam = (url.searchParams.get('status') || 'open').toLowerCase();
		const qParam = (url.searchParams.get('q') || '').trim().toLowerCase();
		const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit')) || 150));

		const allLogs = await ErrorLogModel.find({}).sort({ lastSeenAt: -1 }).limit(1000).lean();

		const byService: Record<string, number> = {};
		let openCount = 0;
		let resolvedCount = 0;
		let fatalCount = 0;
		let totalOccurrences = 0;

		for (const item of allLogs as any[]) {
			const svc = String(item.service || 'unknown').toLowerCase();
			if (!item.resolved) {
				openCount++;
				byService[svc] = (byService[svc] || 0) + 1;
				if (item.level === 'fatal') fatalCount++;
			} else {
				resolvedCount++;
				if (byService[svc] === undefined) byService[svc] = 0;
			}
			totalOccurrences += Number(item.occurrences || 1);
		}

		const knownServices = Array.from(new Set(['virtue', 'yourapps', 'bot', 'app-bot', 'websocket', ...Object.keys(byService)])).sort();

		const selectedServices = serviceParam
			? serviceParam
					.split(',')
					.map((s) => s.trim().toLowerCase())
					.filter(Boolean)
			: [];
		const selectedEnvs = envParam
			? envParam
					.split(',')
					.map((s) => s.trim().toLowerCase())
					.filter(Boolean)
			: [];
		const selectedLevels = levelParam
			? levelParam
					.split(',')
					.map((s) => s.trim().toLowerCase())
					.filter(Boolean)
			: [];

		const filtered = (allLogs as any[]).filter((item) => {
			if (statusParam === 'open' && item.resolved) return false;
			if (statusParam === 'resolved' && !item.resolved) return false;
			if (selectedServices.length > 0 && !selectedServices.includes(String(item.service || '').toLowerCase())) return false;
			if (selectedEnvs.length > 0 && !selectedEnvs.includes(String(item.environment || '').toLowerCase())) return false;
			if (selectedLevels.length > 0 && !selectedLevels.includes(String(item.level || '').toLowerCase())) return false;

			if (qParam) {
				const haystack = [item.service, item.message, item.filepath, item.stack, item.meta ? JSON.stringify(item.meta) : ''].filter(Boolean).join(' ').toLowerCase();
				if (!haystack.includes(qParam)) return false;
			}
			return true;
		});

		return NextResponse.json({
			data: filtered.slice(0, limit),
			stats: {
				total: allLogs.length,
				open: openCount,
				resolved: resolvedCount,
				fatal: fatalCount,
				occurrences: totalOccurrences,
				byService,
			},
			services: knownServices,
		});
	} catch (error) {
		console.error('Failed to fetch error logs:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const caller = await resolveCallerAuth(req, ['access', 'hosting']);
		if (!caller.authorized && !caller.authenticated) {
			return NextResponse.json({ error: 'Unauthorized: Valid token or staff session required.' }, { status: 401 });
		}

		const body = await req.json().catch(() => null);
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
		}

		const db = await database('xernerx');
		const ErrorLogModel = (db.models.core as any)?.ErrorLog;
		if (!ErrorLogModel) {
			return NextResponse.json({ error: 'ErrorLog model unavailable' }, { status: 500 });
		}

		const service =
			String(body.service || body.serviceId || body.id || 'unknown')
				.trim()
				.toLowerCase() || 'unknown';
		const rawEnv = String(body.environment || process.env.ENVIRONMENT || 'production')
			.trim()
			.toLowerCase();
		const environment: 'production' | 'canary' | 'development' = rawEnv === 'development' || rawEnv === 'dev' ? 'development' : rawEnv === 'canary' ? 'canary' : 'production';
		const rawLevel = String(body.level || 'error')
			.trim()
			.toLowerCase();
		const level: 'error' | 'warn' | 'fatal' = rawLevel === 'warn' || rawLevel === 'warning' ? 'warn' : rawLevel === 'fatal' || rawLevel === 'critical' ? 'fatal' : 'error';

		const message =
			String(body.message || 'Unknown error')
				.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
				.trim()
				.slice(0, 4000) || 'Unknown error';
		const stack = body.stack
			? String(body.stack)
					.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
					.slice(0, 16000)
			: null;
		const filepath = body.filepath ? String(body.filepath).slice(0, 500) : extractFilepathFromStack(stack);
		const meta = body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta) ? body.meta : {};

		const fingerprintSource = `${service}:${environment}:${level}:${message.slice(0, 300)}:${filepath || ''}`;
		const fingerprint = crypto.createHash('sha256').update(fingerprintSource).digest('hex');
		const now = new Date();

		const doc = await ErrorLogModel.findOneAndUpdate(
			{ fingerprint, resolved: false },
			{
				$inc: { occurrences: 1 },
				$set: {
					lastSeenAt: now,
					...(stack ? { stack } : {}),
					...(filepath ? { filepath } : {}),
					...(Object.keys(meta).length > 0 ? { meta } : {}),
				},
				$setOnInsert: {
					id: crypto.randomUUID(),
					service,
					environment,
					level,
					message,
					firstSeenAt: now,
					resolved: false,
				},
			},
			{
				upsert: true,
				returnDocument: 'after',
			}
		).lean();

		return NextResponse.json({ data: doc }, { status: 201 });
	} catch (error) {
		console.error('Failed to record error log:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PATCH(req: Request) {
	try {
		const caller = await resolveCallerAuth(req, ['access', 'hosting']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Staff access permission required.' }, { status: caller.authenticated ? 403 : 401 });
		}

		const body = await req.json().catch(() => null);
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
		}

		const db = await database('xernerx');
		const ErrorLogModel = (db.models.core as any)?.ErrorLog;
		if (!ErrorLogModel) {
			return NextResponse.json({ error: 'ErrorLog model unavailable' }, { status: 500 });
		}

		const resolved = body.resolved !== false;
		const now = new Date();

		if (body.all) {
			const filter: Record<string, any> = {};
			if (body.service) {
				const services = String(body.service)
					.split(',')
					.map((s) => s.trim().toLowerCase())
					.filter(Boolean);
				if (services.length > 0) filter.service = { $in: services };
			}
			await ErrorLogModel.updateMany(filter, {
				$set: {
					resolved,
					resolvedAt: resolved ? now : null,
					resolvedBy: resolved ? caller.userId : null,
				},
			});
			return NextResponse.json({ success: true });
		}

		if (!body.id) {
			return NextResponse.json({ error: 'Missing error log id' }, { status: 400 });
		}

		const updated = await ErrorLogModel.findOneAndUpdate(
			{ id: String(body.id) },
			{
				$set: {
					resolved,
					resolvedAt: resolved ? now : null,
					resolvedBy: resolved ? caller.userId : null,
				},
			},
			{ returnDocument: 'after' }
		).lean();

		if (!updated) {
			return NextResponse.json({ error: 'Error log not found' }, { status: 404 });
		}

		return NextResponse.json({ data: updated });
	} catch (error) {
		console.error('Failed to update error log:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: Request) {
	try {
		const caller = await resolveCallerAuth(req, ['access', 'hosting']);
		if (!caller.authorized) {
			return NextResponse.json({ error: 'Forbidden: Staff access permission required.' }, { status: caller.authenticated ? 403 : 401 });
		}

		const db = await database('xernerx');
		const ErrorLogModel = (db.models.core as any)?.ErrorLog;
		if (!ErrorLogModel) {
			return NextResponse.json({ error: 'ErrorLog model unavailable' }, { status: 500 });
		}

		const url = new URL(req.url);
		const id = url.searchParams.get('id');
		const all = url.searchParams.get('all') === 'true';
		const serviceParam = url.searchParams.get('service');
		const resolvedOnly = url.searchParams.get('resolvedOnly') === 'true';

		if (all) {
			const filter: Record<string, any> = {};
			if (serviceParam) {
				const services = serviceParam
					.split(',')
					.map((s) => s.trim().toLowerCase())
					.filter(Boolean);
				if (services.length > 0) filter.service = { $in: services };
			}
			if (resolvedOnly) {
				filter.resolved = true;
			}
			const res = await ErrorLogModel.deleteMany(filter);
			return NextResponse.json({ success: true, deletedCount: res.deletedCount || 0 });
		}

		if (!id) {
			return NextResponse.json({ error: 'Missing error log id' }, { status: 400 });
		}

		await ErrorLogModel.findOneAndDelete({ id });
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Failed to delete error log:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
