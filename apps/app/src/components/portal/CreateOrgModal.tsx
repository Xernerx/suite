/** @format */
'use client';

import { useState } from 'react';
import { Button, Input, Modal } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';

interface CreateOrgModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function CreateOrgModal({ open, onOpenChange }: CreateOrgModalProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [newOrgName, setNewOrgName] = useState('');
	const [newOrgDescription, setNewOrgDescription] = useState('');
	const [creatingOrg, setCreatingOrg] = useState(false);

	const handleCreateOrg = async () => {
		if (!newOrgName.trim()) return;
		setCreatingOrg(true);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/organizations'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newOrgName.trim(), description: newOrgDescription.trim() || undefined }),
				credentials: 'include',
			});
			if (res.ok) {
				window.location.reload();
			} else {
				toast({ title: t('app.portal.modals.create.failed'), type: 'error' });
			}
		} catch (error) {
			toast({ title: t('app.portal.modals.create.error'), type: 'error' });
		} finally {
			setCreatingOrg(false);
		}
	};

	return (
		<Modal open={open} onOpenChange={onOpenChange} title={t('app.portal.modals.create.title')} description={t('app.portal.modals.create.desc')}>
			<div className="flex flex-col gap-4 py-4">
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.modals.create.nameLabel')}</label>
					<Input value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} placeholder={t('app.portal.modals.create.namePlaceholder')} autoFocus />
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.modals.create.descLabel')}</label>
					<Input value={newOrgDescription} onChange={(e) => setNewOrgDescription(e.target.value)} placeholder={t('app.portal.modals.create.descPlaceholder')} />
				</div>
			</div>
			<div className="flex justify-end gap-2">
				<Button variant="ghost" onClick={() => onOpenChange(false)}>
					{t('app.portal.modals.create.cancel')}
				</Button>
				<Button variant="primary" onClick={handleCreateOrg} loading={creatingOrg} disabled={!newOrgName.trim() || creatingOrg}>
					{t('app.portal.modals.create.confirm')}
				</Button>
			</div>
		</Modal>
	);
}
