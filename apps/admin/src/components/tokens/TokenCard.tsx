/** @format */
'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Confirm, Input, Modal, Selector, Toggle } from '@xernerx/ui';
import { Copy, Key, ScrollText, Settings2, Trash2 } from 'lucide-react';
import { useDictionary, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import type { Token } from './types';
import { BotProfilePreview } from './BotProfilePreview';
import { AsyncUserMultiSelector } from './AsyncUserMultiSelector';

interface TokenCardProps {
	token: Token;
	getEnvUrl: (url: string) => string;
	onTokenDeleted: (id: string) => void;
	onTokenUpdated: (updated: Token) => void;
	onViewAuditLogs?: (tokenId: string) => void;
}

export function TokenCard({ token, getEnvUrl, onTokenDeleted, onTokenUpdated, onViewAuditLogs }: TokenCardProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [fullToken, setFullToken] = useState<Token | null>(null);
	const [saving, setSaving] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Editable form states
	const [name, setName] = useState(token.name || '');
	const [status, setStatus] = useState<Token['status']>(token.status || 'active');
	const [botId, setBotId] = useState('');
	const [selectedOwners, setSelectedOwners] = useState<string[]>(token.owners || []);
	const [secure, setSecure] = useState(false);
	const [websocket, setWebsocket] = useState(false);

	const isDirty = useMemo(() => {
		if (!fullToken) return false;
		const sortedSelectedOwners = [...selectedOwners].sort();
		const sortedOriginalOwners = [...(fullToken.owners || [])].sort();
		const ownersChanged = JSON.stringify(sortedSelectedOwners) !== JSON.stringify(sortedOriginalOwners);
		return (
			name !== (fullToken.name || '') ||
			status !== (fullToken.status || 'active') ||
			botId !== (fullToken.botId || '') ||
			ownersChanged ||
			secure !== !!fullToken.permissions?.secure ||
			websocket !== !!fullToken.permissions?.websocket
		);
	}, [fullToken, name, status, botId, selectedOwners, secure, websocket]);

	const handleToggleExpand = async () => {
		setIsModalOpen(true);
		if (!fullToken && !loadingDetails) {
			setLoadingDetails(true);
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/tokens/${token.id}`), {
					credentials: 'include',
				});
				if (res.ok) {
					const data: Token = await res.json();
					setFullToken(data);
					setName(data.name || '');
					setStatus(data.status || 'active');
					setBotId(data.botId || '');
					setSelectedOwners(data.owners || []);
					setSecure(!!data.permissions?.secure);
					setWebsocket(!!data.permissions?.websocket);
				}
			} catch (err) {
				console.error('Failed to fetch token details:', err);
			} finally {
				setLoadingDetails(false);
			}
		}
	};

	const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const submitter = (e.nativeEvent as SubmitEvent).submitter;
		if (submitter && submitter.getAttribute('type') !== 'submit') return;
		setSaving(true);
		try {
			const payload = {
				name,
				status,
				botId: botId || undefined,
				owners: selectedOwners,
				permissions: {
					secure,
					websocket,
				},
			};
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/tokens/${token.id}`), {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(payload),
			});
			if (res.ok) {
				const updated = await res.json();
				const manuallyUpdatedToken: Token = {
					...(fullToken as Token),
					...updated,
					name,
					status,
					botId: botId || undefined,
					owners: selectedOwners,
					permissions: {
						secure,
						websocket,
					},
				};
				setFullToken(manuallyUpdatedToken);
				onTokenUpdated(manuallyUpdatedToken);
				toast({
					title: t('admin.tokens.tokenUpdated'),
					type: 'success',
				});
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || t('admin.tokens.toast.updateError'));
			}
		} catch (err: any) {
			toast({
				type: 'error',
				title: t('admin.tokens.toast.updateError'),
				description: err.message,
			});
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/tokens/${token.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (res.ok) {
				onTokenDeleted(token.id);
				setIsModalOpen(false);
				toast({
					type: 'success',
					title: t('admin.tokens.tokenDeleted'),
				});
			} else {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || t('admin.tokens.toast.deleteError'));
			}
		} catch (err: any) {
			toast({
				type: 'error',
				title: t('admin.tokens.toast.deleteError'),
				description: err.message,
			});
		} finally {
			setDeleting(false);
			setConfirmDeleteOpen(false);
		}
	};

	const statusColors = {
		active: 'bg-(--accent-green)/10 text-(--accent-green)',
		inactive: 'bg-(--text-muted)/10 text-(--text-muted)',
		suspended: 'bg-(--accent-red)/10 text-(--accent-red)',
		pending: 'bg-(--accent-orange)/10 text-(--accent-orange)',
	};

	return (
		<>
			<motion.div
				layout
				initial={{
					opacity: 0,
					y: 10,
				}}
				animate={{
					opacity: 1,
					y: 0,
				}}
				exit={{
					opacity: 0,
					scale: 0.95,
				}}
				onClick={handleToggleExpand}
				className="flex items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-(--accent)/30 group relative"
				style={{
					padding: 'calc(var(--ui-gap) * 0.75)',
				}}
			>
				<div className="absolute inset-0 bg-gradient-to-br from-transparent to-(--border)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

				<div
					className="flex items-center relative z-10"
					style={{
						gap: 'calc(var(--ui-gap) * 0.75)',
					}}
				>
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/10 shrink-0 text-(--accent) shadow-inner transition-colors duration-300 group-hover:bg-(--accent)/20">
						<Key size={24} />
					</div>
					<div className="flex flex-col overflow-hidden">
						<h2 className="font-bold text-base text-(--text) truncate group-hover:text-(--accent) transition-colors">{token.name || t('admin.tokens.empty.title')}</h2>
						<div className="flex items-center gap-2 mt-0.5">
							<span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[token.status] || statusColors.active}`}>
								{t(`admin.tokens.statusOptions.${token.status}`)}
							</span>
						</div>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								navigator.clipboard.writeText(token.id);
								toast({
									title: t('admin.tokens.tokenIdCopied'),
									type: 'success',
								});
							}}
							className="inline-flex items-center gap-1 w-fit text-[10px] text-(--text-muted)/60 hover:text-(--text) font-mono mt-1 truncate transition-colors cursor-pointer"
						>
							<span className="truncate">
								{t('admin.tokens.card.idPrefix')}
								{token.id}
							</span>
							<Copy size={10} className="shrink-0 opacity-70" />
						</button>
					</div>
				</div>

				<div className="flex items-center justify-center w-8 h-8 rounded-full bg-(--border)/10 opacity-0 group-hover:opacity-100 transition-all text-(--text) relative z-10 shrink-0 mr-2">
					<Settings2 size={16} />
				</div>
			</motion.div>

			<Modal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				title={t('admin.tokens.manage.modalTitle')}
				description={t('admin.tokens.manage.description', { name: token.name || t('admin.tokens.empty.title') })}
				maxWidth="max-w-2xl"
			>
				<div
					className="flex flex-col overflow-visible"
					style={{
						padding: 'var(--ui-gap)',
						gap: 'var(--ui-gap)',
					}}
				>
					{loadingDetails ? (
						<div className="flex justify-center py-6">
							<Loading variant="small" />
						</div>
					) : (
						<form
							onSubmit={handleUpdate}
							className="flex flex-col overflow-visible"
							style={{
								gap: 'calc(var(--ui-gap) * 1.5)',
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
									<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.manage.nameLabel')}</label>
									<Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
								</div>

								<div
									className="flex flex-col"
									style={{
										gap: 'calc(var(--ui-gap) * 0.4)',
									}}
								>
									<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.edit.status')}</label>
									<Selector
										value={status}
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
										onChange={(val: string) => setStatus(val as Token['status'])}
									/>
								</div>
							</div>

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
									<label className="block text-xs font-medium text-(--text)">{t('admin.tokens.edit.botId')}</label>
									<div className="flex flex-col gap-2 w-full">
										{botId && botId.length >= 15 && (
											<div className="flex flex-wrap gap-2">
												<BotProfilePreview botId={botId} getEnvUrl={getEnvUrl} onClear={() => setBotId('')} />
											</div>
										)}
										<div className="relative w-full">
											<Input type="text" value={botId} onChange={(e) => setBotId(e.target.value)} placeholder={t('admin.tokens.edit.botIdPlaceholder')} />
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
									<AsyncUserMultiSelector values={selectedOwners} onChange={setSelectedOwners} getEnvUrl={getEnvUrl} />
								</div>
							</div>

							<div className="flex items-center justify-between p-3 rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md shadow-sm">
								<div className="flex flex-col">
									<span className="text-xs font-medium text-(--text)">{t('admin.tokens.edit.secure')}</span>
									<span className="text-[11px] text-(--text-muted)">{t('admin.tokens.edit.allowFetching')}</span>
								</div>
								<Toggle checked={secure} onChange={(e) => setSecure(e.target.checked)} size="sm" />
							</div>

							<div className="flex items-center justify-between p-3 rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md shadow-sm">
								<div className="flex flex-col">
									<span className="text-xs font-medium text-(--text)">{t('admin.tokens.edit.websocket')}</span>
									<span className="text-[11px] text-(--text-muted)">{t('admin.tokens.edit.websocketDescription')}</span>
								</div>
								<Toggle checked={websocket} onChange={(e) => setWebsocket(e.target.checked)} size="sm" />
							</div>

							<div className="flex items-center justify-between pt-4 border-t border-(--border)/10 mt-auto">
								<div className="flex flex-wrap items-center gap-2">
									<button
										type="button"
										onClick={() => setConfirmDeleteOpen(true)}
										className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-(--accent-red)/10 hover:bg-(--accent-red)/20 text-(--accent-red) text-xs font-medium transition-colors"
									>
										<Trash2 size={14} />
										{t('admin.tokens.manage.revokeTitle')}
									</button>
									<button
										type="button"
										onClick={() => {
											navigator.clipboard.writeText(token.id);
											toast({
												title: t('admin.tokens.tokenIdCopied'),
												type: 'success',
											});
										}}
										className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-(--background)/50 hover:bg-(--border)/10 text-(--text-muted) text-xs font-mono font-medium transition-colors"
									>
										<Copy size={12} />
										{(token.id || '').substring(0, 8)}...
									</button>
									{onViewAuditLogs && (
										<button
											type="button"
											onClick={() => {
												setIsModalOpen(false);
												onViewAuditLogs(token.id);
											}}
											className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-(--background)/50 hover:bg-(--border)/10 text-(--text-muted) hover:text-(--accent) text-xs font-medium transition-colors"
										>
											<ScrollText size={13} />
											{t('admin.users.viewAuditHistory')}
										</button>
									)}
								</div>
								<Button type="submit" disabled={saving || !isDirty}>
									{saving ? t('admin.roles.saving') : t('admin.tokens.manage.saveButton')}
								</Button>
							</div>
						</form>
					)}
				</div>
			</Modal>

			<Confirm
				open={confirmDeleteOpen}
				onOpenChange={setConfirmDeleteOpen}
				title={t('admin.tokens.manage.revokeTitle')}
				description={t('admin.tokens.manage.deleteConfirm')}
				confirmKeyword={token.name || token.id}
				confirmText={t('admin.roles.confirmDelete')}
				cancelText={t('admin.roles.cancel')}
				onConfirm={handleDelete}
				loading={deleting}
			/>
		</>
	);
}
