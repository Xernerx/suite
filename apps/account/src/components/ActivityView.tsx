/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useSession, useToast, useUser } from '@xernerx/providers';
import { Button, Input } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { Activity, Bug, Download, ExternalLink, Inbox, RefreshCw, Ticket, Clock } from 'lucide-react';

type TabFilter = 'all' | 'applications' | 'issues' | 'suggestions';

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
		applications: any[];
		exportedAt?: string;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [tab, setTab] = useState<TabFilter>('all');
	const [search, setSearch] = useState('');

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
		...(data?.applications || []).map((a) => ({
			id: `app-${a.id}`,
			kind: 'applications' as const,
			title: a.configTitle || a.targetId || 'Application',
			subtitle: a.reviewNote ? `Note: ${a.reviewNote}` : `Application ID: ${a.id}`,
			status: a.status || 'pending',
			createdAt: a.createdAt,
			href: getEnvUrl('https://www.xernerx.com/applications'),
		})),
		...(data?.issues || []).map((i) => ({
			id: `issue-${i.id}`,
			kind: 'issues' as const,
			title: i.title || 'Reported Issue',
			subtitle: i.description || '',
			status: i.status || 'open',
			createdAt: i.createdAt,
			href: `${getEnvUrl('https://info.xernerx.com')}/issues?q=${encodeURIComponent(i.title || '')}`,
		})),
		...(data?.suggestions || []).map((s) => ({
			id: `sug-${s.id}`,
			kind: 'suggestions' as const,
			title: s.title || 'Feature Suggestion',
			subtitle: s.description || '',
			status: s.status || 'open',
			createdAt: s.createdAt,
			href: `${getEnvUrl('https://info.xernerx.com')}/suggestions?q=${encodeURIComponent(s.title || '')}`,
		})),
	].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

	const filteredEntries = allEntries.filter((entry) => {
		if (tab !== 'all' && entry.kind !== tab) return false;
		if (!search.trim()) return true;
		const q = search.toLowerCase();
		return entry.title.toLowerCase().includes(q) || entry.subtitle.toLowerCase().includes(q) || entry.status.toLowerCase().includes(q);
	});

	const getStatusStyle = (status: string) => {
		const s = status.toLowerCase();
		if (s === 'approved' || s === 'resolved' || s === 'implemented' || s === 'completed') {
			return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
		}
		if (s === 'denied' || s === 'rejected' || s === 'closed') {
			return 'bg-red-500/15 text-red-400 border-red-500/25';
		}
		return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
	};

	const getKindIcon = (kind: TabFilter) => {
		switch (kind) {
			case 'applications':
				return <Ticket size={16} className="text-purple-400" />;
			case 'issues':
				return <Bug size={16} className="text-red-400" />;
			case 'suggestions':
				return <Inbox size={16} className="text-blue-400" />;
			default:
				return <Activity size={16} className="text-(--accent)" />;
		}
	};

	return (
		<div className="flex flex-col max-w-5xl mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col md:flex-row md:items-center justify-between border-b border-(--border)/10 pb-6" style={{ gap: 'var(--ui-gap)' }}>
				<div>
					<h1 className="text-3xl font-bold text-(--text) flex items-center gap-3" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<Activity className="text-(--accent)" size={28} />
						{t('account.activity.title')}
					</h1>
					<p className="text-sm text-(--text-muted) mt-1">{t('account.activity.description')}</p>
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

			{/* Summary Stat Pills */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="p-4 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 flex items-center justify-between">
					<div>
						<span className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">{t('account.activity.tabs.applications')}</span>
						<p className="text-2xl font-bold text-(--text) mt-0.5">{data?.applications?.length || 0}</p>
					</div>
					<div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
						<Ticket size={20} />
					</div>
				</div>
				<div className="p-4 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 flex items-center justify-between">
					<div>
						<span className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">{t('account.activity.tabs.issues')}</span>
						<p className="text-2xl font-bold text-(--text) mt-0.5">{data?.issues?.length || 0}</p>
					</div>
					<div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
						<Bug size={20} />
					</div>
				</div>
				<div className="p-4 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 flex items-center justify-between">
					<div>
						<span className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">{t('account.activity.tabs.suggestions')}</span>
						<p className="text-2xl font-bold text-(--text) mt-0.5">{data?.suggestions?.length || 0}</p>
					</div>
					<div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
						<Inbox size={20} />
					</div>
				</div>
			</div>

			{/* Filter & Search Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex flex-wrap items-center gap-1.5 bg-(--foreground)/30 p-1.5 rounded-xl border border-(--border)/10">
					{(['all', 'applications', 'issues', 'suggestions'] as const).map((key) => (
						<button
							key={key}
							type="button"
							onClick={() => setTab(key)}
							className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
								tab === key ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
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
				<div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-(--border)/10 bg-(--foreground)/20">
					<Activity size={40} className="text-(--text-muted) opacity-40 mb-3" />
					<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('account.activity.emptyTitle')}
					</h3>
					<p className="text-sm text-(--text-muted) max-w-md mt-1">{t('account.activity.emptyDescription')}</p>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{filteredEntries.map((item) => (
						<a
							key={item.id}
							href={item.href}
							target="_blank"
							rel="noopener noreferrer"
							className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 hover:border-(--accent)/40 transition-all"
						>
							<div className="flex items-start gap-3.5 min-w-0">
								<div className="p-2.5 rounded-xl bg-(--background)/70 border border-(--border)/10 shrink-0 mt-0.5">{getKindIcon(item.kind)}</div>
								<div className="flex flex-col gap-1 min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-bold text-sm text-(--text) inline-flex items-center gap-1.5">
											{item.title}
											<ExternalLink size={12} className="opacity-50" />
										</span>
										<span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(item.status)}`}>{item.status}</span>
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
					))}
				</div>
			)}
		</div>
	);
}
