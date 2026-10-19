/** @format */
'use client';

import { Check, Copy, Eye, EyeOff, Loader2, Save, Trash2 } from 'lucide-react';
import { Button, Confirm, Input, Modal, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import { Loading } from '@xernerx/feedback';
import AsyncUserMultiSelector from './AsyncUserMultiSelector';
import BotProfilePreview from './BotProfilePreview';
import { FullToken, TokenStatus } from './types';

interface ManageTokenModalProps {
	tokenId: string | null;
	onClose: () => void;
	onSuccess: () => void;
}

export default function ManageTokenModal({ tokenId, onClose, onSuccess }: ManageTokenModalProps) {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [token, setToken] = useState<FullToken | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [name, setName] = useState('');
	const [owners, setOwners] = useState<string[]>([]);
	const [status, setStatus] = useState<TokenStatus>('active');
	const [isTokenVisible, setIsTokenVisible] = useState(false);
	const [copied, setCopied] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

	useEffect(() => {
		if (!tokenId) {
			setToken(null);
			setIsTokenVisible(false);
			return;
		}
		const fetchFullToken = async () => {
			setIsLoading(true);
			try {
				const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/tokens/${tokenId}`, {
					credentials: 'include',
				});
				if (!res.ok) throw new Error('Failed to fetch full token details');
				const data: FullToken = await res.json();
				setToken(data);
				setName(data.name);
				setOwners(data.owners || []);
				setStatus(data.status);
			} catch (error) {
				toast({
					title: t('account.tokens.manage.loadError', {
						error: (error as Error).message,
					}),
					type: 'error',
				});
				onClose();
			} finally {
				setIsLoading(false);
			}
		};
		fetchFullToken();
	}, [tokenId, onClose, toast, getEnvUrl, t]);

	const isDirty = token ? name !== token.name || [...owners].sort().join(',') !== [...token.owners].sort().join(',') || status !== token.status : false;

	const handleCopy = () => {
		if (!token) return;
		navigator.clipboard.writeText(token.id);
		setCopied(true);
		toast({
			title: t('account.tokens.manage.copySuccess'),
			type: 'success',
		});
		setTimeout(() => setCopied(false), 2000);
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!token) return;
		if (!isDirty) {
			onClose();
			return;
		}
		setIsSaving(true);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/tokens/${token.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					name,
					owners,
					status,
				}),
			});
			if (!res.ok) throw new Error('Update failed');
			toast({
				title: t('account.tokens.manage.updateSuccess'),
				type: 'success',
			});
			onSuccess();
			onClose();
		} catch {
			toast({
				title: t('account.tokens.manage.updateError'),
				type: 'error',
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!token) return;
		setIsSaving(true);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/tokens/${token.id}`, {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Deletion failed');
			toast({
				title: t('account.tokens.manage.deleteSuccess'),
				type: 'success',
			});
			onSuccess();
			onClose();
		} catch {
			toast({
				title: t('account.tokens.manage.deleteError'),
				type: 'error',
			});
		} finally {
			setIsSaving(false);
			setConfirmDeleteOpen(false);
		}
	};

	return (
		<>
			<Modal
				open={!!tokenId}
				onOpenChange={(open) => {
					if (!open) onClose();
				}}
				title={t('account.tokens.manage.modalTitle')}
			>
				{isLoading || !token ? (
					<div className="flex h-64 items-center justify-center">
						<Loading />
					</div>
				) : (
					<>
						<div
							className="flex flex-col rounded-2xl bg-(--background) border border-(--border)/10 p-4"
							style={{
								gap: 'calc(var(--ui-gap) * 0.5)',
							}}
						>
							<label className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">{t('account.tokens.manage.accessKeyLabel')}</label>
							<div className="flex items-center gap-2">
								<div className="flex-1 flex items-center rounded-xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 px-3 py-2 overflow-hidden relative">
									<code className={`text-sm font-mono truncate transition-all duration-300 ${isTokenVisible ? 'text-(--text)' : 'text-(--text-muted) blur-sm select-none'}`}>
										{token.id}
									</code>
								</div>
								<button
									type="button"
									onClick={() => setIsTokenVisible(!isTokenVisible)}
									className="p-2.5 rounded-xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 text-(--text-muted) hover:text-(--text) hover:border-(--accent) transition cursor-pointer"
								>
									{isTokenVisible ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
								<button type="button" onClick={handleCopy} className="p-2.5 rounded-xl bg-(--accent) text-white hover:bg-(--accent-hover) transition cursor-pointer">
									{copied ? <Check size={16} /> : <Copy size={16} />}
								</button>
							</div>
							<p className="text-[11px] text-(--accent-orange) mt-1">{t('account.tokens.manage.securityWarning')}</p>
						</div>

						<form
							onSubmit={handleUpdate}
							className="flex flex-col overflow-visible"
							style={{
								gap: 'var(--ui-gap)',
							}}
						>
							<div
								className="flex flex-col"
								style={{
									gap: 'calc(var(--ui-gap) * 0.5)',
								}}
							>
								<label className="text-sm font-medium text-(--text)">{t('account.tokens.manage.nameLabel')}</label>
								<Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
							</div>

							{token.botId && (
								<div
									className="flex flex-col overflow-visible"
									style={{
										gap: 'calc(var(--ui-gap) * 0.5)',
									}}
								>
									<label className="text-sm font-medium text-(--text)">{t('account.common.description3')}</label>
									<BotProfilePreview botId={token.botId} getEnvUrl={getEnvUrl} />
								</div>
							)}

							<div
								className="flex flex-col overflow-visible"
								style={{
									gap: 'calc(var(--ui-gap) * 0.5)',
								}}
							>
								<label className="text-sm font-medium text-(--text)">{t('account.tokens.manage.ownersLabel')}</label>
								<AsyncUserMultiSelector values={owners} onChange={setOwners} getEnvUrl={getEnvUrl} />
							</div>

							{token.status !== 'pending' && token.status !== 'suspended' && (
								<div className="flex items-center justify-between rounded-xl border border-(--border)/20 bg-(--background) px-4 py-3">
									<div
										className="flex flex-col"
										style={{
											gap: 'calc(var(--ui-gap) * 0.2)',
										}}
									>
										<span className="text-sm font-medium text-(--text)">{t('account.tokens.manage.statusTitle')}</span>
										<span className="text-xs text-(--text-muted)">{status === 'active' ? t('account.tokens.manage.statusActive') : t('account.tokens.manage.statusInactive')}</span>
									</div>
									<Toggle checked={status === 'active'} onChange={() => setStatus(status === 'active' ? 'inactive' : 'active')} />
								</div>
							)}

							<div className="flex items-center justify-between mt-2">
								<Button type="button" variant="danger" disabled={isSaving} onClick={() => setConfirmDeleteOpen(true)}>
									<Trash2 size={14} className="mr-1.5" /> {t('account.tokens.manage.revokeTitle')}
								</Button>
								<div className="flex justify-end gap-3">
									{isDirty && (
										<Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
											{t('account.tokens.manage.closeButton')}
										</Button>
									)}
									<Button type="submit" className="bg-(--accent) text-white hover:bg-(--accent-hover) gap-2" disabled={isSaving}>
										{isSaving ? <Loader2 size={16} className="animate-spin" /> : isDirty ? <Save size={16} /> : <Check size={16} />}
										{isDirty ? t('account.tokens.manage.saveButton') : t('account.tokens.manage.closeButton')}
									</Button>
								</div>
							</div>
						</form>
					</>
				)}
			</Modal>
			<Confirm
				open={confirmDeleteOpen}
				onOpenChange={setConfirmDeleteOpen}
				title={t('account.tokens.manage.revokeTitle')}
				description={t('account.tokens.manage.deleteConfirm')}
				confirmText={t('account.tokens.manage.revokeTitle')}
				cancelText={t('account.tokens.create.cancelButton')}
				onConfirm={handleDelete}
				loading={isSaving}
			/>
		</>
	);
}
