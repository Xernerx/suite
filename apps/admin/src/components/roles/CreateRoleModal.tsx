/** @format */
'use client';

import React from 'react';
import { Button, Modal, Selector, Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import type { DiscordRole } from './types';
import { PermissionMatrix } from './PermissionMatrix';

interface CreateRoleModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	newName: string;
	setNewName: (name: string) => void;
	newDiscordRoleId: string;
	setNewDiscordRoleId: (id: string) => void;
	newSync: boolean;
	setNewSync: (sync: boolean) => void;
	newPermissions: Record<string, boolean>;
	setNewPermissions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
	discordRoles: DiscordRole[];
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	creating: boolean;
}

export function CreateRoleModal({
	open,
	onOpenChange,
	newName,
	setNewName,
	newDiscordRoleId,
	setNewDiscordRoleId,
	newSync,
	setNewSync,
	newPermissions,
	setNewPermissions,
	discordRoles,
	onSubmit,
	creating,
}: CreateRoleModalProps) {
	const { t } = useDictionary();

	const discordRoleOptions = [
		{
			value: '',
			label: t('admin.roles.noneUnlinked'),
		},
		...discordRoles.map((dRole) => ({
			value: dRole.id,
			label: (
				<span
					style={{
						color: dRole.color ? `#${dRole.color.toString(16)}` : 'inherit',
					}}
				>
					{dRole.name}
				</span>
			),
		})),
	];

	return (
		<Modal open={open} onOpenChange={onOpenChange} title={t('admin.roles.createModalTitle')} description={t('admin.roles.createModalDesc')}>
			<form
				onSubmit={onSubmit}
				className="flex flex-col"
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
					<label className="block text-xs font-medium text-(--text)">{t('admin.roles.roleNameLabel')}</label>
					<input
						type="text"
						placeholder={t('admin.roles.roleNamePlaceholder')}
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						className="w-full rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
						style={{
							padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
						}}
						required
					/>
				</div>
				<div
					className="flex flex-col"
					style={{
						gap: 'calc(var(--ui-gap) * 0.4)',
					}}
				>
					<label className="block text-xs font-medium text-(--text)">{t('admin.roles.linkDiscordRoleLabel')}</label>
					<Selector
						value={newDiscordRoleId}
						options={discordRoleOptions}
						onChange={(val: string) => {
							setNewDiscordRoleId(val);
							if (newSync) {
								const matched = discordRoles.find((d) => d.id === val);
								if (matched) setNewName(matched.name);
							}
						}}
						placeholder={t('admin.roles.selectDiscordRolePlaceholder')}
					/>
				</div>
				<div className="flex items-center justify-between pt-1">
					<span className="text-xs font-medium text-(--text)">{t('admin.roles.syncNameWithDiscord')}</span>
					<Toggle
						checked={newSync}
						onChange={(e) => {
							const isChecked = e.target.checked;
							setNewSync(isChecked);
							if (isChecked && newDiscordRoleId) {
								const matched = discordRoles.find((d) => d.id === newDiscordRoleId);
								if (matched) setNewName(matched.name);
							}
						}}
						size="sm"
					/>
				</div>

				{/* Create Permission Matrix */}
				<PermissionMatrix permissionsState={newPermissions} onChange={setNewPermissions} />

				<div className="flex justify-end gap-3 pt-2">
					<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
						{t('admin.roles.cancel')}
					</Button>
					<Button type="submit" variant="primary" disabled={creating}>
						{creating ? t('admin.roles.creating') : t('admin.roles.createButton')}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
