/** @format */
'use client';

import { Link2 } from 'lucide-react';
import { Input } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface LinksTabProps {
	botConfig: any;
	setBotConfig: (config: any) => void;
}

export default function LinksTab({ botConfig, setBotConfig }: LinksTabProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
			<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
				<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
					<Link2 className="w-4 h-4" />
				</div>
				{t('app.portal.bot.links.header')}
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.links.invite')}</label>
					<Input
						value={botConfig.links?.invite || ''}
						onChange={(e) => setBotConfig({ ...botConfig, links: { ...botConfig.links, invite: e.target.value } })}
						placeholder="https://discord.com/oauth2/authorize..."
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.links.website')}</label>
					<Input
						value={botConfig.links?.website || ''}
						onChange={(e) => setBotConfig({ ...botConfig, links: { ...botConfig.links, website: e.target.value } })}
						placeholder="https://yourwebsite.com"
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.links.support')}</label>
					<Input
						value={botConfig.links?.support || ''}
						onChange={(e) => setBotConfig({ ...botConfig, links: { ...botConfig.links, support: e.target.value } })}
						placeholder="https://discord.gg/..."
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.links.github')}</label>
					<Input
						value={botConfig.links?.github || ''}
						onChange={(e) => setBotConfig({ ...botConfig, links: { ...botConfig.links, github: e.target.value } })}
						placeholder="https://github.com/..."
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.links.privacy')}</label>
					<Input value={botConfig.links?.privacy || ''} onChange={(e) => setBotConfig({ ...botConfig, links: { ...botConfig.links, privacy: e.target.value } })} placeholder="https://..." />
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.links.terms')}</label>
					<Input value={botConfig.links?.terms || ''} onChange={(e) => setBotConfig({ ...botConfig, links: { ...botConfig.links, terms: e.target.value } })} placeholder="https://..." />
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.bot.links.dashboard')}</label>
					<Input
						value={botConfig.links?.dashboard || ''}
						onChange={(e) => setBotConfig({ ...botConfig, links: { ...botConfig.links, dashboard: e.target.value } })}
						placeholder="https://..."
					/>
				</div>
			</div>
		</div>
	);
}
