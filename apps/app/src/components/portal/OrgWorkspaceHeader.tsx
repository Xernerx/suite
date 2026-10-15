/** @format */
'use client';

import { Building2 } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';

interface OrgWorkspaceHeaderProps {
	organization: {
		_id: string;
		name: string;
		iconUrl?: string | null;
		bannerUrl?: string | null;
	};
}

export default function OrgWorkspaceHeader({ organization }: OrgWorkspaceHeaderProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	return (
		<div className="relative flex items-center rounded-[2rem] border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden p-8">
			{organization.bannerUrl && (
				<div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: `url(${organization.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
			)}
			<div className="relative z-10 flex items-center w-full gap-4">
				{organization.iconUrl ? (
					<img src={getEnvUrl(organization.iconUrl)} alt={organization.name} className="h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0 shadow-lg" />
				) : (
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--background)/50 shrink-0 shadow-lg border border-(--border)/10">
						<Building2 className="w-8 h-8 text-(--text-muted)" />
					</div>
				)}
				<div className="flex flex-col gap-1">
					<span className="text-3xl font-extrabold text-(--text) drop-shadow-md tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{organization.name}
					</span>
					<span className="text-sm font-medium text-(--text-muted)">{t('app.portal.workspace.id', { id: organization._id })}</span>
				</div>
			</div>
		</div>
	);
}
