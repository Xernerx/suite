/** @format */
'use client';

import { Server, LayoutDashboard } from 'lucide-react';
import { Selector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import Link from 'next/link';

interface OrgServersTabProps {
	orgConfig: any;
	setOrgConfig: (config: any) => void;
	orgGuilds: any[];
}

export default function OrgServersTab({ orgConfig, setOrgConfig, orgGuilds }: OrgServersTabProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
			<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
				<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
					<Server className="w-4 h-4" />
				</div>
				{t('app.portal.servers.header')}
			</div>
			<div className="flex flex-col gap-6">
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
												<img
													src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
													alt={guild.name}
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
						<div className="flex flex-col w-full bg-(--foreground)/30 border border-(--border)/10 rounded-3xl overflow-hidden shadow-sm mt-2">
							{orgGuilds.map((g: any) => (
								<Link
									href={`/dashboard`}
									key={g.id}
									className="flex items-center justify-between gap-4 p-4 hover:bg-(--foreground)/50 border-b border-(--border)/10 last:border-0 transition-colors"
								>
									<div className="flex items-center gap-4">
										{g.icon ? (
											<img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`} alt={g.name} className="w-10 h-10 rounded-full shadow-sm object-cover" />
										) : (
											<div className="w-10 h-10 bg-(--background) rounded-full flex items-center justify-center font-bold shadow-sm">{g.name?.charAt(0) || 'S'}</div>
										)}
										<div className="flex flex-col">
											<span className="font-bold text-(--text)">{g.name}</span>
											<span className="text-xs text-(--text-muted)">{g.id}</span>
										</div>
									</div>
									<LayoutDashboard className="w-5 h-5 text-(--text-muted) opacity-50 group-hover:opacity-100 transition-opacity" />
								</Link>
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
