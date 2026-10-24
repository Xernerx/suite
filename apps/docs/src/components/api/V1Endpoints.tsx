/** @format */
'use client';

import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
import { Input, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useUser } from '@xernerx/providers';
import { V1ProfileEndpoints } from './V1ProfileEndpoints';
import { V1StatsEndpoints } from './V1StatsEndpoints';
import { V1CommandsEndpoints } from './V1CommandsEndpoints';
import { V1PlatformEndpoints } from './V1PlatformEndpoints';

export interface V1EndpointsProps {
	activeGroup?: string;
	searchQuery?: string;
	methodFilter?: string;
	defaultExpanded?: boolean;
	onTryRoute?: (method: string, path: string) => void;
}

export function V1Endpoints({ activeGroup = 'all', searchQuery = '', methodFilter = 'ALL', defaultExpanded = true, onTryRoute }: V1EndpointsProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { user } = useUser();
	const [botId, setBotId] = useState('');
	const [botOptions, setBotOptions] = useState<{ label: string; value: string }[]>([]);

	useEffect(() => {
		if (!user?.id) return;
		let active = true;
		fetch(`${getEnvUrl('https://api.xernerx.com')}/secure/bots`, { credentials: 'include' })
			.then((r) => (r.ok ? r.json() : null))
			.then((res) => {
				if (!active) return;
				const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
				const opts = list
					.filter((b: { id?: string; botId?: string; name?: string; username?: string }) => b && (b.id || b.botId))
					.map((b: { id?: string; botId?: string; name?: string; username?: string }) => {
						const id = String(b.id || b.botId);
						const name = b.name || b.username || id;
						return { label: `${name} (${id})`, value: id };
					});
				setBotOptions(opts);
			})
			.catch(() => {});
		return () => {
			active = false;
		};
	}, [user?.id, getEnvUrl]);

	return (
		<>
			{activeGroup !== 'v1-platform' && (
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex items-center gap-3 min-w-0">
						<div className="w-10 h-10 rounded-2xl bg-(--accent)/10 border border-(--accent)/30 text-(--accent) flex items-center justify-center shrink-0">
							<Bot size={18} />
						</div>
						<div className="min-w-0">
							<h3 className="text-sm font-bold text-(--text)">{t('docs.api.v1.snippetGenerator.botIdLabel')}</h3>
							<p className="text-xs text-(--text-muted) truncate">{t('docs.api.v1.snippetGenerator.botIdHelper')}</p>
						</div>
					</div>
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto sm:min-w-80">
						{botOptions.length > 0 && (
							<div className="sm:w-52">
								<Selector
									value={botId}
									onChange={(val: string) => setBotId(val)}
									options={[{ label: t('docs.api.v1.snippetGenerator.selectBotPlaceholder'), value: '' }, ...botOptions]}
									placeholder={t('docs.api.v1.snippetGenerator.selectBotPlaceholder')}
								/>
							</div>
						)}
						<div className="flex-1 sm:w-56">
							<Input value={botId} onChange={(e) => setBotId(e.target.value)} placeholder={t('docs.api.v1.snippetGenerator.botIdPlaceholder')} />
						</div>
					</div>
				</div>
			)}

			<V1ProfileEndpoints activeGroup={activeGroup} searchQuery={searchQuery} methodFilter={methodFilter} defaultExpanded={defaultExpanded} onTryRoute={onTryRoute} botId={botId} />
			<V1StatsEndpoints activeGroup={activeGroup} searchQuery={searchQuery} methodFilter={methodFilter} defaultExpanded={defaultExpanded} onTryRoute={onTryRoute} botId={botId} />
			<V1CommandsEndpoints activeGroup={activeGroup} searchQuery={searchQuery} methodFilter={methodFilter} defaultExpanded={defaultExpanded} onTryRoute={onTryRoute} botId={botId} />
			<V1PlatformEndpoints
				activeGroup={activeGroup}
				searchQuery={searchQuery}
				methodFilter={methodFilter}
				defaultExpanded={defaultExpanded}
				onTryRoute={onTryRoute}
				botId={botId}
				onBotIdChange={setBotId}
				botOptions={botOptions}
				showBotBar={activeGroup === 'v1-platform'}
			/>
		</>
	);
}
