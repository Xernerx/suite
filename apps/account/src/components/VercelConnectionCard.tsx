/** @format */
'use client';

import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Button } from '@xernerx/ui';
import { CheckCircle2, Cloud, ExternalLink, KeyRound, Unplug } from 'lucide-react';
import type { EasypanelConnectionItem } from './EasypanelConnectionCard';

interface VercelConnectionCardProps {
	connection?: EasypanelConnectionItem;
	isBusy: boolean;
	onDisconnect: () => void;
}

export default function VercelConnectionCard({ connection, isBusy, onDisconnect }: VercelConnectionCardProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	return (
		<div className="rounded-3xl border border-(--accent)/25 bg-(--foreground)/30 backdrop-blur-md shadow-sm flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex items-center gap-4 min-w-0">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30 shrink-0">
						<Cloud size={26} />
					</div>
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<h2 className="text-lg font-bold text-(--text)">{t('account.connections.vercel.title')}</h2>
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
							{connection ? t('account.connections.vercel.connectedAs', { team: connection.displayName || connection.username }) : t('account.connections.vercel.description')}
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 shrink-0">
					<Button variant="secondary" onClick={() => window.open(`${getEnvUrl('https://hosting.xernerx.com')}/?node=vercel`, '_blank')} className="flex items-center gap-2 shrink-0">
						<ExternalLink size={15} />
						{t('account.connections.vercel.openHosting')}
					</Button>
					<Button variant="primary" onClick={() => window.location.assign('/api/connections/vercel')} disabled={isBusy} className="flex items-center gap-2 shrink-0">
						<Cloud size={15} />
						{connection ? t('account.connections.vercel.reconnectOauth') : t('account.connections.vercel.oauthButton')}
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
	);
}
