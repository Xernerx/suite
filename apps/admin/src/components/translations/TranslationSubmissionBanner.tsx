/** @format */
'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, GitBranch, Loader2, Lock, RefreshCw } from 'lucide-react';
import { Button } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export interface TranslationSubmissionStatus {
	language: string;
	canaryVersionAtSubmit: string;
	canaryShaAtSubmit?: string;
	dictionaryCommitSha?: string;
	submittedAt: string;
	submittedBy?: { id: string; name: string };
	unlocked?: boolean;
	unlockedAt?: string;
	unlockedCanaryVersion?: string;
	isLocked: boolean;
	phase: 'syncing' | 'waiting_version' | 'building' | 'build_failed' | 'unlocked';
	currentCanaryVersion: string;
	targetCanaryVersion: string;
	buildStatus?: string | null;
	buildConclusion?: string | null;
	buildUrl?: string | null;
}

interface TranslationSubmissionBannerProps {
	submissionStatus: TranslationSubmissionStatus | null;
	refreshingStatus: boolean;
	onRefresh: () => void;
}

export function TranslationSubmissionBanner({ submissionStatus, refreshingStatus, onRefresh }: TranslationSubmissionBannerProps) {
	const { t } = useDictionary();

	if (!submissionStatus) return null;

	if (!submissionStatus.isLocked) {
		return (
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-green)/25 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{
					padding: 'var(--ui-gap)',
					gap: 'var(--ui-gap)',
				}}
			>
				<div className="flex items-start sm:items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent-green)/10 text-(--accent-green)">
						<CheckCircle2 size={20} />
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.2)' }}>
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-sm font-bold text-(--text)">{t('admin.translations.submissionLock.unlockedTitle')}</span>
							<span className="rounded-full bg-(--accent-green)/10 border border-(--accent-green)/25 px-2.5 py-0.5 text-[11px] font-semibold text-(--accent-green)">
								Canary v{submissionStatus.currentCanaryVersion}
							</span>
						</div>
						<p className="text-xs text-(--text-muted)">
							{t('admin.translations.submissionLock.unlockedDesc', {
								atSubmit: submissionStatus.canaryVersionAtSubmit,
								canaryVersion: submissionStatus.currentCanaryVersion,
							})}
						</p>
					</div>
				</div>
			</div>
		);
	}

	const isAnimatedPhase = submissionStatus.phase === 'syncing' || submissionStatus.phase === 'building';
	const isFailedPhase = submissionStatus.phase === 'build_failed';

	const phaseDescription =
		submissionStatus.phase === 'syncing'
			? t('admin.translations.submissionLock.phaseSyncing', { canaryVersion: submissionStatus.canaryVersionAtSubmit })
			: submissionStatus.phase === 'building'
				? t('admin.translations.submissionLock.phaseBuilding', { targetVersion: submissionStatus.targetCanaryVersion })
				: submissionStatus.phase === 'build_failed'
					? t('admin.translations.submissionLock.phaseFailed', { targetVersion: submissionStatus.targetCanaryVersion })
					: t('admin.translations.submissionLock.phaseWaitingVersion', { canaryVersion: submissionStatus.canaryVersionAtSubmit });

	const statusPillText =
		submissionStatus.phase === 'syncing'
			? t('admin.translations.submissionLock.badgeSyncing')
			: submissionStatus.phase === 'building'
				? t('admin.translations.submissionLock.badgeBuilding')
				: submissionStatus.phase === 'build_failed'
					? t('admin.translations.submissionLock.badgeFailed')
					: t('admin.translations.submissionLock.badgeWaitingVersion');

	return (
		<div
			className={`flex flex-col lg:flex-row lg:items-center justify-between rounded-3xl border backdrop-blur-md shadow-sm ${
				isFailedPhase ? 'border-(--accent-red)/30 bg-(--foreground)/30' : 'border-(--accent-orange)/30 bg-(--foreground)/30'
			}`}
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
			}}
		>
			<div className="flex items-start gap-3.5">
				<div
					className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
						isFailedPhase ? 'bg-(--accent-red)/10 text-(--accent-red)' : 'bg-(--accent-orange)/10 text-(--accent-orange)'
					}`}
				>
					{isAnimatedPhase ? <Loader2 size={20} className="animate-spin" /> : isFailedPhase ? <AlertTriangle size={20} /> : <Lock size={20} />}
				</div>

				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.35)' }}>
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-sm font-bold text-(--text)">{t('admin.translations.submissionLock.lockedTitle')}</span>
						<span
							className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
								isFailedPhase ? 'border-(--accent-red)/30 bg-(--accent-red)/10 text-(--accent-red)' : 'border-(--accent-orange)/30 bg-(--accent-orange)/10 text-(--accent-orange)'
							}`}
						>
							{isAnimatedPhase && <Loader2 size={11} className="animate-spin" />}
							{statusPillText}
						</span>
					</div>

					<p className="text-xs text-(--text-muted) leading-relaxed">{phaseDescription}</p>

					<div className="flex flex-wrap items-center gap-2 pt-0.5">
						<span className="inline-flex items-center gap-1.5 rounded-full border border-(--border)/15 bg-(--background)/60 px-2.5 py-1 text-[11px] font-medium text-(--text)">
							<GitBranch size={12} className="text-(--accent)" />
							{t('admin.translations.submissionLock.canaryVersionLabel', {
								atSubmit: submissionStatus.canaryVersionAtSubmit,
								current: submissionStatus.currentCanaryVersion,
							})}
						</span>

						{submissionStatus.submittedBy?.name && (
							<span className="inline-flex items-center gap-1.5 rounded-full border border-(--border)/15 bg-(--background)/60 px-2.5 py-1 text-[11px] text-(--text-muted)">
								{t('admin.translations.submissionLock.submittedByLabel', {
									user: submissionStatus.submittedBy.name,
								})}
							</span>
						)}
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2 shrink-0">
				<Button variant="secondary" onClick={onRefresh} disabled={refreshingStatus} className="gap-2 rounded-2xl px-4 py-2 text-xs shrink-0">
					<RefreshCw size={14} className={refreshingStatus ? 'animate-spin' : ''} />
					{t('admin.translations.submissionLock.checkStatus')}
				</Button>
			</div>
		</div>
	);
}
