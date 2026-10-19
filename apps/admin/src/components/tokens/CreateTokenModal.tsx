/** @format */
'use client';

import React from 'react';
import { Button, Input, Modal, Selector, Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import type { Token } from './types';
import { BotProfilePreview } from './BotProfilePreview';
import { AsyncUserMultiSelector } from './AsyncUserMultiSelector';

interface CreateTokenModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	newName: string;
	setNewName: (name: string) => void;
	newStatus: Token['status'];
	setNewStatus: (status: Token['status']) => void;
	newBotId: string;
	setNewBotId: (id: string) => void;
	newSelectedOwners: string[];
	setNewSelectedOwners: (owners: string[]) => void;
	newSecure: boolean;
	setNewSecure: (secure: boolean) => void;
	newWebsocket: boolean;
	setNewWebsocket: (ws: boolean) => void;
	getEnvUrl: (url: string) => string;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	creating: boolean;
}

export function CreateTokenModal({
	open,
	onOpenChange,
	newName,
	setNewName,
	newStatus,
	setNewStatus,
	newBotId,
	setNewBotId,
	newSelectedOwners,
	setNewSelectedOwners,
	newSecure,
	setNewSecure,
	newWebsocket,
	setNewWebsocket,
	getEnvUrl,
	onSubmit,
	creating,
}: CreateTokenModalProps) {
	const { t } = useDictionary();

	return (
		<Modal open={open} onOpenChange={onOpenChange} title={t('admin.tokens.create.modalTitle')} description={t('admin.tokens.description')}>
			<form
				onSubmit={onSubmit}
				className="flex flex-col overflow-visible"
				style={{
					gap: 'var(--ui-gap)',
				}}
			>
				<div
					className="flex flex-col"
					style={{
						gap: 'calc(var(--ui-gap) * 0.4)',
					}}
				>
					<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.create.nameLabel')}</label>
					<Input type="text" placeholder={t('admin.tokens.create.namePlaceholder')} value={newName} onChange={(e) => setNewName(e.target.value)} required />
				</div>
				<div
					className="flex flex-col"
					style={{
						gap: 'calc(var(--ui-gap) * 0.4)',
					}}
				>
					<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.edit.status')}</label>
					<Selector
						value={newStatus}
						options={[
							{
								label: t('admin.tokens.statusOptions.active'),
								value: 'active',
							},
							{
								label: t('admin.tokens.statusOptions.inactive'),
								value: 'inactive',
							},
							{
								label: t('admin.tokens.statusOptions.suspended'),
								value: 'suspended',
							},
							{
								label: t('admin.tokens.statusOptions.pending'),
								value: 'pending',
							},
						]}
						onChange={(val: string) => setNewStatus(val as Token['status'])}
					/>
				</div>
				<div
					className="flex flex-col"
					style={{
						gap: 'calc(var(--ui-gap) * 0.4)',
					}}
				>
					<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.edit.botId')}</label>
					<div className="flex flex-col gap-2 w-full">
						{newBotId && newBotId.length >= 15 && (
							<div className="flex flex-wrap gap-2">
								<BotProfilePreview botId={newBotId} getEnvUrl={getEnvUrl} onClear={() => setNewBotId('')} />
							</div>
						)}
						<div className="relative w-full">
							<Input type="text" placeholder={t('admin.tokens.edit.botIdPlaceholder')} value={newBotId} onChange={(e) => setNewBotId(e.target.value)} />
						</div>
					</div>
				</div>
				<div
					className="flex flex-col overflow-visible"
					style={{
						gap: 'calc(var(--ui-gap) * 0.4)',
					}}
				>
					<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.manage.ownersLabel')}</label>
					<AsyncUserMultiSelector values={newSelectedOwners} onChange={setNewSelectedOwners} getEnvUrl={getEnvUrl} />
				</div>
				<div className="flex items-center justify-between pt-1">
					<div className="flex flex-col">
						<span className="text-xs font-medium text-(--text)">{t('admin.tokens.edit.secure')}</span>
						<span className="text-[11px] text-(--text-muted)">{t('admin.tokens.edit.allowFetching')}</span>
					</div>
					<Toggle checked={newSecure} onChange={(e) => setNewSecure(e.target.checked)} size="sm" />
				</div>
				<div className="flex items-center justify-between p-3 rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md shadow-sm mt-3">
					<div className="flex flex-col">
						<span className="text-xs font-medium text-(--text)">{t('admin.tokens.edit.websocket')}</span>
						<span className="text-[11px] text-(--text-muted)">{t('admin.tokens.edit.websocketDescription')}</span>
					</div>
					<Toggle checked={newWebsocket} onChange={(e) => setNewWebsocket(e.target.checked)} size="sm" />
				</div>
				<div className="flex justify-end gap-3 pt-2">
					<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
						{t('admin.tokens.create.cancelButton')}
					</Button>
					<Button type="submit" variant="primary" disabled={creating}>
						{creating ? t('admin.roles.creating') : t('admin.tokens.create.submitButton')}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
