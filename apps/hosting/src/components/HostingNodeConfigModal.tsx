/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { Button, Confirm, Input, Modal } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import { DEFAULT_HOSTING_NODES, type HostingNodeConfig } from './HostingSshModal';

interface HostingNodeConfigModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	nodes: HostingNodeConfig[];
	savingConfig: boolean;
	onSaveNodes: (sanitized: HostingNodeConfig[]) => Promise<void>;
}

export default function HostingNodeConfigModal({ open, onOpenChange, nodes, savingConfig, onSaveNodes }: HostingNodeConfigModalProps) {
	const { t } = useDictionary();
	const { toast, remind } = useToast();

	const [draftNodes, setDraftNodes] = useState<HostingNodeConfig[]>(nodes);
	const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);
	const [confirmResetOpen, setConfirmResetOpen] = useState(false);

	useEffect(() => {
		if (open) {
			setDraftNodes(nodes);
		} else {
			remind(false);
		}
	}, [open, nodes, remind]);

	const isDirty = useMemo(() => JSON.stringify(draftNodes) !== JSON.stringify(nodes), [draftNodes, nodes]);

	const handleUpdateDraftNode = (index: number, field: keyof HostingNodeConfig, value: string) => {
		setDraftNodes((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
	};

	const handleAddDraftNode = () => {
		const nextIdx = draftNodes.length + 1;
		setDraftNodes((prev) => [...prev, { id: `node-${nextIdx}`, name: `node-${nextIdx}`, url: `https://node-${nextIdx}.xernerx.com`, region: `Node ${nextIdx}`, sshPort: '22' }]);
	};

	const handleConfirmRemoveNode = () => {
		if (confirmDeleteIdx === null || draftNodes.length <= 1) {
			setConfirmDeleteIdx(null);
			return;
		}
		setDraftNodes((prev) => prev.filter((_, idx) => idx !== confirmDeleteIdx));
		setConfirmDeleteIdx(null);
	};

	const handleConfirmResetDefaults = () => {
		setDraftNodes(DEFAULT_HOSTING_NODES);
		setConfirmResetOpen(false);
	};

	const handleSave = async () => {
		const sanitized = draftNodes
			.map((n) => ({
				id: (n.id || n.name || 'node')
					.trim()
					.toLowerCase()
					.replace(/[^a-z0-9-_]/g, '-'),
				name: (n.name || n.id || 'node').trim(),
				url: (n.url || '').trim(),
				region: (n.region || '').trim(),
				sshTarget: (n.sshTarget || '').trim(),
				sshPort: (n.sshPort || '22').trim(),
			}))
			.filter((n) => n.id && n.url);

		if (sanitized.length === 0) {
			toast({ type: 'error', title: t('hosting.configModal.invalidError') });
			return;
		}

		await onSaveNodes(sanitized);
		remind(false);
	};

	useEffect(() => {
		if (!open) return;
		if (isDirty) {
			remind(true, handleSave, () => setDraftNodes(nodes), savingConfig);
		} else {
			remind(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, isDirty, draftNodes, nodes, savingConfig]);

	const targetDeleteNode = confirmDeleteIdx !== null ? draftNodes[confirmDeleteIdx] : null;

	return (
		<>
			<Modal open={open} onOpenChange={onOpenChange} maxWidth="max-w-2xl" title={t('hosting.configModal.title')} description={t('hosting.configModal.description')}>
				<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<div className="rounded-2xl bg-(--accent)/10 border border-(--accent)/25 p-3 text-xs text-(--text-muted)">{t('hosting.configModal.cookieHint')}</div>

					<div className="flex flex-col max-h-[50vh] overflow-y-auto pr-1" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
						{draftNodes.map((node, index) => (
							<div key={index} className="flex flex-col rounded-2xl bg-(--background)/50 border border-(--border)/10 p-3.5" style={{ gap: 'calc(var(--ui-gap) * 0.6)' }}>
								<div className="flex items-center justify-between gap-2">
									<span className="text-xs font-extrabold uppercase tracking-wider text-(--accent)">{t('hosting.configModal.nodeLabel', { index: index + 1 })}</span>
									{draftNodes.length > 1 && (
										<button
											type="button"
											onClick={() => setConfirmDeleteIdx(index)}
											className="inline-flex items-center gap-1 text-xs font-semibold text-(--text-muted) hover:text-(--accent-red) transition-colors cursor-pointer"
										>
											<Trash2 size={13} />
											<span>{t('hosting.configModal.deleteNode')}</span>
										</button>
									)}
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'calc(var(--ui-gap) * 0.6)' }}>
									<div className="flex flex-col gap-1">
										<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.configModal.nameField')}</span>
										<Input
											value={node.name}
											onChange={(e) => {
												const val = e.target.value;
												handleUpdateDraftNode(index, 'name', val);
												handleUpdateDraftNode(
													index,
													'id',
													val
														.toLowerCase()
														.replace(/[^a-z0-9-_]/g, '-')
														.replace(/-+/g, '-')
												);
											}}
											placeholder="one-dummi"
										/>
									</div>
									<div className="flex flex-col gap-1">
										<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.configModal.regionField')}</span>
										<Input value={node.region || ''} onChange={(e) => handleUpdateDraftNode(index, 'region', e.target.value)} placeholder="Primary Node" />
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 'calc(var(--ui-gap) * 0.6)' }}>
									<div className="sm:col-span-2 flex flex-col gap-1">
										<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.configModal.urlField')}</span>
										<Input value={node.url} onChange={(e) => handleUpdateDraftNode(index, 'url', e.target.value)} placeholder="https://one-dummi.xernerx.com" />
									</div>
									<div className="flex flex-col gap-1">
										<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('hosting.configModal.sshField')}</span>
										<Input value={node.sshTarget || ''} onChange={(e) => handleUpdateDraftNode(index, 'sshTarget', e.target.value)} placeholder="root@123.45.67.89" />
									</div>
								</div>
							</div>
						))}
					</div>

					<div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-(--border)/10">
						<div className="flex items-center gap-2">
							<Button variant="secondary" size="sm" onClick={handleAddDraftNode} className="flex items-center gap-1.5">
								<Plus size={14} />
								{t('hosting.configModal.addNode')}
							</Button>
							<Button variant="ghost" size="sm" onClick={() => setConfirmResetOpen(true)} className="flex items-center gap-1.5 text-(--text-muted)">
								<RotateCcw size={14} />
								{t('hosting.configModal.resetDefaults')}
							</Button>
						</div>

						<div className="flex items-center gap-2">
							<Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
								{t('hosting.configModal.cancel')}
							</Button>
							<Button variant="primary" size="sm" onClick={handleSave} loading={savingConfig} className="flex items-center gap-1.5">
								<Save size={14} />
								{t('hosting.configModal.save')}
							</Button>
						</div>
					</div>
				</div>
			</Modal>

			<Confirm
				open={confirmDeleteIdx !== null}
				onOpenChange={(next) => !next && setConfirmDeleteIdx(null)}
				title={t('hosting.configModal.deleteConfirmTitle')}
				description={t('hosting.configModal.deleteConfirmDesc', { name: targetDeleteNode?.name || '' })}
				confirmText={t('hosting.configModal.deleteNode')}
				variant="danger"
				onConfirm={handleConfirmRemoveNode}
			/>

			<Confirm
				open={confirmResetOpen}
				onOpenChange={setConfirmResetOpen}
				title={t('hosting.configModal.resetConfirmTitle')}
				description={t('hosting.configModal.resetConfirmDesc')}
				confirmText={t('hosting.configModal.resetDefaults')}
				variant="danger"
				onConfirm={handleConfirmResetDefaults}
			/>
		</>
	);
}
