/** @format */
'use client';

import { AlertTriangle, Bot, Building2, ChevronRight, Compass, Globe, LayoutDashboard, LogIn, Server, Settings, Trash2, Users, MessageSquare, ShieldCheck, Activity } from 'lucide-react';
import { Button, Input, Selector } from '@xernerx/ui';
import { Tabs } from '@xernerx/ui';
import { useDictionary, useEnvironment, useSession, useSidebar, useToast } from '@xernerx/providers';
import { useEffect, useState, useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { Loading } from '@xernerx/feedback';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

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

	const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '3m' | '6m' | '1y' | 'all'>('24h');
	const [activeMetric, setActiveMetric] = useState<'members' | 'messages' | 'bots' | 'boosts'>('members');
	const [isUndrawing, setIsUndrawing] = useState(false);

	const handleMetricSwitch = (metricId: any) => {
		if (metricId === activeMetric || isUndrawing) return;
		setIsUndrawing(true);
		setTimeout(() => {
			setActiveMetric(metricId);
			setIsUndrawing(false);
		}, 400); // 400ms duration for undraw animation
	};

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
					icon: selectedGuild.icon,
					banner: selectedGuild.banner,
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
									<span className="text-sm font-medium text-(--text-muted)">
										{t('app.dashboard.text1')}
										{selectedGuild.id}
									</span>
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
										{guildConfig.bot ? (
											<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl h-min">
												<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
													<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
														<Server className="w-4 h-4" />
													</div>
													{t('app.dashboard.text2')}
												</div>
												<p className="text-xs text-(--text-muted) mb-8 p-4 bg-(--accent)/5 rounded-2xl border border-(--accent)/10 text-(--accent)">
													{t('app.dashboard.text3')}
												</p>

												<div className="flex flex-col gap-6">
													<div className="flex flex-col gap-2">
														<label className="text-sm font-bold text-(--text) ml-1">{t('app.dashboard.text4')}</label>
														<div className="bg-(--background)/50 border border-(--border)/10 rounded-2xl px-5 py-3.5 flex items-center gap-3 text-(--text-muted) cursor-not-allowed opacity-70">
															<Settings className="w-5 h-5 opacity-50" />
															{guildConfig.bot ? 'Yes' : 'No'}
														</div>
													</div>
													<div className="flex flex-col gap-2">
														<label className="text-sm font-bold text-(--text) ml-1">{t('app.dashboard.text5')}</label>
														<div className="bg-(--background)/50 border border-(--border)/10 rounded-2xl px-5 py-3.5 flex items-center gap-3 text-(--text-muted) cursor-not-allowed opacity-70">
															<Settings className="w-5 h-5 opacity-50" />
															{guildConfig.verified ? 'Yes' : 'No'}
														</div>
													</div>
													<div className="flex flex-col gap-2">
														<label className="text-sm font-bold text-(--text) ml-1">{t('app.dashboard.text6')}</label>
														<div className="bg-(--background)/50 border border-(--border)/10 rounded-2xl px-5 py-3.5 flex items-center gap-3 text-(--text-muted) cursor-not-allowed opacity-70">
															<Settings className="w-5 h-5 opacity-50" />
															{guildConfig.locale || 'en-US'}
														</div>
													</div>
												</div>
											</div>
										) : (
											<div className="flex flex-col items-center text-center justify-center bg-(--accent)/5 border border-(--accent)/20 rounded-[2rem] p-10 shadow-xl h-min animate-in fade-in zoom-in-95 duration-300">
												<div className="w-16 h-16 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent) mb-4 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
													<Server className="w-8 h-8" />
												</div>
												<h3 className="text-xl font-extrabold text-(--text) mb-2">Bot Not Connected</h3>
												<p className="text-sm text-(--text-muted) mb-6 max-w-sm">{t('app.dashboard.text3')}</p>
											</div>
										)}

										{/* Server Info Card */}
										<div className="flex flex-col bg-(--foreground)/30 backdrop-blur-md border border-(--border)/20 rounded-[2rem] p-8 shadow-xl">
											<div className="flex items-center gap-3 mb-6 text-(--text) font-extrabold text-sm tracking-widest uppercase">
												<div className="w-8 h-8 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent)">
													<Settings className="w-4 h-4" />
												</div>
												{t('app.dashboard.text7')}
											</div>

											<div className="flex flex-col gap-6">
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">{t('app.dashboard.text8')}</label>
													<Input
														value={guildConfig.description || ''}
														onChange={(e) => setGuildConfig({ ...guildConfig, description: e.target.value })}
														placeholder={t('app.dashboard.placeholder1')}
													/>
												</div>
												<div className="flex flex-col gap-2">
													<label className="text-sm font-bold text-(--text)">{t('app.dashboard.text9')}</label>
													<textarea
														value={guildConfig.info || ''}
														onChange={(e) => setGuildConfig({ ...guildConfig, info: e.target.value })}
														placeholder={t('app.dashboard.placeholder2')}
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
										{/* Server Stats Card */}
										{guildConfig.bot ? (
											(() => {
												let chartData = (guildConfig.stats || []).map((s: any) => ({
													...s,
													timestamp: new Date(s.timestamp).getTime(),
												}));

												if (timeframe !== 'all') {
													const now = Date.now();
													const day = 24 * 60 * 60 * 1000;
													const limits = {
														'24h': now - day,
														'7d': now - 7 * day,
														'30d': now - 30 * day,
														'3m': now - 90 * day,
														'6m': now - 180 * day,
														'1y': now - 365 * day,
													};
													chartData = chartData.filter((s: any) => s.timestamp >= limits[timeframe]);
												}

												// Calculate gain/loss and highest ever for the active metric
												const highestValue = Math.max(0, ...chartData.map((s: any) => s[activeMetric] || 0));
												const firstPoint = chartData[0]?.[activeMetric] || 0;
												const lastPoint = chartData[chartData.length - 1]?.[activeMetric] || 0;
												const gainLoss = lastPoint - firstPoint;
												const gainPercentage = firstPoint > 0 ? ((gainLoss / firstPoint) * 100).toFixed(1) : '0';

												const currentStats = guildConfig.stats?.[guildConfig.stats.length - 1] || { members: 0, messages: 0, bots: 0, boosts: 0 };

												return (
													<div className="flex flex-col gap-6">
														<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
															{[
																{ id: 'members', label: 'Members', value: currentStats.members, icon: Users },
																{ id: 'messages', label: 'Messages', value: currentStats.messages, icon: MessageSquare },
																{ id: 'bots', label: 'Bots', value: currentStats.bots, icon: Bot },
																{ id: 'boosts', label: 'Boosts', value: currentStats.boosts, icon: Activity },
															].map((metric) => (
																<button
																	key={metric.label}
																	onClick={() => handleMetricSwitch(metric.id)}
																	className={`bg-(--foreground)/50 border p-6 rounded-3xl flex flex-col items-center justify-center gap-3 backdrop-blur-md transition-all ${activeMetric === metric.id ? 'border-(--accent) shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_20%,transparent)] scale-105 z-10' : 'border-(--border)/10 hover:border-(--accent)/50'}`}
																>
																	<metric.icon className={`w-8 h-8 ${activeMetric === metric.id ? 'text-(--accent)' : 'text-(--text-muted)'}`} />
																	<div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-fredoka)' }}>
																		{metric.value?.toLocaleString() || '0'}
																	</div>
																	<div
																		className={`text-sm font-semibold uppercase tracking-wider ${activeMetric === metric.id ? 'text-(--accent)' : 'text-(--text-muted)'}`}
																	>
																		{metric.label}
																	</div>
																</button>
															))}
														</div>

														<div className="bg-(--foreground)/50 border border-(--border)/10 p-6 md:p-8 rounded-3xl backdrop-blur-md">
															<div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
																<div>
																	<h3 className="text-2xl font-bold mb-1 capitalize" style={{ fontFamily: 'var(--font-fredoka)' }}>
																		{activeMetric}
																		{t('app.bots.id.text10')}
																	</h3>
																	<div className="flex flex-wrap items-center gap-4 text-sm font-medium">
																		<span
																			className={`${gainLoss >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-md`}
																		>
																			{gainLoss > 0 ? '+' : ''}
																			{gainLoss.toLocaleString()} ({gainPercentage}%)
																		</span>
																		<span className="text-(--text-muted) bg-(--background) px-2 py-1 rounded-md border border-(--border)/10">
																			Highest: {highestValue.toLocaleString()}
																		</span>
																	</div>
																</div>

																<div className="flex bg-(--background) p-2 rounded-xl border border-(--border)/10 gap-1 w-full md:w-auto overflow-x-auto shadow-inner hide-scrollbar">
																	{(['24h', '7d', '30d', '3m', '6m', '1y', 'all'] as const).map((tf) => (
																		<button
																			key={tf}
																			onClick={() => setTimeframe(tf)}
																			className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex-none ${
																				timeframe === tf
																					? 'bg-(--accent) text-white shadow-md'
																					: 'text-(--text-muted) hover:text-(--text) hover:bg-(--foreground)'
																			}`}
																		>
																			{tf === '24h'
																				? '24h'
																				: tf === '7d'
																					? '7d'
																					: tf === '30d'
																						? '1m'
																						: tf === '3m'
																							? '3m'
																							: tf === '6m'
																								? '6m'
																								: tf === '1y'
																									? '1y'
																									: 'All'}
																		</button>
																	))}
																</div>
															</div>

															<div
																className="h-[400px] w-full mt-4"
																style={{
																	clipPath: isUndrawing ? 'inset(0 100% 0 0)' : 'inset(0 0 0 0)',
																	transition: 'clip-path 400ms ease-in-out',
																}}
															>
																{!guildConfig.stats || guildConfig.stats.length === 0 ? (
																	<div className="flex flex-col items-center justify-center py-10 opacity-70 h-full">
																		<Server className="w-10 h-10 mb-4 text-(--text-muted)" />
																		<p className="text-(--text) font-bold text-lg mb-2">{t('app.dashboard.text11')}</p>
																		<p className="text-(--text-muted) text-sm text-center max-w-sm">{t('app.dashboard.text12')}</p>
																	</div>
																) : (
																	<ResponsiveContainer width="100%" height="100%">
																		<LineChart key={activeMetric} data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
																			<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.1} vertical={false} />
																			<XAxis
																				dataKey="timestamp"
																				type="number"
																				domain={['dataMin', 'dataMax']}
																				tickFormatter={(time) => {
																					const date = new Date(time);
																					if (timeframe === '24h') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
																					if (timeframe === 'all' || timeframe === '1y')
																						return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
																					return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
																				}}
																				stroke="var(--text-muted)"
																				fontSize={12}
																				tickLine={false}
																				axisLine={false}
																				dy={10}
																				minTickGap={30}
																			/>
																			<YAxis
																				stroke="var(--text-muted)"
																				fontSize={12}
																				tickLine={false}
																				axisLine={false}
																				dx={-10}
																				domain={['auto', 'auto']}
																				tickFormatter={(val) => {
																					return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val;
																				}}
																			/>
																			<RechartsTooltip
																				contentStyle={{
																					backgroundColor: 'var(--foreground)',
																					border: '1px solid color-mix(in srgb, var(--border) 10%, transparent)',
																					borderRadius: '1rem',
																					boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
																				}}
																				itemStyle={{ color: 'var(--text)', fontWeight: 'bold' }}
																				labelFormatter={(label) => new Date(label as string | number).toLocaleString()}
																			/>
																			<Line
																				type="monotone"
																				dataKey={activeMetric}
																				name={activeMetric}
																				stroke="var(--accent)"
																				strokeWidth={4}
																				dot={chartData.length <= 1 ? { r: 6, fill: 'var(--accent)', strokeWidth: 0 } : false}
																				activeDot={{ r: 8, fill: 'var(--accent)', strokeWidth: 0, stroke: 'var(--background)', strokeOpacity: 0.5 }}
																			/>
																		</LineChart>
																	</ResponsiveContainer>
																)}
															</div>
														</div>
													</div>
												);
											})()
										) : (
											<div className="flex flex-col items-center text-center justify-center bg-(--accent)/5 border border-(--accent)/20 rounded-[2rem] p-10 shadow-xl h-min animate-in fade-in zoom-in-95 duration-300">
												<div className="w-16 h-16 rounded-full bg-(--accent)/20 flex items-center justify-center text-(--accent) mb-4 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
													<Server className="w-8 h-8" />
												</div>
												<h3 className="text-xl font-extrabold text-(--text) mb-2">Bot Not Connected</h3>
												<p className="text-sm text-(--text-muted) mb-6 max-w-sm">{t('app.dashboard.text3')}</p>
											</div>
										)}
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
													<h3>{t('app.dashboard.text13')}</h3>
												</div>
												<div className="flex items-center gap-1 text-xs text-(--text-muted)">{t('app.dashboard.text14')}</div>
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
													<h3>{t('app.dashboard.text15')}</h3>
												</div>
												<p className="text-xs text-(--accent-orange)/80">{t('app.dashboard.text16')}</p>
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
												<span>{t('app.dashboard.text17')}</span>
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
													<h3>{t('app.dashboard.text18')}</h3>
												</div>
												<p className="text-xs text-(--accent-red)/80">{t('app.dashboard.text19')}</p>
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
												<span>{t('app.dashboard.text20')}</span>
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
						{t('app.dashboard.text21')}
					</h1>
					<p className="text-sm text-(--text-muted) max-w-md">{t('app.dashboard.text22')}</p>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center text-center">
					<div className="w-20 h-20 bg-(--accent)/10 rounded-full flex items-center justify-center mb-6">
						<Server className="w-10 h-10 text-(--accent)" />
					</div>
					<h1 className="text-3xl font-extrabold tracking-tight text-(--text) drop-shadow-sm mb-4" style={{ fontFamily: `var(--font-fredoka)` }}>
						{t('app.dashboard.text23')}
					</h1>
					<p className="text-sm text-(--text-muted) max-w-md">{t('app.dashboard.text24')}</p>
					<a
						href="https://discord.com/new"
						target="_blank"
						rel="noopener noreferrer"
						className="mt-6 px-6 py-3 rounded-xl bg-(--accent) hover:bg-(--accent-hover) text-white font-medium transition-colors shadow-sm"
					>
						{t('app.dashboard.text25')}
					</a>
				</div>
			)}
		</div>
	);
}
