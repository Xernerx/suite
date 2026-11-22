/** @format */
'use client';

import { ArrowRight, Ban, ClipboardList, FileSpreadsheet, HelpCircle, Inbox, LogIn, Send, Server, ShieldAlert } from 'lucide-react';
import { Badge, Button, Confirm, Input, Modal } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment, useSidebar, useToast } from '@xernerx/providers';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { getButtonLinkClasses } from '@/components/buttonLinkClasses';
import type { PositionCategory, SubmissionStatus, YourAppsClarification } from '@/components/dashboard/applications/types';

interface PortalPositionSummary {
	id: string;
	name: string;
	description: string;
	category: PositionCategory;
	state: 'open' | 'closed';
	questionsCount: number;
	opensAt?: string | null;
	closesAt?: string | null;
	maxSubmissions?: number;
	maxApprovals?: number;
	submissionsCount?: number;
	approvalsCount?: number;
	anonymousResponses?: boolean;
	eligible: boolean;
	ineligibleReason: string | null;
}

interface PortalSubmissionSummary {
	id: string;
	positionId: string;
	positionName: string;
	status: SubmissionStatus;
	reviewReason?: string | null;
	interviewChannelId?: string | null;
	clarifications?: YourAppsClarification[];
	createdAt?: string;
}

interface PortalOverviewResponse {
	id: string;
	botPresent: boolean;
	server: { id: string; name: string; icon?: string | null; banner?: string | null };
	authenticated: boolean;
	isMember: boolean;
	positions: PortalPositionSummary[];
	mySubmissions: PortalSubmissionSummary[];
}

export default function ServerApplicationsIndex({ guildId }: { guildId: string }) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();
	const { hide } = useSidebar();

	useEffect(() => {
		hide();
	}, [hide]);

	const [data, setData] = useState<PortalOverviewResponse | null>(null);
	const [privateInfo, setPrivateInfo] = useState<{ privateServer: boolean; authenticated: boolean } | null>(null);
	const [loading, setLoading] = useState(true);

	const [withdrawTarget, setWithdrawTarget] = useState<PortalSubmissionSummary | null>(null);
	const [withdrawing, setWithdrawing] = useState(false);

	const [clarifyTarget, setClarifyTarget] = useState<PortalSubmissionSummary | null>(null);
	const [clarifyResponse, setClarifyResponse] = useState('');
	const [sendingClarify, setSendingClarify] = useState(false);

	const fetchOverview = useCallback(async () => {
		if (!isReady) return;
		setLoading(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/apply`), {
				credentials: 'include',
			});
			const json = await res.json().catch(() => null);
			if (res.ok && json) {
				setPrivateInfo(null);
				setData(json);
			} else if (res.status === 403 && json?.privateServer) {
				setPrivateInfo({ privateServer: true, authenticated: Boolean(json.authenticated) });
				setData(null);
			}
		} catch {
			// Ignore transient error
		} finally {
			setLoading(false);
		}
	}, [guildId, getEnvUrl, isReady]);

	useEffect(() => {
		fetchOverview();
	}, [fetchOverview]);

	const statusVariant = (status: string): 'warning' | 'success' | 'danger' | 'accent' | 'muted' => {
		if (status === 'approved') return 'success';
		if (status === 'denied') return 'danger';
		if (status === 'interview') return 'accent';
		if (status === 'pending' || status === 'needs_info') return 'warning';
		return 'muted';
	};

	const statusLabel = (status: string) => {
		if (status === 'approved') return t('app.dashboard.applications.submissions.statusApproved');
		if (status === 'denied') return t('app.dashboard.applications.submissions.statusDenied');
		if (status === 'interview') return t('app.dashboard.applications.submissions.statusInterview');
		if (status === 'needs_info') return t('app.dashboard.applications.submissions.statusNeedsInfo');
		if (status === 'withdrawn') return t('app.dashboard.applications.submissions.statusWithdrawn');
		return t('app.dashboard.applications.submissions.statusPending');
	};

	const handleSignIn = () => {
		const accountBase = getEnvUrl('https://account.xernerx.com');
		const cb = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
		window.location.href = cb ? `${accountBase}/login?callbackUrl=${cb}` : accountBase;
	};

	const handleConfirmWithdraw = async () => {
		if (!withdrawTarget) return;
		setWithdrawing(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/submissions/${withdrawTarget.id}`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'withdraw' }),
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(json.error || 'Withdraw failed');
			toast({ title: t('app.servers.applications.withdrawnToast'), type: 'success' });
			setWithdrawTarget(null);
			fetchOverview();
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setWithdrawing(false);
		}
	};

	const handleSubmitClarification = async () => {
		if (!clarifyTarget || !clarifyResponse.trim()) return;
		setSendingClarify(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/submissions/${clarifyTarget.id}`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'respond_info', response: clarifyResponse.trim() }),
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(json.error || 'Failed to send response');
			toast({ title: t('app.servers.applications.clarifySentToast'), type: 'success' });
			setClarifyTarget(null);
			setClarifyResponse('');
			fetchOverview();
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setSendingClarify(false);
		}
	};

	if (loading) {
		return (
			<div className="flex-1 flex items-center justify-center min-h-[60vh]">
				<Loading />
			</div>
		);
	}

	if (privateInfo?.privateServer) {
		return (
			<div className="max-w-(--page-width) mx-auto w-full py-16 px-4 flex flex-col items-center justify-center text-center gap-4">
				<div className="w-14 h-14 rounded-full bg-(--accent)/15 flex items-center justify-center text-(--accent)">
					<ShieldAlert className="w-7 h-7" />
				</div>
				<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('app.servers.notFoundTitle')}
				</h1>
				<p className="text-sm text-(--text-muted) max-w-md">{privateInfo.authenticated ? t('app.servers.notFoundDesc') : t('app.servers.applications.signInDesc')}</p>
				{!privateInfo.authenticated ? (
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

	if (!data || !data.botPresent) {
		return (
			<div className="max-w-(--page-width) mx-auto w-full py-16 px-4 flex flex-col items-center justify-center text-center gap-4">
				<div className="w-14 h-14 rounded-full bg-(--accent)/15 flex items-center justify-center text-(--accent)">
					<ClipboardList className="w-7 h-7" />
				</div>
				<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('app.servers.applications.notConfiguredTitle')}
				</h1>
				<p className="text-sm text-(--text-muted) max-w-md">{t('app.servers.applications.notConfiguredDesc')}</p>
			</div>
		);
	}

	const activeClarificationPrompt = clarifyTarget?.clarifications?.length ? clarifyTarget.clarifications[clarifyTarget.clarifications.length - 1]?.prompt : '';

	return (
		<div className="max-w-(--page-width) mx-auto w-full py-8 px-4 flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{/* Server Header Card */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm">
				<div className="flex items-center gap-4 min-w-0">
					{data.server.icon ? (
						<img src={data.server.icon} alt={data.server.name} className="w-14 h-14 rounded-2xl object-cover border border-(--border)/10 shrink-0" />
					) : (
						<div className="w-14 h-14 rounded-2xl bg-(--accent)/15 border border-(--border)/10 flex items-center justify-center text-(--accent) shrink-0">
							<Server className="w-6 h-6" />
						</div>
					)}
					<div className="flex flex-col gap-1 min-w-0">
						<h1 className="text-xl sm:text-2xl font-extrabold text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{data.server.name} — {t('app.servers.applications.title')}
						</h1>
						<p className="text-xs sm:text-sm text-(--text-muted)">{t('app.servers.applications.subtitle')}</p>
					</div>
				</div>

				{!data.authenticated && (
					<Button variant="primary" onClick={handleSignIn} className="shrink-0">
						<LogIn className="w-4 h-4" />
						<span>{t('app.servers.applications.signInBtn')}</span>
					</Button>
				)}
			</div>

			{/* Positions List */}
			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex items-center gap-2.5 text-(--text) font-extrabold text-sm tracking-widest uppercase">
					<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
						<FileSpreadsheet className="w-4 h-4" />
					</div>
					<span>{t('app.dashboard.applications.positions.title')}</span>
				</div>

				{data.positions.length === 0 ? (
					<div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 gap-2">
						<FileSpreadsheet className="w-8 h-8 text-(--accent)" />
						<span className="text-sm font-bold text-(--text)">{t('app.servers.applications.emptyPositionsTitle')}</span>
						<span className="text-xs text-(--text-muted) max-w-md">{t('app.servers.applications.emptyPositionsDesc')}</span>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{data.positions.map((pos) => {
							const isOpen = pos.state === 'open';
							const isPoll = pos.category === 'poll';
							return (
								<div key={pos.id} className="flex flex-col justify-between gap-4 p-5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
									<div className="flex flex-col gap-2">
										<div className="flex flex-wrap items-center gap-2">
											<span className="text-base font-bold text-(--text)">{pos.name}</span>
											<Badge variant={isOpen ? 'success' : 'muted'} dot>
												{isOpen ? t('app.dashboard.applications.positions.openBadge') : t('app.dashboard.applications.positions.closedBadge')}
											</Badge>
											<Badge variant="accent">{t(`app.dashboard.applications.positions.categories.${pos.category || 'staff'}`)}</Badge>
											{pos.anonymousResponses && <Badge variant="outline">{t('app.dashboard.applications.positions.anonymousBadge')}</Badge>}
										</div>

										{pos.description && <p className="text-xs text-(--text-muted) line-clamp-3">{pos.description}</p>}

										<div className="flex flex-wrap items-center gap-2 pt-1">
											<Badge variant="outline">{t('app.dashboard.applications.positions.questionsCount', { count: pos.questionsCount })}</Badge>
											{Number(pos.maxApprovals) > 0 && (
												<Badge variant="outline">
													{t('app.dashboard.applications.positions.capApprovalsBadge', { current: pos.approvalsCount ?? 0, max: pos.maxApprovals || 0 })}
												</Badge>
											)}
											{data.authenticated && !pos.eligible && pos.ineligibleReason && <Badge variant="warning">{t('app.servers.applications.ineligibleBadge')}</Badge>}
										</div>
									</div>

									<div className="flex items-center justify-end pt-2 border-t border-(--border)/10">
										{isOpen ? (
											<Link href={`/servers/${guildId}/applications/${pos.id}`} className={getButtonLinkClasses('primary', 'sm')}>
												<span>{isPoll ? t('app.servers.applications.voteBtn') : t('app.servers.applications.applyBtn')}</span>
												<ArrowRight className="w-3.5 h-3.5" />
											</Link>
										) : (
											<Button variant="secondary" size="sm" disabled>
												{t('app.servers.applications.closedBtn')}
											</Button>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* User's Recent Submissions */}
			{data.authenticated && (
				<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
					<div className="flex items-center gap-2.5 text-(--text) font-extrabold text-sm tracking-widest uppercase">
						<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
							<Inbox className="w-4 h-4" />
						</div>
						<span>{t('app.servers.applications.mySubmissionsTitle')}</span>
					</div>

					{data.mySubmissions.length === 0 ? (
						<p className="text-xs text-(--text-muted)">{t('app.servers.applications.mySubmissionsEmpty')}</p>
					) : (
						<div className="flex flex-col gap-2">
							{data.mySubmissions.map((sub) => {
								const canWithdraw = ['pending', 'needs_info', 'interview'].includes(sub.status);
								const latestClar = sub.clarifications?.length ? sub.clarifications[sub.clarifications.length - 1] : null;
								return (
									<div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
										<div className="flex flex-col gap-1 min-w-0">
											<div className="flex flex-wrap items-center gap-2">
												<span className="text-sm font-bold text-(--text)">{sub.positionName}</span>
												<span className="text-xs font-mono text-(--text-muted)">#{sub.id}</span>
												<Badge variant={statusVariant(sub.status)} dot>
													{statusLabel(sub.status)}
												</Badge>
												{sub.interviewChannelId && <Badge variant="accent">{t('app.servers.applications.interviewActiveNote')}</Badge>}
											</div>
											{sub.status === 'needs_info' && latestClar && !latestClar.response && <p className="text-xs font-medium text-(--accent)">Q: {latestClar.prompt}</p>}
											{sub.reviewReason && <p className="text-xs text-(--text-muted)">{sub.reviewReason}</p>}
											{sub.createdAt && <span className="text-[11px] text-(--text-muted)">{new Date(sub.createdAt).toLocaleString()}</span>}
										</div>

										<div className="flex items-center gap-2 shrink-0">
											{sub.status === 'needs_info' && (
												<Button
													variant="primary"
													size="sm"
													onClick={() => {
														setClarifyTarget(sub);
														setClarifyResponse('');
													}}
												>
													<HelpCircle className="w-3.5 h-3.5" />
													<span>{t('app.servers.applications.answerClarifyBtn')}</span>
												</Button>
											)}
											{canWithdraw && (
												<Button variant="danger" size="sm" onClick={() => setWithdrawTarget(sub)}>
													<Ban className="w-3.5 h-3.5" />
													<span>{t('app.servers.applications.withdrawBtn')}</span>
												</Button>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}

			<Modal open={Boolean(clarifyTarget)} onOpenChange={(o) => !o && setClarifyTarget(null)} size="lg" title={t('app.servers.applications.clarifyModalTitle')}>
				<div className="flex flex-col gap-3">
					{activeClarificationPrompt && (
						<div className="flex flex-col gap-1 p-3 rounded-2xl bg-(--background)/60 border border-(--border)/10">
							<span className="text-[11px] font-bold uppercase text-(--text-muted)">{t('app.servers.applications.clarifyPromptLabel')}</span>
							<p className="text-sm text-(--text) whitespace-pre-wrap">{activeClarificationPrompt}</p>
						</div>
					)}
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.servers.applications.clarifyResponseLabel')}</label>
						<Input
							variant="textarea"
							rows={4}
							value={clarifyResponse}
							onChange={(e) => setClarifyResponse(e.target.value)}
							placeholder={t('app.servers.applications.clarifyResponsePlaceholder')}
						/>
					</div>
					<div className="flex items-center justify-end gap-2 pt-2">
						<Button variant="secondary" onClick={() => setClarifyTarget(null)}>
							{t('app.dashboard.applications.positions.modal.cancelBtn')}
						</Button>
						<Button variant="primary" loading={sendingClarify} disabled={!clarifyResponse.trim()} onClick={handleSubmitClarification}>
							<Send className="w-3.5 h-3.5" />
							<span>{t('app.servers.applications.submitClarifyBtn')}</span>
						</Button>
					</div>
				</div>
			</Modal>

			<Confirm
				open={Boolean(withdrawTarget)}
				onOpenChange={(o) => !o && setWithdrawTarget(null)}
				title={t('app.servers.applications.withdrawTitle')}
				description={t('app.servers.applications.withdrawDesc', { id: withdrawTarget?.id || '', position: withdrawTarget?.positionName || '' })}
				variant="danger"
				loading={withdrawing}
				onConfirm={handleConfirmWithdraw}
			/>
		</div>
	);
}
