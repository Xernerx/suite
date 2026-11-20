/** @format */
'use client';

import { BarChart3, Download, Eye, Inbox, RefreshCw, Trash2 } from 'lucide-react';
import { Badge, Button, Confirm, Input, Selector } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import SubmissionInspectorModal from './SubmissionInspectorModal';
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
				const list: YourAppsSubmission[] = Array.isArray(data?.items) ? data.items : [];
				setSubmissions(list);
				setActiveSub((prev) => (prev ? list.find((item) => item.id === prev.id) || prev : null));
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
			setOpenedInitialId(initialSubmissionId);
		}
	}, [initialSubmissionId, openedInitialId, submissions]);

	const filteredSubmissions = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return submissions;
		return submissions.filter((s) => s.id.toLowerCase().includes(q) || (s.userTag || '').toLowerCase().includes(q) || s.userId.includes(q) || (s.positionName || '').toLowerCase().includes(q));
	}, [submissions, search]);

	const selectedPosition = useMemo(() => (positionFilter !== 'all' ? positions.find((p) => p.id === positionFilter) || null : null), [positionFilter, positions]);

	const choiceBreakdowns = useMemo(() => {
		if (!selectedPosition || filteredSubmissions.length === 0) return [];
		const choiceQuestions = (selectedPosition.questions || []).filter((q) => ['select', 'radio', 'multiselect', 'boolean', 'checkbox'].includes(q.type));
		if (choiceQuestions.length === 0) return [];

		return choiceQuestions.map((q) => {
			const counts = new Map<string, number>();
			if (q.type === 'boolean') {
				counts.set(q.options?.[0]?.trim() || 'Yes', 0);
				counts.set(q.options?.[1]?.trim() || 'No', 0);
			} else if (q.type === 'checkbox') {
				counts.set('Yes', 0);
				counts.set('No', 0);
			} else {
				for (const opt of q.options || []) {
					if (opt.trim()) counts.set(opt.trim(), 0);
				}
			}

			let totalAnswered = 0;
			for (const sub of filteredSubmissions) {
				if (sub.status === 'withdrawn') continue;
				const match = (sub.answers || []).find((a) => a.questionId === q.id);
				const raw = (match?.answer || '').trim();
				if (!raw) continue;
				totalAnswered++;
				const parts =
					q.type === 'multiselect'
						? raw
								.split(',')
								.map((x) => x.trim())
								.filter(Boolean)
						: [raw];
				for (const p of parts) {
					counts.set(p, (counts.get(p) || 0) + 1);
				}
			}

			return {
				questionId: q.id,
				question: q.question,
				totalAnswered,
				entries: Array.from(counts.entries()).map(([label, count]) => ({
					label,
					count,
					percent: totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0,
				})),
			};
		});
	}, [selectedPosition, filteredSubmissions]);

	const statusBadgeVariant = (status: string): 'warning' | 'success' | 'danger' | 'accent' | 'muted' => {
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

	const handleExport = (format: 'csv' | 'json') => {
		if (filteredSubmissions.length === 0) return;
		let blob: Blob;
		const filename = `yourapps-submissions-${guildId}-${new Date().toISOString().slice(0, 10)}.${format}`;

		if (format === 'json') {
			blob = new Blob([JSON.stringify(filteredSubmissions, null, 2)], { type: 'application/json' });
		} else {
			const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
			const headers = ['ID', 'Position', 'Applicant', 'Applicant ID', 'Status', 'Upvotes', 'Downvotes', 'Submitted At', 'Reviewed By', 'Review Reason', 'Answers'];
			const rows = filteredSubmissions.map((s) => {
				const ups = (s.votes || []).filter((v) => v.vote === 'up').length;
				const downs = (s.votes || []).filter((v) => v.vote === 'down').length;
				const answersText = (s.answers || []).map((a, i) => `${i + 1}. ${a.question}: ${a.answer}`).join(' | ');
				return [
					s.id,
					s.positionName,
					s.anonymous ? 'Anonymous' : s.userTag,
					s.anonymous ? 'anonymous' : s.userId,
					s.status,
					ups,
					downs,
					s.createdAt || '',
					s.reviewedByTag || s.reviewedBy || '',
					s.reviewReason || '',
					answersText,
				]
					.map(esc)
					.join(',');
			});
			blob = new Blob([[headers.map(esc).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
		}

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
		toast({ title: t('app.dashboard.applications.toast.exportedToast', { count: filteredSubmissions.length }), type: 'success' });
	};

	const activePositionObj = activeSub ? positions.find((p) => p.id === activeSub.positionId) || null : null;

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{choiceBreakdowns.length > 0 && (selectedPosition?.category === 'poll' || choiceBreakdowns.some((b) => b.totalAnswered > 0)) && (
				<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2.5 text-(--text) font-extrabold text-sm tracking-widest uppercase">
							<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
								<BarChart3 className="w-4 h-4" />
							</div>
							<span>{t('app.dashboard.applications.submissions.pollResultsTitle')}</span>
						</div>
						<Badge variant="accent">{selectedPosition?.name}</Badge>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{choiceBreakdowns.map((item) => (
							<div key={item.questionId} className="flex flex-col gap-2.5 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
								<div className="flex items-start justify-between gap-2">
									<span className="text-xs font-bold text-(--text)">{item.question}</span>
									<span className="text-[11px] font-mono text-(--text-muted) shrink-0">
										{t('app.dashboard.applications.submissions.pollResultsResponses', { count: item.totalAnswered })}
									</span>
								</div>
								<div className="flex flex-col gap-1.5">
									{item.entries.map((ent) => (
										<div key={ent.label} className="flex flex-col gap-1">
											<div className="flex items-center justify-between text-xs">
												<span className="text-(--text) truncate">{ent.label}</span>
												<span className="font-mono text-(--text-muted)">
													{ent.percent}% ({ent.count})
												</span>
											</div>
											<div className="h-2 rounded-full bg-(--foreground)/40 overflow-hidden">
												<div className="h-full rounded-full bg-(--accent) transition-all" style={{ width: `${ent.percent}%` }} />
											</div>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-2.5 text-(--text) font-extrabold text-sm tracking-widest uppercase">
						<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
							<Inbox className="w-4 h-4" />
						</div>
						<span>{t('app.dashboard.applications.submissions.title')}</span>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{filteredSubmissions.length > 0 && (
							<>
								<Button variant="ghost" size="sm" onClick={() => handleExport('csv')}>
									<Download className="w-3.5 h-3.5" />
									<span>{t('app.dashboard.applications.submissions.exportCsvBtn')}</span>
								</Button>
								<Button variant="ghost" size="sm" onClick={() => handleExport('json')}>
									<Download className="w-3.5 h-3.5" />
									<span>{t('app.dashboard.applications.submissions.exportJsonBtn')}</span>
								</Button>
							</>
						)}
						<Button variant="secondary" size="sm" onClick={fetchSubmissions}>
							<RefreshCw className="w-3.5 h-3.5" />
							<span>{t('app.dashboard.applications.refreshBtn')}</span>
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
					<div className="md:col-span-6">
						<Input
							variant="search"
							shortcut={true}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t('app.dashboard.applications.submissions.searchPlaceholder')}
						/>
					</div>
					<div className="md:col-span-3">
						<Selector
							value={statusFilter}
							onChange={(v: string) => setStatusFilter(v)}
							options={[
								{ label: t('app.dashboard.applications.submissions.allStatuses'), value: 'all' },
								{ label: t('app.dashboard.applications.submissions.statusPending'), value: 'pending' },
								{ label: t('app.dashboard.applications.submissions.statusInterview'), value: 'interview' },
								{ label: t('app.dashboard.applications.submissions.statusNeedsInfo'), value: 'needs_info' },
								{ label: t('app.dashboard.applications.submissions.statusApproved'), value: 'approved' },
								{ label: t('app.dashboard.applications.submissions.statusDenied'), value: 'denied' },
								{ label: t('app.dashboard.applications.submissions.statusWithdrawn'), value: 'withdrawn' },
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
						{filteredSubmissions.map((sub) => {
							const ups = (sub.votes || []).filter((v) => v.vote === 'up').length;
							const downs = (sub.votes || []).filter((v) => v.vote === 'down').length;
							const notesLen = (sub.internalNotes || []).length;
							const isReviewable = ['pending', 'interview', 'needs_info'].includes(sub.status);

							return (
								<div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
									<div className="flex flex-col gap-1 min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<span className="text-sm font-bold text-(--text)">
												{sub.anonymous ? t('app.dashboard.applications.submissions.anonymousApplicant') : sub.userTag || sub.userId}
											</span>
											<span className="text-[11px] font-mono text-(--text-muted)">#{sub.id}</span>
											<Badge variant="accent">{sub.positionName}</Badge>
											<Badge variant={statusBadgeVariant(sub.status)} dot>
												{statusLabel(sub.status)}
											</Badge>
											{(ups > 0 || downs > 0) && (
												<Badge variant="outline">
													👍 {ups} • 👎 {downs}
												</Badge>
											)}
											{notesLen > 0 && <Badge variant="outline">🗒️ {notesLen}</Badge>}
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
										<Button variant={isReviewable ? 'primary' : 'secondary'} size="sm" onClick={() => setActiveSub(sub)}>
											<Eye className="w-3.5 h-3.5" />
											<span>{t('app.dashboard.applications.submissions.inspectBtn')}</span>
										</Button>
										<Button variant="danger" size="sm" onClick={() => setDeleteTarget(sub)}>
											<Trash2 className="w-3.5 h-3.5" />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			<SubmissionInspectorModal
				guildId={guildId}
				submission={activeSub}
				position={activePositionObj}
				statusBadgeVariant={statusBadgeVariant}
				statusLabel={statusLabel}
				onClose={() => setActiveSub(null)}
				onUpdatedSubmission={(updated) => {
					setActiveSub(updated);
					fetchSubmissions();
					onCountsChanged();
				}}
				onClosedAfterDecision={() => {
					setActiveSub(null);
					fetchSubmissions();
					onCountsChanged();
				}}
				onRequestDelete={(sub) => setDeleteTarget(sub)}
			/>

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
