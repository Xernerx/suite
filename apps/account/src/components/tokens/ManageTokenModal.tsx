/** @format */
'use client';

import { Activity, Check, Clock, Copy, Eye, EyeOff, Loader2, RefreshCw, Save, Trash2 } from 'lucide-react';
import { Badge, Button, Confirm, Input, Modal, Toggle } from '@xernerx/ui';
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
	onTokenRolled?: (newTokenId: string) => void;
}

export default function ManageTokenModal({ tokenId, onClose, onSuccess, onTokenRolled }: ManageTokenModalProps) {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [token, setToken] = useState<FullToken | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isRolling, setIsRolling] = useState(false);
	const [name, setName] = useState('');
	const [owners, setOwners] = useState<string[]>([]);
	const [status, setStatus] = useState<TokenStatus>('active');
	const [isTokenVisible, setIsTokenVisible] = useState(false);
	const [copied, setCopied] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [confirmRollOpen, setConfirmRollOpen] = useState(false);

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

	const verifyDesktopBiometric = async (): Promise<boolean> => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (!bridge?.verifyBiometrics) return true;
		try {
			const res = await bridge.verifyBiometrics(t('account.preferences.desktop.biometricPromptToken'));
			return !res || res.verified !== false;
		} catch {
			return true;
		}
	};

	const handleToggleVisible = async () => {
		if (!isTokenVisible) {
			const ok = await verifyDesktopBiometric();
			if (!ok) return;
		}
		setIsTokenVisible(!isTokenVisible);
	};

	const handleCopy = async () => {
		if (!token) return;
		if (!isTokenVisible) {
			const ok = await verifyDesktopBiometric();
			if (!ok) return;
		}
		navigator.clipboard.writeText(token.id);
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (bridge?.guardClipboardSecret) {
			bridge.guardClipboardSecret(token.id, 60000).catch(() => {});
		} else {
			toast({
				title: t('account.tokens.manage.copySuccess'),
				type: 'success',
			});
		}
		setCopied(true);
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

	const handleRollToken = async () => {
		if (!token) return;
		setIsRolling(true);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/tokens/${token.id}/roll`, {
				method: 'POST',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Roll failed');
			const data = await res.json();
			const nextRecord: FullToken = data.record || { ...token, id: data.token };
			setToken(nextRecord);
			setIsTokenVisible(true);
			navigator.clipboard.writeText(nextRecord.id);
			const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
			if (bridge?.guardClipboardSecret) {
				bridge.guardClipboardSecret(nextRecord.id, 60000).catch(() => {});
			}
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			toast({
				title: t('account.tokens.manage.rollSuccess'),
				type: 'success',
			});
			if (onTokenRolled) onTokenRolled(nextRecord.id);
			onSuccess();
		} catch {
			toast({
				title: t('account.tokens.manage.rollError'),
				type: 'error',
			});
		} finally {
			setIsRolling(false);
			setConfirmRollOpen(false);
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
						<Loading variant="small" />
					</div>
				) : (
					<>
						<div
							className="flex flex-col rounded-2xl bg-(--background) border border-(--border)/10 p-4"
							style={{
								gap: 'calc(var(--ui-gap) * 0.5)',
							}}
						>
							<div className="flex items-center justify-between gap-2">
								<label className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">{t('account.tokens.manage.accessKeyLabel')}</label>
								<div className="flex flex-wrap items-center gap-1.5">
									<Badge variant="muted" size="sm" icon={<Activity size={11} />}>
										{t('account.tokens.requestsBadge', { count: (token.requestCount ?? 0).toLocaleString() })}
									</Badge>
									<Badge variant="muted" size="sm" icon={<Clock size={11} />}>
										{token.lastUsedAt ? t('account.tokens.lastUsedBadge', { date: new Date(token.lastUsedAt).toLocaleDateString() }) : t('account.tokens.neverUsedBadge')}
									</Badge>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<div className="flex-1 flex items-center rounded-xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 px-3 py-2 overflow-hidden relative">
									<code className={`text-sm font-mono truncate transition-all duration-300 ${isTokenVisible ? 'text-(--text)' : 'text-(--text-muted) blur-sm select-none'}`}>
										{token.id}
									</code>
								</div>
								<button
									type="button"
									onClick={handleToggleVisible}
									className="p-2.5 rounded-xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 text-(--text-muted) hover:text-(--text) hover:border-(--accent) transition cursor-pointer"
								>
									{isTokenVisible ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
								<button type="button" onClick={handleCopy} className="p-2.5 rounded-xl bg-(--accent) text-white hover:bg-(--hover-accent) transition cursor-pointer">
									{copied ? <Check size={16} /> : <Copy size={16} />}
								</button>
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={async () => {
										const ok = await verifyDesktopBiometric();
										if (ok) setConfirmRollOpen(true);
									}}
									disabled={isRolling}
									className="shrink-0"
								>
									<RefreshCw size={14} className={isRolling ? 'animate-spin' : ''} />
									{t('account.tokens.manage.rollButton')}
								</Button>
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
									<Button type="submit" className="bg-(--accent) text-white hover:bg-(--hover-accent) gap-2" disabled={isSaving}>
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
				confirmKeyword={token?.name || token?.id || undefined}
				confirmText={t('account.tokens.manage.revokeTitle')}
				cancelText={t('account.tokens.create.cancelButton')}
				onConfirm={handleDelete}
				variant="danger"
				loading={isSaving}
			/>
			<Confirm
				open={confirmRollOpen}
				onOpenChange={setConfirmRollOpen}
				title={t('account.tokens.manage.rollConfirmTitle')}
				description={t('account.tokens.manage.rollConfirmDesc')}
				confirmText={t('account.tokens.manage.rollButton')}
				cancelText={t('account.tokens.create.cancelButton')}
				onConfirm={handleRollToken}
				variant="warning"
				loading={isRolling}
			/>
		</>
	);
}
