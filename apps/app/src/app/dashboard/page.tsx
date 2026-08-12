/** @format */
'use client';

import { AlertTriangle, Bot, Building2, ChevronRight, Compass, Globe, LayoutDashboard, LogIn, Server, Settings, Trash2 } from 'lucide-react';
import { Button, Input, Selector } from '@xernerx/ui';
import { Tabs } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useSidebar, useToast } from '@xernerx/providers';
import { useEffect, useState, useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { Loading } from '@xernerx/feedback';
import { useRouter } from 'next/navigation';

type Guild = {
	id: string;
	name: string;
	icon: string | null;
	iconUrl: string | null;
	banner: string | null;
	bannerUrl: string | null;
	permissions: string;
	features: string[];
};

export default function DashboardPage() {
	const { data: session, status } = useSession();
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const { setNavItems, clearNavItems, show, setView } = useSidebar();
	const router = useRouter();

	const [guilds, setGuilds] = useState<Guild[]>([]);
	const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
	const [guildConfig, setGuildConfig] = useState<any>(null);
	const [originalGuildConfig, setOriginalGuildConfig] = useState<any>(null);
	const [configLoading, setConfigLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [loading, setLoading] = useState(true);
	const [rateLimited, setRateLimited] = useState(false);
	const [activeTab, setActiveTab] = useState('info');
	const { remind } = useToast();

	useEffect(() => {
		if (!isReady || status === 'unauthenticated' || status === 'loading') return;

		show();

		const staticItems = [
			{ label: 'Explore', href: '/', icon: Compass as any, category: 'Navigation' },
			{ label: 'Portal', href: '/portal', icon: Building2 as any, category: 'Navigation' },
		];

		// Populate static items immediately so they aren't blocked by the fetch or StrictMode
		setNavItems(staticItems);

		const fetchGuilds = async () => {
			const sessionData = session as any;
			if (!sessionData?.accessToken || !sessionData?.user?.id) {
				setLoading(false);
				return;
			}

			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${sessionData.user.id}/discord/guilds`), {
					headers: {
						Authorization: `Bearer ${sessionData.accessToken}`,
					},
				});

				if (!res.ok) {
					if (res.status === 429) {
						setRateLimited(true);
						return;
					}
					const errorText = await res.text().catch(() => 'No text');
					throw new Error(`Failed to fetch guilds: ${res.status} ${res.statusText} - ${errorText}`);
				}

				const data: Guild[] = await res.json();

				// Filter for Manage Server (0x20) or Administrator (0x8)
				const managedGuilds = data.filter((guild) => {
					const perms = BigInt(guild.permissions || 0);
					const hasAdmin = (perms & BigInt(0x8)) === BigInt(0x8);
					const hasManageServer = (perms & BigInt(0x20)) === BigInt(0x20);
					return hasAdmin || hasManageServer;
				});

				setGuilds(managedGuilds);

				// Append guilds to sidebar
				setNavItems([
					...staticItems,
					...managedGuilds.map((g) => ({
						label: g.name,
						onClick: () => setSelectedGuild(g),
						category: 'Servers',
						icon: g.iconUrl
							? () => <img src={g.iconUrl!} alt={g.name} className="w-5 h-5 rounded-full object-cover" />
							: () => <div className="w-5 h-5 rounded-full bg-(--foreground) flex items-center justify-center text-[10px]">{g.name.charAt(0)}</div>,
						view: `server-${g.id}`,
					})),
				]);

				// Auto-select the first server contextually
				if (managedGuilds.length > 0) {
					setSelectedGuild(managedGuilds[0]);
					setView(`server-${managedGuilds[0].id}`);
				}
			} catch (error) {
				console.error('Failed to fetch guilds:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchGuilds();

		return () => {
			clearNavItems();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session, getEnvUrl]);

	useEffect(() => {
		if (!selectedGuild) {
			setGuildConfig(null);
			setOriginalGuildConfig(null);
			return;
		}

		const fetchConfig = async () => {
			setConfigLoading(true);
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${selectedGuild.id}`), {
					credentials: 'include',
				});
				if (res.ok) {
					const data = await res.json();
					setGuildConfig(data);
					setOriginalGuildConfig(data);
				}
			} catch (error) {
				console.error('Failed to fetch guild config', error);
			} finally {
				setConfigLoading(false);
			}
		};

		fetchConfig();
	}, [selectedGuild, session, getEnvUrl, isReady]);

	const handleSaveConfig = async () => {
		if (!selectedGuild || !guildConfig) return;

		setSaving(true);
		try {
			const sessionData = session as any;
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${selectedGuild.id}`), {
				method: 'PATCH',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: selectedGuild.name,
					icon: selectedGuild.iconUrl,
					description: guildConfig.description,
					info: guildConfig.info,
					organization: guildConfig.organization,
					privacy: guildConfig.privacy,
					locale: guildConfig.locale,
					links: guildConfig.links,
				}),
			});
			if (res.ok) {
				const updated = await res.json();
				setOriginalGuildConfig(updated);
				setGuildConfig(updated);
			}
		} catch (error) {
			console.error('Failed to save config', error);
		} finally {
			setSaving(false);
		}
	};

	const isDirty = useMemo(() => {
		if (!guildConfig || !originalGuildConfig) return false;
		return JSON.stringify(guildConfig) !== JSON.stringify(originalGuildConfig);
	}, [guildConfig, originalGuildConfig]);

	useEffect(() => {
		remind(isDirty, handleSaveConfig, () => setGuildConfig(originalGuildConfig), saving);
		return () => remind(false);
	}, [isDirty, saving, originalGuildConfig, remind, guildConfig, selectedGuild]);

	const handleDeleteGuild = async () => {
		if (!selectedGuild) return;
		if (!confirm('Are you sure you want to completely delete this guild from the database? This action cannot be undone.')) return;

		setDeleting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${selectedGuild.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});

			if (res.ok) {
				setSelectedGuild(null);
				setGuildConfig(null);
			}
		} catch (error) {
			console.error('Failed to delete guild', error);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{loading ? (
				<Loading message={'We are fetching your Discord servers, just a moment...'} />
			) : selectedGuild ? (
				<>
					<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
						{/* Guild Summary Card (Page Header) */}
						<div
							className="relative flex items-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden"
							style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
						>
							{/* Optional Banner Background */}
							{(selectedGuild as any).bannerUrl && (
								<div
									className="absolute inset-0 z-0 opacity-20"
									style={{
										backgroundImage: `url(${(selectedGuild as any).bannerUrl})`,
										backgroundSize: 'cover',
										backgroundPosition: 'center',
									}}
								/>
							)}
							<div className="relative z-10 flex items-center w-full" style={{ gap: 'var(--ui-gap)' }}>
								{selectedGuild.iconUrl ? (
									<img src={selectedGuild.iconUrl} alt={selectedGuild.name} className="h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0 shadow-lg" />
								) : (
									<div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--background)/50 shrink-0 shadow-lg border border-(--border)/10">
										<Server className="w-8 h-8 text-(--text-muted)" />
									</div>
								)}
								<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.15)' }}>
									<span className="text-3xl font-extrabold text-(--text) drop-shadow-md tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
										{selectedGuild.name}
									</span>
									<span className="text-sm font-medium text-(--text-muted)">ID: {selectedGuild.id}</span>
								</div>
							</div>
						</div>

						{configLoading ? (
							<div className="flex flex-col w-full h-full text-center items-center justify-center py-20 text-(--text-muted)">
								<Loading variant="default" />
							</div>
						) : guildConfig ? (
							<div className="flex flex-col w-full gap-8 mt-4">
								<Tabs
									activeTab={activeTab}
									onChange={setActiveTab}
									tabs={[
										{ id: 'info', label: 'Info' },
										{ id: 'stats', label: 'Stats' },
										{ id: 'settings', label: 'Settings' },
									]}
								/>

								{activeTab === 'info' && (
									<>
										{/* Server Sync Data Card */}
										<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl h-min">
											<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
												<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
													<Server className="w-4 h-4" />
												</div>
												Server Sync Data
											</div>
											<p className="text-xs text-(--text-muted) mb-8 p-4 bg-(--accent)/5 rounded-2xl border border-(--accent)/10 text-(--accent)">
												This data is derived directly from your server. To sync and populate it, the Xernerx Bot must be added to the server.
											</p>

											<div className="flex flex-col gap-6">
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text) ml-1">Bot Connected</label>
													<div className="bg-(--background)/50 border border-(--border)/10 rounded-2xl px-5 py-3.5 flex items-center gap-3 text-(--text-muted) cursor-not-allowed opacity-70">
														<Settings className="w-5 h-5 opacity-50" />
														{guildConfig.bot ? 'Yes' : 'No'}
													</div>
												</div>
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text) ml-1">Verified</label>
													<div className="bg-(--background)/50 border border-(--border)/10 rounded-2xl px-5 py-3.5 flex items-center gap-3 text-(--text-muted) cursor-not-allowed opacity-70">
														<Settings className="w-5 h-5 opacity-50" />
														{guildConfig.verified ? 'Yes' : 'No'}
													</div>
												</div>
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text) ml-1">Locale</label>
													<div className="bg-(--background)/50 border border-(--border)/10 rounded-2xl px-5 py-3.5 flex items-center gap-3 text-(--text-muted) cursor-not-allowed opacity-70">
														<Settings className="w-5 h-5 opacity-50" />
														{guildConfig.locale || 'en-US'}
													</div>
												</div>
											</div>
										</div>

										{/* Server Info Card */}
										<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
											<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
												<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
													<Settings className="w-4 h-4" />
												</div>
												Server Info
											</div>

											<div className="flex flex-col gap-6">
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">Description</label>
													<Input
														value={guildConfig.description || ''}
														onChange={(e) => setGuildConfig({ ...guildConfig, description: e.target.value })}
														placeholder="Short description..."
													/>
												</div>
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">Info</label>
													<textarea
														value={guildConfig.info || ''}
														onChange={(e) => setGuildConfig({ ...guildConfig, info: e.target.value })}
														placeholder="Detailed server info..."
														rows={4}
														className="w-full rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent) resize-none"
														style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)' }}
													/>
												</div>
											</div>
										</div>
									</>
								)}

								{activeTab === 'stats' && (
									<>
										{/* Server Stats Placeholder */}
										<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
											<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
												<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
													<Server className="w-4 h-4" />
												</div>
												Server Stats
											</div>
											<div className="flex flex-col items-center justify-center py-10 opacity-70">
												<Server className="w-10 h-10 mb-4 text-(--text-muted)" />
												<p className="text-(--text) font-bold text-lg mb-2">Metrics Coming Soon</p>
												<p className="text-(--text-muted) text-sm text-center max-w-sm">We're working on bringing detailed server analytics and statistics here.</p>
											</div>
										</div>
									</>
								)}

								{activeTab === 'settings' && (
									<>
										{/* Privacy Setting Card */}
										<div
											className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
											style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
										>
											<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
												<div className="flex items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
													<Settings size={18} />
													<h3>Privacy Setting</h3>
												</div>
												<div className="flex items-center gap-1 text-xs text-(--text-muted)">Choose who can see this server's profile on Xernerx.</div>
											</div>
											<div className="w-full sm:w-48 shrink-0">
												<Selector
													value={guildConfig.privacy || 'private'}
													onChange={(val: string) => setGuildConfig({ ...guildConfig, privacy: val })}
													options={[
														{ label: 'Public', value: 'public' },
														{ label: 'Limited', value: 'limited' },
														{ label: 'Private', value: 'private' },
													]}
												/>
											</div>
										</div>

										{/* Reset Data Card */}
										<div
											className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
											style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
										>
											<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
												<div className="flex items-center text-(--accent-orange) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
													<AlertTriangle size={18} />
													<h3>Reset Data</h3>
												</div>
												<p className="text-xs text-(--accent-orange)/80">Reset all server settings and configurations back to default.</p>
											</div>
											<button
												onClick={() => setGuildConfig({ ...guildConfig, description: '', info: '', locale: '', links: {} })}
												className="flex items-center justify-center rounded-xl bg-(--accent-orange) text-sm font-medium text-white transition-colors hover:bg-(--accent-orange)/80 shrink-0 shadow-sm"
												style={{
													padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
													gap: 'calc(var(--ui-gap) * 0.5)',
												}}
											>
												<Trash2 size={16} />
												<span>Reset Data</span>
											</button>
										</div>

										{/* Delete Server Data Card */}
										<div
											className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-red)/20 bg-(--accent-red)/5 shadow-sm"
											style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
										>
											<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
												<div className="flex items-center text-(--accent-red) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
													<AlertTriangle size={18} />
													<h3>Delete Server Data</h3>
												</div>
												<p className="text-xs text-(--accent-red)/80">Permanently delete all data associated with this server from Xernerx.</p>
											</div>
											<button
												onClick={handleDeleteGuild}
												className="flex items-center justify-center rounded-xl bg-(--accent-red) text-sm font-medium text-white transition-colors hover:bg-(--accent-red)/80 shrink-0 shadow-sm"
												style={{
													padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
													gap: 'calc(var(--ui-gap) * 0.5)',
												}}
											>
												<Trash2 size={16} />
												<span>Delete Server</span>
											</button>
										</div>
									</>
								)}
							</div>
						) : null}
					</div>
				</>
			) : rateLimited ? (
				<div className="flex flex-col items-center justify-center text-center">
					<div className="w-20 h-20 bg-(--accent)/10 rounded-full flex items-center justify-center mb-6">
						<Server className="w-10 h-10 text-(--accent)" />
					</div>
					<h1 className="text-3xl font-extrabold tracking-tight text-(--text) drop-shadow-sm mb-4" style={{ fontFamily: `var(--font-fredoka)` }}>
						Too Many Requests
					</h1>
					<p className="text-sm text-(--text-muted) max-w-md">We are hitting Discord's rate limits for fetching your servers. Please wait a moment and try refreshing the page!</p>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center text-center">
					<div className="w-20 h-20 bg-(--accent)/10 rounded-full flex items-center justify-center mb-6">
						<Server className="w-10 h-10 text-(--accent)" />
					</div>
					<h1 className="text-3xl font-extrabold tracking-tight text-(--text) drop-shadow-sm mb-4" style={{ fontFamily: `var(--font-fredoka)` }}>
						No Eligible Servers
					</h1>
					<p className="text-sm text-(--text-muted) max-w-md">
						You don't seem to have Manage Server or Administrator permissions in any connected servers. Please become authorized in a server or create a new Discord server to get started!
					</p>
					<a
						href="https://discord.com/new"
						target="_blank"
						rel="noopener noreferrer"
						className="mt-6 px-6 py-3 rounded-xl bg-(--accent) hover:bg-(--accent-hover) text-white font-medium transition-colors shadow-sm"
					>
						Create Discord Server
					</a>
				</div>
			)}
		</div>
	);
}
