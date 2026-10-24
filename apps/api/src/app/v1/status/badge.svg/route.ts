/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';

const SETTING_KEY = 'system_status_history_24h';

function computeUptimeFromSeries(series?: Record<string, { status: string; ping: number | null }>): { uptime: number | null; latestPing: number | null; latestStatus: string | null } {
	if (!series || typeof series !== 'object') {
		return { uptime: null, latestPing: null, latestStatus: null };
	}
	const keys = Object.keys(series).sort((a, b) => Number(a) - Number(b));
	if (keys.length === 0) {
		return { uptime: null, latestPing: null, latestStatus: null };
	}
	let up = 0;
	for (const k of keys) {
		const st = series[k]?.status;
		if (st && st !== 'down' && st !== 'offline') {
			up++;
		}
	}
	const latest = series[keys[keys.length - 1]];
	return {
		uptime: Math.round((up / keys.length) * 1000) / 10,
		latestPing: typeof latest?.ping === 'number' ? latest.ping : null,
		latestStatus: latest?.status || null,
	};
}

function escapeXml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function GET(req: NextRequest) {
	const botQuery = req.nextUrl.searchParams.get('bot')?.trim();
	const serviceQuery = req.nextUrl.searchParams.get('service')?.trim()?.toLowerCase();

	let label = 'Xernerx Status';
	let statusText = 'Operational';
	let color = '#10b981';

	try {
		const { models } = await database('xernerx');
		const SettingModel = (models.core as any).Setting;

		if (botQuery) {
			const BotModel = (models.bots as any).Bot;
			const [botDoc, historySetting] = await Promise.all([
				BotModel
					? BotModel.findOne({
							$or: [{ id: botQuery }, { name: { $regex: new RegExp(`^${botQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }],
						})
							.lean()
							.catch(() => null)
					: Promise.resolve(null),
				SettingModel
					? SettingModel.findOne({ id: SETTING_KEY })
							.lean()
							.catch(() => null)
					: Promise.resolve(null),
			]);

			const parsedHistory = historySetting?.value ? JSON.parse(historySetting.value) : null;
			const botId = botDoc?.id ? String(botDoc.id) : botQuery;
			const botName = botDoc?.name ? String(botDoc.name) : botQuery;
			label = `${botName} Status`;

			const stats = computeUptimeFromSeries(parsedHistory?.bots?.[botId]);
			const rawStatus = String(botDoc?.status || stats.latestStatus || (botDoc ? 'online' : 'offline')).toLowerCase();
			const uptimeSuffix = stats.uptime !== null ? ` · ${stats.uptime}%` : '';

			if (rawStatus === 'online') {
				statusText = `Online${uptimeSuffix}`;
				color = '#10b981';
			} else if (rawStatus === 'idle' || rawStatus === 'dnd') {
				statusText = `${rawStatus === 'dnd' ? 'Busy' : 'Idle'}${uptimeSuffix}`;
				color = '#f59e0b';
			} else {
				statusText = `Offline${uptimeSuffix}`;
				color = '#ef4444';
			}
		} else if (serviceQuery) {
			const historySetting = SettingModel
				? await SettingModel.findOne({ id: SETTING_KEY })
						.lean()
						.catch(() => null)
				: null;
			const parsedHistory = historySetting?.value ? JSON.parse(historySetting.value) : null;
			const stats = computeUptimeFromSeries(parsedHistory?.services?.[serviceQuery]);

			label = `Xernerx ${serviceQuery.toUpperCase()}`;
			const pingSuffix = stats.latestPing !== null ? ` · ${stats.latestPing}ms` : stats.uptime !== null ? ` · ${stats.uptime}%` : '';
			const rawStatus = stats.latestStatus || 'operational';

			if (rawStatus === 'operational') {
				statusText = `Operational${pingSuffix}`;
				color = '#10b981';
			} else if (rawStatus === 'degraded') {
				statusText = `Degraded${pingSuffix}`;
				color = '#f59e0b';
			} else {
				statusText = `Down${pingSuffix}`;
				color = '#ef4444';
			}
		} else {
			const activeIssues = await (models.core.Issue as any)
				.countDocuments({
					acknowledged: true,
					status: { $nin: ['resolved', 'closed'] },
				})
				.catch(() => 0);

			if (activeIssues > 0) {
				statusText = `${activeIssues} Active Incident${activeIssues > 1 ? 's' : ''}`;
				color = '#f59e0b';
			}
		}
	} catch {}

	const safeLabel = escapeXml(label);
	const safeStatus = escapeXml(statusText);
	const labelWidth = Math.max(92, Math.round(safeLabel.length * 6.8 + 18));
	const valueWidth = Math.max(82, Math.round(safeStatus.length * 6.8 + 18));
	const totalWidth = Math.round(labelWidth + valueWidth);

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="24" role="img" aria-label="${safeLabel}: ${safeStatus}">
	<title>${safeLabel}: ${safeStatus}</title>
	<clipPath id="r">
		<rect width="${totalWidth}" height="24" rx="6" fill="#fff"/>
	</clipPath>
	<g clip-path="url(#r)">
		<rect width="${labelWidth}" height="24" fill="#18181b"/>
		<rect x="${labelWidth}" width="${valueWidth}" height="24" fill="${color}"/>
	</g>
	<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11" font-weight="600">
		<text x="${Math.round(labelWidth / 2)}" y="16" fill="#e4e4e7">${safeLabel}</text>
		<text x="${Math.round(labelWidth + valueWidth / 2)}" y="16" fill="#ffffff">${safeStatus}</text>
	</g>
</svg>`;

	return new NextResponse(svg, {
		status: 200,
		headers: {
			'Content-Type': 'image/svg+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=120, s-maxage=120',
		},
	});
}
