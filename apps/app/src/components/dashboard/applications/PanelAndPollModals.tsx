/** @format */
'use client';

import { BarChart3, Plus, Send, X } from 'lucide-react';
import { Button, Check, Input, Modal, MultiSelector, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import type { YourAppsPanel, YourAppsPosition } from './types';

interface ChannelOption {
	label: string;
	value: string;
}

interface ApplyPanelModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	guildId: string;
	editingPanel: YourAppsPanel | null;
	initialChannelId: string;
	channelOptions: ChannelOption[];
	positions: YourAppsPosition[];
	onSaved: () => void;
}

export function ApplyPanelModal({ open, onOpenChange, guildId, editingPanel, initialChannelId, channelOptions, positions, onSaved }: ApplyPanelModalProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [panelChannelId, setPanelChannelId] = useState(initialChannelId);
	const [panelTitle, setPanelTitle] = useState('');
	const [panelDesc, setPanelDesc] = useState('');
	const [panelBtnLabel, setPanelBtnLabel] = useState('');
	const [panelPosIds, setPanelPosIds] = useState<string[]>([]);
	const [panelAutoSync, setPanelAutoSync] = useState(true);
	const [publishingPanel, setPublishingPanel] = useState(false);

	useEffect(() => {
		if (!open) return;
		if (editingPanel) {
			setPanelChannelId(initialChannelId);
			setPanelTitle(editingPanel.title || t('app.dashboard.applications.positions.panelModal.defaultTitle'));
			setPanelDesc(editingPanel.description || '');
			setPanelBtnLabel(editingPanel.buttonLabel || t('app.dashboard.applications.positions.panelModal.defaultButton'));
			setPanelPosIds([...(editingPanel.positionIds || [])]);
			setPanelAutoSync(editingPanel.autoSync !== false);
		} else {
			setPanelChannelId(initialChannelId);
			setPanelTitle(t('app.dashboard.applications.positions.panelModal.defaultTitle'));
			setPanelDesc(t('app.dashboard.applications.positions.panelModal.defaultDesc'));
			setPanelBtnLabel(t('app.dashboard.applications.positions.panelModal.defaultButton'));
			setPanelPosIds([]);
			setPanelAutoSync(true);
		}
	}, [open, editingPanel, initialChannelId, t]);

	const handlePublishOrUpdatePanel = async () => {
		if (!panelChannelId) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: t('app.dashboard.applications.positions.panelModal.channelLabel'), type: 'error' });
			return;
		}
		setPublishingPanel(true);
		try {
			const url = editingPanel
				? getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/panels/${editingPanel.id}`)
				: getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/panels`);

			const res = await fetch(url, {
				method: editingPanel ? 'PATCH' : 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					channelId: panelChannelId,
					title: panelTitle,
					description: panelDesc,
					buttonLabel: panelBtnLabel,
					positionIds: panelPosIds,
					autoSync: panelAutoSync,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || 'Failed to save panel');
			toast({
				title: editingPanel ? t('app.dashboard.applications.toast.panelUpdated') : t('app.dashboard.applications.toast.panelPublished'),
				type: 'success',
			});
			onOpenChange(false);
			onSaved();
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setPublishingPanel(false);
		}
	};

	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			size="lg"
			title={editingPanel ? t('app.dashboard.applications.positions.panelEditTitle') : t('app.dashboard.applications.positions.panelModal.title')}
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
					<MultiSelector value={panelPosIds} onChange={setPanelPosIds} options={positions.map((p) => ({ label: p.name, value: p.id }))} />
				</div>
				<Check checked={panelAutoSync} onCheckedChange={(c) => setPanelAutoSync(Boolean(c))} label={t('app.dashboard.applications.positions.panelModal.autoSyncLabel')} />
				<div className="flex items-center justify-end gap-2 pt-2">
					<Button variant="secondary" onClick={() => onOpenChange(false)}>
						{t('app.dashboard.applications.positions.modal.cancelBtn')}
					</Button>
					<Button variant="primary" loading={publishingPanel} disabled={!panelChannelId} onClick={handlePublishOrUpdatePanel}>
						<Send className="w-3.5 h-3.5" />
						<span>{editingPanel ? t('app.dashboard.applications.positions.panelSaveBtn') : t('app.dashboard.applications.positions.panelModal.publishBtn')}</span>
					</Button>
				</div>
			</div>
		</Modal>
	);
}

interface NativePollModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	guildId: string;
	initialChannelId: string;
	channelOptions: ChannelOption[];
}

export function NativePollModal({ open, onOpenChange, guildId, initialChannelId, channelOptions }: NativePollModalProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [pollChannelId, setPollChannelId] = useState(initialChannelId);
	const [pollQuestion, setPollQuestion] = useState('');
	const [pollOptions, setPollOptions] = useState<string[]>(['Option 1', 'Option 2']);
	const [pollDraftOpt, setPollDraftOpt] = useState('');
	const [pollDuration, setPollDuration] = useState(48);
	const [pollMultiselect, setPollMultiselect] = useState(false);
	const [publishingPoll, setPublishingPoll] = useState(false);

	useEffect(() => {
		if (open) {
			setPollChannelId(initialChannelId);
		}
	}, [open, initialChannelId]);

	const commitPollOption = () => {
		const trimmed = pollDraftOpt.trim().slice(0, 55);
		if (!trimmed || pollOptions.length >= 10) return;
		if (!pollOptions.some((o) => o.toLowerCase() === trimmed.toLowerCase())) {
			setPollOptions((prev) => [...prev, trimmed]);
		}
		setPollDraftOpt('');
	};

	const handlePublishNativePoll = async () => {
		if (!pollChannelId || !pollQuestion.trim() || pollOptions.length < 2) return;
		setPublishingPoll(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}/applications/panels`), {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mode: 'poll',
					channelId: pollChannelId,
					question: pollQuestion.trim(),
					options: pollOptions,
					durationHours: pollDuration,
					allowMultiselect: pollMultiselect,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || 'Failed to publish poll');
			toast({ title: t('app.dashboard.applications.toast.pollPublished'), type: 'success' });
			onOpenChange(false);
			setPollQuestion('');
		} catch (err: any) {
			toast({ title: t('app.dashboard.applications.toast.saveError'), description: err.message, type: 'error' });
		} finally {
			setPublishingPoll(false);
		}
	};

	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			size="lg"
			title={t('app.dashboard.applications.positions.pollModal.title')}
			description={t('app.dashboard.applications.positions.pollModal.desc')}
		>
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.panelModal.channelLabel')}</label>
					<Selector value={pollChannelId} onChange={(v: string) => setPollChannelId(v)} options={channelOptions} />
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.pollModal.questionLabel')}</label>
					<Input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder={t('app.dashboard.applications.positions.pollModal.questionPlaceholder')} />
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.pollModal.optionsLabel')}</label>
					<div className="flex flex-wrap gap-1.5">
						{pollOptions.map((opt, idx) => (
							<span
								key={`${opt}-${idx}`}
								className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-(--accent)/15 border border-(--accent)/30 text-(--text)"
							>
								<span>{opt}</span>
								{pollOptions.length > 2 && (
									<button
										type="button"
										onClick={() => setPollOptions((prev) => prev.filter((_, i) => i !== idx))}
										className="text-(--text-muted) hover:text-(--accent-red) cursor-pointer"
									>
										<X className="w-3 h-3" />
									</button>
								)}
							</span>
						))}
					</div>
					<div className="flex items-center gap-2">
						<Input
							value={pollDraftOpt}
							disabled={pollOptions.length >= 10}
							onChange={(e) => setPollDraftOpt(e.target.value)}
							onKeyDown={(e) => {
								if (e.nativeEvent.isComposing || e.keyCode === 229) return;
								if (e.key === 'Enter') {
									e.preventDefault();
									commitPollOption();
								}
							}}
							placeholder={t('app.dashboard.applications.positions.pollModal.optionPlaceholder')}
						/>
						<Button type="button" variant="secondary" size="sm" disabled={!pollDraftOpt.trim() || pollOptions.length >= 10} onClick={commitPollOption}>
							<Plus className="w-3.5 h-3.5" />
							<span>{t('app.dashboard.applications.positions.pollModal.addOptionBtn')}</span>
						</Button>
					</div>
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-bold text-(--text)">{t('app.dashboard.applications.positions.pollModal.durationLabel')}</label>
					<Input type="number" min={1} max={168} value={String(pollDuration)} onChange={(e) => setPollDuration(Math.max(1, Math.min(168, Number(e.target.value) || 48)))} />
				</div>
				<Check checked={pollMultiselect} onCheckedChange={(c) => setPollMultiselect(Boolean(c))} label={t('app.dashboard.applications.positions.pollModal.multiselectLabel')} />
				<div className="flex items-center justify-end gap-2 pt-2">
					<Button variant="secondary" onClick={() => onOpenChange(false)}>
						{t('app.dashboard.applications.positions.modal.cancelBtn')}
					</Button>
					<Button variant="primary" loading={publishingPoll} disabled={!pollChannelId || !pollQuestion.trim() || pollOptions.length < 2} onClick={handlePublishNativePoll}>
						<BarChart3 className="w-3.5 h-3.5" />
						<span>{t('app.dashboard.applications.positions.pollModal.publishBtn')}</span>
					</Button>
				</div>
			</div>
		</Modal>
	);
}
