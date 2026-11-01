/** @format */
'use client';

import { useState } from 'react';
import { Server, LayoutDashboard, Link2, Unlink } from 'lucide-react';
import { Button, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import Image from 'next/image';
import Link from 'next/link';

interface OrgServersTabProps {
	orgConfig: any;
	setOrgConfig: (config: any) => void;
	orgGuilds: any[];
	setOrgGuilds?: React.Dispatch<React.SetStateAction<any[]>>;
	managedGuilds?: any[];
}

export default function OrgServersTab({ orgConfig, setOrgConfig, orgGuilds, setOrgGuilds, managedGuilds = [] }: OrgServersTabProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [selectedGuildId, setSelectedGuildId] = useState('');
	const [busyGuildId, setBusyGuildId] = useState<string | null>(null);

	const linkedIds = new Set(orgGuilds.map((g) => String(g.id)));
	const availableGuilds = managedGuilds.filter((g) => g?.id && !linkedIds.has(String(g.id)));

	const handleLinkServer = async () => {
		if (!selectedGuildId || !orgConfig?._id) return;
		const targetGuild = managedGuilds.find((g) => String(g.id) === selectedGuildId);
		setBusyGuildId(selectedGuildId);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${selectedGuildId}`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					organization: orgConfig._id,
					...(targetGuild?.name ? { name: targetGuild.name } : {}),
					...(targetGuild?.icon !== undefined ? { icon: targetGuild.icon } : {}),
				}),
			});
			if (res.ok) {
				const updated = await res.json().catch(() => null);
				setOrgGuilds?.((prev) => [...prev, updated || { id: selectedGuildId, name: targetGuild?.name || selectedGuildId, icon: targetGuild?.icon, organization: orgConfig._id }]);
				setSelectedGuildId('');
				toast({ title: t('app.portal.servers.linkedToast'), type: 'success' });
			} else {
				toast({ title: t('common.toast.saveFailed'), type: 'error' });
			}
		} catch {
			toast({ title: t('common.toast.saveError'), type: 'error' });
		} finally {
			setBusyGuildId(null);
		}
	};

	const handleUnlinkServer = async (guildId: string) => {
		setBusyGuildId(guildId);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${guildId}`), {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ organization: '' }),
			});
			if (res.ok) {
				setOrgGuilds?.((prev) => prev.filter((g) => String(g.id) !== String(guildId)));
				if (orgConfig?.guild === guildId) {
					setOrgConfig({ ...orgConfig, guild: '' });
				}
				toast({ title: t('app.portal.servers.unlinkedToast'), type: 'success' });
			} else {
				toast({ title: t('common.toast.saveFailed'), type: 'error' });
			}
		} catch {
			toast({ title: t('common.toast.saveError'), type: 'error' });
		} finally {
			setBusyGuildId(null);
		}
	};

	return (
		<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
			<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
				<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
					<Server className="w-4 h-4" />
				</div>
				{t('app.portal.servers.header')}
			</div>
			<div className="flex flex-col gap-6">
				{availableGuilds.length > 0 && (
					<div className="flex flex-col gap-2 pb-6 border-b border-(--border)/10">
						<label className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('app.portal.servers.linkServerLabel')}</label>
						<div className="flex flex-col sm:flex-row gap-3">
							<div className="flex-1">
								<Selector
									value={selectedGuildId}
									onChange={(val) => setSelectedGuildId(val)}
									placeholder={t('app.portal.servers.linkServerPlaceholder')}
									options={availableGuilds.map((g) => ({
										value: String(g.id),
										label: `${g.name || g.id} (${g.id})`,
									}))}
								/>
							</div>
							<Button variant="primary" onClick={handleLinkServer} disabled={!selectedGuildId || busyGuildId !== null} className="shrink-0 gap-2">
								<Link2 className="w-4 h-4" />
								{t('app.portal.servers.linkServerButton')}
							</Button>
						</div>
					</div>
				)}

				<p className="text-sm text-(--text-muted)">{t('app.portal.servers.desc')}</p>
				<div className="flex flex-col gap-2">
					{orgGuilds.length > 0 ? (
						<Selector
							value={orgConfig?.guild || ''}
							onChange={(val) => setOrgConfig({ ...orgConfig, guild: val })}
							options={[
								{ label: t('app.portal.servers.none'), value: '' },
								...orgGuilds.map((guild) => ({
									value: guild.id,
									label: (
										<div className="flex items-center gap-3">
											{guild.icon ? (
												<Image
													src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
													alt={guild.name}
													width={20}
													height={20}
													unoptimized
													className="w-5 h-5 rounded-full object-cover shadow-sm border border-(--border)/10"
												/>
											) : (
												<div className="w-5 h-5 rounded-full bg-(--foreground)/50 flex items-center justify-center text-(--text-muted) font-bold text-[10px] shadow-sm border border-(--border)/10">
													{guild.name.charAt(0)}
												</div>
											)}
											<span className="font-medium">{guild.name}</span>
										</div>
									),
								})),
							]}
						/>
					) : (
						<div className="flex flex-col items-center justify-center py-10 text-(--text-muted) bg-(--background)/50 rounded-2xl border border-(--border)/10 border-dashed">
							<Server className="w-8 h-8 mb-4 opacity-30" />
							<p className="text-sm">{t('app.portal.servers.noLinked')}</p>
							<p className="text-xs mt-1">{t('app.portal.servers.transferFirst')}</p>
						</div>
					)}
				</div>

				<div className="flex flex-col gap-2 mt-4 pt-4 border-t border-(--border)/10">
					<label className="text-sm font-bold text-(--text)">{t('app.portal.servers.linkedServers')}</label>
					<span className="text-xs text-(--text-muted)">{t('app.portal.servers.transferred')}</span>
					{orgGuilds.length > 0 ? (
						<div className="flex flex-col w-full bg-(--foreground)/30 border border-(--border)/10 rounded-3xl overflow-hidden shadow-sm mt-2 divide-y divide-(--border)/10">
							{orgGuilds.map((g: any) => (
								<div key={g.id} className="flex items-center justify-between gap-4 p-4 hover:bg-(--foreground)/50 transition-colors">
									<Link href={getEnvUrl(`https://app.xernerx.com/dashboard?guild=${g.id}`)} className="flex items-center gap-4 flex-1 min-w-0">
										{g.icon ? (
											<Image
												src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`}
												alt={g.name}
												width={40}
												height={40}
												unoptimized
												className="w-10 h-10 rounded-full shadow-sm object-cover shrink-0"
											/>
										) : (
											<div className="w-10 h-10 bg-(--background) rounded-full flex items-center justify-center font-bold shadow-sm shrink-0">{g.name?.charAt(0) || 'S'}</div>
										)}
										<div className="flex flex-col min-w-0">
											<span className="font-bold text-(--text) truncate">{g.name}</span>
											<span className="text-xs text-(--text-muted)">{g.id}</span>
										</div>
									</Link>
									<div className="flex items-center gap-2 shrink-0">
										<Button variant="secondary" onClick={() => handleUnlinkServer(g.id)} disabled={busyGuildId === g.id} className="text-xs py-1.5 px-3 h-auto gap-1.5">
											<Unlink className="w-3.5 h-3.5" />
											{t('app.portal.servers.unlinkServer')}
										</Button>
										<Link href={getEnvUrl(`https://app.xernerx.com/dashboard?guild=${g.id}`)} className="p-2 text-(--text-muted) hover:text-(--text) transition-colors">
											<LayoutDashboard className="w-5 h-5" />
										</Link>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-6 text-(--text-muted) bg-(--background)/50 rounded-2xl border border-(--border)/10 border-dashed mt-2">
							<p className="text-sm">{t('app.portal.servers.noServers')}</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
