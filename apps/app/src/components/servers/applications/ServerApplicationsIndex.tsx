/** @format */
'use client';

import { ArrowRight, ClipboardList, FileSpreadsheet, Inbox, LogIn, Server } from 'lucide-react';
import { Badge, Button } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface PortalPositionSummary {
	id: string;
	name: string;
	description: string;
	category: 'staff' | 'appeal' | 'feedback' | 'event' | 'custom';
	state: 'open' | 'closed';
	questionsCount: number;
	eligible: boolean;
	ineligibleReason: string | null;
}

interface PortalSubmissionSummary {
	id: string;
	positionId: string;
	positionName: string;
	status: 'pending' | 'approved' | 'denied' | 'withdrawn';
	reviewReason?: string | null;
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

	const [data, setData] = useState<PortalOverviewResponse | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchOverview = useCallback(async () => {
		if (!isReady) return;
		setLoading(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/apply`), {
				credentials: 'include',
			});
			if (res.ok) {
				setData(await res.json());
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

	const statusVariant = (status: string): 'warning' | 'success' | 'danger' | 'muted' => {
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

	const handleSignIn = () => {
		const accountBase = getEnvUrl('https://account.xernerx.com');
		const cb = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
		window.location.href = cb ? `${accountBase}/login?callbackUrl=${cb}` : accountBase;
	};

	if (loading) {
		return (
			<div className="flex-1 flex items-center justify-center min-h-[60vh]">
				<Loading />
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
							return (
								<div key={pos.id} className="flex flex-col justify-between gap-4 p-5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
									<div className="flex flex-col gap-2">
										<div className="flex flex-wrap items-center gap-2">
											<span className="text-base font-bold text-(--text)">{pos.name}</span>
											<Badge variant={isOpen ? 'success' : 'muted'} dot>
												{isOpen ? t('app.dashboard.applications.positions.openBadge') : t('app.dashboard.applications.positions.closedBadge')}
											</Badge>
											<Badge variant="accent">{t(`app.dashboard.applications.positions.categories.${pos.category}`)}</Badge>
										</div>

										{pos.description && <p className="text-xs text-(--text-muted) line-clamp-3">{pos.description}</p>}

										<div className="flex flex-wrap items-center gap-2 pt-1">
											<Badge variant="outline">{t('app.dashboard.applications.positions.questionsCount', { count: pos.questionsCount })}</Badge>
											{data.authenticated && !pos.eligible && pos.ineligibleReason && <Badge variant="warning">{t('app.servers.applications.ineligibleBadge')}</Badge>}
										</div>
									</div>

									<div className="flex items-center justify-end pt-2 border-t border-(--border)/10">
										{isOpen ? (
											<Link href={`/servers/${guildId}/applications/${pos.id}`}>
												<Button variant="primary" size="sm">
													<span>{t('app.servers.applications.applyBtn')}</span>
													<ArrowRight className="w-3.5 h-3.5" />
												</Button>
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
							{data.mySubmissions.map((sub) => (
								<div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
									<div className="flex flex-col gap-1">
										<div className="flex flex-wrap items-center gap-2">
											<span className="text-sm font-bold text-(--text)">{sub.positionName}</span>
											<span className="text-xs font-mono text-(--text-muted)">#{sub.id}</span>
											<Badge variant={statusVariant(sub.status)} dot>
												{statusLabel(sub.status)}
											</Badge>
										</div>
										{sub.reviewReason && <p className="text-xs text-(--text-muted)">{sub.reviewReason}</p>}
									</div>
									{sub.createdAt && <span className="text-[11px] text-(--text-muted)">{new Date(sub.createdAt).toLocaleString()}</span>}
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
