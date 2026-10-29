/** @format */

import { database, dictionary, locales } from '@xernerx/lib/server';

import { NextResponse } from 'next/server';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';

type Locale = (typeof locales)[number];

export interface TranslationSubmissionRecord {
	language: string;
	canaryVersionAtSubmit: string;
	canaryShaAtSubmit?: string;
	dictionaryCommitSha?: string;
	submittedAt: string;
	submittedBy?: { id: string; name: string };
	unlocked?: boolean;
	unlockedAt?: string;
	unlockedCanaryVersion?: string;
}

export interface TranslationSubmissionStatus extends TranslationSubmissionRecord {
	isLocked: boolean;
	phase: 'syncing' | 'waiting_version' | 'building' | 'build_failed' | 'unlocked';
	currentCanaryVersion: string;
	targetCanaryVersion: string;
	buildStatus?: string | null;
	buildConclusion?: string | null;
	buildUrl?: string | null;
}

async function fetchCanaryDictionaryJson(validLanguage: Locale): Promise<any | null> {
	const owner = process.env.GITHUB_REPO_OWNER;
	const repo = process.env.GITHUB_REPO_NAME;
	const token = process.env.GITHUB_PAT;

	if (!owner || !repo) return null;

	try {
		const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/packages/lib/src/dictionaries/${validLanguage}.json?ref=canary`, {
			headers: {
				Accept: 'application/vnd.github.raw+json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			cache: 'no-store',
		});
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}

async function fetchCanaryPipelineState() {
	const owner = process.env.GITHUB_REPO_OWNER;
	const repo = process.env.GITHUB_REPO_NAME;
	const token = process.env.GITHUB_PAT;

	const ghHeaders: Record<string, string> = {
		Accept: 'vnd.github+json',
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};

	const [liveVersionRes, ghPkgRes, branchRes, canaryRunsRes, syncRunsRes] = await Promise.all([
		fetch('https://admin.canary.xernerx.com/api/version', { cache: 'no-store' })
			.then((r) => (r.ok ? r.json() : null))
			.catch(() => null),
		owner && repo
			? fetch(`https://api.github.com/repos/${owner}/${repo}/contents/apps/admin/package.json?ref=canary`, {
					headers: { ...ghHeaders, Accept: 'application/vnd.github.raw+json' },
					cache: 'no-store',
				})
					.then((r) => (r.ok ? r.json() : null))
					.catch(() => null)
			: Promise.resolve(null),
		owner && repo
			? fetch(`https://api.github.com/repos/${owner}/${repo}/branches/canary`, {
					headers: ghHeaders,
					cache: 'no-store',
				})
					.then((r) => (r.ok ? r.json() : null))
					.catch(() => null)
			: Promise.resolve(null),
		owner && repo
			? fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/canary.yml/runs?branch=canary&per_page=5`, {
					headers: ghHeaders,
					cache: 'no-store',
				})
					.then((r) => (r.ok ? r.json() : null))
					.catch(() => null)
			: Promise.resolve(null),
		owner && repo
			? fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/sync-canary.yml/runs?branch=dictionary&per_page=5`, {
					headers: ghHeaders,
					cache: 'no-store',
				})
					.then((r) => (r.ok ? r.json() : null))
					.catch(() => null)
			: Promise.resolve(null),
	]);

	const liveCanaryVersion: string | null = liveVersionRes?.version || null;
	const githubCanaryVersion: string | null = ghPkgRes?.version || null;
	const currentCanaryVersion: string | null = liveCanaryVersion || githubCanaryVersion || null;
	const canaryHeadSha: string | null = branchRes?.commit?.sha || null;
	const latestCanaryRun = Array.isArray(canaryRunsRes?.workflow_runs) ? canaryRunsRes.workflow_runs[0] || null : null;
	const latestSyncRun = Array.isArray(syncRunsRes?.workflow_runs) ? syncRunsRes.workflow_runs[0] || null : null;

	return {
		liveCanaryVersion,
		githubCanaryVersion,
		currentCanaryVersion,
		canaryHeadSha,
		latestCanaryRun,
		latestSyncRun,
	};
}

async function resolveSubmissionStatus(validLanguage: string): Promise<TranslationSubmissionStatus | null> {
	if (validLanguage === 'en-GB') return null;

	try {
		const db = (await database('xernerx')).models.core as any;
		const SettingModel = db.Setting;
		const settingKey = `translation_submission_${validLanguage}`;
		const setting = await SettingModel.findOne({ id: settingKey }).lean();

		if (!setting?.value) return null;

		let record: TranslationSubmissionRecord;
		try {
			record = JSON.parse(setting.value);
		} catch {
			return null;
		}

		if (!record || !record.canaryVersionAtSubmit) return null;

		if (record.unlocked === true) {
			const ver = record.unlockedCanaryVersion || record.canaryVersionAtSubmit;
			return {
				...record,
				isLocked: false,
				phase: 'unlocked',
				currentCanaryVersion: ver,
				targetCanaryVersion: ver,
			};
		}

		const state = await fetchCanaryPipelineState();
		const targetCanaryVersion = state.githubCanaryVersion || state.liveCanaryVersion || record.canaryVersionAtSubmit;
		const currentCanaryVersion = state.liveCanaryVersion || state.githubCanaryVersion || record.canaryVersionAtSubmit;

		// Strictly compare Canary version at submission to current Canary version
		const githubVersionChanged = Boolean(state.githubCanaryVersion && state.githubCanaryVersion !== record.canaryVersionAtSubmit);
		const liveVersionChanged = Boolean(state.liveCanaryVersion && state.liveCanaryVersion !== record.canaryVersionAtSubmit);
		const canaryVersionChanged = githubVersionChanged && (!state.liveCanaryVersion || liveVersionChanged);

		const latestSync = state.latestSyncRun;
		const latestRun = state.latestCanaryRun;

		const syncRunning = Boolean(latestSync && (latestSync.status === 'in_progress' || latestSync.status === 'queued' || latestSync.status === 'waiting'));
		const canaryRunning = Boolean(latestRun && (latestRun.status === 'in_progress' || latestRun.status === 'queued' || latestRun.status === 'waiting'));
		const canaryPassed = !latestRun || (latestRun.status === 'completed' && latestRun.conclusion === 'success');
		const canaryFailed = Boolean(latestRun && latestRun.status === 'completed' && latestRun.conclusion && latestRun.conclusion !== 'success');

		if (canaryVersionChanged && canaryPassed && !canaryRunning && !syncRunning) {
			const updatedRecord: TranslationSubmissionRecord = {
				...record,
				unlocked: true,
				unlockedAt: new Date().toISOString(),
				unlockedCanaryVersion: currentCanaryVersion,
			};
			await SettingModel.findOneAndUpdate(
				{ id: settingKey },
				{
					$set: {
						id: settingKey,
						value: JSON.stringify(updatedRecord),
						valueType: 'json',
						description: `Translation submission lock state for ${validLanguage}`,
					},
				},
				{ upsert: true }
			);

			return {
				...updatedRecord,
				isLocked: false,
				phase: 'unlocked',
				currentCanaryVersion,
				targetCanaryVersion,
				buildStatus: latestRun?.status || 'completed',
				buildConclusion: latestRun?.conclusion || 'success',
				buildUrl: latestRun?.html_url || null,
			};
		}

		let phase: TranslationSubmissionStatus['phase'] = 'waiting_version';
		if (syncRunning) {
			phase = 'syncing';
		} else if (githubVersionChanged && (canaryRunning || !liveVersionChanged)) {
			phase = 'building';
		} else if (githubVersionChanged && canaryFailed) {
			phase = 'build_failed';
		} else if (canaryRunning) {
			phase = 'building';
		}

		return {
			...record,
			isLocked: true,
			phase,
			currentCanaryVersion,
			targetCanaryVersion,
			buildStatus: latestRun?.status || null,
			buildConclusion: latestRun?.conclusion || null,
			buildUrl: latestRun?.html_url || null,
		};
	} catch (err) {
		console.warn('[Dictionary Lock] Failed to resolve submission status:', err);
		return null;
	}
}

export async function GET(req: Request, { params }: { params: Promise<{ language: string }> }) {
	const { language } = await params;

	if (!language) {
		return NextResponse.json({ error: 'Language parameter is required' }, { status: 400 });
	}

	if (!(locales as readonly string[]).includes(language)) {
		return NextResponse.json({ error: `Language '${language}' is not supported` }, { status: 400 });
	}

	const validLanguage = language as Locale;

	try {
		const [canaryDictJson, submissionStatus] = await Promise.all([fetchCanaryDictionaryJson(validLanguage), resolveSubmissionStatus(validLanguage)]);

		if (canaryDictJson && typeof canaryDictJson === 'object') {
			return NextResponse.json({
				dictionary: canaryDictJson,
				currentLocale: validLanguage,
				source: 'canary',
				submissionStatus,
			});
		}

		// Fallback to local dictionary if GitHub canary fetch is unavailable
		const fallbackData = await dictionary(validLanguage, { includeDefault: true });
		return NextResponse.json({
			...fallbackData,
			source: 'local',
			submissionStatus,
		});
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(req: Request, { params }: { params: Promise<{ language: string }> }) {
	const { language } = await params;

	// 1. Await the session to resolve the promise
	const session = await getServerSession(auth);

	// 2. Extract the actual variables from the session (with fallbacks if undefined)
	const userName = session?.user?.name || 'Unknown User';
	const userId = (session?.user as any)?.id || 'Unknown ID';

	if (!language) {
		return NextResponse.json({ error: 'Language parameter is required' }, { status: 400 });
	}

	if (!(locales as readonly string[]).includes(language)) {
		return NextResponse.json({ error: `Language '${language}' is not supported` }, { status: 400 });
	}

	const validLanguage = language as Locale;

	try {
		// Check if there is an active submission lock for this locale (comparing Canary version to Canary version)
		const existingStatus = await resolveSubmissionStatus(validLanguage);
		if (existingStatus?.isLocked) {
			return NextResponse.json(
				{
					error: `Translations for ${validLanguage} have already been submitted on Canary v${existingStatus.canaryVersionAtSubmit} and are locked until Canary updates to a new version and the Canary build finishes and passes.`,
					submissionStatus: existingStatus,
				},
				{ status: 409 }
			);
		}

		const body = await req.json();
		const hasWrapper = body && typeof body === 'object' && body.dictionary && typeof body.dictionary === 'object';
		const updatedDictionary = hasWrapper ? body.dictionary : body;

		const pipelineState = await fetchCanaryPipelineState();
		const canaryVersionAtSubmit = pipelineState.currentCanaryVersion || '0.14.0';

		const owner = process.env.GITHUB_REPO_OWNER; // e.g. your GitHub username or org
		const repo = process.env.GITHUB_REPO_NAME; // e.g. your repository name
		const token = process.env.GITHUB_PAT; // GitHub Personal Access Token with repo scope
		const branch = 'dictionary'; // Target branch

		const filePath = `packages/lib/src/dictionaries/${validLanguage}.json`;
		const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

		// 1. Get the current file SHA from GitHub (required for updates)
		const existingFileRes = await fetch(`${url}?ref=${branch}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'vnd.github+json',
			},
		});

		let fileSha: string | undefined;
		if (existingFileRes.ok) {
			const fileData = await existingFileRes.json();
			fileSha = fileData.sha;
		}

		// 2. Format JSON string and encode to Base64
		const fileContent = JSON.stringify(updatedDictionary, null, 4) + '\n';
		const encodedContent = Buffer.from(fileContent).toString('base64');

		// Build a detailed commit message using the live session data and Canary version
		const commitTitle = `chore(i18n): update translations for ${validLanguage}`;
		const commitDescription = `Updated by: ${userName} (ID: ${userId})\nSubmitted against: Canary v${canaryVersionAtSubmit}`;
		const fullCommitMessage = `${commitTitle}\n\n${commitDescription}`;

		// 3. Push commit via GitHub Contents API
		const updateRes = await fetch(url, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'vnd.github+json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				message: fullCommitMessage,
				content: encodedContent,
				sha: fileSha,
				branch: branch,
			}),
		});

		if (!updateRes.ok) {
			const errData = await updateRes.json();
			throw new Error(errData.message || 'Failed to commit to GitHub');
		}

		const commitData = await updateRes.json().catch(() => null);
		const dictionaryCommitSha: string | undefined = commitData?.commit?.sha || undefined;

		// 4. Persist submission lock metadata in MongoDB until Canary version changes and Canary build finishes & passes
		const record: TranslationSubmissionRecord = {
			language: validLanguage,
			canaryVersionAtSubmit,
			canaryShaAtSubmit: pipelineState.canaryHeadSha || undefined,
			dictionaryCommitSha,
			submittedAt: new Date().toISOString(),
			submittedBy: { id: String(userId), name: String(userName) },
			unlocked: false,
		};

		try {
			const db = (await database('xernerx')).models.core as any;
			const SettingModel = db.Setting;
			const settingKey = `translation_submission_${validLanguage}`;
			await SettingModel.findOneAndUpdate(
				{ id: settingKey },
				{
					$set: {
						id: settingKey,
						value: JSON.stringify(record),
						valueType: 'json',
						description: `Translation submission lock state for ${validLanguage}`,
					},
				},
				{ upsert: true }
			);
		} catch (dbErr) {
			console.warn('[Dictionary Lock] Failed to save submission lock record:', dbErr);
		}

		const submissionStatus: TranslationSubmissionStatus = {
			...record,
			isLocked: true,
			phase: 'syncing',
			currentCanaryVersion: canaryVersionAtSubmit,
			targetCanaryVersion: canaryVersionAtSubmit,
			buildStatus: 'queued',
			buildConclusion: null,
			buildUrl: null,
		};

		return NextResponse.json({
			success: true,
			submissionStatus,
		});
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
