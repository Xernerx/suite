/** @format */

import { exec, execFile, execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

function loadLocalEnvFallback() {
	const envPath = path.join(ROOT_DIR, '.env');
	if (!fs.existsSync(envPath)) return;
	for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
		const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
		if (!m) continue;
		const key = m[1];
		if (!['VERCEL_TOKEN', 'VERCEL_TEAM_ID', 'VERCEL_ORG_ID', 'GITHUB_TOKEN', 'GH_TOKEN', 'GITHUB_PAT', 'CANARY_VERIFIER_SECRET'].includes(key)) continue;
		if (!process.env[key]) {
			process.env[key] = m[2].replace(/^['"]|['"]$/g, '');
		}
	}
}

loadLocalEnvFallback();

const SUITE_CANARY_APPS = ['www', 'api', 'cdn', 'account', 'app', 'docs', 'admin', 'info', 'store', 'portal', 'hosting', 'haste', 'blog'];
const MAX_ALLOWED_5XX = Number(process.env.CANARY_MAX_5XX ?? '0');
const MAX_ALLOWED_FATAL = Number(process.env.CANARY_MAX_FATAL ?? '0');
const FAIL_ON_RUNTIME_ERROR = process.env.CANARY_FAIL_ON_RUNTIME_ERROR === 'true';

function flattenStrings(obj, prefix = '', out = {}) {
	for (const [k, v] of Object.entries(obj || {})) {
		const p = prefix ? `${prefix}.${k}` : k;
		if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
			flattenStrings(v, p, out);
		} else if (typeof v === 'string') {
			out[p] = v;
		}
	}
	return out;
}

function extractPlaceholders(str) {
	const matches = [...String(str).matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1]);
	return [...new Set(matches)].sort();
}

function execGit(args) {
	try {
		return execFileSync('git', args, { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch {
		return '';
	}
}

function resolveGitHubRepo() {
	if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY.includes('/')) {
		return process.env.GITHUB_REPOSITORY.trim();
	}
	const remote = execGit(['remote', 'get-url', 'origin']);
	const match = remote.match(/github\.com[:/]([^/]+\/[^/.]+?)(?:\.git)?$/i);
	return match ? match[1] : 'Xernerx/suite';
}

function resolveCanarySha() {
	if (process.env.CANARY_SHA?.trim()) return process.env.CANARY_SHA.trim();
	return execGit(['rev-parse', 'origin/canary']) || execGit(['rev-parse', 'canary']) || execGit(['rev-parse', 'HEAD']);
}

function resolveSoakStartIso() {
	const now = Date.now();
	const maxWindowMs = 23 * 60 * 60 * 1000; // Stay safely inside Vercel Pro's strict 1-day (24h) runtime-log retention boundary
	let commitEpochSec = Number(process.env.CANARY_COMMIT_EPOCH || '0');
	if (!commitEpochSec) {
		const raw = execGit(['log', '-1', '--format=%ct', 'origin/canary']) || execGit(['log', '-1', '--format=%ct', 'canary']);
		commitEpochSec = Number(raw || '0');
	}
	if (commitEpochSec > 0) {
		const commitMs = commitEpochSec * 1000;
		const clampedMs = Math.max(commitMs, now - maxWindowMs);
		if (clampedMs < now - 60_000) {
			return new Date(clampedMs).toISOString();
		}
	}
	return new Date(now - maxWindowMs).toISOString();
}

function verifyLocalDictionaries() {
	const dictDir = path.join(ROOT_DIR, 'packages/lib/src/dictionaries');
	const enPath = path.join(dictDir, 'en-GB.json');
	if (!fs.existsSync(enPath)) {
		throw new Error(`Missing primary dictionary: ${enPath}`);
	}

	const enRaw = fs.readFileSync(enPath, 'utf8');
	const enObj = JSON.parse(enRaw);
	const enFlat = flattenStrings(enObj);

	const files = fs.readdirSync(dictDir).filter((f) => f.endsWith('.json'));
	const placeholderMismatches = [];

	for (const file of files) {
		const fullPath = path.join(dictDir, file);
		let parsed;
		try {
			parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
		} catch (err) {
			throw new Error(`Invalid JSON in dictionary ${file}: ${err.message}`, { cause: err });
		}

		if (file === 'en-GB.json') continue;

		const flat = flattenStrings(parsed);
		for (const [keyPath, val] of Object.entries(flat)) {
			if (keyPath.startsWith('metadata.')) continue;
			const enVal = enFlat[keyPath];
			if (typeof enVal !== 'string') continue;

			const expectedVars = extractPlaceholders(enVal);
			const actualVars = extractPlaceholders(val);
			const unknownVars = actualVars.filter((v) => !expectedVars.includes(v));
			if (unknownVars.length > 0) {
				placeholderMismatches.push(`${file} -> ${keyPath}: unknown placeholder(s) {${unknownVars.join('}, {')}} (expected: ${expectedVars.map((v) => `{${v}}`).join(', ') || 'none'})`);
			}
		}
	}

	if (placeholderMismatches.length > 0) {
		throw new Error(`Dictionary placeholder validation failed:\n  - ${placeholderMismatches.slice(0, 15).join('\n  - ')}`);
	}

	console.log(`✅ [1/5] Dictionary Integrity Passed (${files.length} locale files, ${Object.keys(enFlat).length} source keys verified)`);
}

async function fetchJson(url, headers = {}, timeoutMs = 15000) {
	const res = await fetch(url, {
		method: 'GET',
		headers: {
			'User-Agent': 'Xernerx-Canary-Verifier/2.0',
			Accept: 'application/json',
			...headers,
		},
		signal: AbortSignal.timeout(timeoutMs),
	});
	const text = await res.text();
	let json = null;
	try {
		json = text ? JSON.parse(text) : null;
	} catch {}
	return { ok: res.ok, status: res.status, json, text };
}

async function verifyGitHubCommitReadiness() {
	const repo = resolveGitHubRepo();
	const sha = resolveCanarySha();
	const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT || '';

	if (!sha) {
		throw new Error('Unable to resolve origin/canary commit SHA for GitHub status verification.');
	}

	const headers = {
		'X-GitHub-Api-Version': '2022-11-28',
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};

	const [statusRes, checksRes, deploymentsRes] = await Promise.all([
		fetchJson(`https://api.github.com/repos/${repo}/commits/${sha}/status`, headers),
		fetchJson(`https://api.github.com/repos/${repo}/commits/${sha}/check-runs?filter=latest&per_page=100`, headers),
		fetchJson(`https://api.github.com/repos/${repo}/deployments?sha=${sha}&per_page=100`, headers),
	]);

	if (!statusRes.ok && (statusRes.status === 401 || statusRes.status === 403 || statusRes.status === 404) && !token) {
		console.log(`⚠️ [2/5] GitHub Commit Status Gate skipped (no GITHUB_TOKEN set for private repo ${repo})`);
		return;
	}

	const failures = [];

	// 1. Classic commit statuses (Vercel posts one status per project here)
	let statusCount = 0;
	if (statusRes.ok && statusRes.json) {
		const statuses = Array.isArray(statusRes.json.statuses) ? statusRes.json.statuses : [];
		statusCount = statuses.length;
		for (const st of statuses) {
			if (st.state === 'failure' || st.state === 'error' || st.state === 'pending') {
				failures.push(`Commit status "${st.context}" is ${st.state}${st.description ? ` (${st.description})` : ''}`);
			}
		}
	} else {
		failures.push(`Failed to fetch GitHub commit statuses (HTTP ${statusRes.status})`);
	}

	// 2. Check runs (GitHub Actions & Vercel App checks)
	let checkCount = 0;
	if (checksRes.ok && checksRes.json) {
		const runs = Array.isArray(checksRes.json.check_runs) ? checksRes.json.check_runs : [];
		const currentRunId = Number(process.env.GITHUB_RUN_ID || '0');
		for (const run of runs) {
			// Skip self if manually dispatched directly on canary
			if (currentRunId && run.details_url && run.details_url.includes(`/runs/${currentRunId}`)) continue;
			checkCount++;
			if (run.status !== 'completed') {
				failures.push(`Check run "${run.name}" is still ${run.status}`);
			} else if (!['success', 'neutral', 'skipped'].includes(run.conclusion)) {
				failures.push(`Check run "${run.name}" concluded with "${run.conclusion}"`);
			}
		}
	} else if (checksRes.status !== 403) {
		failures.push(`Failed to fetch GitHub check runs (HTTP ${checksRes.status})`);
	}

	// 3. GitHub Deployments for this exact SHA (Vercel environment deploys)
	let deployCount = 0;
	if (deploymentsRes.ok && Array.isArray(deploymentsRes.json)) {
		const latestByEnv = new Map();
		for (const dep of deploymentsRes.json) {
			const envKey = dep.environment || String(dep.id);
			if (!latestByEnv.has(envKey)) {
				latestByEnv.set(envKey, dep);
			}
		}
		deployCount = latestByEnv.size;
		const depChecks = await Promise.all(
			[...latestByEnv.values()].map(async (dep) => {
				const stRes = await fetchJson(`https://api.github.com/repos/${repo}/deployments/${dep.id}/statuses?per_page=1`, headers);
				if (!stRes.ok || !Array.isArray(stRes.json) || stRes.json.length === 0) return null;
				const latest = stRes.json[0];
				if (['failure', 'error', 'in_progress', 'queued', 'pending'].includes(latest.state)) {
					return `Deployment "${dep.environment || dep.id}" is ${latest.state}${latest.description ? ` (${latest.description})` : ''}`;
				}
				return null;
			})
		);
		for (const f of depChecks) {
			if (f) failures.push(f);
		}
	}

	if (failures.length > 0) {
		throw new Error(`GitHub CI & Vercel deployment readiness failed for canary@${sha.slice(0, 7)}:\n  - ${failures.join('\n  - ')}`);
	}

	console.log(`✅ [2/5] GitHub CI & Deployment Statuses Passed for canary@${sha.slice(0, 7)} (${statusCount} statuses, ${checkCount} checks, ${deployCount} deployments)`);
}

function findVercelExecutable() {
	const probe = spawnSync('vercel', ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' });
	if (probe.status === 0) return { cmd: 'vercel', prefixArgs: [] };
	const pnpxProbe = spawnSync('pnpx', ['vercel@latest', '--version'], { encoding: 'utf8', shell: process.platform === 'win32' });
	if (pnpxProbe.status === 0) return { cmd: 'pnpx', prefixArgs: ['vercel@latest'] };
	return { cmd: 'npx', prefixArgs: ['-y', 'vercel@latest'] };
}

function parseJsonLines(stdout) {
	const records = [];
	const warnings = [];
	let summary = null;
	let cliError = null;

	for (const rawLine of String(stdout || '').split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || !line.startsWith('{')) continue;
		try {
			const obj = JSON.parse(line);
			if (obj.type === 'log' || obj.type === 'request') {
				records.push(obj.data || obj);
			} else if (obj.type === 'warning') {
				warnings.push(obj.message || obj.data?.message || JSON.stringify(obj));
			} else if (obj.type === 'summary') {
				summary = obj.data || obj;
			} else if (obj.status === 'error' || obj.error) {
				cliError = obj;
			}
		} catch {}
	}

	return { records, warnings, summary, cliError };
}

function quoteWindowsArg(arg) {
	const s = String(arg);
	return /[\s<>&|()^"]/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s;
}

async function runVercelLogsCli(vercelBin, args, env) {
	const fullArgs = [...vercelBin.prefixArgs, ...args];
	try {
		const execOpts = {
			encoding: 'utf8',
			env,
			maxBuffer: 16 * 1024 * 1024,
			timeout: 30000,
		};
		const { stdout, stderr } =
			process.platform === 'win32' ? await execAsync(`${vercelBin.cmd} ${fullArgs.map(quoteWindowsArg).join(' ')}`, execOpts) : await execFileAsync(vercelBin.cmd, fullArgs, execOpts);
		const parsed = parseJsonLines(stdout);
		const combinedError = [parsed.cliError?.message, parsed.cliError?.reason, parsed.cliError?.hint, stderr].filter(Boolean).join(' ').trim();
		return {
			ok: !parsed.cliError,
			status: parsed.cliError ? 1 : 0,
			records: parsed.records,
			warnings: parsed.warnings,
			summary: parsed.summary,
			errorText: combinedError,
		};
	} catch (err) {
		const stdout = err?.stdout || '';
		const stderr = err?.stderr || err?.message || '';
		const parsed = parseJsonLines(stdout);
		const combinedError = [parsed.cliError?.message, parsed.cliError?.reason, parsed.cliError?.hint, stderr].filter(Boolean).join(' ').trim();
		return {
			ok: false,
			status: typeof err?.code === 'number' ? err.code : 1,
			records: parsed.records,
			warnings: parsed.warnings,
			summary: parsed.summary,
			errorText: combinedError,
		};
	}
}

function isEntitlementOrPlanLimitError(text) {
	return /observability plus|payment_required|\b402\b|entitlement|upgrade|plan does not|not available on your plan|pro plan|enterprise|forbidden|\b403\b/i.test(String(text || ''));
}

function isRetentionLimitError(text) {
	return /retention|does not retain|time range|too old|exceeds.*window|start time|max.*window|1 hour|24 hours|1 day/i.test(String(text || ''));
}

async function resolveVercelTeamId(token) {
	if (process.env.VERCEL_TEAM_ID?.trim()) return process.env.VERCEL_TEAM_ID.trim();
	if (process.env.VERCEL_ORG_ID?.trim()) return process.env.VERCEL_ORG_ID.trim();

	const teamsRes = await fetchJson('https://api.vercel.com/v2/teams?limit=20', { Authorization: `Bearer ${token}` });
	if (!teamsRes.ok || !Array.isArray(teamsRes.json?.teams) || teamsRes.json.teams.length === 0) {
		return '';
	}
	const teams = teamsRes.json.teams;
	const xernerxTeam = teams.find((t) => /xernerx/i.test(String(t.slug || '')) || /xernerx/i.test(String(t.name || '')));
	if (xernerxTeam?.id) return xernerxTeam.id;
	if (teams.length === 1 && teams[0]?.id) return teams[0].id;
	return '';
}

async function verifyVercelSoakErrors({ requireVercelSoak }) {
	const token = process.env.VERCEL_TOKEN?.trim() || '';
	if (!token) {
		if (requireVercelSoak) {
			throw new Error(
				'VERCEL_TOKEN is required for the 24h Vercel soak-error check. Add VERCEL_TOKEN (and optionally VERCEL_TEAM_ID) in GitHub Repository Secrets, or run with skip_vercel_logs=true for an emergency override.'
			);
		}
		console.log('⚠️ [3/5] Vercel 24h Soak-Error Gate skipped (VERCEL_TOKEN not set in environment)');
		return;
	}

	const teamId = await resolveVercelTeamId(token);
	const teamQuery = teamId ? `&teamId=${encodeURIComponent(teamId)}` : '';
	const headers = { Authorization: `Bearer ${token}` };
	const canarySha = resolveCanarySha();
	const soakSinceIso = resolveSoakStartIso();

	// 1. Fetch latest canary branch deployments across all Vercel projects in the team
	const depRes = await fetchJson(`https://api.vercel.com/v6/deployments?branch=canary&limit=100${teamQuery}`, headers, 20000);
	if (!depRes.ok) {
		throw new Error(`Failed to fetch Vercel canary deployments (HTTP ${depRes.status}): ${depRes.text.slice(0, 300)}`);
	}

	const allDeployments = Array.isArray(depRes.json?.deployments) ? depRes.json.deployments : [];
	const expectedRepoName = resolveGitHubRepo().split('/')[1]?.toLowerCase() || 'suite';
	const suiteDeployments = allDeployments.filter((d) => {
		const depRepo = String(d.meta?.githubRepo || '').toLowerCase();
		return !depRepo || depRepo === expectedRepoName;
	});
	if (suiteDeployments.length === 0) {
		throw new Error('No Vercel deployments found on branch "canary". Refusing to promote an undeployed canary.');
	}

	// Keep the latest deployment per project on branch=canary, and inspect any failed deploys for CANARY_SHA
	const latestByProject = new Map();
	const deploymentFailures = [];

	for (const d of suiteDeployments) {
		const deployId = d.uid || d.id;
		const projectKey = d.projectId || d.name || deployId;
		const state = String(d.readyState || d.state || '').toUpperCase();
		const commitSha = d.meta?.githubCommitSha || '';

		if (!latestByProject.has(projectKey)) {
			latestByProject.set(projectKey, d);
			if (state !== 'READY') {
				deploymentFailures.push(`${d.name || projectKey} latest canary deploy (${deployId}) is ${state}`);
			}
		} else if (canarySha && commitSha === canarySha && ['ERROR', 'BUILDING', 'INITIALIZING', 'QUEUED'].includes(state)) {
			deploymentFailures.push(`${d.name || projectKey} deploy for canary@${canarySha.slice(0, 7)} (${deployId}) is ${state}`);
		}
	}

	if (deploymentFailures.length > 0) {
		throw new Error(`Vercel canary deployment check failed:\n  - ${deploymentFailures.join('\n  - ')}`);
	}

	const activeDeployments = [...latestByProject.values()].filter((d) => String(d.readyState || d.state || '').toUpperCase() === 'READY');
	const vercelBin = findVercelExecutable();
	const cliEnv = { ...process.env, VERCEL_TOKEN: token, CI: '1' };
	const scopeArgs = teamId ? ['--scope', teamId] : [];

	const totalFindings = {
		http5xx: [],
		fatalLogs: [],
		runtimeErrorCount: 0,
		retentionNotes: new Set(),
		entitlementNotes: new Set(),
		checkedApps: [],
	};

	const concurrency = 4;
	const queue = [...activeDeployments];

	async function inspectDeployment(dep) {
		const projectName = dep.name || dep.projectId;
		const projectId = dep.projectId || dep.name;
		const deploymentId = dep.uid || dep.id;

		// Only inspect logs since the deployment actually went live (or soakSinceIso, whichever is later)
		const deployCreatedMs = Number(dep.ready || dep.createdAt || dep.created || 0);
		const sinceMs = Math.max(Date.parse(soakSinceIso), deployCreatedMs > 0 ? deployCreatedMs : 0);
		const sinceIso = new Date(Math.min(sinceMs, Date.now() - 60_000)).toISOString();

		// A. Check CDN HTTP 5xx request records over the soak window
		let reqResult = await runVercelLogsCli(
			vercelBin,
			[
				'logs',
				'requests',
				'--project',
				projectId,
				'--deployment',
				deploymentId,
				'--since',
				sinceIso,
				'--query',
				'httpStatus >= 500 AND httpStatus < 600',
				'--limit',
				'50',
				'--json',
				'--non-interactive',
				...scopeArgs,
			],
			cliEnv
		);

		if (!reqResult.ok && isRetentionLimitError(reqResult.errorText)) {
			totalFindings.retentionNotes.add('CDN request log window capped by plan retention (retried with --since 1h)');
			reqResult = await runVercelLogsCli(
				vercelBin,
				[
					'logs',
					'requests',
					'--project',
					projectId,
					'--deployment',
					deploymentId,
					'--since',
					'1h',
					'--query',
					'httpStatus >= 500 AND httpStatus < 600',
					'--limit',
					'50',
					'--json',
					'--non-interactive',
					...scopeArgs,
				],
				cliEnv
			);
		}

		if (reqResult.ok) {
			for (const rec of reqResult.records) {
				const code = Number(rec.httpStatus ?? rec.statusCode ?? rec.responseStatusCode ?? 0);
				if (code >= 500 && code < 600) {
					totalFindings.http5xx.push({
						project: projectName,
						status: code,
						method: rec.requestMethod || rec.method || 'GET',
						path: rec.requestPath || rec.route || rec.path || '/',
						requestId: rec.requestId || '',
						timestamp: rec.timestamp || rec.timestampInMs || '',
					});
				}
			}
		} else if (isEntitlementOrPlanLimitError(reqResult.errorText)) {
			totalFindings.entitlementNotes.add(`logs requests unavailable on current Vercel plan (${reqResult.errorText.slice(0, 140)})`);
		} else if (reqResult.errorText) {
			throw new Error(`Vercel request log query failed for ${projectName}: ${reqResult.errorText.slice(0, 260)}`);
		}

		// B. Check runtime fatal crashes & error logs over the soak window
		let runtimeResult = await runVercelLogsCli(
			vercelBin,
			[
				'logs',
				'runtime',
				'--project',
				projectId,
				'--deployment',
				deploymentId,
				'--since',
				sinceIso,
				'--query',
				'level:(fatal OR error)',
				'--limit',
				'50',
				'--json',
				'--non-interactive',
				...scopeArgs,
			],
			cliEnv
		);

		if (!runtimeResult.ok && isRetentionLimitError(runtimeResult.errorText)) {
			totalFindings.retentionNotes.add('Runtime log window capped by plan retention (retried with --since 1h)');
			runtimeResult = await runVercelLogsCli(
				vercelBin,
				[
					'logs',
					'runtime',
					'--project',
					projectId,
					'--deployment',
					deploymentId,
					'--since',
					'1h',
					'--query',
					'level:(fatal OR error)',
					'--limit',
					'50',
					'--json',
					'--non-interactive',
					...scopeArgs,
				],
				cliEnv
			);
		}

		let appFatalCount = 0;
		let appErrorCount = 0;

		if (runtimeResult.ok) {
			for (const rec of runtimeResult.records) {
				const level = String(rec.level || '').toLowerCase();
				const statusCode = Number(rec.responseStatusCode ?? rec.httpStatus ?? rec.statusCode ?? 0);
				const msg = String(rec.message || '')
					.replace(/\s+/g, ' ')
					.trim()
					.slice(0, 180);

				if (level === 'fatal') {
					appFatalCount++;
					totalFindings.fatalLogs.push({
						project: projectName,
						path: rec.requestPath || '/',
						status: statusCode || null,
						message: msg || 'Fatal runtime crash',
						timestamp: rec.timestamp || rec.timestampInMs || '',
					});
				} else if (level === 'error') {
					appErrorCount++;
					totalFindings.runtimeErrorCount++;
					// If request logs were unavailable due to plan entitlement, still catch 5xx tagged in runtime logs
					if (statusCode >= 500 && statusCode < 600 && !reqResult.ok) {
						totalFindings.http5xx.push({
							project: projectName,
							status: statusCode,
							method: rec.requestMethod || 'GET',
							path: rec.requestPath || '/',
							requestId: rec.requestId || '',
							timestamp: rec.timestamp || rec.timestampInMs || '',
						});
					}
					if (FAIL_ON_RUNTIME_ERROR) {
						totalFindings.fatalLogs.push({
							project: projectName,
							path: rec.requestPath || '/',
							status: statusCode || null,
							message: `[error] ${msg || 'Runtime error'}`,
							timestamp: rec.timestamp || rec.timestampInMs || '',
						});
					}
				}
			}
		} else if (isEntitlementOrPlanLimitError(runtimeResult.errorText)) {
			totalFindings.entitlementNotes.add(`logs runtime unavailable on current Vercel plan (${runtimeResult.errorText.slice(0, 140)})`);
		} else if (runtimeResult.errorText) {
			throw new Error(`Vercel runtime log query failed for ${projectName}: ${runtimeResult.errorText.slice(0, 260)}`);
		}

		const app5xx = totalFindings.http5xx.filter((e) => e.project === projectName).length;
		totalFindings.checkedApps.push({ project: projectName, deploymentId, app5xx, appFatalCount, appErrorCount });
	}

	const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
		while (queue.length > 0) {
			const next = queue.shift();
			if (next) await inspectDeployment(next);
		}
	});
	await Promise.all(workers);

	for (const app of totalFindings.checkedApps.toSorted((a, b) => a.project.localeCompare(b.project))) {
		console.log(`   • ${app.project.padEnd(18)} (${app.deploymentId.slice(0, 12)}) -> 5xx=${app.app5xx}, fatal=${app.appFatalCount}, stderr/error=${app.appErrorCount}`);
	}
	for (const note of totalFindings.retentionNotes) {
		console.log(`   ℹ️ ${note}`);
	}
	for (const note of totalFindings.entitlementNotes) {
		console.log(`   ℹ️ ${note}`);
	}

	const soakErrors = [];
	if (totalFindings.http5xx.length > MAX_ALLOWED_5XX) {
		const samples = totalFindings.http5xx.slice(0, 10).map((e) => `[${e.project}] HTTP ${e.status} ${e.method} ${e.path}${e.requestId ? ` (req=${e.requestId})` : ''}`);
		soakErrors.push(`Detected ${totalFindings.http5xx.length} HTTP 5xx error(s) during soak (max allowed: ${MAX_ALLOWED_5XX}):\n    - ${samples.join('\n    - ')}`);
	}
	if (totalFindings.fatalLogs.length > MAX_ALLOWED_FATAL) {
		const samples = totalFindings.fatalLogs.slice(0, 10).map((e) => `[${e.project}] ${e.path}${e.status ? ` (HTTP ${e.status})` : ''}: ${e.message}`);
		soakErrors.push(`Detected ${totalFindings.fatalLogs.length} fatal runtime crash(es) during soak (max allowed: ${MAX_ALLOWED_FATAL}):\n    - ${samples.join('\n    - ')}`);
	}

	if (soakErrors.length > 0) {
		throw new Error(`Vercel soak-error gate failed:\n  - ${soakErrors.join('\n  - ')}`);
	}

	console.log(
		`✅ [3/5] Vercel Soak-Error Gate Passed (${activeDeployments.length} READY canary deployments since ${soakSinceIso}: ${totalFindings.http5xx.length} 5xx, ${totalFindings.fatalLogs.length} fatal, ${totalFindings.runtimeErrorCount} non-fatal error logs)`
	);
}

function formatResponseDiagnostics(res) {
	const parts = [];
	if (res.server) parts.push(`server=${res.server}`);
	if (res.cfMitigated) parts.push(`cf-mitigated=${res.cfMitigated}`);
	if (res.cfRay) parts.push(`cf-ray=${res.cfRay}`);
	if (res.vercelMitigated) parts.push(`x-vercel-mitigated=${res.vercelMitigated}`);
	if (res.vercelId) parts.push('reached-vercel=true');
	else if (res.server?.toLowerCase().includes('cloudflare')) parts.push('reached-vercel=false (blocked at Cloudflare edge)');
	return parts.length > 0 ? ` (${parts.join(', ')})` : '';
}

async function fetchWithRetry(url, timeoutMs = 8000, retries = 2) {
	const verifierSecret = process.env.CANARY_VERIFIER_SECRET?.trim() || '';
	const headers = {
		'User-Agent': 'Xernerx-Canary-Verifier/2.0',
		Accept: 'application/json, text/plain, */*',
		...(verifierSecret ? { 'X-Canary-Verifier-Secret': verifierSecret } : {}),
	};

	let lastErr = null;
	for (let attempt = 0; attempt <= retries; attempt++) {
		const start = performance.now();
		try {
			const res = await fetch(url, {
				method: 'GET',
				headers,
				signal: AbortSignal.timeout(timeoutMs),
			});
			const latencyMs = Math.round(performance.now() - start);
			const bodyText = await res.text();
			const vercelId = res.headers.get('x-vercel-id');
			const vercelMitigated = res.headers.get('x-vercel-mitigated');
			const server = res.headers.get('server');
			const cfMitigated = res.headers.get('cf-mitigated');
			const cfRay = res.headers.get('cf-ray');
			if (res.status >= 500 && attempt < retries) {
				await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
				continue;
			}
			return { ok: res.ok, status: res.status, latencyMs, bodyText, vercelId, vercelMitigated, server, cfMitigated, cfRay };
		} catch (err) {
			lastErr = err;
			if (attempt < retries) {
				await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
			}
		}
	}
	throw lastErr || new Error(`Request failed: ${url}`);
}

async function verifyCanarySubdomains() {
	const results = await Promise.all(
		SUITE_CANARY_APPS.map(async (app) => {
			const url = `https://${app}.canary.xernerx.com/api/version`;
			const res = await fetchWithRetry(url, 10000, 2);
			if (res.status === 401 && res.vercelId) {
				return { app, version: 'sso-protected', latencyMs: res.latencyMs };
			}
			if (!res.ok) {
				throw new Error(`[${app}.canary.xernerx.com] returned HTTP ${res.status}${formatResponseDiagnostics(res)}`);
			}
			let parsed;
			try {
				parsed = JSON.parse(res.bodyText);
			} catch {
				throw new Error(`[${app}.canary.xernerx.com] /api/version did not return valid JSON`);
			}
			return { app, version: parsed?.version || 'unknown', latencyMs: res.latencyMs };
		})
	);

	for (const r of results) {
		console.log(`   • ${r.app.padEnd(8)} (${r.app}.canary.xernerx.com) -> v${r.version} (${r.latencyMs}ms)`);
	}
	console.log(`✅ [4/5] All ${results.length} Canary Subdomains Passed Smoke Check`);
}

async function verifyConcurrentStressGate() {
	const endpoints = [
		'https://api.canary.xernerx.com/api/version',
		'https://api.canary.xernerx.com/info/status/bots',
		'https://api.canary.xernerx.com/core/faq?flat=true',
		'https://ws.xernerx.com/health',
		'https://app.canary.xernerx.com/api/version',
		'https://www.canary.xernerx.com/api/version',
	];

	const totalRequests = 24;
	const tasks = Array.from({ length: totalRequests }, (_, idx) => {
		const targetUrl = endpoints[idx % endpoints.length];
		return fetchWithRetry(targetUrl, 10000, 1).then((res) => ({
			url: targetUrl,
			status: res.status,
			ok: res.ok,
			latencyMs: res.latencyMs,
			diagnostics: formatResponseDiagnostics(res),
		}));
	});

	const outcomes = await Promise.all(tasks);
	const serverErrors = outcomes.filter((o) => o.status >= 500 || !o.ok);
	if (serverErrors.length > 0) {
		throw new Error(`Stress gate failed with ${serverErrors.length} error(s): ${serverErrors.map((e) => `${e.url} (HTTP ${e.status}${e.diagnostics})`).join(', ')}`);
	}

	const latencies = outcomes.map((o) => o.latencyMs).toSorted((a, b) => a - b);
	const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
	const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
	const maxLatency = latencies[latencies.length - 1] || 0;

	if (p95 > 9000) {
		throw new Error(`Stress gate p95 latency (${p95}ms) exceeded 9000ms threshold`);
	}

	console.log(`✅ [5/5] Concurrent API & WebSocket Stress Gate Passed (${totalRequests} concurrent requests, 0 errors, p50=${p50}ms, p95=${p95}ms, max=${maxLatency}ms)`);
}

async function main() {
	const localOnly = process.argv.includes('--local-only');
	const requireVercelSoak = process.argv.includes('--require-vercel-soak') || process.env.REQUIRE_VERCEL_SOAK === 'true';
	console.log(localOnly ? '🔍 Running Local Dictionary Integrity Gate...' : '🚀 Running Full Canary Soak-Error, Deployment & Stress Gate...');

	verifyLocalDictionaries();
	if (localOnly) return;

	await verifyGitHubCommitReadiness();
	await verifyVercelSoakErrors({ requireVercelSoak });
	await verifyCanarySubdomains();
	await verifyConcurrentStressGate();
	console.log('🎉 Canary passed all 5 soak, deployment, and live stress gates — ready for promotion!');
}

main().catch((err) => {
	console.error(`❌ Canary verification failed: ${err?.message || err}`);
	process.exit(1);
});
