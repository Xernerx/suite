/** @format */
'use client';

import { useState } from 'react';
import { Building2, Check, Image as ImageIcon, Share2, Shield, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useDictionary, useToast } from '@xernerx/providers';
import { Button, CopyButton } from '@xernerx/ui';

export interface ServerHeaderProps {
	server: any;
	organizationData: any;
	canVote: boolean;
	voting: boolean;
	timeLeft: string;
	onVote: () => void;
}

export function ServerHeader({ server, organizationData, canVote, voting, timeLeft, onVote }: ServerHeaderProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [copiedShare, setCopiedShare] = useState(false);

	const avatarUrl = server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=256` : null;
	const bannerUrl = server.banner ? `https://cdn.discordapp.com/banners/${server.id}/${server.banner}.png?size=1024` : null;

	const handleShareProfile = () => {
		const url = window.location.href;
		navigator.clipboard.writeText(url).then(() => {
			setCopiedShare(true);
			toast({ type: 'success', title: t('app.servers.profileLinkCopied'), description: url });
			setTimeout(() => setCopiedShare(false), 2000);
		});
	};

	return (
		<div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 p-8 rounded-3xl bg-(--foreground)/50 border border-(--border)/10 backdrop-blur-md shadow-sm mt-8 relative overflow-hidden">
			{bannerUrl && <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
			{avatarUrl ? (
				<Image src={avatarUrl} alt={server.name} width={128} height={128} className="rounded-2xl shadow-lg border-2 border-(--border)/20 relative z-10" />
			) : (
				<div className="w-32 h-32 rounded-2xl bg-(--background) border-2 border-(--border)/20 flex items-center justify-center text-(--text-muted) shadow-lg relative z-10">
					<ImageIcon className="w-12 h-12" />
				</div>
			)}
			<div className="flex-1 relative z-10">
				<div className="flex flex-wrap items-center gap-3 mb-2">
					<h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{server.name}
					</h1>
					{server.verified && <Shield className="w-6 h-6 text-(--accent-green)" />}
					<CopyButton value={server.id} label={server.id} toastTitle={t('app.servers.idCopied')} toastDescription={server.id} />
				</div>
				<p className="text-lg text-(--text-muted) mb-4 max-w-2xl">{server.description || t('common.noDescription')}</p>

				<div className="flex flex-wrap items-center gap-4">
					{server.bot !== false && (
						<div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-(--background)/80 border border-(--border)/10 shadow-sm backdrop-blur-md">
							<Users className="w-4 h-4 text-(--accent)" />
							<span className="text-sm font-semibold text-(--text)">
								{server.stats && server.stats.length > 0 ? server.stats[server.stats.length - 1].members.toLocaleString() : 'N/A'} {t('app.dashboard.stats.members')}
							</span>
						</div>
					)}
					{organizationData?.name &&
						(organizationData.privacy === 'public' || organizationData.config?.privacy === 'public' ? (
							<Link
								href={`/organization/${organizationData._id}`}
								className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-(--background)/80 border border-(--border)/10 hover:border-(--accent)/50 shadow-sm backdrop-blur-md transition-colors"
							>
								<Building2 className="w-4 h-4 text-(--accent)" />
								<span className="text-sm font-semibold text-(--accent)">{organizationData.name}</span>
							</Link>
						) : (
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-(--background)/80 border border-(--border)/10 shadow-sm backdrop-blur-md">
								<Building2 className="w-4 h-4 text-(--text-muted)" />
								<span className="text-sm font-semibold text-(--text-muted)">{organizationData.name}</span>
							</div>
						))}
				</div>
			</div>

			<div className="flex flex-col gap-3 min-w-[200px] relative z-10 w-full md:w-auto mt-6 md:mt-0">
				<div className="flex gap-2">
					<Button
						variant="primary"
						className="flex-1 justify-center shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_40%,transparent)] transition-shadow"
						onClick={() => window.open(server.links?.invite || server.links?.website || '#', '_blank')}
					>
						{t('app.servers.joinServer')}
					</Button>
					<Button
						variant="secondary"
						onClick={handleShareProfile}
						title={t('app.servers.shareProfile')}
						className="px-3.5 justify-center border border-(--border)/10 hover:border-(--accent)/50"
					>
						{copiedShare ? <Check className="w-4 h-4 text-(--accent-green)" /> : <Share2 className="w-4 h-4" />}
					</Button>
				</div>
				<Button
					variant={canVote ? 'secondary' : 'ghost'}
					className={`w-full justify-center ${canVote ? 'hover:border-(--accent) hover:text-(--accent)' : 'opacity-70 cursor-not-allowed border-(--border)/5 bg-(--foreground)/30'}`}
					onClick={onVote}
					disabled={!canVote || voting}
					loading={voting}
				>
					{canVote ? t('app.servers.voteForServer', { count: server.voteCount || 0 }) : t('app.servers.voteAvailableIn', { time: timeLeft })}
				</Button>
			</div>
		</div>
	);
}
