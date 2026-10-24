/** @format */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Award, CheckCircle2, Lock, Server, Trophy, Users } from 'lucide-react';
import { evaluateBotMilestones, EvaluatedMilestone, formatMilestoneCount } from '@xernerx/lib';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';

interface MilestonesProps {
	bot: any;
	id: string;
}

interface MilestoneTrackCardProps {
	title: string;
	subtitle: string;
	icon: any;
	currentCount: number;
	evaluation: {
		milestones: EvaluatedMilestone[];
		highestUnlocked: EvaluatedMilestone | null;
		nextMilestone: EvaluatedMilestone | null;
		progressPercent: number;
		fallbackBadgeSvg: string;
	};
}

function MilestoneTrackCard({ title, subtitle, icon: Icon, currentCount, evaluation }: MilestoneTrackCardProps) {
	const { t } = useDictionary();
	const { milestones, highestUnlocked, nextMilestone, progressPercent, fallbackBadgeSvg } = evaluation;
	const unlockedCount = milestones.filter((m) => m.unlocked).length;

	return (
		<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			{/* Header & Current Highest Badge Summary */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-(--border)/10">
				<div className="flex items-center gap-3.5">
					<div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-(--background)/60 border border-(--accent)/30 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_18%,transparent)] p-2">
						<Image
							src={highestUnlocked ? highestUnlocked.badgeSvg : fallbackBadgeSvg}
							alt={highestUnlocked ? highestUnlocked.label : title}
							width={44}
							height={44}
							unoptimized
							className="h-10 w-10 object-contain"
						/>
					</div>
					<div className="flex flex-col">
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{title}
							</h3>
							<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 px-2.5 py-0.5 text-xs font-extrabold text-(--accent)">
								<Trophy size={11} />
								{t('app.bots.milestones.unlockedCount', { unlocked: unlockedCount, total: milestones.length })}
							</span>
						</div>
						<p className="text-xs text-(--text-muted) mt-0.5">{subtitle}</p>
					</div>
				</div>

				<div className="flex items-center gap-3 self-start sm:self-auto rounded-2xl bg-(--background)/50 border border-(--border)/10 px-4 py-2.5">
					<Icon className="h-5 w-5 text-(--accent) shrink-0" />
					<div className="flex flex-col">
						<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t('app.bots.milestones.currentPeak')}</span>
						<span className="text-base font-extrabold text-(--text) font-mono">{currentCount.toLocaleString()}</span>
					</div>
				</div>
			</div>

			{/* Progress Bar to Next Tier */}
			<div className="flex flex-col gap-2 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4">
				<div className="flex flex-wrap items-center justify-between gap-2 text-xs">
					<span className="font-bold text-(--text)">{nextMilestone ? t('app.bots.milestones.nextTarget', { target: nextMilestone.label }) : t('app.bots.milestones.maxTierReached')}</span>
					<span className="font-mono font-bold text-(--accent)">
						{nextMilestone ? `${formatMilestoneCount(currentCount)} / ${formatMilestoneCount(nextMilestone.threshold)} (${progressPercent}%)` : '100%'}
					</span>
				</div>
				<div className="h-2.5 w-full rounded-full bg-(--foreground)/50 border border-(--border)/10 overflow-hidden">
					<div className="h-full rounded-full bg-(--accent) transition-all duration-500 shadow-[0_0_12px_var(--accent)]" style={{ width: `${Math.max(4, progressPercent)}%` }} />
				</div>
			</div>

			{/* 16 Milestone Badges Grid */}
			<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
				{milestones.map((m) => {
					const reachedDate = m.reachedAt ? new Date(m.reachedAt).toLocaleDateString() : null;

					return (
						<div
							key={m.tier}
							className={`relative flex flex-col items-center justify-between rounded-2xl border p-3.5 text-center transition-all ${
								m.unlocked
									? 'bg-(--background)/60 border-(--accent)/35 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_16%,transparent)]'
									: 'bg-(--background)/30 border-(--border)/10 opacity-55 grayscale'
							}`}
						>
							<div className="flex items-center justify-between w-full mb-1">
								<span className="text-[10px] font-mono font-bold text-(--text-muted)">#{m.tier}</span>
								{m.unlocked ? <CheckCircle2 size={12} className="text-(--accent-green)" /> : <Lock size={11} className="text-(--text-muted)" />}
							</div>

							<div className="my-2 flex h-12 w-12 items-center justify-center">
								<Image src={m.badgeSvg} alt={m.label} width={48} height={48} unoptimized className="h-11 w-11 object-contain drop-shadow-sm" />
							</div>

							<div className="flex flex-col gap-0.5 w-full">
								<span className="text-xs font-extrabold text-(--text) truncate">{formatMilestoneCount(m.threshold)}</span>
								<span className="text-[10px] text-(--text-muted) truncate">
									{m.unlocked ? reachedDate || t('app.bots.milestones.unlockedLabel') : t('app.bots.milestones.lockedLabel')}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default function Milestones({ bot, id }: MilestonesProps) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();

	const [stats, setStats] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!isReady || !id) return;
		let active = true;

		const fetchStats = async () => {
			setLoading(true);
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/stats`));
				if (res.ok && active) {
					const data = await res.json();
					if (Array.isArray(data)) {
						setStats(data);
					}
				}
			} catch (err) {
				console.error('Failed to fetch stats for milestones:', err);
			} finally {
				if (active) setLoading(false);
			}
		};

		fetchStats();
		return () => {
			active = false;
		};
	}, [id, getEnvUrl, isReady]);

	if (loading) {
		return (
			<div className="py-12 flex justify-center">
				<Loading variant="small" />
			</div>
		);
	}

	const latestStat = stats.length > 0 ? stats[stats.length - 1] : null;
	const currentGuilds = Math.max(Number(bot?.stats?.guildCount ?? bot?.guildCount ?? 0) || 0, Number(latestStat?.guildCount ?? latestStat?.servers ?? 0) || 0);
	const currentUsers = Math.max(Number(bot?.stats?.userCount ?? bot?.userCount ?? 0) || 0, Number(latestStat?.userCount ?? latestStat?.users ?? 0) || 0);

	const serverEval = evaluateBotMilestones(currentGuilds, stats, 'servers');
	const memberEval = evaluateBotMilestones(currentUsers, stats, 'members');

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
					<Award className="h-5 w-5" />
				</div>
				<div>
					<h2 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('app.bots.milestones.title')}
					</h2>
					<p className="text-xs text-(--text-muted)">{t('app.bots.milestones.subtitle')}</p>
				</div>
			</div>

			<MilestoneTrackCard title={t('app.bots.milestones.serversTitle')} subtitle={t('app.bots.milestones.serversSubtitle')} icon={Server} currentCount={currentGuilds} evaluation={serverEval} />

			<MilestoneTrackCard title={t('app.bots.milestones.membersTitle')} subtitle={t('app.bots.milestones.membersSubtitle')} icon={Users} currentCount={currentUsers} evaluation={memberEval} />
		</div>
	);
}
