/** @format */
'use client';

import { ArrowLeft, CheckCircle2, ClipboardList, LogIn, Send, Server, ShieldAlert } from 'lucide-react';
import { Badge, Button, Check, Input, MultiSelector, Selector } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { DiscordChannelItem, DiscordRoleItem, YourAppsPosition, YourAppsQuestion } from '@/components/dashboard/applications/types';

interface FormPortalResponse {
	found: boolean;
	botPresent: boolean;
	server: { id: string; name: string; icon?: string | null; banner?: string | null };
	authenticated: boolean;
	isMember: boolean;
	eligible: boolean;
	ineligibleReason: string | null;
	position?: YourAppsPosition;
	draftAnswers?: Array<{ questionId: string; answer: string }>;
	serverRoles?: DiscordRoleItem[];
	serverChannels?: DiscordChannelItem[];
}

export default function ServerApplicationForm({ guildId, appId }: { guildId: string; appId: string }) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();

	const [data, setData] = useState<FormPortalResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [submitting, setSubmitting] = useState(false);
	const [submittedId, setSubmittedId] = useState<string | null>(null);

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
				}
			}
		} catch {
			setData(null);
		} finally {
			setLoading(false);
		}
	}, [guildId, appId, getEnvUrl, isReady]);

	useEffect(() => {
		fetchPositionForm();
	}, [fetchPositionForm]);

	const setAnswer = (questionId: string, val: string) => {
		setAnswers((prev) => ({ ...prev, [questionId]: val }));
	};

	const handleSignIn = () => {
		const accountBase = getEnvUrl('https://account.xernerx.com');
		const cb = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
		window.location.href = cb ? `${accountBase}/login?callbackUrl=${cb}` : accountBase;
	};

	const handleSubmit = async () => {
		if (!data?.position) return;
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

	if (loading) {
		return (
			<div className="flex-1 flex items-center justify-center min-h-[60vh]">
				<Loading />
			</div>
		);
	}

	if (!data || !data.found || !data.position) {
		return (
			<div className="max-w-(--page-width) mx-auto w-full py-16 px-4 flex flex-col items-center justify-center text-center gap-4">
				<div className="w-14 h-14 rounded-full bg-(--accent)/15 flex items-center justify-center text-(--accent)">
					<ClipboardList className="w-7 h-7" />
				</div>
				<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('app.servers.applications.notFoundTitle')}
				</h1>
				<p className="text-sm text-(--text-muted) max-w-md">{t('app.servers.applications.notFoundDesc')}</p>
				<Link href={`/servers/${guildId}/applications`}>
					<Button variant="secondary">
						<ArrowLeft className="w-4 h-4" />
						<span>{t('app.servers.applications.backToPositions')}</span>
					</Button>
				</Link>
			</div>
		);
	}

	const pos = data.position;
	const roleOptions = (data.serverRoles || []).map((r) => ({
		label: `@${r.name}`,
		value: `<@&${r.id}> (@${r.name})`,
	}));
	const channelOptions = (data.serverChannels || []).map((c) => ({
		label: `#${c.name}`,
		value: `<#${c.id}> (#${c.name})`,
	}));

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
					<Link href={`/servers/${guildId}/applications`}>
						<Button variant="primary">{t('app.servers.applications.viewMySubmissionsBtn')}</Button>
					</Link>
				</div>
			</div>
		);
	}

	const renderQuestionControl = (q: YourAppsQuestion) => {
		const val = answers[q.id] || '';
		const opts = Array.isArray(q.options) ? q.options.filter(Boolean) : [];
		const disabled = !data.authenticated || !data.eligible;

		switch (q.type) {
			case 'short':
				return <Input disabled={disabled} value={val} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder={q.placeholder || ''} />;

			case 'number':
				return <Input type="number" disabled={disabled} value={val} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder={q.placeholder || '0'} />;

			case 'select': {
				const selectOpts = opts.map((o) => ({ label: o, value: o }));
				return (
					<Selector
						disabled={disabled}
						value={val}
						onChange={(v: string) => setAnswer(q.id, v)}
						options={selectOpts}
						placeholder={q.placeholder || t('app.servers.applications.selectOptionPlaceholder')}
					/>
				);
			}

			case 'radio': {
				return (
					<div className="flex flex-col gap-2">
						{opts.map((opt) => {
							const active = val === opt;
							return <Check key={opt} variant="circle" checked={active} disabled={disabled} onCheckedChange={() => setAnswer(q.id, opt)} label={opt} />;
						})}
					</div>
				);
			}

			case 'multiselect': {
				const multiOpts = opts.map((o) => ({ label: o, value: o }));
				const selectedValues = val
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean);
				return (
					<MultiSelector
						value={selectedValues}
						onChange={(vals: string[]) => setAnswer(q.id, vals.join(', '))}
						options={multiOpts}
						placeholder={t('app.servers.applications.selectMultiplePlaceholder')}
					/>
				);
			}

			case 'boolean': {
				const defaultYes = t('app.dashboard.applications.positions.modal.booleanYesPlaceholder');
				const defaultNo = t('app.dashboard.applications.positions.modal.booleanNoPlaceholder');
				const yesLabel = opts[0]?.trim() || defaultYes;
				const noLabel = opts[1]?.trim() && opts[1]?.trim() !== yesLabel ? opts[1].trim() : defaultNo;
				return (
					<div className="flex flex-wrap gap-2">
						<Button type="button" size="sm" variant={val === yesLabel ? 'primary' : 'secondary'} disabled={disabled} onClick={() => setAnswer(q.id, yesLabel)}>
							{yesLabel}
						</Button>
						<Button type="button" size="sm" variant={val === noLabel ? 'primary' : 'secondary'} disabled={disabled} onClick={() => setAnswer(q.id, noLabel)}>
							{noLabel}
						</Button>
					</div>
				);
			}

			case 'checkbox':
				return (
					<Check
						checked={val === 'Yes'}
						disabled={disabled}
						onCheckedChange={(checked) => setAnswer(q.id, checked ? 'Yes' : '')}
						label={q.placeholder || t('app.servers.applications.checkboxAgreeLabel')}
					/>
				);

			case 'role':
				return roleOptions.length > 0 ? (
					<Selector
						disabled={disabled}
						value={val}
						onChange={(v: string) => setAnswer(q.id, v)}
						options={roleOptions}
						placeholder={q.placeholder || t('app.servers.applications.selectRolePlaceholder')}
					/>
				) : (
					<Input disabled={disabled} value={val} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder={q.placeholder || t('app.servers.applications.selectRolePlaceholder')} />
				);

			case 'channel':
				return channelOptions.length > 0 ? (
					<Selector
						disabled={disabled}
						value={val}
						onChange={(v: string) => setAnswer(q.id, v)}
						options={channelOptions}
						placeholder={q.placeholder || t('app.servers.applications.selectChannelPlaceholder')}
					/>
				) : (
					<Input disabled={disabled} value={val} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder={q.placeholder || t('app.servers.applications.selectChannelPlaceholder')} />
				);

			case 'user':
			case 'mentionable':
				return <Input disabled={disabled} value={val} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder={q.placeholder || t('app.servers.applications.userInputPlaceholder')} />;

			case 'file':
				return <Input disabled={disabled} value={val} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder={q.placeholder || t('app.servers.applications.fileInputPlaceholder')} />;

			case 'paragraph':
			default:
				return <Input variant="textarea" rows={4} disabled={disabled} value={val} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder={q.placeholder || ''} />;
		}
	};

	return (
		<div className="max-w-(--page-width) mx-auto w-full py-8 px-4 flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<div className="flex items-center justify-between gap-3">
				<Link href={`/servers/${guildId}/applications`}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="w-4 h-4" />
						<span>{t('app.servers.applications.backToPositions')}</span>
					</Button>
				</Link>
			</div>

			{/* Header */}
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
							<Badge variant="accent">{t(`app.dashboard.applications.positions.categories.${pos.category}`)}</Badge>
						</div>
					</div>
				</div>
				{pos.description && <p className="text-sm text-(--text-muted) whitespace-pre-wrap">{pos.description}</p>}
			</div>

			{/* Auth / Eligibility Banner */}
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

			{/* Questions Form */}
			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				{pos.questions.map((q, idx) => (
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
						{renderQuestionControl(q)}
					</div>
				))}

				<div className="flex items-center justify-end gap-3 pt-2 border-t border-(--border)/10">
					<Link href={`/servers/${guildId}/applications`}>
						<Button variant="secondary">{t('app.dashboard.applications.positions.modal.cancelBtn')}</Button>
					</Link>
					<Button variant="primary" loading={submitting} disabled={!data.authenticated || !data.eligible} onClick={handleSubmit}>
						<Send className="w-4 h-4" />
						<span>{t('app.servers.applications.submitBtn')}</span>
					</Button>
				</div>
			</div>
		</div>
	);
}
