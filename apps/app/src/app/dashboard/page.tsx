/** @format */
'use client';

import { Building2, ChevronRight, Compass, Globe, LayoutDashboard, LogIn, Save, Server, Settings } from 'lucide-react';
import { Button, Input, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useSidebar } from '@xernerx/providers';
import { useEffect, useState } from 'react';

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
	const { data: session } = useSession();
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const { setNavItems, clearNavItems, show, setView } = useSidebar();
	const router = useRouter();

	const [guilds, setGuilds] = useState<Guild[]>([]);
	const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
	const [guildConfig, setGuildConfig] = useState<any>(null);
	const [configLoading, setConfigLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [loading, setLoading] = useState(true);
	const [rateLimited, setRateLimited] = useState(false);

	useEffect(() => {
		show();

		const staticItems = [
			{ label: 'Explore', href: '/', icon: Compass as any, category: 'Navigation' },
			{ label: 'Organizations', href: '/organizations', icon: Building2 as any, category: 'Navigation' },
			{ label: 'Portal', href: 'https://admin.xernerx.com', icon: LayoutDashboard as any, category: 'Navigation' },
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
				}
			} catch (error) {
				console.error('Failed to fetch guild config', error);
			} finally {
				setConfigLoading(false);
			}
		};

		fetchConfig();
	}, [selectedGuild, session, getEnvUrl]);

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
				// Success
			}
		} catch (error) {
			console.error('Failed to save config', error);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div
			className="flex flex-col w-full items-center justify-start text-center"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'calc(var(--ui-gap) * 2)',
			}}
		>
			<div className="flex flex-col items-center justify-center p-12 rounded-[2rem] border border-(--border)/10 bg-(--foreground)/10 backdrop-blur-md shadow-2xl w-full mx-auto">
				{loading ? (
					<Loading message={'We are fetching your Discord servers, just a moment...'} />
				) : selectedGuild ? (
					<div className="flex flex-col items-start justify-start w-full text-left">
						<div className="relative w-full h-56 rounded-[2rem] overflow-hidden bg-(--background) border border-(--border)/10 mb-8 shadow-2xl">
							{selectedGuild.bannerUrl ? (
								<img src={selectedGuild.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80" />
							) : (
								<div className="w-full h-full bg-gradient-to-tr from-(--accent)/30 to-(--foreground)/40" />
							)}

							<div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end gap-6">
								{selectedGuild.iconUrl ? (
									<img src={selectedGuild.iconUrl} alt={selectedGuild.name} className="w-28 h-28 rounded-[1.5rem] shadow-2xl object-cover border-[6px] border-[#0a0a0a]" />
								) : (
									<div className="w-28 h-28 rounded-[1.5rem] bg-[#0a0a0a] border-[6px] border-[#0a0a0a] flex items-center justify-center text-4xl font-bold text-(--text-muted) shadow-2xl">
										{selectedGuild.name.charAt(0)}
									</div>
								)}
								<div className="flex flex-col pb-2">
									<h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-xl" style={{ fontFamily: `var(--font-fredoka)` }}>
										{selectedGuild.name}
									</h1>
									<p className="text-sm text-white/70 font-mono mt-1 drop-shadow-md">ID: {selectedGuild.id}</p>
								</div>
							</div>
						</div>

						{configLoading ? (
							<div className="flex flex-col w-full h-full text-center items-center justify-center py-20 text-(--text-muted)">
								<Loading variant="default" />
							</div>
						) : guildConfig ? (
							<div className="flex flex-col w-full gap-8 mt-4">
								<div className="flex justify-end mb-2 gap-4">
									<Button
										onClick={() => {}}
										disabled={saving}
										className="bg-(--background) hover:bg-(--border)/10 text-(--text) border border-(--border)/20 rounded-xl px-6 py-2.5 font-bold shadow-sm transition-colors flex items-center gap-2"
									>
										Reset
									</Button>
									<Button
										onClick={handleSaveConfig}
										disabled={saving}
										className="bg-(--accent) hover:bg-(--accent-hover) text-white rounded-xl px-6 py-2.5 font-bold shadow-sm transition-colors flex items-center gap-2"
									>
										{saving ? <Loading variant="small" /> : <Save className="w-4 h-4" />}
										{saving ? 'Saving...' : 'Save Changes'}
									</Button>
								</div>

								<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
									{/* Server Info Card */}
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
													<Globe className="w-5 h-5 opacity-50" />
													{guildConfig.locale || '--'}
												</div>
											</div>
										</div>
									</div>

									{/* Info Card */}
									<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl h-min">
										<div className="flex items-center gap-3 mb-8 text-(--text) font-extrabold text-sm tracking-widest uppercase">
											<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
												<Globe className="w-4 h-4" />
											</div>
											Server Info
										</div>

										<div className="flex flex-col gap-6">
											<div className="flex flex-col gap-2">
												<label className="text-sm font-bold text-(--text) ml-1">Description</label>
												<Input
													placeholder="Short guild description"
													value={guildConfig.description || ''}
													onChange={(e) => setGuildConfig({ ...guildConfig, description: e.target.value })}
													className="bg-(--background)/50 border-(--border)/10 rounded-2xl px-5 py-3.5 focus:border-(--accent) transition-colors"
												/>
											</div>
											<div className="flex flex-col gap-2">
												<label className="text-sm font-bold text-(--text) ml-1">Long Description</label>
												<Input
													variant="textarea"
													placeholder="Longer guild information"
													value={guildConfig.info || ''}
													onChange={(e: any) => setGuildConfig({ ...guildConfig, info: e.target.value })}
													className="bg-(--background)/50 border-(--border)/10 rounded-2xl px-5 py-4 min-h-[140px] focus:border-(--accent) transition-colors resize-none"
												/>
											</div>
											<div className="flex flex-col gap-2">
												<label className="text-sm font-bold text-(--text) ml-1">Organization</label>
												<Selector
													value={guildConfig.organization || 'Personal'}
													onChange={(val) => setGuildConfig({ ...guildConfig, organization: val })}
													options={[
														{ value: 'Personal', label: 'Personal' },
														{ value: 'xernerx-studios', label: 'Xernerx Studios' },
													]}
													items={true}
												/>
											</div>
										</div>
									</div>
								</div>

								{/* Privacy & Data Card */}
								<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl mt-2">
									<div className="flex items-center gap-3 mb-8 text-(--text) font-extrabold text-sm tracking-widest uppercase">
										<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
											<Settings className="w-4 h-4" />
										</div>
										Privacy & Data
									</div>

									<div className="flex flex-col gap-8">
										<div className="flex flex-col gap-2">
											<label className="text-sm font-bold text-(--text) ml-1">Privacy</label>
											<Selector
												value={guildConfig.privacy || 'private'}
												onChange={(val) => setGuildConfig({ ...guildConfig, privacy: val })}
												options={[
													{ value: 'private', label: 'Private' },
													{ value: 'limited', label: 'Limited' },
													{ value: 'public', label: 'Public' },
												]}
												items={true}
											/>
										</div>
										<div className="flex flex-col gap-2">
											<label className="text-sm font-bold text-red-500 ml-1">Delete Data</label>
											<div className="flex flex-col md:flex-row items-center gap-4">
												<div className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl px-5 py-4 text-sm w-full">
													Delete server data for this server. Will not remove our bots.
												</div>
												<Button className="bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/20 rounded-2xl px-8 py-4 font-bold transition-colors w-full md:w-auto flex-shrink-0">
													Delete guild data
												</Button>
											</div>
										</div>
									</div>
								</div>
							</div>
						) : null}
					</div>
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
							You don't seem to have Manage Server or Administrator permissions in any connected servers. Please become authorized in a server or create a new Discord server to get
							started!
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
		</div>
	);
}
