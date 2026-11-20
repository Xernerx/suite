/** @format */
'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ClipboardList, FileEdit, Trash2 } from 'lucide-react';
import { Button, Confirm, Selector } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import type { UserYourAppsDraftItem, UserYourAppsSubmissionItem } from './types';

interface UserYourAppsServerSectionProps {
	userId: string;
	guildId: string;
	serverName: string;
	hasData: boolean;
	submissions: UserYourAppsSubmissionItem[];
	drafts: UserYourAppsDraftItem[];
	getEnvUrl: (url: string) => string;
	onReload: () => Promise<void>;
}

export function UserYourAppsServerSection({ userId, guildId, serverName, hasData, submissions, drafts, getEnvUrl, onReload }: UserYourAppsServerSectionProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
	const [updatingId, setUpdatingId] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<{ kind: 'submission' | 'draft' | 'wipe'; id?: string; label: string } | null>(null);
	const [deleting, setDeleting] = useState(false);

	const handleStatusChange = async (submissionId: string, nextStatus: string) => {
		setUpdatingId(submissionId);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}/bots`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					action: 'update_yourapps_submission',
					submissionId,
					status: nextStatus,
				}),
			});
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: t('admin.users.botProfiles.submissionUpdated') });
			await onReload();
		} catch {
			toast({ type: 'error', title: t('admin.users.botProfiles.updateError') });
		} finally {
			setUpdatingId(null);
		}
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			const params = new URLSearchParams();
			if (deleteTarget.kind === 'submission' && deleteTarget.id) {
				params.set('submissionId', deleteTarget.id);
			} else if (deleteTarget.kind === 'draft' && deleteTarget.id) {
				params.set('draftId', deleteTarget.id);
			} else {
				params.set('guildId', guildId);
				params.set('bot', 'yourapps');
			}
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${userId}/bots?${params.toString()}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: t('admin.users.botProfiles.resetSuccess') });
			setDeleteTarget(null);
			await onReload();
		} catch {
			toast({ type: 'error', title: t('admin.users.botProfiles.resetError') });
		} finally {
			setDeleting(false);
		}
	};

	const statusBadgeClass = (status: string) => {
		if (status === 'approved') return 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/30';
		if (status === 'denied') return 'bg-(--accent-red)/15 text-(--accent-red) border-(--accent-red)/30';
		if (status === 'withdrawn') return 'bg-(--border)/15 text-(--text-muted) border-(--border)/20';
		return 'bg-(--accent-orange)/15 text-(--accent-orange) border-(--accent-orange)/30';
	};

	return (
		<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md p-4" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent)">
						<ClipboardList size={16} />
					</span>
					<div>
						<h4 className="text-sm font-extrabold text-(--text)">{t('admin.users.botProfiles.yourappsTitle')}</h4>
						<p className="text-xs text-(--text-muted)">
							{t('admin.users.botProfiles.yourappsSummary', {
								submissions: submissions.length,
								drafts: drafts.length,
							})}
						</p>
					</div>
				</div>
				{hasData && (
					<Button type="button" variant="danger" size="sm" onClick={() => setDeleteTarget({ kind: 'wipe', label: serverName })} className="flex items-center gap-1.5">
						<Trash2 size={13} />
						<span>{t('admin.users.botProfiles.wipeYourApps')}</span>
					</Button>
				)}
			</div>

			{!hasData ? (
				<div className="rounded-2xl border border-(--border)/10 bg-(--background)/50 px-4 py-6 text-center text-xs text-(--text-muted)">{t('admin.users.botProfiles.noYourAppsData')}</div>
			) : (
				<div className="flex flex-col gap-3">
					{submissions.length > 0 && (
						<div className="flex flex-col gap-2">
							<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('admin.users.botProfiles.submissionsHeading', { count: submissions.length })}</span>
							{submissions.map((sub) => {
								const isExpanded = expandedSubId === sub.id;
								return (
									<div key={sub.id} className="flex flex-col rounded-2xl border border-(--border)/10 bg-(--background)/50 p-3 gap-2.5">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div className="flex flex-wrap items-center gap-2 min-w-0">
												<span className="text-xs font-bold text-(--text) truncate">{sub.positionName}</span>
												<span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${statusBadgeClass(sub.status)}`}>{sub.status}</span>
												{sub.createdAt && <span className="text-[11px] font-mono text-(--text-muted)">{new Date(sub.createdAt).toLocaleDateString()}</span>}
											</div>
											<div className="flex items-center gap-2">
												<div className="w-36">
													<Selector
														value={sub.status}
														disabled={updatingId === sub.id}
														onChange={(val) => handleStatusChange(sub.id, val)}
														options={[
															{ value: 'pending', label: t('admin.users.botProfiles.statusPending') },
															{ value: 'approved', label: t('admin.users.botProfiles.statusApproved') },
															{ value: 'denied', label: t('admin.users.botProfiles.statusDenied') },
															{ value: 'withdrawn', label: t('admin.users.botProfiles.statusWithdrawn') },
														]}
														toggleClassName="!h-8 !text-xs"
													/>
												</div>
												<button
													type="button"
													onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
													className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-(--foreground)/50 hover:bg-(--foreground) text-(--text) transition-colors cursor-pointer"
												>
													{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
												</button>
												<button
													type="button"
													onClick={() => setDeleteTarget({ kind: 'submission', id: sub.id, label: sub.positionName })}
													className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-(--accent-red)/10 hover:bg-(--accent-red)/20 text-(--accent-red) transition-colors cursor-pointer"
												>
													<Trash2 size={13} />
												</button>
											</div>
										</div>

										{isExpanded && (
											<div className="flex flex-col gap-2 pt-2 border-t border-(--border)/10">
												{sub.reviewReason && (
													<div className="rounded-xl bg-(--foreground)/40 px-3 py-2 text-xs text-(--text-muted)">
														<span className="font-bold text-(--text)">{t('admin.users.botProfiles.reviewReasonLabel')}: </span>
														{sub.reviewReason}
													</div>
												)}
												{sub.answers.length === 0 ? (
													<p className="text-xs text-(--text-muted)">{t('admin.users.botProfiles.noAnswers')}</p>
												) : (
													sub.answers.map((ans, idx) => (
														<div key={`${ans.questionId}-${idx}`} className="rounded-xl bg-(--foreground)/30 px-3 py-2">
															<p className="text-[11px] font-bold text-(--text-muted)">{ans.question}</p>
															<p className="text-xs text-(--text) whitespace-pre-wrap mt-0.5">{ans.answer || '—'}</p>
														</div>
													))
												)}
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}

					{drafts.length > 0 && (
						<div className="flex flex-col gap-2">
							<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('admin.users.botProfiles.draftsHeading', { count: drafts.length })}</span>
							{drafts.map((dr) => (
								<div key={dr.id} className="flex items-center justify-between rounded-2xl border border-(--border)/10 bg-(--background)/50 p-3 gap-2">
									<div className="flex items-center gap-2 min-w-0">
										<FileEdit size={14} className="text-(--accent) shrink-0" />
										<div className="min-w-0">
											<p className="text-xs font-bold text-(--text) truncate">{dr.positionName}</p>
											<p className="text-[11px] text-(--text-muted)">
												{t('admin.users.botProfiles.draftStepInfo', {
													step: dr.currentStep + 1,
													answered: dr.answers.length,
												})}
											</p>
										</div>
									</div>
									<button
										type="button"
										onClick={() => setDeleteTarget({ kind: 'draft', id: dr.id, label: dr.positionName })}
										className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-(--accent-red)/10 hover:bg-(--accent-red)/20 text-(--accent-red) transition-colors cursor-pointer shrink-0"
									>
										<Trash2 size={13} />
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			<Confirm
				open={Boolean(deleteTarget)}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
				title={t('admin.users.botProfiles.confirmDeleteTitle')}
				description={t('admin.users.botProfiles.confirmDeleteDesc', { target: deleteTarget?.label || '' })}
				confirmText={t('admin.roles.confirmDelete')}
				cancelText={t('admin.roles.cancel')}
				variant="danger"
				loading={deleting}
				onConfirm={handleConfirmDelete}
			/>
		</div>
	);
}
