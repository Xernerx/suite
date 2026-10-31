/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@xernerx/lib/server';
import { getSuiteVersionsMap, SUITE_APPS } from '@/lib/suiteVersions';

export const dynamic = 'force-dynamic';

async function verifyHostingStaff(userId: string) {
	if (!userId) return { allowed: false, user: null, models: null, status: 401, error: 'Unauthorized: Missing userId' };
	const { models } = await database('xernerx');
	const user = (await models.users.User.findOne({ id: userId }).lean()) as any;
	if (!user) return { allowed: false, user: null, models, status: 404, error: 'User not found' };

	const userRoles: string[] = Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : [];
	const roles = userRoles.length > 0 ? await models.core.Role.find({ id: { $in: userRoles } }).lean() : [];
	const hasAccess = roles.some((r: any) => Boolean(r?.permissions?.hosting || r?.permissions?.access));
	if (!hasAccess) {
		return { allowed: false, user, models, status: 403, error: 'Forbidden: Missing server hosting permission' };
	}
	return { allowed: true, user, models, status: 200, error: null };
}

function buildVercelQuery(teamId?: string, teamSlug?: string, extraParams: Record<string, string | number> = {}): string {
	const params = new URLSearchParams();
	for (const [k, v] of Object.entries(extraParams)) {
		params.set(k, String(v));
	}
	if (teamId && teamId.startsWith('team_')) {
		params.set('teamId', teamId);
	} else if (teamSlug && !teamSlug.includes('@')) {
		params.set('slug', teamSlug);
	}
	const qs = params.toString();
	return qs ? `?${qs}` : '';
}

async function fetchVercelEndpoint(path: string, token: string, teamId?: string, teamSlug?: string, extraParams: Record<string, string | number> = {}) {
	const headers = {
		Authorization: `Bearer ${token}`,
		Accept: 'application/json',
	};

	const withTeamQs = buildVercelQuery(teamId, teamSlug, extraParams);
	const res = await fetch(`https://api.vercel.com${path}${withTeamQs}`, {
		headers,
		signal: AbortSignal.timeout(6000),
		cache: 'no-store',
	}).catch(() => null);

	if (res && res.ok) {
		return res.json().catch(() => null);
	}

	// If teamSlug/teamId failed (e.g. personal account username entered in team field), retry without team scope
	if (teamId || teamSlug) {
		const fallbackQs = buildVercelQuery(undefined, undefined, extraParams);
		const retryRes = await fetch(`https://api.vercel.com${path}${fallbackQs}`, {
			headers,
			signal: AbortSignal.timeout(6000),
			cache: 'no-store',
		}).catch(() => null);
		if (retryRes && retryRes.ok) {
			return retryRes.json().catch(() => null);
		}
	}

	return null;
}

export async function GET(req: NextRequest) {
	try {
		const userId = String(req.nextUrl.searchParams.get('userId') || '').trim();
		const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true';

		const authCheck = await verifyHostingStaff(userId);
		if (!authCheck.allowed) {
			return NextResponse.json({ ok: false, error: authCheck.error }, { status: authCheck.status });
		}

		const user = authCheck.user;
		const connections: any[] = Array.isArray(user.connections) ? user.connections : [];
		const vercelConn = connections.find((c: any) => c.provider === 'vercel') || null;

		const token = String(vercelConn?.token || process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN || '').trim();
		const teamId = String(vercelConn?.secret || process.env.VERCEL_TEAM_ID || 'team_gnRP1qRvMVSecUcGXBzPptK1').trim();
		const teamSlug = String(vercelConn?.username || process.env.VERCEL_TEAM_SLUG || 'xernerx').trim();

		const [versionsMap, vercelUserRes, projectsRes, deploymentsRes] = await Promise.all([
			getSuiteVersionsMap(forceRefresh).catch(() => ({}) as Record<string, any>),
			token ? fetchVercelEndpoint('/v2/user', token) : Promise.resolve(null),
			token ? fetchVercelEndpoint('/v9/projects', token, teamId, teamSlug, { limit: 30 }) : Promise.resolve(null),
			token ? fetchVercelEndpoint('/v6/deployments', token, teamId, teamSlug, { limit: 25 }) : Promise.resolve(null),
		]);

		const rawProjects: any[] = Array.isArray(projectsRes?.projects) ? projectsRes.projects : [];
		const rawDeployments: any[] = Array.isArray(deploymentsRes?.deployments) ? deploymentsRes.deployments : [];

		const projects = rawProjects.map((p: any) => ({
			id: p.id,
			name: p.name,
			framework: p.framework || 'nextjs',
			nodeVersion: p.nodeVersion || '20.x',
			updatedAt: p.updatedAt || null,
			repo: p.link?.repo ? `${p.link.org || ''}/${p.link.repo}`.replace(/^\//, '') : null,
			productionUrl: p.targets?.production?.alias?.[0] ? `https://${p.targets.production.alias[0]}` : null,
			latestState: p.targets?.production?.readyState || p.latestDeployments?.[0]?.readyState || null,
		}));

		const deployments = rawDeployments.map((d: any) => ({
			id: d.uid || d.id,
			name: d.name,
			url: d.url ? `https://${d.url}` : null,
			inspectorUrl: d.inspectorUrl || null,
			state: d.readyState || d.state || 'UNKNOWN',
			target: d.target || 'preview',
			createdAt: d.createdAt || d.created || null,
			readyAt: d.ready || null,
			buildingAt: d.buildingAt || null,
			branch: d.meta?.githubCommitRef || d.meta?.gitlabCommitRef || 'main',
			commitSha: (d.meta?.githubCommitSha || d.meta?.gitlabCommitSha || '').slice(0, 7) || null,
			commitMessage: d.meta?.githubCommitMessage || d.meta?.gitlabCommitMessage || null,
			author: d.meta?.githubCommitAuthorName || d.creator?.username || null,
		}));

		const suiteApps = SUITE_APPS.map((app) => {
			const vInfo = versionsMap[app.id];
			const matchedProject =
				projects.find(
					(p) =>
						p.name.toLowerCase() === app.id.toLowerCase() ||
						p.name.toLowerCase() === `xernerx-${app.id.toLowerCase()}` ||
						p.name.toLowerCase() === `suite-${app.id.toLowerCase()}` ||
						(p.productionUrl && p.productionUrl.includes(app.domain))
				) || null;
			const latestDeployment =
				deployments.find(
					(d) =>
						d.name.toLowerCase() === app.id.toLowerCase() ||
						d.name.toLowerCase() === `xernerx-${app.id.toLowerCase()}` ||
						d.name.toLowerCase() === `suite-${app.id.toLowerCase()}` ||
						(matchedProject && d.name.toLowerCase() === matchedProject.name.toLowerCase())
				) || null;

			return {
				id: app.id,
				name: app.name,
				domain: app.domain,
				canaryDomain: `${app.id}.canary.xernerx.com`,
				devPort: app.devPort,
				prodVersion: vInfo?.prodVersion || null,
				canaryVersion: vInfo?.canaryVersion || null,
				devVersion: vInfo?.devVersion || null,
				prodLatencyMs: vInfo?.prodLatencyMs ?? null,
				canaryLatencyMs: vInfo?.canaryLatencyMs ?? null,
				devLatencyMs: vInfo?.devLatencyMs ?? null,
				project: matchedProject,
				latestDeployment,
			};
		});

		const vercelUser = vercelUserRes?.user
			? {
					id: vercelUserRes.user.id || vercelUserRes.user.uid,
					username: vercelUserRes.user.username,
					email: vercelUserRes.user.email,
					name: vercelUserRes.user.name,
				}
			: null;

		return NextResponse.json({
			ok: true,
			connected: Boolean(token),
			tokenValid: Boolean(vercelUser || rawProjects.length > 0 || rawDeployments.length > 0),
			connection: vercelConn
				? {
						username: vercelConn.username || '',
						teamId: vercelConn.secret || '',
						hasToken: Boolean(vercelConn.token),
					}
				: null,
			vercelUser,
			projects,
			deployments,
			suiteApps,
		});
	} catch (err: any) {
		return NextResponse.json({ ok: false, error: err?.message || 'Failed to load Vercel hosting status' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => ({}));
		const userId = String(body.userId || '').trim();
		const action = String(body.action || '').trim();

		const authCheck = await verifyHostingStaff(userId);
		if (!authCheck.allowed || !authCheck.models) {
			return NextResponse.json({ ok: false, error: authCheck.error }, { status: authCheck.status });
		}

		const { user, models } = authCheck;
		const existingConnections: any[] = Array.isArray(user.connections) ? user.connections : [];
		const existingVercel = existingConnections.find((c: any) => c.provider === 'vercel') || null;

		if (action === 'saveCredentials') {
			if (body.disconnect) {
				const filtered = existingConnections.filter((c: any) => c.provider !== 'vercel');
				await models.users.User.findOneAndUpdate({ id: userId }, { $set: { connections: filtered } });
				return NextResponse.json({ ok: true, connected: false, connection: null });
			}

			const username = String(body.username ?? existingVercel?.username ?? 'vercel').trim() || 'vercel';
			const teamId = body.teamId !== undefined ? String(body.teamId).trim() : existingVercel?.secret || '';
			const apiToken = body.apiToken !== undefined ? String(body.apiToken).trim() : existingVercel?.token || '';

			if (!apiToken) {
				return NextResponse.json({ ok: false, error: 'Vercel Access Token is required' }, { status: 400 });
			}

			const newConn = {
				provider: 'vercel',
				id: username.toLowerCase(),
				username,
				displayName: username,
				secret: teamId,
				token: apiToken,
				showOnProfile: false,
				connectedAt: existingVercel?.connectedAt || new Date(),
			};

			const updatedConnections = [...existingConnections.filter((c: any) => c.provider !== 'vercel'), newConn];
			await models.users.User.findOneAndUpdate({ id: userId }, { $set: { connections: updatedConnections } });

			return NextResponse.json({
				ok: true,
				connected: true,
				connection: {
					username: newConn.username,
					teamId: newConn.secret,
					hasToken: Boolean(newConn.token),
				},
			});
		}

		if (action === 'redeploy') {
			const token = String(existingVercel?.token || process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN || '').trim();
			const teamId = String(existingVercel?.secret || process.env.VERCEL_TEAM_ID || 'team_gnRP1qRvMVSecUcGXBzPptK1').trim();
			const teamSlug = String(existingVercel?.username || process.env.VERCEL_TEAM_SLUG || 'xernerx').trim();

			if (!token) {
				return NextResponse.json({ ok: false, error: 'Please link a Vercel Access Token before triggering a redeploy.' }, { status: 400 });
			}

			const deploymentId = String(body.deploymentId || '').trim();
			const name = String(body.name || '').trim();
			const target = body.target === 'production' ? 'production' : undefined;

			if (!deploymentId || !name) {
				return NextResponse.json({ ok: false, error: 'Missing deploymentId or project name' }, { status: 400 });
			}

			const qs = buildVercelQuery(teamId, teamSlug, { forceNew: 1 });
			const res = await fetch(`https://api.vercel.com/v13/deployments${qs}`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name,
					deploymentId,
					...(target ? { target } : {}),
				}),
				signal: AbortSignal.timeout(10000),
			});

			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				return NextResponse.json({ ok: false, error: data?.error?.message || 'Vercel redeploy request failed' }, { status: res.status });
			}

			return NextResponse.json({
				ok: true,
				deployment: {
					id: data.id || data.uid,
					name: data.name,
					url: data.url ? `https://${data.url}` : null,
					inspectorUrl: data.inspectorUrl || null,
					state: data.readyState || data.state || 'BUILDING',
				},
			});
		}

		return NextResponse.json({ ok: false, error: 'Unsupported action' }, { status: 400 });
	} catch (err: any) {
		return NextResponse.json({ ok: false, error: err?.message || 'Vercel action failed' }, { status: 500 });
	}
}
