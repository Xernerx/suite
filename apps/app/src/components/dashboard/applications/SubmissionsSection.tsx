/** @format */
'use client';

import { CheckCircle2, Eye, Inbox, RefreshCw, Trash2, XCircle } from 'lucide-react';
import { Badge, Button, Confirm, Input, Modal, Selector } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { YourAppsPosition, YourAppsSubmission } from './types';

interface SubmissionsSectionProps {
	guildId: string;
	positions: YourAppsPosition[];
	initialSubmissionId?: string | null;
	onCountsChanged: () => void;
}

export default function SubmissionsSection({ guildId, positions, initialSubmissionId = null, onCountsChanged }: SubmissionsSectionProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [submissions, setSubmissions] = useState<YourAppsSubmission[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [positionFilter, setPositionFilter] = useState<string>('all');
	const [search, setSearch] = useState('');

	const [activeSub, setActiveSub] = useState<YourAppsSubmission | null>(null);
	const [openedInitialId, setOpenedInitialId] = useState<string | null>(null);
	const [reviewReason, setReviewReason] = useState('');
	const [deciding, setDeciding] = useState<'approved' | 'denied' | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<YourAppsSubmission | null>(null);
	const [deleting, setDeleting] = useState(false);

	const fetchSubmissions = useCallback(async () => {
		setLoading(true);
		try {
			const qs = new URLSearchParams();
			if (statusFilter !== 'all') qs.set('status', statusFilter);
			if (positionFilter !== 'all') qs.set('positionId', positionFilter);
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/submissions?${qs.toString()}`), {
				credentials: 'include',
			});
			if (res.ok) {
				const data = await res.json();
				setSubmissions(Array.isArray(data?.items) ? data.items : []);
			}
		} catch {
			// Ignore transient error
		} finally {
			setLoading(false);
		}
	}, [guildId, statusFilter, positionFilter, getEnvUrl]);

	useEffect(() => {
		fetchSubmissions();
	}, [fetchSubmissions]);

	useEffect(() => {
		if (!initialSubmissionId || openedInitialId === initialSubmissionId || submissions.length === 0) return;
		const match = submissions.find((s) => s.id === initialSubmissionId);
		if (match) {
			setActiveSub(match);
			setReviewReason(match.reviewReason || '');
			setOpenedInitialId(initialSubmissionId);
		}
	}, [initialSubmissionId, openedInitialId, submissions]);

	const filteredSubmissions = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return submissions;
		return submissions.filter((s) => s.id.toLowerCase().includes(q) || (s.userTag || '').toLowerCase().includes(q) || s.userId.includes(q) || (s.positionName || '').toLowerCase().includes(q));
	}, [submissions, search]);

	const statusBadgeVariant = (status: string): 'warning' | 'success' | 'danger' | 'muted' => {
		if (status === 'approved') return 'success';
		if (status === 'denied') return 'danger';
		if (status === 'pending') return 'warning';
		return 'muted';
	};

	const statusLabel = (status: string) => {
		if (status === 'approved') return t('app.dashboard.applications.submissions.statusApproved');
		if (status === 'denied') return t('app.dashboard.applications.submissions.statusDenied');
		if (status === 'withdrawn') return t('app.dashboard.applications.submissions.statusWithdrawn');
		return t('app.dashboard.applications.submissions.statusPending');
	};

	const handleDecision = async (decision: 'approved' | 'denied') => {
		if (!activeSub) return;
		setDeciding(decision);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/submissions/${activeSub.id}`), {
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
			setActiveSub(null);
			setReviewReason('');
			fetchSubmissions();
			onCountsChanged();
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setDeciding(null);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/submissions/${deleteTarget.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Delete failed');
			toast({ title: t('app.dashboard.applications.toast.submissionDeleted'), type: 'success' });
			setDeleteTarget(null);
			if (activeSub?.id === deleteTarget.id) setActiveSub(null);
			fetchSubmissions();
			onCountsChanged();
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="flex items-center gap-2.5 text-(--text) font-extrabold text-sm tracking-widest uppercase">
					<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
						<Inbox className="w-4 h-4" />
					</div>
					<span>{t('app.dashboard.applications.submissions.title')}</span>
				</div>
				<Button variant="secondary" size="sm" onClick={fetchSubmissions}>
					<RefreshCw className="w-3.5 h-3.5" />
					<span>{t('app.dashboard.applications.refreshBtn')}</span>
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
				<div className="md:col-span-6">
					<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('app.dashboard.applications.submissions.searchPlaceholder')} />
				</div>
				<div className="md:col-span-3">
					<Selector
						value={statusFilter}
						onChange={(v: string) => setStatusFilter(v)}
						options={[
							{ label: t('app.dashboard.applications.submissions.allStatuses'), value: 'all' },
							{ label: t('app.dashboard.applications.submissions.statusPending'), value: 'pending' },
							{ label: t('app.dashboard.applications.submissions.statusApproved'), value: 'approved' },
							{ label: t('app.dashboard.applications.submissions.statusDenied'), value: 'denied' },
						]}
					/>
				</div>
				<div className="md:col-span-3">
					<Selector
						value={positionFilter}
						onChange={(v: string) => setPositionFilter(v)}
						options={[{ label: t('app.dashboard.applications.submissions.allPositions'), value: 'all' }, ...positions.map((p) => ({ label: p.name, value: p.id }))]}
					/>
				</div>
			</div>

			{loading ? (
				<div className="py-12 flex items-center justify-center">
					<Loading variant="small" />
				</div>
			) : filteredSubmissions.length === 0 ? (
				<div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 gap-2">
					<Inbox className="w-8 h-8 text-(--accent)" />
					<span className="text-sm font-bold text-(--text)">{t('app.dashboard.applications.submissions.emptyTitle')}</span>
					<span className="text-xs text-(--text-muted) max-w-md">{t('app.dashboard.applications.submissions.emptyDesc')}</span>
				</div>
			) : (
				<div className="flex flex-col gap-2.5">
					{filteredSubmissions.map((sub) => (
						<div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
							<div className="flex flex-col gap-1 min-w-0">
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-sm font-bold text-(--text)">{sub.userTag || sub.userId}</span>
									<span className="text-[11px] font-mono text-(--text-muted)">#{sub.id}</span>
									<Badge variant="accent">{sub.positionName}</Badge>
									<Badge variant={statusBadgeVariant(sub.status)} dot>
										{statusLabel(sub.status)}
									</Badge>
								</div>
								<div className="flex flex-wrap items-center gap-2 text-[11px] text-(--text-muted)">
									{sub.createdAt && <span>{t('app.dashboard.applications.submissions.submittedAt', { date: new Date(sub.createdAt).toLocaleString() })}</span>}
									{sub.reviewedBy && (
										<>
											<span>•</span>
											<span>{t('app.dashboard.applications.submissions.reviewedBy', { reviewer: sub.reviewedByTag || sub.reviewedBy })}</span>
										</>
									)}
								</div>
							</div>

							<div className="flex items-center gap-2 shrink-0">
								<Button
									variant={sub.status === 'pending' ? 'primary' : 'secondary'}
									size="sm"
									onClick={() => {
										setActiveSub(sub);
										setReviewReason(sub.reviewReason || '');
									}}
								>
									<Eye className="w-3.5 h-3.5" />
									<span>{t('app.dashboard.applications.submissions.inspectBtn')}</span>
								</Button>
								<Button variant="danger" size="sm" onClick={() => setDeleteTarget(sub)}>
									<Trash2 className="w-3.5 h-3.5" />
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			<Modal
				open={Boolean(activeSub)}
				onOpenChange={(o) => !o && setActiveSub(null)}
				size="2xl"
				title={t('app.dashboard.applications.submissions.modal.title', { position: activeSub?.positionName || '' })}
			>
				{activeSub && (
					<div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
						<div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-(--background)/60 border border-(--border)/10">
							<div className="flex flex-col">
								<span className="text-[11px] text-(--text-muted)">{t('app.dashboard.applications.submissions.modal.applicant')}</span>
								<span className="text-sm font-bold text-(--text)">
									{activeSub.userTag || activeSub.userId} <span className="text-xs font-mono text-(--text-muted)">({activeSub.userId})</span>
								</span>
							</div>
							<Badge variant={statusBadgeVariant(activeSub.status)} size="md" dot>
								{statusLabel(activeSub.status)}
							</Badge>
						</div>

						<div className="flex flex-col gap-2.5">
							<span className="text-xs font-extrabold uppercase tracking-wider text-(--text)">{t('app.dashboard.applications.submissions.modal.answersTitle')}</span>
							{activeSub.answers.map((ans, idx) => (
								<div key={`${ans.questionId}-${idx}`} className="flex flex-col gap-1 p-3.5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
									<span className="text-xs font-bold text-(--text)">
										{idx + 1}. {ans.question}
									</span>
									<p className="text-sm text-(--text-muted) whitespace-pre-wrap break-words">{ans.answer || t('app.dashboard.applications.submissions.modal.noAnswer')}</p>
								</div>
							))}
						</div>

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

						<div className="flex flex-wrap items-center justify-between gap-2 pt-2">
							<Button variant="danger" size="sm" onClick={() => setDeleteTarget(activeSub)}>
								<Trash2 className="w-3.5 h-3.5" />
								<span>{t('app.dashboard.applications.submissions.modal.deleteBtn')}</span>
							</Button>
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
						</div>
					</div>
				)}
			</Modal>

			<Confirm
				open={Boolean(deleteTarget)}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
				title={t('app.dashboard.applications.submissions.modal.deleteTitle')}
				description={t('app.dashboard.applications.submissions.modal.deleteDesc', { id: deleteTarget?.id || '' })}
				variant="danger"
				loading={deleting}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
