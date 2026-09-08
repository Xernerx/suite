'use client';

import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Button } from '@xernerx/ui';
import { User, ExternalLink, ShieldCheck, Globe, LifeBuoy, MessageSquare, FileText, Shield } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import Image from 'next/image';

export default function Header({ organization, id, servers }: { organization: any; id: string; servers?: any[] }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	const mainServer = servers?.find((s) => s.id === organization.guild) || servers?.[0];
	const inviteUrl = mainServer?.links?.invite || organization.links?.invite;

	return (
		<div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 p-8 rounded-3xl bg-(--foreground)/50 border border-(--border)/10 backdrop-blur-md shadow-sm mt-8 relative overflow-hidden">
			{organization.bannerUrl && (
				<div
					className="absolute inset-0 opacity-20 pointer-events-none"
					style={{ backgroundImage: `url(${getEnvUrl(organization.bannerUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
				/>
			)}
			{organization.iconUrl || organization.icon ? (
				<Image
					src={organization.iconUrl ? getEnvUrl(organization.iconUrl) : organization.icon}
					alt={organization.name || 'Organization Avatar'}
					width={128}
					height={128}
					className="rounded-2xl shadow-lg border-2 border-(--border)/20 relative z-10"
				/>
			) : (
				<div className="w-32 h-32 rounded-2xl bg-(--background) border-2 border-(--border)/20 flex items-center justify-center text-(--text-muted) shadow-lg relative z-10">
					<User className="w-12 h-12" />
				</div>
			)}
			<div className="flex-1 relative z-10">
				<div className="flex flex-wrap items-center gap-4 mb-3">
					<div className="flex items-center gap-3">
						<h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{organization.name || 'Unknown Organization'}
						</h1>
						{organization.verified && <ShieldCheck className="w-6 h-6 text-green-500" />}
					</div>
				</div>
				<p className="text-lg text-(--text-muted) max-w-2xl">{organization.description || 'No description provided.'}</p>
			</div>

			<div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0 relative z-10 flex flex-col items-start md:items-end gap-6">
				{inviteUrl && (
					<Button variant="primary" onClick={() => window.open(inviteUrl, '_blank')} className="shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_40%,transparent)]">
						Join Server
					</Button>
				)}
				<div className="flex flex-col items-start md:items-end gap-3 w-full">
					{organization.links && Object.entries(organization.links).filter(([key, val]) => val).length > 0 && (
						<div className="flex flex-wrap gap-2 justify-end w-full">
							{Object.entries(organization.links)
								.filter(([key, val]) => val)
								.map(([key, val]) => {
									let Icon: any = ExternalLink;
									if (key === 'github') Icon = FaGithub;
									else if (key === 'website') Icon = Globe;
									else if (key === 'support') Icon = LifeBuoy;
									else if (key === 'community') Icon = MessageSquare;
									else if (key === 'privacy') Icon = Shield;
									else if (key === 'terms') Icon = FileText;

									return (
										<button
											key={key}
											onClick={() => window.open(val as string, '_blank')}
											className="flex items-center gap-1.5 text-xs font-bold text-(--text-muted) hover:text-(--text) bg-(--background)/50 hover:bg-(--background) px-3 py-1.5 rounded-lg border border-(--border)/10 transition-all capitalize shadow-sm"
										>
											<Icon className="w-3.5 h-3.5" />
											{key}
										</button>
									);
								})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
