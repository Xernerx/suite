/** @format */
'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';
import { User, Activity, Terminal, ArrowLeft, ExternalLink, ShieldCheck, Server, Users, Hash, Globe, LifeBuoy, MessageSquare, FileText, Shield, ChevronUp } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface BotProfile {
	id: string;
	name: string;
	avatar?: string;
	description?: string;
	info?: string;
	owners?: string[];
	organization?: string;
	verified?: boolean;
	privacy?: string;
	tags?: string[];
	links?: Record<string, string>;
	commands?: any[];
	discord?: any;
	ownersData?: any[];
}

export default function BotPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const { getEnvUrl, isReady } = useEnvironment();
	const { view, setNavItems, show, hide } = useSidebar();
	const { t } = useDictionary();

	const [bot, setBot] = useState<BotProfile | null>(null);
	const [stats, setStats] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [statsLoading, setStatsLoading] = useState(true);
	const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '3m' | '6m' | '1y' | 'all'>('24h');
	const [activeMetric, setActiveMetric] = useState<'guildCount' | 'userCount' | 'shardCount' | 'voteCount' | 'uptime'>('guildCount');
	const [isUndrawing, setIsUndrawing] = useState(false);
	const statsCache = useRef<Record<string, any[]>>({});

	const handleMetricSwitch = (metricId: any) => {
		if (metricId === activeMetric || isUndrawing) return;
		setIsUndrawing(true);
		setTimeout(() => {
			setActiveMetric(metricId);
			setIsUndrawing(false);
		}, 400); // 400ms duration for undraw animation
	};

	// Vote State
	const [canVote, setCanVote] = useState(false);
	const [nextVoteAt, setNextVoteAt] = useState<string | null>(null);
	const [voting, setVoting] = useState(false);
	const [timeLeft, setTimeLeft] = useState<string>('');

	// Update countdown timer
	useEffect(() => {
		if (!nextVoteAt || canVote) return;
		const interval = setInterval(() => {
			const diff = new Date(nextVoteAt).getTime() - Date.now();
			if (diff <= 0) {
				setCanVote(true);
				setNextVoteAt(null);
				clearInterval(interval);
			} else {
				const h = Math.floor(diff / (1000 * 60 * 60));
				const m = Math.floor((diff / 1000 / 60) % 60);
				setTimeLeft(`${h}h ${m}m`);
			}
		}, 60000); // Update every minute to save renders

		// Initial calculation
		const diff = new Date(nextVoteAt).getTime() - Date.now();
		if (diff > 0) {
			const h = Math.floor(diff / (1000 * 60 * 60));
			const m = Math.floor((diff / 1000 / 60) % 60);
			setTimeLeft(`${h}h ${m}m`);
		}

		return () => clearInterval(interval);
	}, [nextVoteAt, canVote]);

	// 1. Setup Sidebar
	useEffect(() => {
		show();
		setNavItems([
			{ label: 'Back to Bots', href: '/bots', icon: ArrowLeft, category: 'Navigation' },
			{ label: 'Profile', view: 'profile', icon: User, category: 'Bot Details' },
			{ label: 'Statistics', view: 'stats', icon: Activity, category: 'Bot Details' },
			{ label: 'Commands', view: 'commands', icon: Terminal, category: 'Bot Details' },
		]);
		return () => hide();
	}, [setNavItems, show, hide]);

	// 1.5. Reset State on ID Change
	useEffect(() => {
		setBot(null);
		setStats([]);
		statsCache.current = {};
		setLoading(true);
		setStatsLoading(true);
	}, [id]);

	// 2. Fetch Bot Profile
	useEffect(() => {
		if (!isReady) return;
		const fetchBot = async () => {
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/profile`));
				if (res.ok) {
					setBot(await res.json());
				}
			} catch (error) {
				console.error('Failed to fetch bot profile', error);
			} finally {
				setLoading(false);
			}
		};
		fetchBot();
	}, [id, getEnvUrl, isReady]);

	// 3. Fetch Bot Stats (Dynamic by timeframe)
	useEffect(() => {
		if (!isReady) return;
		const fetchStats = async () => {
			if (statsCache.current[timeframe]) {
				setStats(statsCache.current[timeframe]);
				return;
			}

			setStatsLoading(true);
			try {
				let url = `https://api.xernerx.com/secure/bots/${id}/stats`;

				if (timeframe !== 'all') {
					const now = Date.now();
					const day = 24 * 60 * 60 * 1000;
					const limits: Record<string, number> = {
						'24h': now - day,
						'7d': now - 7 * day,
						'30d': now - 30 * day,
						'3m': now - 90 * day,
						'6m': now - 180 * day,
						'1y': now - 365 * day,
					};
					const after = limits[timeframe];
					url += `?after=${after}`;
				}

				const res = await fetch(getEnvUrl(url));
				if (res.ok) {
					const data = await res.json();
					const normalized = data.map((s: any) => {
						let dateObj;
						if (s.timestamp) dateObj = new Date(s.timestamp);
						else if (s.createdAt) dateObj = new Date(s.createdAt);
						let sc = s.shardCount ?? s.shards ?? 0;
						if (Array.isArray(sc)) sc = sc.length;
						return {
							...s,
							timestamp: dateObj ? dateObj.getTime() : 0,
							guildCount: s.guildCount ?? s.servers ?? 0,
							userCount: s.userCount ?? s.users ?? 0,
							shardCount: typeof sc === 'object' ? 0 : sc,
							voteCount: s.voteCount ?? s.votes ?? 0,
						};
					});
					statsCache.current[timeframe] = normalized;
					setStats(normalized);
				}
			} catch (error) {
				console.error('Failed to fetch bot stats', error);
			} finally {
				setStatsLoading(false);
			}
		};
		fetchStats();
	}, [id, getEnvUrl, timeframe, isReady]);

	// 4. Fetch Vote Status
	useEffect(() => {
		if (!isReady) return;
		const fetchVoteStatus = async () => {
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/vote`), { credentials: 'include' });
				if (res.ok) {
					const data = await res.json();
					setCanVote(data.canVote);
					setNextVoteAt(data.nextVoteAt);
				}
			} catch (error) {
				// Silently fail if not logged in or error
			}
		};
		fetchVoteStatus();
	}, [id, getEnvUrl, isReady]);

	const handleVote = async () => {
		setVoting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/vote`), {
				method: 'POST',
				credentials: 'include',
			});
			if (res.ok) {
				setCanVote(false);
				setNextVoteAt(new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString());
				setBot((prev: any) => (prev ? { ...prev, voteCount: (prev.voteCount || 0) + 1 } : prev));
				setStats((prev: any) => {
					if (!prev || !prev.length) return prev;
					const last = prev[prev.length - 1];
					return [...prev, { ...last, voteCount: (last.voteCount || 0) + 1, timestamp: Date.now() }];
				});
				statsCache.current = {};
			}
		} catch (error) {
			console.error('Failed to vote', error);
		} finally {
			setVoting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex-1 flex items-center justify-center min-h-screen">
				<Loading />
			</div>
		);
	}

	if (!bot) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center">
				<h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('app.bots.id.text1')}
				</h2>
				<p className="text-(--text-muted) mb-8">{t('app.bots.id.text2')}</p>
				<Link href="/bots">
					<Button variant="primary">{t('app.bots.id.text3')}</Button>
				</Link>
			</div>
		);
	}

	const currentView = view || 'profile';

	// Header Profile Summary (Persistent across views)
	const renderHeader = () => {
		const avatarUrl = bot.discord?.avatar
			? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.discord.avatar}.png?size=256`
			: bot.avatar
				? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png?size=256`
				: null;

		return (
			<div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 p-8 rounded-3xl bg-(--foreground)/50 border border-(--border)/10 backdrop-blur-md shadow-sm mt-8 relative overflow-hidden">
				{bot.discord?.banner && (
					<div
						className="absolute inset-0 opacity-20 pointer-events-none"
						style={{ backgroundImage: `url(https://cdn.discordapp.com/banners/${bot.id}/${bot.discord.banner}.png?size=1024)`, backgroundSize: 'cover', backgroundPosition: 'center' }}
					/>
				)}
				{avatarUrl ? (
					<Image
						src={avatarUrl}
						alt={bot.discord?.global_name || bot.discord?.username || bot.name || 'Bot Avatar'}
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
					<div className="flex items-center gap-3 mb-2">
						<h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{bot.discord?.global_name || bot.discord?.username || bot.name || 'Unknown Bot'}
						</h1>
						{bot.verified && <ShieldCheck className="w-6 h-6 text-green-500" />}
						{bot.discord?.bot && <span className="px-2 py-0.5 bg-[#5865F2] text-white text-[10px] font-bold rounded-sm uppercase tracking-wider">{t('app.bots.id.text4')}</span>}
					</div>
					<p className="text-lg text-(--text-muted) mb-4 max-w-2xl">{bot.description || 'No description provided.'}</p>
					<div className="flex flex-wrap gap-2">
						{bot.tags?.map((tag) => (
							<span key={tag} className="px-3 py-1 bg-(--accent)/10 text-(--accent) text-sm font-semibold rounded-full border border-(--accent)/20 flex items-center gap-1">
								<Hash className="w-3 h-3" /> {tag}
							</span>
						))}
					</div>
				</div>

				<div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0 relative z-10 flex flex-col items-start md:items-end gap-6">
					<div className="flex flex-col items-start md:items-end gap-3 w-full">
						<div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
							{bot.links?.invite && (
								<Button onClick={() => window.open(bot.links!.invite, '_blank')} className="w-full sm:w-auto px-8 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_40%,transparent)]">
									{t('app.bots.id.text5')}
								</Button>
							)}
							<Button
								onClick={handleVote}
								disabled={!canVote || voting}
								variant="outline"
								className={`w-full sm:w-auto px-6 border border-(--border)/10 ${canVote ? 'hover:border-(--accent)/50 hover:bg-(--accent)/10 text-(--accent)' : 'opacity-50 cursor-not-allowed'}`}
							>
								<ChevronUp className="w-4 h-4 mr-2" />
								{voting ? 'Voting...' : canVote ? 'Vote' : nextVoteAt ? `Vote again in ${timeLeft || '...'}` : 'Voted'}
							</Button>
						</div>
						{bot.links && Object.entries(bot.links).filter(([key, val]) => key !== 'invite' && val).length > 0 && (
							<div className="flex flex-wrap gap-2 justify-end w-full">
								{Object.entries(bot.links)
									.filter(([key, val]) => key !== 'invite' && val)
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

					{bot.ownersData && bot.ownersData.length > 0 && (
						<div className="flex flex-col items-start md:items-end gap-2">
							<span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">{t('app.bots.id.text6')}</span>
							<div className="flex flex-wrap gap-2 justify-end">
								{bot.ownersData.map((owner: any) => (
									<Link
										href={`/users/${owner.id}`}
										key={owner.id}
										className="flex items-center gap-2 bg-(--background) border border-(--border)/10 px-3 py-1 rounded-full shadow-sm hover:border-(--accent)/50 transition-colors"
									>
										<Image
											src={
												owner.avatar
													? `https://cdn.discordapp.com/avatars/${owner.id}/${owner.avatar}.png?size=64`
													: `https://cdn.discordapp.com/embed/avatars/${Number(owner.discriminator) % 5}.png`
											}
											alt={owner.global_name || owner.username || 'Owner Avatar'}
											width={16}
											height={16}
											className="rounded-full"
										/>

										<span className="text-xs font-bold text-(--text)">{owner.global_name || owner.username}</span>
									</Link>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		);
	};

	// Contextual: Profile View
	const renderProfile = () => (
		<div className="prose prose-invert max-w-none prose-headings:font-fredoka prose-a:text-(--accent) bg-(--foreground)/30 p-8 rounded-3xl border border-(--border)/10">
			{bot.info ? <ReactMarkdown>{bot.info}</ReactMarkdown> : <div className="text-center text-(--text-muted) py-12">{t('app.bots.id.text7')}</div>}
		</div>
	);

	// Contextual: Stats View
	const renderStats = () => {
		if (stats.length === 0 && statsLoading)
			return (
				<div className="py-20 flex justify-center">
					<Loading variant="small" />
				</div>
			);

		if (stats.length === 0) return <div className="text-center text-(--text-muted) py-12 border border-(--border)/10 rounded-3xl">{t('app.bots.id.text8')}</div>;

		const currentStats = stats[stats.length - 1];

		// Filter chart data based on timeframe and calculate uptime
		let chartData = stats;

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
			chartData = stats.filter((s) => s.timestamp >= limits[timeframe]);
		}

		// Map uptime into chartData (convert to hours)
		chartData = chartData.map((s) => ({
			...s,
			uptime: s.onlineSince ? Math.max(0, (s.timestamp - s.onlineSince) / (1000 * 60 * 60)) : 0,
		}));

		// Calculate gain/loss and highest ever for the active metric
		const highestValue = Math.max(...stats.map((s) => s[activeMetric] || 0));
		const firstPoint = chartData[0]?.[activeMetric] || 0;
		const lastPoint = chartData[chartData.length - 1]?.[activeMetric] || 0;
		const gainLoss = lastPoint - firstPoint;
		const gainPercentage = firstPoint > 0 ? ((gainLoss / firstPoint) * 100).toFixed(1) : '0';

		// Calculate Uptime
		const calculateUptime = () => {
			if (!currentStats.onlineSince) return 'Unknown';
			const diff = Date.now() - currentStats.onlineSince;
			if (diff < 0) return 'Just now';

			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
			const minutes = Math.floor((diff / 1000 / 60) % 60);

			if (days > 0) return `${days}d ${hours}h`;
			if (hours > 0) return `${hours}h ${minutes}m`;
			return `${minutes}m`;
		};

		return (
			<div className="flex flex-col gap-6">
				{/* Metrics Row */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
					{[
						{ id: 'guildCount', label: 'Servers', value: currentStats.guildCount, icon: Server },
						{ id: 'userCount', label: 'Users', value: currentStats.userCount, icon: Users },
						{ id: 'shardCount', label: 'Shards', value: currentStats.shardCount, icon: Activity },
						{ id: 'voteCount', label: 'Votes', value: (bot as any).voteCount || currentStats.voteCount || 0, icon: ShieldCheck },
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
							<div className={`text-sm font-semibold uppercase tracking-wider ${activeMetric === metric.id ? 'text-(--accent)' : 'text-(--text-muted)'}`}>{metric.label}</div>
						</button>
					))}

					{/* Uptime Box */}
					<button
						onClick={() => handleMetricSwitch('uptime')}
						className={`bg-(--foreground)/50 border p-6 rounded-3xl flex flex-col items-center justify-center gap-3 backdrop-blur-md transition-all ${activeMetric === 'uptime' ? 'border-(--accent) shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_20%,transparent)] scale-105 z-10' : 'border-(--border)/10 hover:border-(--accent)/50'}`}
					>
						<Activity className={`w-8 h-8 ${activeMetric === 'uptime' ? 'text-(--accent)' : 'text-green-400'}`} />
						<div className={`text-3xl font-bold ${activeMetric === 'uptime' ? 'text-white' : 'text-green-400'}`} style={{ fontFamily: 'var(--font-fredoka)' }}>
							{calculateUptime()}
						</div>
						<div className={`text-sm font-semibold uppercase tracking-wider ${activeMetric === 'uptime' ? 'text-(--accent)' : 'text-(--text-muted)'}`}>{t('app.bots.id.text9')}</div>
					</button>
				</div>

				{/* Chart Section */}
				<div className="bg-(--foreground)/50 border border-(--border)/10 p-6 md:p-8 rounded-3xl backdrop-blur-md">
					<div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
						<div>
							<h3 className="text-2xl font-bold mb-1 capitalize" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{activeMetric.replace('Count', '')}
								{t('app.bots.id.text10')}
							</h3>
							<div className="flex flex-wrap items-center gap-4 text-sm font-medium">
								<span className={`${gainLoss >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-md`}>
									{gainLoss > 0 ? '+' : ''}
									{activeMetric === 'uptime' ? gainLoss.toFixed(1) : gainLoss.toLocaleString()} ({gainPercentage}
									{t('app.bots.id.text11')}
								</span>
								<span className="text-(--text-muted) bg-(--background) px-2 py-1 rounded-md border border-(--border)/10">
									{t('app.bots.id.text12')}
									{activeMetric === 'uptime' ? `${highestValue.toFixed(1)}h` : highestValue.toLocaleString()}
								</span>
							</div>
						</div>

						{/* Timeframe Toggles */}
						<div className="flex bg-(--background) p-2 rounded-xl border border-(--border)/10 gap-1 w-full md:w-auto overflow-x-auto shadow-inner hide-scrollbar">
							{(['24h', '7d', '30d', '3m', '6m', '1y', 'all'] as const).map((tf) => (
								<button
									key={tf}
									onClick={() => setTimeframe(tf)}
									className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex-none ${
										timeframe === tf ? 'bg-(--accent) text-white shadow-md' : 'text-(--text-muted) hover:text-(--text) hover:bg-(--foreground)'
									}`}
								>
									{tf === '24h' ? '24h' : tf === '7d' ? '7d' : tf === '30d' ? '1m' : tf === '3m' ? '3m' : tf === '6m' ? '6m' : tf === '1y' ? '1y' : 'All'}
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
						{statsLoading ? (
							<div className="w-full h-full flex items-center justify-center">
								<Loading />
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
											if (timeframe === 'all' || timeframe === '1y') return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
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
											if (activeMetric === 'uptime') return `${val.toFixed(0)}h`;
											return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val;
										}}
									/>

									<Tooltip
										contentStyle={{
											backgroundColor: 'var(--foreground)',
											border: '1px solid color-mix(in srgb, var(--border) 10%, transparent)',
											borderRadius: '1rem',
											boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
										}}
										itemStyle={{ color: 'var(--text)', fontWeight: 'bold' }}
										labelFormatter={(label) => new Date(label as string | number).toLocaleString()}
										separator=" "
										formatter={(value: any) => value.toLocaleString()}
									/>

									<Line
										type="monotone"
										dataKey={activeMetric}
										name={
											activeMetric === 'guildCount'
												? 'Servers'
												: activeMetric === 'userCount'
													? 'Users'
													: activeMetric === 'shardCount'
														? 'Shards'
														: activeMetric === 'voteCount'
															? 'Votes'
															: 'Uptime'
										}
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
	};

	// Contextual: Commands View
	const renderCommands = () => (
		<div className="flex flex-col gap-4">
			{bot.commands && bot.commands.length > 0 ? (
				bot.commands.map((cmd, i) => (
					<div key={i} className="bg-(--foreground)/50 border border-(--border)/10 p-6 rounded-3xl">
						<div className="flex items-center gap-3 mb-2">
							<Terminal className="w-5 h-5 text-(--accent)" />
							<h3 className="text-xl font-bold font-mono">/{cmd.name}</h3>
						</div>
						<p className="text-(--text-muted) mb-4">{cmd.description}</p>

						{/* Render Discord Options if present */}
						{cmd.options && cmd.options.length > 0 && (
							<div className="bg-(--background) rounded-2xl p-4 border border-(--border)/10">
								<h4 className="text-xs font-bold text-(--text-muted) uppercase tracking-wider mb-3">{t('app.bots.id.text13')}</h4>
								<div className="flex flex-col gap-2">
									{cmd.options.map((opt: any, j: number) => (
										<div key={j} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-(--border)/10 last:border-0 gap-2">
											<div className="flex items-center gap-2">
												<span className="font-mono text-sm font-semibold">{opt.name}</span>
												{opt.required && <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">{t('app.bots.id.text14')}</span>}
											</div>
											<span className="text-sm text-(--text-muted)">{opt.description}</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				))
			) : (
				<div className="text-center text-(--text-muted) py-12 border border-dashed border-(--border)/10 rounded-3xl bg-(--foreground)/30">{t('app.bots.id.text15')}</div>
			)}
		</div>
	);

	return (
		<div className="flex flex-col w-full min-h-screen pb-24">
			{renderHeader()}

			<div className="mt-4">
				{currentView === 'profile' && renderProfile()}
				{currentView === 'stats' && renderStats()}
				{currentView === 'commands' && renderCommands()}
			</div>
		</div>
	);
}
