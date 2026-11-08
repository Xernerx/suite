/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Database, Server, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Confirm, Input } from '@xernerx/ui';

interface BotStatsLogCardProps {
	botId: string;
	earliestTimestamp?: number;
	onDeleted?: (statId: string) => void;
}

export function BotStatsLogCard({ botId, earliestTimestamp, onDeleted }: BotStatsLogCardProps) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();

	const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
	const minDateStr = useMemo(
		() => (earliestTimestamp && Number.isFinite(earliestTimestamp) && earliestTimestamp > 0 ? new Date(earliestTimestamp).toISOString().split('T')[0] : undefined),
		[earliestTimestamp]
	);

	const [selectedDate, setSelectedDate] = useState<string>(todayStr);
	const [search, setSearch] = useState('');
	const [dayStats, setDayStats] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [pendingDelete, setPendingDelete] = useState<any | null>(null);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (!isReady || !botId || !selectedDate) return;
		let active = true;

		const loadDaySnapshots = async () => {
			setLoading(true);
			try {
				const startMs = new Date(`${selectedDate}T00:00:00`).getTime();
				const endMs = startMs + 24 * 60 * 60 * 1000 - 1;
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/stats?after=${startMs}&before=${endMs}&limit=1000`), {
					credentials: 'include',
				});
				if (res.ok && active) {
					const data = await res.json();
					if (Array.isArray(data)) {
						const normalized = data
							.map((s: any) => {
								const ts = s.timestamp ? (typeof s.timestamp === 'string' && /^\d+$/.test(s.timestamp) ? Number(s.timestamp) : new Date(s.timestamp).getTime()) : 0;
								const sc = Array.isArray(s.shardCount) ? s.shardCount.length : Array.isArray(s.shards) ? s.shards.length : Number(s.shardCount ?? s.shards ?? 0) || 0;
								return {
									...s,
									_id: s._id ? String(s._id) : undefined,
									timestamp: Number.isFinite(ts) ? ts : 0,
									guildCount: Number(s.guildCount ?? s.servers ?? 0) || 0,
									userCount: Number(s.userCount ?? s.users ?? 0) || 0,
									shardCount: sc,
									voteCount: Number(s.voteCount ?? s.votes ?? 0) || 0,
								};
							})
							.sort((a, b) => b.timestamp - a.timestamp);
						setDayStats(normalized);
					}
				}
			} catch (err) {
				console.error('Failed to load daily stat snapshots:', err);
			} finally {
				if (active) setLoading(false);
			}
		};

		loadDaySnapshots();
		return () => {
			active = false;
		};
	}, [botId, selectedDate, getEnvUrl, isReady]);

	const filteredDayStats = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return dayStats;
		return dayStats.filter((stat) => {
			const timeStr = new Date(stat.timestamp).toLocaleTimeString().toLowerCase();
			return (
				timeStr.includes(q) ||
				String(stat.guildCount).includes(q) ||
				String(stat.userCount).includes(q) ||
				String(stat.shardCount).includes(q) ||
				String(stat.voteCount).includes(q)
			);
		});
	}, [dayStats, search]);

	const handleConfirmDelete = async () => {
		if (!pendingDelete?._id || deleting) return;
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/stats?statId=${encodeURIComponent(pendingDelete._id)}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Delete failed');
			const removedId = String(pendingDelete._id);
			setDayStats((prev) => prev.filter((s) => s._id !== removedId));
			onDeleted?.(removedId);
			toast({ type: 'success', title: t('app.bots.overview.statsLogDeletedToast') });
		} catch {
			toast({ type: 'error', title: t('app.bots.overview.statsLogDeleteErrorToast') });
		} finally {
			setDeleting(false);
			setPendingDelete(null);
		}
	};

	return (
		<div
			className="flex flex-col rounded-3xl bg-(--foreground)/30 border border-(--border)/10 backdrop-blur-md shadow-sm"
			style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
		>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-(--border)/10">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25 shrink-0">
						<Database className="w-5 h-5" />
					</div>
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.bots.overview.statsLogTitle')}
							</h3>
							<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 px-2.5 py-0.5 text-xs font-mono font-bold text-(--accent)">
								{t('app.bots.overview.statsLogEntriesCount', { count: filteredDayStats.length })}
							</span>
						</div>
						<p className="text-xs text-(--text-muted)">{t('app.bots.overview.statsLogSubtitle')}</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<div className="w-56">
						<Input
							variant="search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t('app.bots.overview.statsLogSearchPlaceholder')}
						/>
					</div>
					<div className="w-44">
						<Input
							type="date"
							min={minDateStr}
							max={todayStr}
							value={selectedDate}
							onChange={(e) => {
								if (e.target.value && !Number.isNaN(new Date(e.target.value).getTime())) {
									setSelectedDate(e.target.value);
								}
							}}
						/>
					</div>
				</div>
			</div>

			{loading ? (
				<div className="py-10 flex justify-center">
					<Loading variant="small" />
				</div>
			) : filteredDayStats.length === 0 ? (
				<div className="py-10 text-center text-xs text-(--text-muted) rounded-2xl bg-(--background)/40 border border-(--border)/10">
					{t('app.bots.overview.statsLogEmpty', { date: selectedDate })}
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
					{filteredDayStats.map((stat, idx) => (
						<div
							key={stat._id || `${stat.timestamp}-${idx}`}
							className="flex flex-col justify-between gap-2.5 p-3.5 rounded-2xl bg-(--background)/55 border border-(--border)/10 hover:border-(--accent)/30 transition-all"
						>
							<div className="flex items-center justify-between gap-2 pb-2 border-b border-(--border)/10">
								<span className="text-xs font-mono font-bold text-(--text)">
									{new Date(stat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
								</span>
								{stat._id && (
									<Button
										variant="danger"
										size="sm"
										onClick={() => setPendingDelete(stat)}
										className="!p-1.5 rounded-xl"
									>
										<Trash2 size={13} />
									</Button>
								)}
							</div>

							<div className="grid grid-cols-2 gap-2 text-xs font-mono">
								<div className="flex items-center gap-1.5 text-(--text-muted)">
									<Server size={12} className="text-(--accent) shrink-0" />
									<span className="font-bold text-(--text)">{stat.guildCount.toLocaleString()}</span>
								</div>
								<div className="flex items-center gap-1.5 text-(--text-muted)">
									<Users size={12} className="text-(--accent) shrink-0" />
									<span className="font-bold text-(--text)">{stat.userCount.toLocaleString()}</span>
								</div>
								<div className="flex items-center gap-1.5 text-(--text-muted)">
									<Activity size={12} className="text-(--accent) shrink-0" />
									<span>{stat.shardCount.toLocaleString()}</span>
								</div>
								<div className="flex items-center gap-1.5 text-(--text-muted)">
									<ShieldCheck size={12} className="text-(--accent) shrink-0" />
									<span>{stat.voteCount.toLocaleString()}</span>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			<Confirm
				open={Boolean(pendingDelete)}
				onOpenChange={(open) => {
					if (!open) setPendingDelete(null);
				}}
				onConfirm={handleConfirmDelete}
				loading={deleting}
				title={t('app.bots.overview.statsLogDeleteTitle')}
				description={t('app.bots.overview.statsLogDeleteConfirm', {
					time: pendingDelete ? new Date(pendingDelete.timestamp).toLocaleString() : '',
				})}
				variant="danger"
			/>
		</div>
	);
}
