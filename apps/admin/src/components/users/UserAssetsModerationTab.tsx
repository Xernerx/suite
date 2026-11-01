/** @format */
'use client';

import React from 'react';
import { Bot, Building2, CheckCircle2, ExternalLink, Laptop, Link2, Server, Settings2, Sparkles, Trash2 } from 'lucide-react';
import { Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import type { UserAssetEntity, UserConnectionItem, UserDeviceItem, UserShowcaseItem } from './types';

interface UserAssetsModerationTabProps {
	showcases: UserShowcaseItem[];
	setShowcases: (val: UserShowcaseItem[]) => void;
	connections: UserConnectionItem[];
	setConnections: (val: UserConnectionItem[]) => void;
	devices: UserDeviceItem[];
	setDevices: (val: UserDeviceItem[]) => void;
	ownedBots?: UserAssetEntity[];
	ownedServers?: UserAssetEntity[];
	userOrganizations?: UserAssetEntity[];
	onNavigateEntity?: (tab: string, query: string) => void;
}

export function UserAssetsModerationTab({
	showcases,
	setShowcases,
	connections,
	setConnections,
	devices,
	setDevices,
	ownedBots = [],
	ownedServers = [],
	userOrganizations = [],
	onNavigateEntity,
}: UserAssetsModerationTabProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	return (
		<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 1.25)' }}>
			{/* Ecosystem Entities: Bots, Servers & Organizations */}
			<div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
				{/* Owned Bots */}
				<div className="rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4 flex flex-col gap-2">
					<span className="text-xs font-bold uppercase tracking-wider text-(--accent) flex items-center gap-1.5">
						<Bot size={14} />
						{t('admin.users.fields.ownedBotsTitle', { count: ownedBots.length })}
					</span>
					{ownedBots.length === 0 ? (
						<p className="text-xs text-(--text-muted) italic">{t('admin.users.fields.noOwnedBots')}</p>
					) : (
						<div className="flex flex-col gap-1.5">
							{ownedBots.map((bot) => (
								<div key={bot.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-(--foreground)/30 border border-(--border)/10">
									<div className="flex items-center gap-1.5 min-w-0">
										<span className="text-xs font-bold text-(--text) truncate">{bot.name || bot.id}</span>
										{bot.verified && <CheckCircle2 size={12} className="text-(--accent-green) shrink-0" />}
									</div>
									<div className="flex items-center gap-1.5 shrink-0">
										{onNavigateEntity && (
											<button
												type="button"
												onClick={() => onNavigateEntity('bots', bot.id)}
												className="text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
											>
												<Settings2 size={12} />
											</button>
										)}
										<button
											type="button"
											onClick={() => window.open(getEnvUrl(`https://app.xernerx.com/bots/${bot.vanitySlug || bot.id}`), '_blank')}
											className="text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
										>
											<ExternalLink size={12} />
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Owned Servers */}
				<div className="rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4 flex flex-col gap-2">
					<span className="text-xs font-bold uppercase tracking-wider text-(--accent) flex items-center gap-1.5">
						<Server size={14} />
						{t('admin.users.fields.ownedServersTitle', { count: ownedServers.length })}
					</span>
					{ownedServers.length === 0 ? (
						<p className="text-xs text-(--text-muted) italic">{t('admin.users.fields.noOwnedServers')}</p>
					) : (
						<div className="flex flex-col gap-1.5">
							{ownedServers.map((srv) => (
								<div key={srv.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-(--foreground)/30 border border-(--border)/10">
									<div className="flex items-center gap-1.5 min-w-0">
										<span className="text-xs font-bold text-(--text) truncate">{srv.name || srv.id}</span>
										{srv.verified && <CheckCircle2 size={12} className="text-(--accent-green) shrink-0" />}
									</div>
									<div className="flex items-center gap-1.5 shrink-0">
										{onNavigateEntity && (
											<button
												type="button"
												onClick={() => onNavigateEntity('servers', srv.id)}
												className="text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
											>
												<Settings2 size={12} />
											</button>
										)}
										<button
											type="button"
											onClick={() => window.open(getEnvUrl(`https://app.xernerx.com/servers/${srv.vanitySlug || srv.id}`), '_blank')}
											className="text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
										>
											<ExternalLink size={12} />
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Organizations */}
				<div className="rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4 flex flex-col gap-2">
					<span className="text-xs font-bold uppercase tracking-wider text-(--accent) flex items-center gap-1.5">
						<Building2 size={14} />
						{t('admin.users.fields.organizationsTitle', { count: userOrganizations.length })}
					</span>
					{userOrganizations.length === 0 ? (
						<p className="text-xs text-(--text-muted) italic">{t('admin.users.fields.noOrganizations')}</p>
					) : (
						<div className="flex flex-col gap-1.5">
							{userOrganizations.map((org) => (
								<div key={org.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-(--foreground)/30 border border-(--border)/10">
									<div className="flex items-center gap-1.5 min-w-0">
										<span className="text-xs font-bold text-(--text) truncate">{org.name || org.id}</span>
										{org.verified && <CheckCircle2 size={12} className="text-(--accent-green) shrink-0" />}
									</div>
									<div className="flex items-center gap-1.5 shrink-0">
										{onNavigateEntity && (
											<button
												type="button"
												onClick={() => onNavigateEntity('organizations', org.id)}
												className="text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
											>
												<Settings2 size={12} />
											</button>
										)}
										<button
											type="button"
											onClick={() => window.open(getEnvUrl(`https://app.xernerx.com/organizations/${org.vanitySlug || org.id}`), '_blank')}
											className="text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
										>
											<ExternalLink size={12} />
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Profile Showcases */}
			<div className="rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4 flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
				<div className="flex items-center justify-between">
					<span className="text-xs font-bold uppercase tracking-wider text-(--accent) flex items-center gap-1.5">
						<Sparkles size={14} />
						{t('admin.users.fields.showcasesTitle', { count: showcases.length })}
					</span>
				</div>
				{showcases.length === 0 ? (
					<p className="text-xs text-(--text-muted) italic">{t('admin.users.fields.noShowcases')}</p>
				) : (
					<div className="flex flex-col gap-2">
						{showcases.map((sc) => (
							<div key={sc.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-(--foreground)/30 border border-(--border)/10">
								<div className="flex flex-col min-w-0">
									<div className="flex items-center gap-2">
										<span className="text-xs font-bold text-(--text) truncate">{sc.title}</span>
										{sc.tag && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-(--accent)/15 text-(--accent)">{sc.tag}</span>}
										{sc.linkUrl && (
											<a href={sc.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-(--accent) hover:underline">
												<ExternalLink size={11} />
											</a>
										)}
									</div>
									{sc.description && <p className="text-[11px] text-(--text-muted) line-clamp-1">{sc.description}</p>}
								</div>
								<button
									type="button"
									onClick={() => setShowcases(showcases.filter((item) => item.id !== sc.id))}
									className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-(--accent-red)/10 hover:bg-(--accent-red)/20 text-(--accent-red) text-xs font-medium transition-colors shrink-0 cursor-pointer"
								>
									<Trash2 size={13} />
									<span>{t('admin.users.fields.removeShowcase')}</span>
								</button>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Connected OAuth Accounts */}
			<div className="rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4 flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
				<span className="text-xs font-bold uppercase tracking-wider text-(--accent) flex items-center gap-1.5">
					<Link2 size={14} />
					{t('admin.users.fields.connectionsTitle', { count: connections.length })}
				</span>
				{connections.length === 0 ? (
					<p className="text-xs text-(--text-muted) italic">{t('admin.users.fields.noConnections')}</p>
				) : (
					<div className="flex flex-col gap-2">
						{connections.map((conn, idx) => (
							<div key={`${conn.provider}-${conn.id}-${idx}`} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-(--foreground)/30 border border-(--border)/10">
								<div className="flex flex-col min-w-0">
									<div className="flex items-center gap-2">
										<span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-(--accent)/15 text-(--accent)">{conn.provider}</span>
										<span className="text-xs font-bold text-(--text) truncate">{conn.displayName || conn.username}</span>
										<span className="text-[11px] text-(--text-muted) font-mono truncate">({conn.id})</span>
									</div>
								</div>
								<div className="flex items-center gap-3 shrink-0">
									<label className="flex items-center gap-1.5 text-[11px] text-(--text-muted) cursor-pointer">
										<span>{t('admin.users.fields.showOnProfile')}</span>
										<Toggle
											size="sm"
											checked={conn.showOnProfile !== false}
											onChange={(e) => {
												const next = [...connections];
												next[idx] = { ...conn, showOnProfile: e.target.checked };
												setConnections(next);
											}}
										/>
									</label>
									<button
										type="button"
										onClick={() => setConnections(connections.filter((_, i) => i !== idx))}
										className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-(--accent-red)/10 hover:bg-(--accent-red)/20 text-(--accent-red) text-xs font-medium transition-colors cursor-pointer"
									>
										<Trash2 size={13} />
										<span>{t('admin.users.fields.unlinkConnection')}</span>
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Logged-In Devices */}
			<div className="rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4 flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
				<div className="flex items-center justify-between">
					<span className="text-xs font-bold uppercase tracking-wider text-(--accent) flex items-center gap-1.5">
						<Laptop size={14} />
						{t('admin.users.fields.devicesTitle', { count: devices.length })}
					</span>
					{devices.length > 0 && (
						<button type="button" onClick={() => setDevices([])} className="text-xs font-semibold text-(--accent-red) hover:underline cursor-pointer">
							{t('admin.users.fields.clearAllDevices')}
						</button>
					)}
				</div>
				{devices.length === 0 ? (
					<p className="text-xs text-(--text-muted) italic">{t('admin.users.fields.noDevices')}</p>
				) : (
					<div className="flex flex-col gap-2">
						{devices.map((dev, idx) => (
							<div key={dev.id || idx} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-(--foreground)/30 border border-(--border)/10">
								<div className="flex flex-col min-w-0">
									<span className="text-xs font-bold text-(--text)">
										{dev.browser || 'Unknown Browser'} • {dev.os || 'Unknown OS'} ({dev.deviceType || 'desktop'})
									</span>
									{dev.lastActive && <span className="text-[11px] text-(--text-muted) font-mono">{new Date(dev.lastActive).toLocaleString()}</span>}
								</div>
								<button
									type="button"
									onClick={() => setDevices(devices.filter((_, i) => i !== idx))}
									className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-(--accent-red)/10 hover:bg-(--accent-red)/20 text-(--accent-red) text-xs font-medium transition-colors cursor-pointer"
								>
									<Trash2 size={13} />
									<span>{t('admin.users.fields.revokeDevice')}</span>
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
