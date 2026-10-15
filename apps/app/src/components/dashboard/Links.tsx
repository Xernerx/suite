/** @format */
'use client';

import { Globe } from 'lucide-react';
import { Input } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface LinksProps {
	guildConfig: any;
	setGuildConfig: (config: any) => void;
}

export default function Links({ guildConfig, setGuildConfig }: LinksProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
			<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
				<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
					<Globe className="w-4 h-4" />
				</div>
				{t('app.dashboard.links.title')}
			</div>
			<p className="text-sm text-(--text-muted) mb-6">{t('app.dashboard.links.description')}</p>

			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.dashboard.links.inviteUrl')}</label>
					<Input
						value={guildConfig.links?.invite || ''}
						onChange={(e) => setGuildConfig({ ...guildConfig, links: { ...guildConfig.links, invite: e.target.value } })}
						placeholder={t('app.dashboard.links.invitePlaceholder')}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.dashboard.links.website')}</label>
					<Input
						value={guildConfig.links?.website || ''}
						onChange={(e) => setGuildConfig({ ...guildConfig, links: { ...guildConfig.links, website: e.target.value } })}
						placeholder={t('app.dashboard.links.websitePlaceholder')}
					/>
				</div>
			</div>
		</div>
	);
}
