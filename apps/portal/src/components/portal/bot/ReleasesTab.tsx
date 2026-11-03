/** @format */
'use client';

import { useEffect, useState } from 'react';
import { Calendar, Plus, Rocket, Tag, Trash2 } from 'lucide-react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Button, Confirm, Input, Markdown } from '@xernerx/ui';

export default function ReleasesTab({
	botId,
	botConfig,
	setBotConfig,
	setOriginalBotConfig,
}: {
	botId: string;
	botConfig: any;
	setBotConfig: (config: any) => void;
	setOriginalBotConfig?: (config: any) => void;
}) {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();

	const [releases, setReleases] = useState<any[]>(Array.isArray(botConfig?.releases) ? botConfig.releases : []);
	const [relVersion, setRelVersion] = useState('');
	const [relTitle, setRelTitle] = useState('');
	const [relBody, setRelBody] = useState('');
	const [publishingRelease, setPublishingRelease] = useState(false);
	const [releaseToDelete, setReleaseToDelete] = useState<any | null>(null);
	const [deletingRelease, setDeletingRelease] = useState(false);

	useEffect(() => {
		if (!isReady || !botId) return;
		fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/releases`), { credentials: 'include' })
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (Array.isArray(data)) setReleases(data);
				else if (Array.isArray(data?.releases)) setReleases(data.releases);
			})
			.catch(() => null);
	}, [botId, getEnvUrl, isReady]);

	const handlePublishRelease = async () => {
		if (!relVersion.trim() || !relTitle.trim()) {
			toast({ type: 'error', title: t('app.portal.bot.releases.validationError') });
			return;
		}
		setPublishingRelease(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/releases`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ version: relVersion.trim(), title: relTitle.trim(), body: relBody.trim() }),
			});
			if (res.ok) {
				const data = await res.json().catch(() => null);
				let nextReleases = releases;
				if (Array.isArray(data)) nextReleases = data;
				else if (Array.isArray(data?.releases)) nextReleases = data.releases;
				else {
					const created = data?.release || data || { id: String(Date.now()), version: relVersion.trim(), title: relTitle.trim(), body: relBody.trim(), createdAt: new Date().toISOString() };
					nextReleases = [created, ...releases];
				}
				setReleases(nextReleases);
				setBotConfig((prev: any) => (prev ? { ...prev, releases: nextReleases } : prev));
				setOriginalBotConfig?.((prev: any) => (prev ? JSON.parse(JSON.stringify({ ...prev, releases: nextReleases })) : prev));
				setRelVersion('');
				setRelTitle('');
				setRelBody('');
				toast({ type: 'success', title: t('app.portal.bot.releases.publishedToast') });
			} else {
				const err = await res.json().catch(() => ({}));
				toast({ type: 'error', title: err.error || t('common.toast.saveFailed') });
			}
		} catch {
			toast({ type: 'error', title: t('common.toast.saveError') });
		} finally {
			setPublishingRelease(false);
		}
	};

	const handleConfirmDeleteRelease = async () => {
		if (!releaseToDelete) return;
		const releaseId = releaseToDelete.id || releaseToDelete._id || releaseToDelete.version;
		setDeletingRelease(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${botId}/releases?releaseId=${encodeURIComponent(releaseId)}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				const nextReleases = releases.filter((r) => (r.id || r._id || r.version) !== releaseId);
				setReleases(nextReleases);
				setBotConfig((prev: any) => (prev ? { ...prev, releases: nextReleases } : prev));
				setOriginalBotConfig?.((prev: any) => (prev ? JSON.parse(JSON.stringify({ ...prev, releases: nextReleases })) : prev));
				setReleaseToDelete(null);
				toast({ type: 'success', title: t('app.portal.bot.releases.deletedToast') });
			} else {
				toast({ type: 'error', title: t('common.toast.saveFailed') });
			}
		} catch {
			toast({ type: 'error', title: t('common.toast.saveError') });
		} finally {
			setDeletingRelease(false);
		}
	};

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shrink-0">
							<Rocket className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-lg font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.portal.bot.releases.title')}
							</h3>
							<p className="text-xs text-(--text-muted)">{t('app.portal.bot.releases.subtitle')}</p>
						</div>
					</div>
					<span className="px-3 py-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-extrabold text-(--accent)">
						{t('app.bots.releases.countBadge', { count: releases.length })}
					</span>
				</div>

				<div className="flex flex-col gap-3 p-5 rounded-2xl bg-(--background)/50 border border-(--border)/10">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div>
							<label className="block text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-1.5">{t('app.portal.bot.releases.versionLabel')}</label>
							<Input value={relVersion} onChange={(e) => setRelVersion(e.target.value)} placeholder="v1.2.0" />
						</div>
						<div className="sm:col-span-2">
							<label className="block text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-1.5">{t('app.portal.bot.releases.releaseTitleLabel')}</label>
							<Input value={relTitle} onChange={(e) => setRelTitle(e.target.value)} placeholder={t('app.portal.bot.releases.releaseTitlePlaceholder')} />
						</div>
					</div>
					<Markdown editable label={t('app.portal.bot.releases.bodyLabel')} value={relBody} onChange={setRelBody} placeholder={t('app.portal.bot.releases.bodyPlaceholder')} rows={4} />
					<div className="flex justify-end">
						<Button variant="primary" onClick={handlePublishRelease} loading={publishingRelease} className="gap-1.5">
							<Plus size={15} />
							<span>{t('app.portal.bot.releases.publishBtn')}</span>
						</Button>
					</div>
				</div>

				{releases.length > 0 && (
					<div className="flex flex-col gap-2.5">
						{releases.map((rel, i) => {
							const relId = rel.id || rel._id || `${rel.version}-${i}`;
							return (
								<div key={relId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-(--background)/40 border border-(--border)/10">
									<div className="flex flex-col gap-1 min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--accent)/15 border border-(--accent)/30 text-xs font-mono font-extrabold text-(--accent)">
												<Tag size={11} />
												{rel.version}
											</span>
											<span className="font-bold text-sm text-(--text) truncate">{rel.title}</span>
											{rel.createdAt && (
												<span className="inline-flex items-center gap-1 text-[11px] text-(--text-muted)">
													<Calendar size={11} />
													{new Date(rel.createdAt).toLocaleDateString()}
												</span>
											)}
										</div>
										{rel.body && <p className="text-xs text-(--text-muted) line-clamp-2">{rel.body}</p>}
									</div>
									<Button variant="ghost" onClick={() => setReleaseToDelete(rel)} className="text-(--accent-red) hover:bg-(--accent-red)/10 self-end sm:self-auto shrink-0">
										<Trash2 size={15} />
									</Button>
								</div>
							);
						})}
					</div>
				)}
			</div>

			<Confirm
				open={Boolean(releaseToDelete)}
				onOpenChange={(open) => !open && setReleaseToDelete(null)}
				title={t('app.portal.bot.releases.deleteConfirmTitle')}
				description={t('app.portal.bot.releases.deleteConfirmDesc', { version: releaseToDelete?.version || '' })}
				confirmText={t('common.buttons.delete')}
				cancelText={t('common.buttons.cancel')}
				variant="danger"
				loading={deletingRelease}
				onConfirm={handleConfirmDeleteRelease}
			/>
		</div>
	);
}
