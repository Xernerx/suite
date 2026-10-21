/** @format */
'use client';

import React, { useMemo, useState } from 'react';
import { Reorder } from 'framer-motion';
import { Button, Confirm, Input, Modal, Selector, Toggle } from '@xernerx/ui';
import { Copy, GripVertical, Settings2, Shield, Trash2 } from 'lucide-react';
import { useDictionary, useToast } from '@xernerx/providers';
import { permissions } from '@xernerx/lib';
import type { DiscordRole, Role } from './types';
import { PermissionMatrix } from './PermissionMatrix';

interface RoleCardProps {
	role: Role;
	discordRoles: DiscordRole[];
	getEnvUrl: (url: string) => string;
	onRoleDeleted: (id: string) => void;
	onRoleUpdated: (updated: Role) => void;
}

export function RoleCard({ role, discordRoles, getEnvUrl, onRoleDeleted, onRoleUpdated }: RoleCardProps) {
	const { toast } = useToast();
	const { t } = useDictionary();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Editable form states
	const [name, setName] = useState(role.name || '');
	const [discordRoleId, setDiscordRoleId] = useState(role.role || '');
	const [sync, setSync] = useState(!!role.sync);
	const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>(() => {
		const initial: Record<string, boolean> = {};
		permissions.forEach((p) => {
			initial[p.key] = role.permissions?.[p.key] ?? p.defaultValue;
		});
		return initial;
	});

	const isDirty = useMemo(() => {
		const permsChanged = Object.keys(localPermissions).some((k) => localPermissions[k] !== (role.permissions?.[k] ?? permissions.find((p) => p.key === k)?.defaultValue));
		return name !== (role.name || '') || discordRoleId !== (role.role || '') || sync !== !!role.sync || permsChanged;
	}, [role, name, discordRoleId, sync, localPermissions]);

	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const submitter = (e.nativeEvent as SubmitEvent).submitter;
		if (submitter && submitter.getAttribute('type') !== 'submit') return;
		setSaving(true);
		try {
			const updatePayload: any = {
				name,
				role: discordRoleId || null,
				sync,
				permissions: localPermissions,
			};
			if (sync && discordRoleId) {
				const matchedDiscordRole = discordRoles.find((d) => d.id === discordRoleId);
				if (matchedDiscordRole) {
					updatePayload.name = matchedDiscordRole.name;
					setName(matchedDiscordRole.name);
				}
			}
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/${role.id}`), {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(updatePayload),
			});
			if (res.ok) {
				const updated = await res.json();
				onRoleUpdated(updated);
				setIsModalOpen(false);
				toast({
					type: 'success',
					title: t('admin.roles.roleUpdated'),
				});
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || t('admin.roles.updateRoleError'));
			}
		} catch (err: any) {
			console.error('Failed to update role:', err);
			toast({
				type: 'error',
				title: t('admin.roles.updateRoleError'),
				description: err.message,
			});
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/${role.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				onRoleDeleted(role.id);
				toast({
					type: 'success',
					title: t('admin.roles.roleDeleted'),
				});
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || t('admin.roles.deleteRoleError'));
			}
		} catch (err: any) {
			console.error('Failed to delete role:', err);
			toast({
				type: 'error',
				title: t('admin.roles.deleteRoleError'),
				description: err.message,
			});
		} finally {
			setDeleting(false);
			setConfirmDeleteOpen(false);
		}
	};

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

	const linkedDiscordRole = discordRoles.find((d) => d.id === role.role);

	return (
		<>
			<Reorder.Item
				value={role}
				as="div"
				className="flex flex-col p-4 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-all hover:border-(--border)/30 hover:bg-(--foreground)/40 group relative overflow-hidden"
				style={{
					gap: 'var(--ui-gap)',
				}}
				onClick={() => setIsModalOpen(true)}
			>
				<div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity text-(--text-muted) p-2 hover:text-(--text)">
					<GripVertical size={16} />
				</div>
				<div className="flex items-start justify-between pl-8">
					<div
						className="flex items-center relative z-10"
						style={{
							gap: 'calc(var(--ui-gap) * 0.75)',
						}}
					>
						<div
							className="flex h-14 w-14 items-center justify-center rounded-2xl shrink-0 shadow-inner transition-colors duration-300"
							style={{
								backgroundColor: linkedDiscordRole?.color ? `#${linkedDiscordRole.color.toString(16)}15` : 'color-mix(in srgb, var(--accent) 10%, transparent)',
								color: linkedDiscordRole?.color ? `#${linkedDiscordRole.color.toString(16)}` : 'var(--accent)',
							}}
						>
							<Shield size={24} />
						</div>
						<div className="flex flex-col overflow-hidden">
							<h2 className="font-bold text-base text-(--text) truncate group-hover:text-(--accent) transition-colors">{role.name || t('admin.roles.unnamedRole')}</h2>
							<div className="flex items-center gap-2 mt-0.5">
								{linkedDiscordRole ? (
									<span
										className="text-xs px-2 py-0.5 rounded-full bg-(--border)/10 font-medium truncate"
										style={{
											color: `#${linkedDiscordRole.color.toString(16)}`,
										}}
									>
										{linkedDiscordRole.name}
									</span>
								) : (
									<span className="text-xs px-2 py-0.5 rounded-full bg-(--border)/10 text-(--text-muted) font-medium truncate">{t('admin.roles.unlinked')}</span>
								)}
								{role.sync && <span className="text-[10px] px-1.5 py-0.5 rounded-xl bg-(--accent)/20 text-(--accent) font-semibold uppercase">{t('admin.roles.synced')}</span>}
							</div>
							<span className="text-[10px] text-(--text-muted)/60 font-mono mt-1 truncate">
								{t('admin.roles.uuid')} {role.id}
							</span>
						</div>
					</div>

					<div className="flex items-center justify-center w-8 h-8 rounded-full bg-(--border)/10 opacity-0 group-hover:opacity-100 transition-all text-(--text) relative z-10 shrink-0 mr-2">
						<Settings2 size={16} />
					</div>
				</div>
			</Reorder.Item>

			<Modal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				title={t('admin.roles.manageConfig')}
				description={t('admin.roles.manageRoleDesc', {
					name: role.name || t('admin.roles.unnamedRole'),
				})}
				maxWidth="max-w-4xl"
			>
				<div
					className="grid grid-cols-1 md:grid-cols-3 overflow-visible"
					style={{
						gap: 'calc(var(--ui-gap) * 1.5)',
					}}
				>
					{/* Left Col: Role Preview */}
					<div className="flex flex-col col-span-1 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md overflow-hidden relative shadow-sm h-fit">
						<div
							className="h-24 w-full"
							style={{
								background: linkedDiscordRole?.color
									? `linear-gradient(135deg, #${linkedDiscordRole.color.toString(16)}40, #${linkedDiscordRole.color.toString(16)}10)`
									: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 40%, transparent), color-mix(in srgb, var(--accent) 10%, transparent))',
							}}
						/>

						<div className="absolute top-12 left-4 rounded-2xl border-4 border-(--background) bg-(--background) overflow-hidden h-20 w-20 shadow-md flex items-center justify-center">
							<Shield
								size={32}
								style={{
									color: linkedDiscordRole?.color ? `#${linkedDiscordRole.color.toString(16)}` : 'var(--accent)',
								}}
							/>
						</div>

						<div className="pt-10 px-5 pb-5 flex flex-col">
							<h3 className="font-bold text-lg text-(--text) truncate">{role.name || t('admin.roles.unnamedRole')}</h3>
							<span className="text-sm text-(--text-muted) truncate">
								{linkedDiscordRole ? t('admin.roles.linkedPrefix', { name: linkedDiscordRole.name }) : t('admin.roles.unlinked')}
							</span>

							<div
								className="mt-4 flex flex-col"
								style={{
									gap: 'calc(var(--ui-gap) * 0.5)',
								}}
							>
								<button
									type="button"
									onClick={() => {
										navigator.clipboard.writeText(role.id);
										toast({
											title: t('admin.roles.roleIdCopied'),
											type: 'success',
										});
									}}
									className="flex items-center justify-between text-xs bg-(--background)/50 p-2.5 rounded-xl border border-(--border)/10 font-mono text-center text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/30 transition-all text-left group cursor-pointer"
								>
									<span className="truncate">
										{t('admin.roles.card.idPrefix', {
											id: role.id,
										})}
									</span>
									<Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
								</button>
								{discordRoleId && (
									<button
										type="button"
										onClick={() => {
											navigator.clipboard.writeText(discordRoleId);
											toast({
												title: t('admin.roles.discordIdCopied'),
												type: 'success',
											});
										}}
										className="flex items-center justify-between text-xs bg-(--background)/50 p-2.5 rounded-xl border border-(--border)/10 font-mono text-center text-(--text-muted) hover:text-(--accent) hover:border-(--accent)/30 transition-all text-left group cursor-pointer"
									>
										<span className="truncate">
											{t('admin.roles.card.discordIdPrefix', {
												discordRoleId,
											})}
										</span>
										<Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
									</button>
								)}
							</div>
						</div>
					</div>

					{/* Right Cols: Form */}
					<form
						onSubmit={handleUpdate}
						className="col-span-1 md:col-span-2 flex flex-col overflow-visible"
						style={{
							gap: 'var(--ui-gap)',
						}}
					>
						<div
							className="grid grid-cols-1 md:grid-cols-2"
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
								<Input type="text" value={name} disabled={sync} onChange={(e) => setName(e.target.value)} className={sync ? 'opacity-60 cursor-not-allowed' : ''} required />
							</div>

							<div
								className="flex flex-col"
								style={{
									gap: 'calc(var(--ui-gap) * 0.4)',
								}}
							>
								<label className="block text-xs font-medium text-(--text)">{t('admin.roles.linkDiscordRoleLabel')}</label>
								<Selector
									value={discordRoleId}
									options={discordRoleOptions}
									onChange={(val: string) => {
										setDiscordRoleId(val);
										if (sync) {
											const matched = discordRoles.find((d) => d.id === val);
											if (matched) setName(matched.name);
										}
									}}
									placeholder={t('admin.roles.selectDiscordRolePlaceholder')}
								/>
							</div>
						</div>

						<div className="flex items-center justify-between p-3 rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md shadow-sm">
							<span className="text-xs font-medium text-(--text)">{t('admin.roles.syncNameWithDiscord')}</span>
							<Toggle
								checked={sync}
								onChange={(e) => {
									const isChecked = e.target.checked;
									setSync(isChecked);
									if (isChecked && discordRoleId) {
										const matched = discordRoles.find((d) => d.id === discordRoleId);
										if (matched) setName(matched.name);
									}
								}}
								size="sm"
							/>
						</div>

						{/* Permission Matrix */}
						<PermissionMatrix permissionsState={localPermissions} onChange={setLocalPermissions} />

						<div className="flex items-center justify-between pt-4 border-t border-(--border)/10 mt-auto">
							<button
								type="button"
								onClick={() => setConfirmDeleteOpen(true)}
								className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-(--accent-red)/10 hover:bg-(--accent-red)/20 text-(--accent-red) text-xs font-medium transition-colors"
							>
								<Trash2 size={14} />
								{t('admin.roles.deleteRole')}
							</button>
							<Button type="submit" disabled={saving || !isDirty}>
								{saving ? t('admin.roles.saving') : t('admin.roles.saveChanges')}
							</Button>
						</div>
					</form>
				</div>
			</Modal>

			<Confirm
				open={confirmDeleteOpen}
				onOpenChange={setConfirmDeleteOpen}
				title={t('admin.roles.deleteRole')}
				description={t('admin.roles.deleteConfirmDescription', {
					name: role.name || t('admin.roles.unnamedRole'),
				})}
				confirmKeyword={role.name || role.id}
				confirmText={t('admin.roles.confirmDelete')}
				cancelText={t('admin.roles.cancel')}
				onConfirm={handleDelete}
				loading={deleting}
			/>
		</>
	);
}
