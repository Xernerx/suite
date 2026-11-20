/** @format */
'use client';

import { BarChart3, ClipboardList, Copy, Edit3, Megaphone, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Badge, Button, Confirm, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useState } from 'react';
import { ApplyPanelModal, NativePollModal } from './PanelAndPollModals';
import PositionWizardModal from './PositionWizardModal';
import type { DiscordChannelItem, DiscordRoleItem, YourAppsPanel, YourAppsPosition } from './types';

interface PositionsSectionProps {
	guildId: string;
	positions: YourAppsPosition[];
	panels?: YourAppsPanel[];
	discordRoles: DiscordRoleItem[];
	discordChannels: DiscordChannelItem[];
	defaultPanelChannel: string;
	onChanged: () => void;
}

export default function PositionsSection({ guildId, positions, panels = [], discordRoles, discordChannels, defaultPanelChannel, onChanged }: PositionsSectionProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [editorOpen, setEditorOpen] = useState(false);
	const [editingPosition, setEditingPosition] = useState<YourAppsPosition | null>(null);
	const [saving, setSaving] = useState(false);
	const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

	const [deleteTarget, setDeleteTarget] = useState<YourAppsPosition | null>(null);
	const [deleting, setDeleting] = useState(false);

	const [panelModalOpen, setPanelModalOpen] = useState(false);
	const [editingPanel, setEditingPanel] = useState<YourAppsPanel | null>(null);
	const [syncingPanels, setSyncingPanels] = useState(false);
	const [deletePanelTarget, setDeletePanelTarget] = useState<YourAppsPanel | null>(null);
	const [deletingPanel, setDeletingPanel] = useState(false);

	const [pollModalOpen, setPollModalOpen] = useState(false);

	const channelOptions = discordChannels
		.filter((c) => c.type === 0 || c.type === 5)
		.map((c) => ({
			label: `#${c.name}`,
			value: c.id,
		}));

	const channelNameById = (cid: string) => {
		const found = discordChannels.find((c) => c.id === cid);
		return found ? `#${found.name}` : `#${cid}`;
	};

	const resolveInitialChannelId = (preferred?: string) => {
		if (preferred && channelOptions.some((c) => c.value === preferred)) {
			return preferred;
		}
		if (defaultPanelChannel && channelOptions.some((c) => c.value === defaultPanelChannel)) {
			return defaultPanelChannel;
		}
		return channelOptions[0]?.value || '';
	};

	const openCreate = () => {
		setEditingPosition(null);
		setEditorOpen(true);
	};

	const openEdit = (pos: YourAppsPosition) => {
		setEditingPosition(pos);
		setEditorOpen(true);
	};

	const handleDuplicate = async (pos: YourAppsPosition) => {
		setDuplicatingId(pos.id);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/positions`), {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...pos,
					name: `${pos.name} ${t('app.dashboard.applications.positions.copySuffix')}`.slice(0, 80),
					state: 'closed',
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || 'Failed to duplicate position');
			toast({ title: t('app.dashboard.applications.toast.positionDuplicated'), type: 'success' });
			onChanged();
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setDuplicatingId(null);
		}
	};

	const handleSavePosition = async (payload: any) => {
		setSaving(true);
		try {
			const url = editingPosition
				? getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/positions/${editingPosition.id}`)
				: getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/positions`);

			const res = await fetch(url, {
				method: editingPosition ? 'PATCH' : 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || 'Failed to save position');
			}

			toast({ title: t('app.dashboard.applications.toast.positionSaved'), type: 'success' });
			setEditorOpen(false);
			onChanged();
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleToggleState = async (pos: YourAppsPosition) => {
		const nextState = pos.state === 'open' ? 'closed' : 'open';
		const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/positions/${pos.id}`), {
			method: 'PATCH',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ state: nextState }),
		});
		if (res.ok) {
			toast({ title: t('app.dashboard.applications.toast.positionSaved'), type: 'success' });
			onChanged();
		}
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/positions/${deleteTarget.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Delete failed');
			toast({ title: t('app.dashboard.applications.toast.positionDeleted'), type: 'success' });
			setDeleteTarget(null);
			onChanged();
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setDeleting(false);
		}
	};

	const handleSyncPanels = async () => {
		setSyncingPanels(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/panels`), {
				method: 'PUT',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Sync failed');
			toast({ title: t('app.dashboard.applications.toast.panelsSynced'), type: 'success' });
			onChanged();
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setSyncingPanels(false);
		}
	};

	const handleDeletePanel = async () => {
		if (!deletePanelTarget) return;
		setDeletingPanel(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/panels/${deletePanelTarget.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Delete failed');
			toast({ title: t('app.dashboard.applications.toast.panelDeleted'), type: 'success' });
			setDeletePanelTarget(null);
			onChanged();
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setDeletingPanel(false);
		}
	};

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2.5 text-(--text) font-extrabold text-sm tracking-widest uppercase">
							<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
								<ClipboardList className="w-4 h-4" />
							</div>
							<span>{t('app.dashboard.applications.positions.title')}</span>
						</div>
						<p className="text-xs text-(--text-muted)">{t('app.dashboard.applications.positions.subtitle')}</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button variant="secondary" size="sm" onClick={() => setPollModalOpen(true)}>
							<BarChart3 className="w-3.5 h-3.5" />
							<span>{t('app.dashboard.applications.positions.publishPollBtn')}</span>
						</Button>
						{positions.length > 0 && (
							<Button
								variant="secondary"
								size="sm"
								onClick={() => {
									setEditingPanel(null);
									setPanelModalOpen(true);
								}}
							>
								<Megaphone className="w-3.5 h-3.5" />
								<span>{t('app.dashboard.applications.positions.publishPanelBtn')}</span>
							</Button>
						)}
						<Button variant="primary" size="sm" onClick={openCreate}>
							<Plus className="w-3.5 h-3.5" />
							<span>{t('app.dashboard.applications.positions.createBtn')}</span>
						</Button>
					</div>
				</div>

				{positions.length === 0 ? (
					<div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl bg-(--background)/50 border border-(--border)/10 gap-2">
						<ClipboardList className="w-8 h-8 text-(--accent)" />
						<span className="text-sm font-bold text-(--text)">{t('app.dashboard.applications.positions.emptyTitle')}</span>
						<span className="text-xs text-(--text-muted) max-w-md">{t('app.dashboard.applications.positions.emptyDesc')}</span>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{positions.map((pos) => {
							const maxSubs = Number(pos.maxSubmissions) || 0;
							const maxApps = Number(pos.maxApprovals) || 0;
							return (
								<div key={pos.id} className="flex flex-col justify-between gap-3 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
									<div className="flex flex-col gap-2">
										<div className="flex items-start justify-between gap-2">
											<div className="flex flex-col gap-1 min-w-0">
												<span className="text-base font-bold text-(--text) truncate">{pos.name}</span>
												<div className="flex flex-wrap items-center gap-1.5">
													<Badge variant={pos.state === 'open' ? 'success' : 'muted'} dot>
														{pos.state === 'open' ? t('app.dashboard.applications.positions.openBadge') : t('app.dashboard.applications.positions.closedBadge')}
													</Badge>
													<Badge variant="accent">{t(`app.dashboard.applications.positions.categories.${pos.category || 'staff'}`)}</Badge>
													{pos.anonymousResponses && <Badge variant="outline">{t('app.dashboard.applications.positions.anonymousBadge')}</Badge>}
													{maxSubs > 0 && (
														<Badge variant="outline">
															{t('app.dashboard.applications.positions.capSubmissionsBadge', { current: pos.submissionsCount ?? 0, max: maxSubs })}
														</Badge>
													)}
													{maxApps > 0 && (
														<Badge variant="outline">
															{t('app.dashboard.applications.positions.capApprovalsBadge', { current: pos.approvalsCount ?? 0, max: maxApps })}
														</Badge>
													)}
												</div>
											</div>
											<Toggle checked={pos.state === 'open'} onChange={() => handleToggleState(pos)} size="sm" />
										</div>
										{pos.description && <p className="text-xs text-(--text-muted) line-clamp-2">{pos.description}</p>}
										{(pos.opensAt || pos.closesAt) && (
											<div className="flex flex-wrap items-center gap-2 text-[11px] text-(--text-muted)">
												{pos.opensAt && pos.state === 'closed' && (
													<span>{t('app.dashboard.applications.positions.opensBadge', { date: new Date(pos.opensAt).toLocaleString() })}</span>
												)}
												{pos.closesAt && pos.state === 'open' && (
													<span>{t('app.dashboard.applications.positions.closesBadge', { date: new Date(pos.closesAt).toLocaleString() })}</span>
												)}
											</div>
										)}
									</div>

									<div className="flex items-center justify-between gap-2 pt-2 border-t border-(--border)/10">
										<div className="flex items-center gap-3 text-[11px] text-(--text-muted) font-medium">
											<span>{t('app.dashboard.applications.positions.questionsCount', { count: pos.questions?.length || 0 })}</span>
											<span>•</span>
											<span>{t('app.dashboard.applications.positions.rewardRolesCount', { count: pos.rewardRoles?.length || 0 })}</span>
										</div>
										<div className="flex items-center gap-1.5">
											<Button variant="ghost" size="sm" loading={duplicatingId === pos.id} onClick={() => handleDuplicate(pos)}>
												<Copy className="w-3.5 h-3.5" />
												<span className="hidden sm:inline">{t('app.dashboard.applications.positions.duplicateBtn')}</span>
											</Button>
											<Button variant="secondary" size="sm" onClick={() => openEdit(pos)}>
												<Edit3 className="w-3.5 h-3.5" />
												<span>{t('app.dashboard.applications.positions.editBtn')}</span>
											</Button>
											<Button variant="danger" size="sm" onClick={() => setDeleteTarget(pos)}>
												<Trash2 className="w-3.5 h-3.5" />
											</Button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2.5 text-(--text) font-extrabold text-sm tracking-widest uppercase">
							<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
								<Megaphone className="w-4 h-4" />
							</div>
							<span>{t('app.dashboard.applications.positions.panelsTitle')}</span>
						</div>
						<p className="text-xs text-(--text-muted)">{t('app.dashboard.applications.positions.panelsSubtitle')}</p>
					</div>
					{panels.length > 0 && (
						<Button variant="secondary" size="sm" loading={syncingPanels} onClick={handleSyncPanels}>
							<RefreshCw className="w-3.5 h-3.5" />
							<span>{t('app.dashboard.applications.positions.syncPanelsBtn')}</span>
						</Button>
					)}
				</div>

				{panels.length === 0 ? (
					<p className="text-xs text-(--text-muted)">{t('app.dashboard.applications.positions.panelsEmpty')}</p>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{panels.map((pnl) => {
							const linkedNames =
								Array.isArray(pnl.positionIds) && pnl.positionIds.length > 0
									? pnl.positionIds.map((pid) => positions.find((p) => p.id === pid)?.name || pid).join(', ')
									: t('app.dashboard.applications.positions.panelAllOpenLabel');
							return (
								<div key={pnl.id} className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
									<div className="flex flex-col gap-1 min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<span className="text-sm font-bold text-(--text) truncate">{pnl.title || t('app.dashboard.applications.positions.panelModal.defaultTitle')}</span>
											<Badge variant="accent">{channelNameById(pnl.channelId)}</Badge>
											{pnl.autoSync !== false && <Badge variant="success">{t('app.dashboard.applications.positions.panelAutoSyncBadge')}</Badge>}
										</div>
										<span className="text-[11px] text-(--text-muted) truncate">{linkedNames}</span>
									</div>
									<div className="flex items-center gap-1.5 shrink-0">
										<Button
											variant="secondary"
											size="sm"
											onClick={() => {
												setEditingPanel(pnl);
												setPanelModalOpen(true);
											}}
										>
											<Edit3 className="w-3.5 h-3.5" />
										</Button>
										<Button variant="danger" size="sm" onClick={() => setDeletePanelTarget(pnl)}>
											<Trash2 className="w-3.5 h-3.5" />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			<PositionWizardModal
				open={editorOpen}
				onOpenChange={setEditorOpen}
				initialPosition={editingPosition}
				discordRoles={discordRoles}
				discordChannels={discordChannels}
				saving={saving}
				onSave={handleSavePosition}
			/>

			<ApplyPanelModal
				open={panelModalOpen}
				onOpenChange={setPanelModalOpen}
				guildId={guildId}
				editingPanel={editingPanel}
				initialChannelId={resolveInitialChannelId(editingPanel?.channelId)}
				channelOptions={channelOptions}
				positions={positions}
				onSaved={onChanged}
			/>

			<NativePollModal open={pollModalOpen} onOpenChange={setPollModalOpen} guildId={guildId} initialChannelId={resolveInitialChannelId()} channelOptions={channelOptions} />

			<Confirm
				open={Boolean(deleteTarget)}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
				title={t('app.dashboard.applications.positions.deleteTitle')}
				description={t('app.dashboard.applications.positions.deleteDesc', { name: deleteTarget?.name || '' })}
				variant="danger"
				loading={deleting}
				onConfirm={handleConfirmDelete}
			/>

			<Confirm
				open={Boolean(deletePanelTarget)}
				onOpenChange={(o) => !o && setDeletePanelTarget(null)}
				title={t('app.dashboard.applications.positions.panelDeleteTitle')}
				description={t('app.dashboard.applications.positions.panelDeleteDesc', { title: deletePanelTarget?.title || '' })}
				variant="danger"
				loading={deletingPanel}
				onConfirm={handleDeletePanel}
			/>
		</div>
	);
}
