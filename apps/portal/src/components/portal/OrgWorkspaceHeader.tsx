/** @format */
'use client';

import { useState } from 'react';
import { Building2, ExternalLink, Copy, Check } from 'lucide-react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { Button } from '@xernerx/ui';
import Image from 'next/image';
import Link from 'next/link';

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
	const { toast } = useToast();
	const [copiedId, setCopiedId] = useState(false);

	const handleCopyId = () => {
		if (!organization._id) return;
		navigator.clipboard.writeText(organization._id);
		setCopiedId(true);
		toast({ title: t('app.portal.workspace.idCopied'), type: 'success' });
		setTimeout(() => setCopiedId(false), 2000);
	};

	return (
		<div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[2rem] border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden p-8">
			{organization.bannerUrl && (
				<div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: `url(${organization.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
			)}
			<div className="relative z-10 flex items-center gap-4">
				{organization.iconUrl ? (
					<Image
						src={getEnvUrl(organization.iconUrl)}
						alt={organization.name}
						width={80}
						height={80}
						unoptimized
						className="h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0 shadow-lg"
					/>
				) : (
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--background)/50 shrink-0 shadow-lg border border-(--border)/10">
						<Building2 className="w-8 h-8 text-(--text-muted)" />
					</div>
				)}
				<div className="flex flex-col gap-1.5">
					<span className="text-3xl font-extrabold text-(--text) drop-shadow-md tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{organization.name}
					</span>
					<button
						type="button"
						onClick={handleCopyId}
						className="inline-flex items-center gap-1.5 w-fit text-xs font-mono text-(--text-muted) hover:text-(--text) bg-(--background)/60 hover:bg-(--background) px-2.5 py-1 rounded-lg border border-(--border)/10 transition-colors cursor-pointer"
					>
						<span>{t('app.portal.workspace.id', { id: organization._id })}</span>
						{copiedId ? <Check className="w-3.5 h-3.5 text-(--accent-green)" /> : <Copy className="w-3.5 h-3.5" />}
					</button>
				</div>
			</div>
			<div className="relative z-10 flex items-center gap-2 shrink-0">
				<Link href={getEnvUrl(`https://app.xernerx.com/organization/${organization._id}`)}>
					<Button variant="secondary" className="gap-2">
						<ExternalLink className="w-4 h-4" />
						{t('app.portal.workspace.viewPublicProfile')}
					</Button>
				</Link>
			</div>
		</div>
	);
}
