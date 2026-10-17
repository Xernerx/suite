/** @format */
'use client';

import { Loader2 } from 'lucide-react';
import { Button, Modal } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import AsyncUserMultiSelector from './AsyncUserMultiSelector';

interface CreateTokenModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	userId?: string;
}

export default function CreateTokenModal({ isOpen, onClose, onSuccess, userId }: CreateTokenModalProps) {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [name, setName] = useState('');
	const [owners, setOwners] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (isOpen && userId && owners.length === 0) {
			setOwners([userId]);
		} else if (!isOpen) {
			setName('');
			setOwners(userId ? [userId] : []);
		}
	}, [isOpen, userId]);

	const generateTokenString = () => 'xrx_' + crypto.randomUUID().replace(/-/g, '');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		setIsSubmitting(true);
		const newTokenId = generateTokenString();
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/tokens/${newTokenId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					name,
					status: 'pending',
					owners,
					userId: userId || owners[0],
				}),
			});
			if (!res.ok) throw new Error('Failed to create token');
			toast({
				title: t('account.tokens.create.success'),
				type: 'success',
			});
			onSuccess();
			onClose();
		} catch (error) {
			toast({
				title: t('account.tokens.create.errorTitle'),
				description: t('account.tokens.create.errorDesc', {
					error: (error as Error).message,
				}),
				type: 'error',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			title={t('account.tokens.create.modalTitle')}
		>
			<form
				onSubmit={handleSubmit}
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
					<label className="text-sm font-medium text-(--text)">{t('account.tokens.create.nameLabel')}</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder={t('account.tokens.create.namePlaceholder')}
						className="w-full rounded-xl border border-(--border)/20 bg-(--background) px-4 py-2.5 text-sm text-(--text) outline-none transition focus:border-(--accent) focus:ring-1 focus:ring-(--accent)"
						required
						autoFocus
					/>
				</div>

				<div
					className="flex flex-col overflow-visible"
					style={{
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<label className="text-sm font-medium text-(--text)">{t('account.tokens.manage.ownersLabel')}</label>
					<AsyncUserMultiSelector values={owners} onChange={setOwners} getEnvUrl={getEnvUrl} />
				</div>

				<div className="flex justify-end gap-3 mt-2">
					<Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
						{t('account.tokens.create.cancelButton')}
					</Button>
					<Button type="submit" className="bg-(--accent) text-white hover:bg-(--accent-hover)" disabled={isSubmitting}>
						{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t('account.tokens.create.submitButton')}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
