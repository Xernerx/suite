/** @format */
'use client';

import { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Button, Input, Modal } from '@xernerx/ui';
import { CheckCircle2, ExternalLink, KeyRound, Plus, Server, Settings2, Unplug } from 'lucide-react';

export interface EasypanelConnectionItem {
	provider: string;
	id: string;
	username: string;
	displayName?: string;
	url?: string;
	secret?: string;
	token?: string;
	hasSecret?: boolean;
	hasToken?: boolean;
	showOnProfile: boolean;
	connectedAt?: string;
}

interface EasypanelConnectionCardProps {
	connection?: EasypanelConnectionItem;
	defaultEmail?: string;
	isBusy: boolean;
	onDisconnect: () => void;
	onSaved: (conn: EasypanelConnectionItem) => void;
}

export default function EasypanelConnectionCard({ connection, defaultEmail = '', isBusy, onDisconnect, onSaved }: EasypanelConnectionCardProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [modalOpen, setModalOpen] = useState(false);
	const [email, setEmail] = useState(connection?.username || defaultEmail);
	const [password, setPassword] = useState(connection?.secret || '');
	const [apiToken, setApiToken] = useState(connection?.token || '');
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (connection) {
			setEmail(connection.username || '');
			setPassword(connection.secret || '');
			setApiToken(connection.token || '');
		}
	}, [connection]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		if (params.get('open') === 'easypanel') {
			setModalOpen(true);
			params.delete('open');
			window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
		}
	}, []);

	const handleOpenModal = () => {
		setEmail(connection?.username || defaultEmail);
		setPassword(connection?.secret || '');
		setApiToken(connection?.token || '');
		setModalOpen(true);
	};

	const handleSave = async () => {
		const trimmedEmail = email.trim();
		if (!trimmedEmail) {
			toast({ type: 'error', title: t('account.connections.easypanel.emailRequired') });
			return;
		}
		setSaving(true);
		try {
			const res = await fetch('/api/connections/easypanel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					email: trimmedEmail,
					password,
					apiToken: apiToken.trim(),
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.error || t('account.connections.saveError'));
			}
			onSaved({
				...(data.connection || {}),
				provider: 'easypanel',
				id: trimmedEmail.toLowerCase(),
				username: trimmedEmail,
				displayName: trimmedEmail,
				secret: password,
				token: apiToken.trim(),
				hasSecret: Boolean(password),
				hasToken: Boolean(apiToken.trim()),
				showOnProfile: false,
			});
			setModalOpen(false);
			toast({ type: 'success', title: t('account.connections.easypanel.savedToast') });
		} catch (err: any) {
			toast({ type: 'error', title: err.message || t('account.connections.saveError') });
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
			<div className="rounded-3xl border border-(--accent)/25 bg-(--foreground)/30 backdrop-blur-md shadow-sm flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex items-center gap-4 min-w-0">
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shrink-0">
							<Server size={26} />
						</div>
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<h2 className="text-lg font-bold text-(--text)">{t('account.connections.easypanel.title')}</h2>
								<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
									<KeyRound size={11} />
									{t('account.connections.easypanel.staffBadge')}
								</span>
								{connection && (
									<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/25">
										<CheckCircle2 size={12} />
										{t('account.connections.connected')}
									</span>
								)}
							</div>
							<p className="text-xs text-(--text-muted) mt-1">
								{connection ? t('account.connections.easypanel.connectedAs', { email: connection.username }) : t('account.connections.easypanel.description')}
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2 shrink-0">
						<Button variant="secondary" onClick={() => window.open(getEnvUrl('https://hosting.xernerx.com'), '_blank')} className="flex items-center gap-2 shrink-0">
							<ExternalLink size={15} />
							{t('account.connections.easypanel.openHosting')}
						</Button>
						<Button variant="primary" onClick={handleOpenModal} className="flex items-center gap-2 shrink-0">
							{connection ? <Settings2 size={15} /> : <Plus size={15} />}
							{connection ? t('account.connections.easypanel.editButton') : t('account.connections.connectButton')}
						</Button>
						{connection && (
							<Button variant="secondary" onClick={onDisconnect} disabled={isBusy} className="flex items-center gap-1.5 text-(--accent-red) shrink-0">
								<Unplug size={15} />
								{t('account.connections.disconnect')}
							</Button>
						)}
					</div>
				</div>
			</div>

			<Modal
				open={modalOpen}
				onOpenChange={setModalOpen}
				maxWidth="max-w-xl"
				title={t('account.connections.easypanel.modalTitle')}
				description={t('account.connections.easypanel.modalDescription')}
			>
				<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('account.connections.easypanel.emailLabel')}</span>
						<Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('account.connections.easypanel.emailPlaceholder')} />
					</div>

					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('account.connections.easypanel.passwordLabel')}</span>
						<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('account.connections.easypanel.passwordPlaceholder')} />
					</div>

					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('account.connections.easypanel.tokenLabel')}</span>
						<Input type="password" value={apiToken} onChange={(e) => setApiToken(e.target.value)} placeholder={t('account.connections.easypanel.tokenPlaceholder')} />
					</div>

					<div className="flex items-center justify-end gap-2 pt-2 border-t border-(--border)/10">
						<Button variant="secondary" onClick={() => setModalOpen(false)}>
							{t('common.actions.cancel')}
						</Button>
						<Button variant="primary" onClick={handleSave} loading={saving}>
							{t('account.connections.easypanel.saveButton')}
						</Button>
					</div>
				</div>
			</Modal>
		</>
	);
}
