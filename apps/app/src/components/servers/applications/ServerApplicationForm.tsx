/** @format */
'use client';

import { ArrowLeft, CheckCircle2, ClipboardList, EyeOff, LogIn, Send, Server, ShieldAlert } from 'lucide-react';
import { Badge, Button } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment, useSidebar, useToast } from '@xernerx/providers';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getButtonLinkClasses } from '@/components/buttonLinkClasses';
import type { DiscordChannelItem, DiscordRoleItem, YourAppsPosition, YourAppsQuestion } from '@/components/dashboard/applications/types';
import ServerApplicationQuestionInput, { parseAttachmentLines } from './ServerApplicationQuestionInput';

interface GuildMemberPreview {
	id: string;
	username: string;
	displayName: string;
}

interface FormPortalResponse {
	found: boolean;
	privateServer?: boolean;
	botPresent?: boolean;
	server?: { id: string; name: string; icon?: string | null; banner?: string | null };
	authenticated: boolean;
	isMember?: boolean;
	eligible?: boolean;
	ineligibleReason?: string | null;
	position?: YourAppsPosition;
	draftAnswers?: Array<{ questionId: string; answer: string }>;
	serverRoles?: DiscordRoleItem[];
	serverChannels?: DiscordChannelItem[];
	guildMembers?: GuildMemberPreview[];
}

function isQuestionActiveOnWeb(question: YourAppsQuestion, answers: Record<string, string>): boolean {
	const cond = question.condition;
	if (!cond || !cond.questionId) return true;
	const refRaw = String(answers[cond.questionId] ?? '').trim();
	const target = String(cond.value ?? '').trim();
	if (!target) return true;

	const refLower = refRaw.toLowerCase();
	const targetLower = target.toLowerCase();
	if (cond.operator === 'not_equals') return refLower !== targetLower;
	if (cond.operator === 'contains') return refLower.includes(targetLower);
	return refLower === targetLower;
}

export default function ServerApplicationForm({ guildId, appId }: { guildId: string; appId: string }) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();
	const { hide } = useSidebar();

	useEffect(() => {
		hide();
	}, [hide]);

	const [data, setData] = useState<FormPortalResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
	const [uploadingQId, setUploadingQId] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [submittedId, setSubmittedId] = useState<string | null>(null);

	const hydratedRef = useRef(false);
	const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const fetchPositionForm = useCallback(async () => {
		if (!isReady) return;
		setLoading(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/apply/${appId}`), {
				credentials: 'include',
			});
			const json = await res.json().catch(() => null);
			if (json) {
				setData(json);
				if (Array.isArray(json.draftAnswers) && json.draftAnswers.length > 0) {
					const prefill: Record<string, string> = {};
					for (const d of json.draftAnswers) {
						if (d?.questionId && d?.answer) {
							prefill[String(d.questionId)] = String(d.answer);
						}
					}
					setAnswers(prefill);
					setDraftStatus('saved');
				}
			}
		} catch {
			setData(null);
		} finally {
			hydratedRef.current = true;
			setLoading(false);
		}
	}, [guildId, appId, getEnvUrl, isReady]);

	useEffect(() => {
		fetchPositionForm();
	}, [fetchPositionForm]);

	const saveDraftNow = useCallback(
		async (nextAnswers: Record<string, string>) => {
			if (!data?.authenticated || !data?.eligible || submittedId) return;
			setDraftStatus('saving');
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/apply/${appId}`), {
					method: 'PUT',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ answers: nextAnswers }),
				});
				if (res.ok) {
					setDraftStatus('saved');
				} else {
					setDraftStatus('idle');
				}
			} catch {
				setDraftStatus('idle');
			}
		},
		[data?.authenticated, data?.eligible, submittedId, getEnvUrl, guildId, appId]
	);

	const setAnswer = (questionId: string, val: string) => {
		setAnswers((prev) => {
			const next = { ...prev, [questionId]: val };
			if (hydratedRef.current && data?.authenticated && data?.eligible) {
				if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
				setDraftStatus('saving');
				draftTimerRef.current = setTimeout(() => {
					void saveDraftNow(next);
				}, 900);
			}
			return next;
		});
	};

	useEffect(() => {
		return () => {
			if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
		};
	}, []);

	const handleFileSelection = async (questionId: string, fileList: FileList | null) => {
		if (!fileList || fileList.length === 0) return;
		const existing = parseAttachmentLines(answers[questionId] || '');
		const slotsRemaining = Math.max(0, 5 - existing.length);
		if (slotsRemaining === 0) return;

		const files = Array.from(fileList).slice(0, slotsRemaining);
		setUploadingQId(questionId);
		try {
			const uploadedLines: string[] = [];
			for (const file of files) {
				const formData = new FormData();
				formData.append('file', file);
				const res = await fetch(getEnvUrl('https://cdn.xernerx.com/yourapps/upload'), {
					method: 'POST',
					credentials: 'include',
					body: formData,
				});
				const json = await res.json().catch(() => ({}));
				if (!res.ok) {
					throw new Error(json.error || 'Upload failed');
				}
				if (json.markdown) {
					uploadedLines.push(String(json.markdown));
				} else if (json.url) {
					uploadedLines.push(`[${file.name}](${json.url})`);
				}
			}
			if (uploadedLines.length > 0) {
				const combined = [...existing.map((e) => e.rawLine), ...uploadedLines].join('\n');
				setAnswer(questionId, combined);
			}
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setUploadingQId(null);
		}
	};

	const handleSignIn = () => {
		const accountBase = getEnvUrl('https://account.xernerx.com');
		const cb = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
		window.location.href = cb ? `${accountBase}/login?callbackUrl=${cb}` : accountBase;
	};

	const handleSubmit = async () => {
		if (!data?.position) return;
		if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
		setSubmitting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/apply/${appId}`), {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ answers }),
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(result.error || t('app.dashboard.applications.toast.saveError'));
			}
			setSubmittedId(String(result?.submission?.id || ''));
			toast({ title: t('app.servers.applications.submittedToast'), type: 'success' });
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setSubmitting(false);
		}
	};

	const activeQuestions = useMemo(() => {
		if (!data?.position?.questions) return [];
		const visible: YourAppsQuestion[] = [];
		const visibleIds = new Set<string>();
		for (const q of data.position.questions) {
			if (q.condition?.questionId && !visibleIds.has(q.condition.questionId)) continue;
			if (!isQuestionActiveOnWeb(q, answers)) continue;
			visible.push(q);
			visibleIds.add(q.id);
		}
		return visible;
	}, [data?.position?.questions, answers]);

	if (loading) {
		return (
			<div className="flex-1 flex items-center justify-center min-h-[60vh]">
				<Loading />
			</div>
		);
	}

	if (data?.privateServer) {
		return (
			<div className="max-w-(--page-width) mx-auto w-full py-16 px-4 flex flex-col items-center justify-center text-center gap-4">
				<div className="w-14 h-14 rounded-full bg-(--accent)/15 flex items-center justify-center text-(--accent)">
					<ShieldAlert className="w-7 h-7" />
				</div>
				<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('app.servers.notFoundTitle')}
				</h1>
				<p className="text-sm text-(--text-muted) max-w-md">{data.authenticated ? t('app.servers.notFoundDesc') : t('app.servers.applications.signInDesc')}</p>
				{!data.authenticated ? (
					<Button variant="primary" onClick={handleSignIn}>
						<LogIn className="w-4 h-4" />
						<span>{t('app.servers.applications.signInBtn')}</span>
					</Button>
				) : (
					<Link href="/servers" className={getButtonLinkClasses('secondary')}>
						{t('app.servers.backToExplore')}
					</Link>
				)}
			</div>
		);
	}

	if (!data || !data.found || !data.position || !data.server) {
		return (
			<div className="max-w-(--page-width) mx-auto w-full py-16 px-4 flex flex-col items-center justify-center text-center gap-4">
				<div className="w-14 h-14 rounded-full bg-(--accent)/15 flex items-center justify-center text-(--accent)">
					<ClipboardList className="w-7 h-7" />
				</div>
				<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('app.servers.applications.notFoundTitle')}
				</h1>
				<p className="text-sm text-(--text-muted) max-w-md">{t('app.servers.applications.notFoundDesc')}</p>
				<Link href={`/servers/${guildId}/applications`} className={getButtonLinkClasses('secondary')}>
					<ArrowLeft className="w-4 h-4" />
					<span>{t('app.servers.applications.backToPositions')}</span>
				</Link>
			</div>
		);
	}

	const pos = data.position;
	const isPoll = pos.category === 'poll';
	const disabled = !data.authenticated || !data.eligible;

	const roleOptions = (data.serverRoles || []).map((r) => ({
		label: `@${r.name}`,
		value: `<@&${r.id}> (@${r.name})`,
	}));
	const channelOptions = (data.serverChannels || [])
		.filter((c) => c.type === 0 || c.type === 5 || c.type === 15)
		.map((c) => ({
			label: `#${c.name}`,
			value: `<#${c.id}> (#${c.name})`,
		}));
	const memberOptions = (data.guildMembers || []).map((m) => ({
		label: `${m.displayName} (@${m.username})`,
		value: `<@${m.id}> (${m.username})`,
	}));
	const mentionableOptions = [...memberOptions, ...roleOptions];

	if (submittedId) {
		return (
			<div className="max-w-(--page-width) mx-auto w-full py-16 px-4 flex flex-col items-center justify-center text-center gap-5">
				<div className="p-8 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm flex flex-col items-center gap-4 w-full">
					<div className="w-14 h-14 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
						<CheckCircle2 className="w-7 h-7" />
					</div>
					<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('app.servers.applications.submittedTitle')}
					</h1>
					<p className="text-sm text-(--text-muted) max-w-md">{t('app.servers.applications.submittedDesc', { position: pos.name, id: submittedId })}</p>
					<Link href={`/servers/${guildId}/applications`} className={getButtonLinkClasses('primary')}>
						{t('app.servers.applications.viewMySubmissionsBtn')}
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-(--page-width) mx-auto w-full py-8 px-4 flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<div className="flex items-center justify-between gap-3">
				<Link href={`/servers/${guildId}/applications`} className={getButtonLinkClasses('ghost', 'sm')}>
					<ArrowLeft className="w-4 h-4" />
					<span>{t('app.servers.applications.backToPositions')}</span>
				</Link>
				{data.authenticated && data.eligible && draftStatus !== 'idle' && (
					<Badge variant={draftStatus === 'saved' ? 'success' : 'outline'}>
						{draftStatus === 'saving' ? t('app.servers.applications.draftSaving') : t('app.servers.applications.draftSaved')}
					</Badge>
				)}
			</div>

			<div className="flex flex-col gap-3 p-6 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm">
				<div className="flex items-center gap-3">
					{data.server.icon ? (
						<img src={data.server.icon} alt={data.server.name} className="w-12 h-12 rounded-2xl object-cover border border-(--border)/10 shrink-0" />
					) : (
						<div className="w-12 h-12 rounded-2xl bg-(--accent)/15 border border-(--border)/10 flex items-center justify-center text-(--accent) shrink-0">
							<Server className="w-5 h-5" />
						</div>
					)}
					<div className="flex flex-col gap-1 min-w-0">
						<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{data.server.name}</span>
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-xl sm:text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{pos.name}
							</h1>
							<Badge variant={pos.state === 'open' ? 'success' : 'muted'} dot>
								{pos.state === 'open' ? t('app.dashboard.applications.positions.openBadge') : t('app.dashboard.applications.positions.closedBadge')}
							</Badge>
							<Badge variant="accent">{t(`app.dashboard.applications.positions.categories.${pos.category || 'staff'}`)}</Badge>
							{pos.anonymousResponses && <Badge variant="outline">{t('app.dashboard.applications.positions.anonymousBadge')}</Badge>}
						</div>
					</div>
				</div>
				{pos.description && <p className="text-sm text-(--text-muted) whitespace-pre-wrap">{pos.description}</p>}
				{pos.anonymousResponses && (
					<div className="flex items-center gap-2 text-xs text-(--accent)">
						<EyeOff className="w-3.5 h-3.5 shrink-0" />
						<span>{t('app.servers.applications.anonymousNotice')}</span>
					</div>
				)}
			</div>

			{!data.authenticated ? (
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--accent)/30 shadow-sm">
					<div className="flex flex-col gap-1">
						<span className="text-sm font-bold text-(--text)">{t('app.servers.applications.signInTitle')}</span>
						<span className="text-xs text-(--text-muted)">{t('app.servers.applications.signInDesc')}</span>
					</div>
					<Button variant="primary" onClick={handleSignIn} className="shrink-0">
						<LogIn className="w-4 h-4" />
						<span>{t('app.servers.applications.signInBtn')}</span>
					</Button>
				</div>
			) : !data.eligible && data.ineligibleReason ? (
				<div className="flex items-center gap-3 p-4 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/15 shadow-sm">
					<ShieldAlert className="w-5 h-5 text-(--accent) shrink-0" />
					<span className="text-xs sm:text-sm font-semibold text-(--text)">{data.ineligibleReason}</span>
				</div>
			) : null}

			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				{activeQuestions.map((q, idx) => (
					<div key={q.id} className="flex flex-col gap-2 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
						<div className="flex items-start justify-between gap-2">
							<label className="text-sm font-bold text-(--text)">
								<span className="text-(--accent) font-mono mr-1.5">{idx + 1}.</span>
								{q.question}
							</label>
							<Badge variant={q.required !== false ? 'accent' : 'outline'}>
								{q.required !== false ? t('app.servers.applications.requiredTag') : t('app.servers.applications.optionalTag')}
							</Badge>
						</div>
						<ServerApplicationQuestionInput
							question={q}
							value={answers[q.id] || ''}
							disabled={disabled}
							isUploadingThis={uploadingQId === q.id}
							roleOptions={roleOptions}
							channelOptions={channelOptions}
							memberOptions={memberOptions}
							mentionableOptions={mentionableOptions}
							onChange={(val) => setAnswer(q.id, val)}
							onUploadFiles={(files) => void handleFileSelection(q.id, files)}
						/>
					</div>
				))}

				<div className="flex items-center justify-end gap-3 pt-2 border-t border-(--border)/10">
					<Link href={`/servers/${guildId}/applications`} className={getButtonLinkClasses('secondary')}>
						{t('app.dashboard.applications.positions.modal.cancelBtn')}
					</Link>
					<Button variant="primary" loading={submitting} disabled={!data.authenticated || !data.eligible} onClick={handleSubmit}>
						<Send className="w-4 h-4" />
						<span>{isPoll ? t('app.servers.applications.submitPollBtn') : t('app.servers.applications.submitBtn')}</span>
					</Button>
				</div>
			</div>
		</div>
	);
}
