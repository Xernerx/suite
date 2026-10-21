/** @format */
'use client';

import { RefreshCw, Trash2 } from 'lucide-react';
import { Button, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';

interface SisterServersSectionProps {
	sisterServers: { id: string }[];
	setSisterServers: (servers: { id: string }[]) => void;
	userGuilds: any[];
}

export function SisterServersSection({ sisterServers, setSisterServers, userGuilds }: SisterServersSectionProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	return (
		<div
			className="flex flex-col max-w-md"
			style={{
				gap: 'calc(var(--ui-gap) * 0.5)',
			}}
		>
			<div className="flex justify-between items-center">
				<div>
					<label className="text-xs font-semibold text-(--text)">{t('admin.dashboard.settings.sisterServers')}</label>
					<p className="text-xs text-(--text-muted) mb-1">{t('admin.dashboard.settings.sisterServersDesc')}</p>
				</div>
				<Button type="button" variant="ghost" size="sm" onClick={() => setSisterServers([...sisterServers, { id: '' }])}>
					{t('admin.dashboard.settings.add')}
				</Button>
			</div>
			{sisterServers.map((server, idx) => (
				<div key={idx} className="flex gap-2">
					<div className="flex-1">
						<Selector
							value={server.id}
							onChange={(val: string) => {
								const newServers = sisterServers.map((s, i) => (i === idx ? { id: val } : s));
								setSisterServers(newServers);
							}}
							options={[{ value: '', label: t('admin.dashboard.settings.selectServer') }, ...userGuilds.map((g) => ({ value: g.id, label: g.name }))]}
							placeholder={t('admin.dashboard.settings.selectDiscordGuild')}
						/>
					</div>
					<Button
						type="button"
						variant="outline"
						size="icon"
						disabled={!server.id}
						onClick={async () => {
							toast({ title: t('admin.settings.toasts.syncInitiated'), type: 'info' });
							try {
								const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/sister_servers/sync'), {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									credentials: 'include',
									body: JSON.stringify({ guildId: server.id }),
								});
								if (res.ok) {
									toast({ title: t('admin.settings.toasts.syncStarted', { id: server.id }), type: 'success' });
								} else {
									toast({ title: t('admin.settings.toasts.syncFailed'), type: 'error' });
								}
							} catch (err) {
								console.error(err);
							}
						}}
					>
						<RefreshCw size={16} />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="text-(--accent-red)"
						onClick={() => {
							const newServers = sisterServers.filter((_, i) => i !== idx);
							setSisterServers(newServers);
							toast({ title: t('admin.settings.toasts.sisterServerRemoved'), type: 'info' });
						}}
					>
						<Trash2 size={16} />
					</Button>
				</div>
			))}
		</div>
	);
}
