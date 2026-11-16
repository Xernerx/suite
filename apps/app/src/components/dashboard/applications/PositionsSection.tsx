/** @format */
'use client';

import { ClipboardList, Edit3, Megaphone, Plus, Send, Trash2 } from 'lucide-react';
import { Badge, Button, Confirm, Input, Modal, MultiSelector, Selector, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useState } from 'react';
import PositionWizardModal from './PositionWizardModal';
import type { DiscordChannelItem, DiscordRoleItem, YourAppsPosition } from './types';

interface PositionsSectionProps {
	guildId: string;
	positions: YourAppsPosition[];
	discordRoles: DiscordRoleItem[];
	discordChannels: DiscordChannelItem[];
	defaultPanelChannel: string;
	onChanged: () => void;
}

export default function PositionsSection({ guildId, positions, discordRoles, discordChannels, defaultPanelChannel, onChanged }: PositionsSectionProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [editorOpen, setEditorOpen] = useState(false);
	const [editingPosition, setEditingPosition] = useState<YourAppsPosition | null>(null);
	const [saving, setSaving] = useState(false);

	const [deleteTarget, setDeleteTarget] = useState<YourAppsPosition | null>(null);
	const [deleting, setDeleting] = useState(false);

	const [panelModalOpen, setPanelModalOpen] = useState(false);
	const [panelChannelId, setPanelChannelId] = useState(defaultPanelChannel || '');
	const [panelTitle, setPanelTitle] = useState('');
	const [panelDesc, setPanelDesc] = useState('');
	const [panelBtnLabel, setPanelBtnLabel] = useState('');
	const [panelPosIds, setPanelPosIds] = useState<string[]>([]);
	const [publishingPanel, setPublishingPanel] = useState(false);

	const channelOptions = discordChannels
		.filter((c) => c.type === 0 || c.type === 5)
		.map((c) => ({
			label: `#${c.name}`,
			value: c.id,
		}));

	const openCreate = () => {
		setEditingPosition(null);
		setEditorOpen(true);
	};

	const openEdit = (pos: YourAppsPosition) => {
		setEditingPosition(pos);
		setEditorOpen(true);
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

	const handlePublishPanel = async () => {
		if (!panelChannelId) return;
		setPublishingPanel(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/panels`), {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					channelId: panelChannelId,
					title: panelTitle,
					description: panelDesc,
					buttonLabel: panelBtnLabel,
					positionIds: panelPosIds,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || 'Failed to publish panel');
			toast({ title: t('app.dashboard.applications.toast.panelPublished'), type: 'success' });
			setPanelModalOpen(false);
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setPublishingPanel(false);
		}
	};

	return (
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
					{positions.length > 0 && (
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								setPanelChannelId(defaultPanelChannel || channelOptions[0]?.value || '');
								if (!panelTitle) setPanelTitle(t('app.dashboard.applications.positions.panelModal.defaultTitle'));
								if (!panelDesc) setPanelDesc(t('app.dashboard.applications.positions.panelModal.defaultDesc'));
								if (!panelBtnLabel) setPanelBtnLabel(t('app.dashboard.applications.positions.panelModal.defaultButton'));
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
					{positions.map((pos) => (
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
										</div>
									</div>
									<Toggle checked={pos.state === 'open'} onChange={() => handleToggleState(pos)} size="sm" />
								</div>
								{pos.description && <p className="text-xs text-(--text-muted) line-clamp-2">{pos.description}</p>}
							</div>

							<div className="flex items-center justify-between gap-2 pt-2 border-t border-(--border)/10">
								<div className="flex items-center gap-3 text-[11px] text-(--text-muted) font-medium">
									<span>{t('app.dashboard.applications.positions.questionsCount', { count: pos.questions?.length || 0 })}</span>
									<span>•</span>
									<span>{t('app.dashboard.applications.positions.rewardRolesCount', { count: pos.rewardRoles?.length || 0 })}</span>
								</div>
								<div className="flex items-center gap-1.5">
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
					))}
				</div>
			)}

			<PositionWizardModal open={editorOpen} onOpenChange={setEditorOpen} initialPosition={editingPosition} discordRoles={discordRoles} saving={saving} onSave={handleSavePosition} />

			<Modal
				open={panelModalOpen}
				onOpenChange={setPanelModalOpen}
				size="lg"
				title={t('app.dashboard.applications.positions.panelModal.title')}
				description={t('app.dashboard.applications.positions.panelModal.desc')}
			>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.panelModal.channelLabel')}</label>
						<Selector value={panelChannelId} onChange={(v: string) => setPanelChannelId(v)} options={channelOptions} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.panelModal.panelTitleLabel')}</label>
						<Input value={panelTitle} onChange={(e) => setPanelTitle(e.target.value)} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.panelModal.panelDescLabel')}</label>
						<Input variant="textarea" rows={2} value={panelDesc} onChange={(e) => setPanelDesc(e.target.value)} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.panelModal.buttonLabel')}</label>
						<Input value={panelBtnLabel} onChange={(e) => setPanelBtnLabel(e.target.value)} />
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.panelModal.positionsLabel')}</label>
						<MultiSelector
							value={panelPosIds}
							onChange={setPanelPosIds}
							options={positions.map((p) => ({ label: p.name, value: p.id }))}
							placeholder={t('app.dashboard.applications.submissions.allPositions')}
						/>
					</div>
					<div className="flex items-center justify-end gap-2 pt-2">
						<Button variant="secondary" onClick={() => setPanelModalOpen(false)}>
							{t('app.dashboard.applications.positions.modal.cancelBtn')}
						</Button>
						<Button variant="primary" loading={publishingPanel} disabled={!panelChannelId} onClick={handlePublishPanel}>
							<Send className="w-3.5 h-3.5" />
							<span>{t('app.dashboard.applications.positions.panelModal.publishBtn')}</span>
						</Button>
					</div>
				</div>
			</Modal>

			<Confirm
				open={Boolean(deleteTarget)}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
				title={t('app.dashboard.applications.positions.deleteTitle')}
				description={t('app.dashboard.applications.positions.deleteDesc', { name: deleteTarget?.name || '' })}
				variant="danger"
				loading={deleting}
				onConfirm={handleConfirmDelete}
			/>
		</div>
	);
}
