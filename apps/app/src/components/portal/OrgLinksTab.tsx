/** @format */
'use client';

import { Link2 } from 'lucide-react';
import { Input } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface OrgLinksTabProps {
	orgConfig: any;
	setOrgConfig: (config: any) => void;
}

export default function OrgLinksTab({ orgConfig, setOrgConfig }: OrgLinksTabProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
			<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
				<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
					<Link2 className="w-4 h-4" />
				</div>
				{t('app.portal.links.header')}
			</div>
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.links.website')}</label>
					<Input value={orgConfig.links?.website || ''} onChange={(e) => setOrgConfig({ ...orgConfig, links: { ...orgConfig.links, website: e.target.value } })} placeholder="https://..." />
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.links.github')}</label>
					<Input
						value={orgConfig.links?.github || ''}
						onChange={(e) => setOrgConfig({ ...orgConfig, links: { ...orgConfig.links, github: e.target.value } })}
						placeholder="https://github.com/..."
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.links.privacy')}</label>
					<Input value={orgConfig.links?.privacy || ''} onChange={(e) => setOrgConfig({ ...orgConfig, links: { ...orgConfig.links, privacy: e.target.value } })} placeholder="https://..." />
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.links.terms')}</label>
					<Input value={orgConfig.links?.terms || ''} onChange={(e) => setOrgConfig({ ...orgConfig, links: { ...orgConfig.links, terms: e.target.value } })} placeholder="https://..." />
				</div>
			</div>
		</div>
	);
}
