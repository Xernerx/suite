/** @format */
'use client';

import { CheckCircle2, HelpCircle, Lock, MessageSquare, Send, ThumbsDown, ThumbsUp, Trash2, XCircle } from 'lucide-react';
import { Badge, Button, Input, Modal } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import type { YourAppsPosition, YourAppsSubmission } from './types';

interface SubmissionInspectorModalProps {
	guildId: string;
	submission: YourAppsSubmission | null;
	position: YourAppsPosition | null;
	statusBadgeVariant: (status: string) => 'warning' | 'success' | 'danger' | 'accent' | 'muted';
	statusLabel: (status: string) => string;
	onClose: () => void;
	onUpdatedSubmission: (updated: YourAppsSubmission) => void;
	onClosedAfterDecision: () => void;
	onRequestDelete: (submission: YourAppsSubmission) => void;
}

export default function SubmissionInspectorModal({
	guildId,
	submission,
	position,
	statusBadgeVariant,
	statusLabel,
	onClose,
	onUpdatedSubmission,
	onClosedAfterDecision,
	onRequestDelete,
}: SubmissionInspectorModalProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [reviewReason, setReviewReason] = useState('');
	const [noteDraft, setNoteDraft] = useState('');
	const [clarifyDraft, setClarifyDraft] = useState('');
	const [busyAction, setBusyAction] = useState<string | null>(null);
	const [deciding, setDeciding] = useState<'approved' | 'denied' | null>(null);

	useEffect(() => {
		if (submission) {
			setReviewReason(submission.reviewReason || '');
			setNoteDraft('');
			setClarifyDraft('');
		}
	}, [submission?.id]);

	const runReviewerSubAction = async (actionKey: string, payload: Record<string, any>, successToastKey: string) => {
		if (!submission) return;
		setBusyAction(actionKey);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/submissions/${submission.id}`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || 'Action failed');

			onUpdatedSubmission(data);
			toast({ title: t(successToastKey), type: 'success' });
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setBusyAction(null);
		}
	};

	const handleDecision = async (decision: 'approved' | 'denied') => {
		if (!submission) return;
		setDeciding(decision);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/submissions/${submission.id}`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: decision,
					reason: reviewReason.trim() || null,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || 'Review failed');

			toast({
				title: decision === 'approved' ? t('app.dashboard.applications.toast.submissionApproved') : t('app.dashboard.applications.toast.submissionDenied'),
				type: 'success',
			});
			onClosedAfterDecision();
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setDeciding(null);
		}
	};

	const activeVotes = submission?.votes || [];
	const upVotesCount = activeVotes.filter((v) => v.vote === 'up').length;
	const downVotesCount = activeVotes.filter((v) => v.vote === 'down').length;
	const activeNotes = submission?.internalNotes || [];
	const activeClarifications = submission?.clarifications || [];
	const isActiveReviewable = submission ? ['pending', 'interview', 'needs_info'].includes(submission.status) : false;

	return (
		<Modal
			open={Boolean(submission)}
			onOpenChange={(o) => !o && onClose()}
			size="3xl"
			title={t('app.dashboard.applications.submissions.modal.title', { position: submission?.positionName || '' })}
		>
			{submission && (
				<div className="flex flex-col gap-4 max-h-[76vh] overflow-y-auto pr-1">
					<div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-(--background)/60 border border-(--border)/10">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<div className="flex flex-col">
								<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.submissions.modal.applicant')}</span>
								<span className="text-sm font-bold text-(--text)">
									{submission.anonymous ? (
										t('app.dashboard.applications.submissions.anonymousApplicant')
									) : (
										<>
											{submission.userTag || submission.userId} <span className="text-xs font-mono text-(--text-muted)">({submission.userId})</span>
										</>
									)}
								</span>
							</div>
							<div className="flex items-center gap-2">
								{submission.interviewChannelId && <Badge variant="accent">{t('app.dashboard.applications.submissions.modal.interviewActiveBadge')}</Badge>}
								<Badge variant={statusBadgeVariant(submission.status)} size="md" dot>
									{statusLabel(submission.status)}
								</Badge>
							</div>
						</div>

						{!submission.anonymous && submission.applicantMeta && (
							<div className="flex flex-wrap items-center gap-2 pt-2 border-t border-(--border)/10 text-[11px] text-(--text-muted)">
								{submission.applicantMeta.accountCreatedAt && (
									<Badge variant="outline">
										{t('app.dashboard.applications.submissions.modal.dossierAccount', {
											date: new Date(submission.applicantMeta.accountCreatedAt).toLocaleDateString(),
										})}
									</Badge>
								)}
								{submission.applicantMeta.guildJoinedAt && (
									<Badge variant="outline">
										{t('app.dashboard.applications.submissions.modal.dossierJoined', {
											date: new Date(submission.applicantMeta.guildJoinedAt).toLocaleDateString(),
										})}
									</Badge>
								)}
								{typeof submission.applicantMeta.priorSubmissionsCount === 'number' && submission.applicantMeta.priorSubmissionsCount > 0 && (
									<Badge variant="accent">{t('app.dashboard.applications.submissions.modal.dossierPrior', { count: submission.applicantMeta.priorSubmissionsCount })}</Badge>
								)}
							</div>
						)}
					</div>

					{isActiveReviewable && (
						<div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
							<div className="flex flex-wrap items-center gap-2">
								<Button
									variant="secondary"
									size="sm"
									loading={busyAction === 'vote-up'}
									onClick={() => runReviewerSubAction('vote-up', { action: 'vote', vote: 'up' }, 'app.dashboard.applications.toast.voteSaved')}
								>
									<ThumbsUp className="w-3.5 h-3.5" />
									<span>{t('app.dashboard.applications.submissions.modal.upvoteBtn', { count: upVotesCount })}</span>
								</Button>
								<Button
									variant="secondary"
									size="sm"
									loading={busyAction === 'vote-down'}
									onClick={() => runReviewerSubAction('vote-down', { action: 'vote', vote: 'down' }, 'app.dashboard.applications.toast.voteSaved')}
								>
									<ThumbsDown className="w-3.5 h-3.5" />
									<span>{t('app.dashboard.applications.submissions.modal.downvoteBtn', { count: downVotesCount })}</span>
								</Button>
								{Number(position?.minVotesToApprove) > 0 && (
									<span className="text-[11px] text-(--text-muted)">
										{t('app.dashboard.applications.submissions.modal.minVotesHint', { count: position?.minVotesToApprove || 0 })}
									</span>
								)}
							</div>

							{!submission.anonymous && (
								<div>
									{submission.interviewChannelId ? (
										<Button
											variant="secondary"
											size="sm"
											loading={busyAction === 'close-interview'}
											onClick={() => runReviewerSubAction('close-interview', { action: 'close_interview' }, 'app.dashboard.applications.toast.interviewClosed')}
										>
											<Lock className="w-3.5 h-3.5" />
											<span>{t('app.dashboard.applications.submissions.modal.closeInterviewBtn')}</span>
										</Button>
									) : (
										<Button
											variant="secondary"
											size="sm"
											loading={busyAction === 'open-interview'}
											onClick={() => runReviewerSubAction('open-interview', { action: 'open_interview' }, 'app.dashboard.applications.toast.interviewOpened')}
										>
											<MessageSquare className="w-3.5 h-3.5" />
											<span>{t('app.dashboard.applications.submissions.modal.openInterviewBtn')}</span>
										</Button>
									)}
								</div>
							)}
						</div>
					)}

					<div className="flex flex-col gap-2.5">
						<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">{t('app.dashboard.applications.submissions.modal.answersTitle')}</span>
						{submission.answers.map((ans, idx) => (
							<div key={`${ans.questionId}-${idx}`} className="flex flex-col gap-1 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
								<span className="text-xs font-bold text-(--text)">
									{idx + 1}. {ans.question}
								</span>
								<p className="text-sm text-(--text-muted) whitespace-pre-wrap break-words">{ans.answer || t('app.dashboard.applications.submissions.modal.noAnswer')}</p>
							</div>
						))}
					</div>

					{!submission.anonymous && (activeClarifications.length > 0 || isActiveReviewable) && (
						<div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
							<div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-(--text)">
								<HelpCircle className="w-3.5 h-3.5 text-(--accent)" />
								<span>{t('app.dashboard.applications.submissions.modal.clarifyTitle')}</span>
							</div>

							{activeClarifications.map((cl) => (
								<div key={cl.id} className="flex flex-col gap-1 p-3 rounded-xl bg-(--foreground)/30 border border-(--border)/10 text-xs">
									<span className="font-bold text-(--text)">Q: {cl.prompt}</span>
									<span className="text-(--text-muted) whitespace-pre-wrap">{cl.response || t('app.dashboard.applications.submissions.modal.clarifyPending')}</span>
								</div>
							))}

							{isActiveReviewable && (
								<div className="flex items-center gap-2">
									<Input
										value={clarifyDraft}
										onChange={(e) => setClarifyDraft(e.target.value)}
										onKeyDown={(e) => {
											if (e.nativeEvent.isComposing || e.keyCode === 229) return;
											if (e.key === 'Enter' && clarifyDraft.trim() && !busyAction) {
												e.preventDefault();
												const prompt = clarifyDraft.trim();
												setClarifyDraft('');
												void runReviewerSubAction('clarify', { action: 'request_info', prompt }, 'app.dashboard.applications.toast.clarificationSent');
											}
										}}
										placeholder={t('app.dashboard.applications.submissions.modal.clarifyPlaceholder')}
									/>
									<Button
										variant="secondary"
										size="sm"
										loading={busyAction === 'clarify'}
										disabled={!clarifyDraft.trim()}
										onClick={async () => {
											const prompt = clarifyDraft.trim();
											setClarifyDraft('');
											await runReviewerSubAction('clarify', { action: 'request_info', prompt }, 'app.dashboard.applications.toast.clarificationSent');
										}}
										className="shrink-0"
									>
										<Send className="w-3.5 h-3.5" />
										<span>{t('app.dashboard.applications.submissions.modal.sendClarifyBtn')}</span>
									</Button>
								</div>
							)}
						</div>
					)}

					<div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
						<div className="flex items-center justify-between gap-2">
							<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">{t('app.dashboard.applications.submissions.modal.internalNotesTitle')}</span>
							<Badge variant="outline">{t('app.dashboard.applications.submissions.modal.internalNotesBadge')}</Badge>
						</div>

						{activeNotes.length === 0 ? (
							<span className="text-xs text-(--text-muted)">{t('app.dashboard.applications.submissions.modal.internalNotesEmpty')}</span>
						) : (
							<div className="flex flex-col gap-1.5">
								{activeNotes.map((n) => (
									<div key={n.id} className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-(--foreground)/30 border border-(--border)/10 text-xs">
										<span className="font-bold text-(--text)">{n.authorTag || n.authorId}</span>
										<span className="text-(--text-muted) whitespace-pre-wrap">{n.content}</span>
									</div>
								))}
							</div>
						)}

						<div className="flex items-center gap-2">
							<Input
								value={noteDraft}
								onChange={(e) => setNoteDraft(e.target.value)}
								onKeyDown={(e) => {
									if (e.nativeEvent.isComposing || e.keyCode === 229) return;
									if (e.key === 'Enter' && noteDraft.trim() && !busyAction) {
										e.preventDefault();
										const content = noteDraft.trim();
										setNoteDraft('');
										void runReviewerSubAction('note', { action: 'note', content }, 'app.dashboard.applications.toast.noteAdded');
									}
								}}
								placeholder={t('app.dashboard.applications.submissions.modal.internalNotesPlaceholder')}
							/>
							<Button
								variant="secondary"
								size="sm"
								loading={busyAction === 'note'}
								disabled={!noteDraft.trim()}
								onClick={async () => {
									const content = noteDraft.trim();
									setNoteDraft('');
									await runReviewerSubAction('note', { action: 'note', content }, 'app.dashboard.applications.toast.noteAdded');
								}}
								className="shrink-0"
							>
								<span>{t('app.dashboard.applications.submissions.modal.addNoteBtn')}</span>
							</Button>
						</div>
					</div>

					{isActiveReviewable && (
						<div className="flex flex-col gap-1.5 pt-2 border-t border-(--border)/10">
							<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.submissions.modal.reasonLabel')}</label>
							<Input
								variant="textarea"
								rows={2}
								value={reviewReason}
								onChange={(e) => setReviewReason(e.target.value)}
								placeholder={t('app.dashboard.applications.submissions.modal.reasonPlaceholder')}
							/>
						</div>
					)}

					<div className="flex flex-wrap items-center justify-between gap-2 pt-2">
						<Button variant="danger" size="sm" onClick={() => onRequestDelete(submission)}>
							<Trash2 className="w-3.5 h-3.5" />
							<span>{t('app.dashboard.applications.submissions.modal.deleteBtn')}</span>
						</Button>
						{isActiveReviewable && (
							<div className="flex items-center gap-2">
								<Button variant="danger" loading={deciding === 'denied'} disabled={deciding !== null} onClick={() => handleDecision('denied')}>
									<XCircle className="w-4 h-4" />
									<span>{t('app.dashboard.applications.submissions.modal.denyBtn')}</span>
								</Button>
								<Button variant="primary" loading={deciding === 'approved'} disabled={deciding !== null} onClick={() => handleDecision('approved')}>
									<CheckCircle2 className="w-4 h-4" />
									<span>{t('app.dashboard.applications.submissions.modal.approveBtn')}</span>
								</Button>
							</div>
						)}
					</div>
				</div>
			)}
		</Modal>
	);
}
