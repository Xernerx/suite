/** @format */
'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Calendar, Rocket, Sparkles, Tag } from 'lucide-react';
import { Loading } from '@xernerx/feedback';
import { useDictionary, useEnvironment } from '@xernerx/providers';

export interface BotReleaseItem {
	id?: string;
	_id?: string;
	version: string;
	title: string;
	body?: string;
	createdAt?: string;
}

export interface ReleasesProps {
	bot: any;
	id: string;
}

export function Releases({ bot, id }: ReleasesProps) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();

	const [releases, setReleases] = useState<BotReleaseItem[]>(Array.isArray(bot?.releases) ? bot.releases : []);
	const [loading, setLoading] = useState(!Array.isArray(bot?.releases));

	useEffect(() => {
		if (!isReady || !id) return;
		let cancelled = false;

		const fetchReleases = async () => {
			setLoading(true);
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/releases`), {
					credentials: 'include',
				});
				if (res.ok && !cancelled) {
					const data = await res.json();
					const list = Array.isArray(data) ? data : Array.isArray(data?.releases) ? data.releases : Array.isArray(bot?.releases) ? bot.releases : [];
					setReleases(list);
				} else if (!cancelled && Array.isArray(bot?.releases)) {
					setReleases(bot.releases);
				}
			} catch {
				if (!cancelled && Array.isArray(bot?.releases)) {
					setReleases(bot.releases);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		fetchReleases();
		return () => {
			cancelled = true;
		};
	}, [id, bot?.releases, getEnvUrl, isReady]);

	if (loading) {
		return (
			<div className="flex justify-center py-12 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md">
				<Loading variant="small" />
			</div>
		);
	}

	const sortedReleases = [...releases].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex items-center gap-3.5">
					<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)] shrink-0">
						<Rocket className="h-6 w-6" />
					</div>
					<div>
						<h2 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('app.bots.releases.title')}
						</h2>
						<p className="text-xs text-(--text-muted)">{t('app.bots.releases.subtitle')}</p>
					</div>
				</div>

				<span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-(--accent)/10 border border-(--accent)/25 text-xs font-extrabold text-(--accent) self-start sm:self-auto">
					<Tag size={13} />
					{t('app.bots.releases.countBadge', { count: sortedReleases.length })}
				</span>
			</div>

			{sortedReleases.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-3xl border border-dashed border-(--border)/15 bg-(--foreground)/30 backdrop-blur-md">
					<Tag className="h-10 w-10 text-(--text-muted) opacity-40 mb-3" />
					<p className="text-base font-bold text-(--text)">{t('app.bots.releases.emptyTitle')}</p>
					<p className="text-xs text-(--text-muted) mt-1 max-w-md">{t('app.bots.releases.emptyDesc')}</p>
				</div>
			) : (
				<div
					className="relative flex flex-col pl-4 sm:pl-8 before:absolute before:left-[15px] sm:before:left-[31px] before:top-6 before:bottom-6 before:w-0.5 before:bg-(--border)/20"
					style={{ gap: 'var(--ui-gap)' }}
				>
					{sortedReleases.map((rel, index) => {
						const isLatest = index === 0;
						const key = rel.id || rel._id || `${rel.version}-${index}`;
						const formattedDate = rel.createdAt ? new Date(rel.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null;

						return (
							<div key={key} className="relative pl-6 sm:pl-8">
								{/* Timeline Node */}
								<div
									className={`absolute -left-[9px] sm:-left-[9px] top-6 h-5 w-5 rounded-full border-4 border-(--background) transition-all ${
										isLatest ? 'bg-(--accent) shadow-[0_0_14px_var(--accent)] ring-2 ring-(--accent)/40' : 'bg-(--text-muted)/60'
									}`}
								/>

								<div
									className={`flex flex-col rounded-3xl border backdrop-blur-md transition-all ${
										isLatest
											? 'bg-(--foreground)/45 border-(--accent)/35 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_15%,transparent)]'
											: 'bg-(--foreground)/30 border-(--border)/10 hover:border-(--accent)/25'
									}`}
									style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
								>
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div className="flex flex-wrap items-center gap-2.5">
											<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-mono font-extrabold text-(--accent)">
												<Tag size={12} />
												{rel.version.startsWith('v') ? rel.version : `v${rel.version}`}
											</span>
											{isLatest && (
												<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--accent) text-white text-[10px] font-extrabold uppercase tracking-wider">
													<Sparkles size={10} />
													{t('app.bots.releases.latestBadge')}
												</span>
											)}
											<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
												{rel.title}
											</h3>
										</div>

										{formattedDate && (
											<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--background)/60 border border-(--border)/10 text-xs font-medium text-(--text-muted)">
												<Calendar size={12} className="text-(--accent)" />
												{formattedDate}
											</span>
										)}
									</div>

									{rel.body && (
										<div className="rounded-2xl bg-(--background)/50 border border-(--border)/10 p-4 text-sm text-(--text-muted) prose max-w-none prose-headings:font-fredoka prose-headings:text-(--text) prose-strong:text-(--text) prose-code:text-(--accent)">
											<ReactMarkdown>{rel.body}</ReactMarkdown>
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

export default Releases;
