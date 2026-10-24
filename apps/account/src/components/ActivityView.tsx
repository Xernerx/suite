/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useSession, useToast, useUser } from '@xernerx/providers';
import { Button, Input, Modal } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { Activity, Bug, Clock, Download, ExternalLink, FileText, Inbox, RefreshCw, Ticket } from 'lucide-react';

type TabFilter = 'all' | 'applications' | 'issues' | 'suggestions';

interface ApplicationQuestion {
	id: string;
	question: string;
	type?: string;
}

interface EnrichedApplication {
	id: string;
	targetId: string;
	configTitle?: string;
	configDescription?: string;
	questions?: ApplicationQuestion[];
	status?: string;
	reviewNote?: string;
	data?: Record<string, any>;
	createdAt?: string;
}

function resolveApplicationPairs(app: EnrichedApplication): { id: string; label: string; value: any }[] {
	const rawData = app?.data && typeof app.data === 'object' ? app.data : {};
	const questions = Array.isArray(app?.questions) ? app.questions : [];
	const seenKeys = new Set<string>();
	const pairs: { id: string; label: string; value: any }[] = [];

	for (const q of questions) {
		if (!q?.id) continue;
		seenKeys.add(q.id);
		pairs.push({
			id: q.id,
			label: q.question || q.id,
			value: rawData[q.id],
		});
	}

	for (const [key, val] of Object.entries(rawData)) {
		if (seenKeys.has(key)) continue;
		pairs.push({
			id: key,
			label: key,
			value: val,
		});
	}

	return pairs;
}

function formatAnswerValue(val: any, fallbackText: string): string {
	if (val === undefined || val === null || val === '') return fallbackText;
	if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : fallbackText;
	if (typeof val === 'boolean') return val ? 'Yes' : 'No';
	if (typeof val === 'object') return JSON.stringify(val);
	return String(val);
}

export default function ActivityView() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { data: session } = useSession();
	const { user: discordUser } = useUser();
	const { toast } = useToast();

	const activeUserId = (discordUser as any)?.id || (session?.user as any)?.id;

	const [data, setData] = useState<{
		profile: any;
		issues: any[];
		suggestions: any[];
		applications: EnrichedApplication[];
		exportedAt?: string;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [tab, setTab] = useState<TabFilter>('all');
	const [search, setSearch] = useState('');
	const [selectedApp, setSelectedApp] = useState<EnrichedApplication | null>(null);

	const fetchActivity = async (isManual = false) => {
		if (!isReady || !activeUserId) {
			setLoading(false);
			return;
		}
		if (isManual) setRefreshing(true);
		else setLoading(true);

		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/users/${activeUserId}/activity`), {
				credentials: 'include',
			});
			if (res.ok) {
				const json = await res.json();
				setData(json);
			} else {
				toast({ type: 'error', title: t('account.activity.fetchError') });
			}
		} catch (err: any) {
			toast({ type: 'error', title: t('account.activity.fetchError'), description: err.message });
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		if (isReady && activeUserId) {
			fetchActivity();
		}
	}, [isReady, activeUserId]);

	const handleExportData = () => {
		if (!data) return;
		const payload = {
			...data,
			user: discordUser || session?.user || data.profile,
			exportedAt: new Date().toISOString(),
		};
		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `xernerx-account-data-${activeUserId}-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toast({ type: 'success', title: t('account.activity.exportSuccess') });
	};

	if (loading) return <Loading />;

	const allEntries = [
		...(data?.applications || []).map((a) => {
			const pairs = resolveApplicationPairs(a);
			return {
				id: `app-${a.id}`,
				kind: 'applications' as const,
				title: a.configTitle || a.targetId || t('account.activity.tabs.applications'),
				subtitle: a.reviewNote ? t('account.activity.notePrefix', { note: a.reviewNote }) : a.configDescription || '',
				status: a.status || 'pending',
				createdAt: a.createdAt,
				href: getEnvUrl('https://www.xernerx.com/applications'),
				application: a,
				pairs,
			};
		}),
		...(data?.issues || []).map((i) => ({
			id: `issue-${i.id}`,
			kind: 'issues' as const,
			title: i.title || t('account.activity.tabs.issues'),
			subtitle: i.description || '',
			status: i.status || 'open',
			createdAt: i.createdAt,
			href: `${getEnvUrl('https://info.xernerx.com')}/issues?q=${encodeURIComponent(i.title || '')}`,
			application: undefined,
			pairs: [] as { id: string; label: string; value: any }[],
		})),
		...(data?.suggestions || []).map((s) => ({
			id: `sug-${s.id}`,
			kind: 'suggestions' as const,
			title: s.title || t('account.activity.tabs.suggestions'),
			subtitle: s.description || '',
			status: s.status || 'open',
			createdAt: s.createdAt,
			href: `${getEnvUrl('https://info.xernerx.com')}/suggestions?q=${encodeURIComponent(s.title || '')}`,
			application: undefined,
			pairs: [] as { id: string; label: string; value: any }[],
		})),
	].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

	const filteredEntries = allEntries.filter((entry) => {
		if (tab !== 'all' && entry.kind !== tab) return false;
		if (!search.trim()) return true;
		const q = search.toLowerCase();
		const pairsMatch = entry.pairs.some((p) => p.label.toLowerCase().includes(q) || formatAnswerValue(p.value, '').toLowerCase().includes(q));
		return entry.title.toLowerCase().includes(q) || entry.subtitle.toLowerCase().includes(q) || entry.status.toLowerCase().includes(q) || pairsMatch;
	});

	const getStatusStyle = (status: string) => {
		const s = status.toLowerCase();
		if (s === 'approved' || s === 'resolved' || s === 'implemented' || s === 'completed') {
			return 'bg-(--accent-green)/15 text-(--accent-green) border-(--accent-green)/25';
		}
		if (s === 'denied' || s === 'rejected' || s === 'closed') {
			return 'bg-(--accent-red)/15 text-(--accent-red) border-(--accent-red)/25';
		}
		return 'bg-(--accent)/15 text-(--accent) border-(--accent)/25';
	};

	const getKindIcon = (kind: TabFilter) => {
		switch (kind) {
			case 'applications':
				return <Ticket size={16} className="text-(--accent)" />;
			case 'issues':
				return <Bug size={16} className="text-(--accent)" />;
			case 'suggestions':
				return <Inbox size={16} className="text-(--accent)" />;
			default:
				return <Activity size={16} className="text-(--accent)" />;
		}
	};

	const selectedAppPairs = selectedApp ? resolveApplicationPairs(selectedApp) : [];

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<div className="flex flex-col md:flex-row md:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm flex items-center gap-3" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<Activity className="text-(--accent)" size={32} />
						{t('account.activity.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('account.activity.description')}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button variant="secondary" onClick={handleExportData} className="flex items-center gap-2">
						<Download size={15} />
						{t('account.activity.exportData')}
					</Button>
					<Button variant="secondary" onClick={() => fetchActivity(true)} disabled={refreshing} className="flex items-center gap-2">
						<RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
						{t('account.activity.refresh')}
					</Button>
				</div>
			</div>

			{/* Summary Stat Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 'var(--ui-gap)' }}>
				<div className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm flex items-center justify-between" style={{ padding: 'var(--ui-gap)' }}>
					<div>
						<span className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">{t('account.activity.tabs.applications')}</span>
						<p className="text-2xl font-bold text-(--text) mt-0.5" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{data?.applications?.length || 0}
						</p>
					</div>
					<div className="p-3 rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
						<Ticket size={20} />
					</div>
				</div>
				<div className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm flex items-center justify-between" style={{ padding: 'var(--ui-gap)' }}>
					<div>
						<span className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">{t('account.activity.tabs.issues')}</span>
						<p className="text-2xl font-bold text-(--text) mt-0.5" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{data?.issues?.length || 0}
						</p>
					</div>
					<div className="p-3 rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
						<Bug size={20} />
					</div>
				</div>
				<div className="rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm flex items-center justify-between" style={{ padding: 'var(--ui-gap)' }}>
					<div>
						<span className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">{t('account.activity.tabs.suggestions')}</span>
						<p className="text-2xl font-bold text-(--text) mt-0.5" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{data?.suggestions?.length || 0}
						</p>
					</div>
					<div className="p-3 rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
						<Inbox size={20} />
					</div>
				</div>
			</div>

			{/* Filter & Search Bar */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md p-2 shadow-sm"
				style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}
			>
				<div className="flex flex-wrap items-center gap-1.5 bg-(--background)/60 p-1 rounded-2xl border border-(--border)/10">
					{(['all', 'applications', 'issues', 'suggestions'] as const).map((key) => (
						<button
							key={key}
							type="button"
							onClick={() => setTab(key)}
							className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
								tab === key ? 'bg-(--accent) text-white shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_35%,transparent)]' : 'text-(--text-muted) hover:text-(--text)'
							}`}
						>
							{t(`account.activity.tabs.${key}`)}
						</button>
					))}
				</div>

				<div className="w-full sm:w-72">
					<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('account.activity.searchPlaceholder')} />
				</div>
			</div>

			{/* Submissions List */}
			{filteredEntries.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm">
					<Activity size={40} className="text-(--text-muted) opacity-40 mb-3" />
					<h2 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('account.activity.emptyTitle')}
					</h2>
					<p className="text-sm text-(--text-muted) max-w-md mt-1">{t('account.activity.emptyDescription')}</p>
				</div>
			) : (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					{filteredEntries.map((item) => {
						if (item.kind === 'applications' && item.application) {
							return (
								<div
									key={item.id}
									onClick={() => setSelectedApp(item.application!)}
									className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm hover:border-(--accent)/40 transition-all cursor-pointer"
									style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
								>
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
										<div className="flex items-start gap-3.5 min-w-0">
											<div className="p-2.5 rounded-2xl bg-(--accent)/10 border border-(--accent)/20 shrink-0 mt-0.5">{getKindIcon(item.kind)}</div>
											<div className="flex flex-col gap-1 min-w-0">
												<div className="flex flex-wrap items-center gap-2">
													<span className="font-bold text-sm text-(--text) inline-flex items-center gap-1.5">
														{item.title}
														<FileText size={12} className="opacity-50" />
													</span>
													<span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(item.status)}`}>
														{item.status}
													</span>
												</div>
												{item.subtitle && <p className="text-xs text-(--text-muted) line-clamp-2">{item.subtitle}</p>}
											</div>
										</div>

										{item.createdAt && (
											<div className="flex items-center gap-1.5 text-xs font-mono text-(--text-muted) shrink-0">
												<Clock size={12} className="opacity-60" />
												{new Date(item.createdAt).toLocaleDateString()}
											</div>
										)}
									</div>

									{item.pairs.length > 0 && (
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-(--border)/10">
											{item.pairs.slice(0, 6).map((pair) => (
												<div key={pair.id} className="flex flex-col gap-0.5 rounded-2xl bg-(--background)/50 border border-(--border)/10 px-3.5 py-2.5">
													<span className="text-[11px] font-bold text-(--text-muted) truncate">{pair.label}</span>
													<span className="text-xs font-medium text-(--text) line-clamp-2">{formatAnswerValue(pair.value, t('account.activity.noAnswerProvided'))}</span>
												</div>
											))}
										</div>
									)}
								</div>
							);
						}

						return (
							<a
								key={item.id}
								href={item.href}
								target="_blank"
								rel="noopener noreferrer"
								className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm hover:border-(--accent)/40 transition-all"
								style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
							>
								<div className="flex items-start gap-3.5 min-w-0">
									<div className="p-2.5 rounded-2xl bg-(--accent)/10 border border-(--accent)/20 shrink-0 mt-0.5">{getKindIcon(item.kind)}</div>
									<div className="flex flex-col gap-1 min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-bold text-sm text-(--text) inline-flex items-center gap-1.5">
												{item.title}
												<ExternalLink size={12} className="opacity-50" />
											</span>
											<span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(item.status)}`}>{item.status}</span>
										</div>
										{item.subtitle && <p className="text-xs text-(--text-muted) line-clamp-2">{item.subtitle}</p>}
									</div>
								</div>

								{item.createdAt && (
									<div className="flex items-center gap-1.5 text-xs font-mono text-(--text-muted) shrink-0">
										<Clock size={12} className="opacity-60" />
										{new Date(item.createdAt).toLocaleDateString()}
									</div>
								)}
							</a>
						);
					})}
				</div>
			)}

			{/* Application Data Details Modal */}
			<Modal
				open={Boolean(selectedApp)}
				onOpenChange={(open) => {
					if (!open) setSelectedApp(null);
				}}
				title={selectedApp?.configTitle || selectedApp?.targetId || t('account.activity.tabs.applications')}
				description={selectedApp?.createdAt ? t('account.activity.submittedOn', { date: new Date(selectedApp.createdAt).toLocaleString() }) : selectedApp?.configDescription || ''}
				maxWidth="max-w-2xl"
			>
				{selectedApp && (
					<div className="flex flex-col gap-4 pt-2">
						<div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--background)/50 border border-(--border)/10 px-4 py-3">
							<div className="flex items-center gap-2">
								<Ticket size={15} className="text-(--accent)" />
								<span className="text-xs font-bold text-(--text)">{selectedApp.configTitle || selectedApp.targetId}</span>
							</div>
							<span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(selectedApp.status || 'pending')}`}>
								{selectedApp.status || 'pending'}
							</span>
						</div>

						{selectedApp.reviewNote && (
							<div className="flex flex-col gap-1 rounded-2xl bg-(--accent)/10 border border-(--accent)/25 p-4">
								<span className="text-[11px] font-extrabold uppercase tracking-wider text-(--accent)">{t('account.activity.reviewerNote')}</span>
								<p className="text-xs text-(--text) whitespace-pre-wrap">{selectedApp.reviewNote}</p>
							</div>
						)}

						<div className="flex flex-col gap-3 max-h-[52vh] overflow-y-auto pr-1 custom-scrollbar">
							<span className="text-xs font-extrabold uppercase tracking-wider text-(--text-muted)">{t('account.activity.submittedResponses')}</span>
							{selectedAppPairs.map((pair, idx) => (
								<div key={pair.id} className="flex flex-col gap-1.5 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4">
									<span className="text-xs font-bold text-(--text)">
										<span className="text-(--accent) mr-1.5">{idx + 1}.</span>
										{pair.label}
									</span>
									<p className="text-xs text-(--text-muted) whitespace-pre-wrap pl-4">{formatAnswerValue(pair.value, t('account.activity.noAnswerProvided'))}</p>
								</div>
							))}
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}
