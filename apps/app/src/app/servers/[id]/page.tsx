/** @format */
'use client';

import { useEffect, useState, use } from 'react';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';
import { ArrowLeft, Server, Users, Shield, Link as LinkIcon, Image as ImageIcon, Activity, MessageSquare, ShieldCheck, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface GuildProfile {
	id: string;
	name: string;
	icon?: string;
	banner?: string;
	description?: string;
	info?: string;
	organization?: string;
	verified?: boolean;
	privacy?: string;
	links?: Record<string, string>;
	stats?: { members: number; messages: number }[];
	voteCount?: number;
}

export default function ServerPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const { getEnvUrl } = useEnvironment();
	const { view, setNavItems, show, hide } = useSidebar();
	const { t } = useDictionary();

	const [server, setServer] = useState<GuildProfile | null>(null);
	const [loading, setLoading] = useState(true);

	// Chart State
	const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '3m' | '6m' | '1y' | 'all'>('24h');
	const [activeMetric, setActiveMetric] = useState<'members' | 'messages' | 'voteCount'>('members');
	const [isUndrawing, setIsUndrawing] = useState(false);

	const handleMetricSwitch = (metricId: any) => {
		if (metricId === activeMetric || isUndrawing) return;
		setIsUndrawing(true);
		setTimeout(() => {
			setActiveMetric(metricId);
			setIsUndrawing(false);
		}, 400);
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
		}, 60000);

		const diff = new Date(nextVoteAt).getTime() - Date.now();
		if (diff > 0) {
			const h = Math.floor(diff / (1000 * 60 * 60));
			const m = Math.floor((diff / 1000 / 60) % 60);
			setTimeLeft(`${h}h ${m}m`);
		}

		return () => clearInterval(interval);
	}, [nextVoteAt, canVote]);

	useEffect(() => {
		show();
		setNavItems([
			{ label: 'Back to Servers', href: '/servers', icon: ArrowLeft, category: 'Navigation' },
			{ label: 'Profile', view: 'profile', icon: Server, category: 'Server Details' },
			{ label: 'Statistics', view: 'statistics', icon: Activity, category: 'Server Details' },
		]);
		return () => hide();
	}, [setNavItems, show, hide]);

	// Fetch Server Profile
	useEffect(() => {
		const fetchServer = async () => {
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}`));
				if (res.ok) {
					setServer(await res.json());
				}
			} catch (error) {
				console.error('Failed to fetch server profile', error);
			} finally {
				setLoading(false);
			}
		};
		fetchServer();
	}, [id, getEnvUrl]);

	// Fetch Vote Status
	useEffect(() => {
		const fetchVoteStatus = async () => {
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/vote`), { credentials: 'include' });
				if (res.ok) {
					const data = await res.json();
					setCanVote(data.canVote);
					setNextVoteAt(data.nextVoteAt);
				}
			} catch (error) {
				// Silently fail if not logged in
			}
		};
		fetchVoteStatus();
	}, [id, getEnvUrl]);

	const handleVote = async () => {
		setVoting(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/vote`), {
				method: 'POST',
				credentials: 'include',
			});
			if (res.ok) {
				setCanVote(false);
				setNextVoteAt(new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString());
				setServer((prev) => (prev ? { ...prev, voteCount: (prev.voteCount || 0) + 1 } : prev));
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

	if (!server || server.name === 'Unknown Guild') {
		return (
			<div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center">
				<h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
					Server Not Found
				</h2>
				<p className="text-(--text-muted) mb-8">This server either doesn't exist or is private.</p>
				<Link href="/servers">
					<Button variant="primary">Back to Explore</Button>
				</Link>
			</div>
		);
	}

	const renderHeader = () => {
		const avatarUrl = server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=256` : null;
		const bannerUrl = server.banner ? `https://cdn.discordapp.com/banners/${server.id}/${server.banner}.png?size=1024` : null;

		return (
			<div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 p-8 rounded-3xl bg-(--foreground)/50 border border-(--border)/10 backdrop-blur-md shadow-sm mt-8 relative overflow-hidden">
				{bannerUrl && (
					<div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
				)}
				{avatarUrl ? (
					<Image src={avatarUrl} alt={server.name} width={128} height={128} className="rounded-2xl shadow-lg border-2 border-(--border)/20 relative z-10" />
				) : (
					<div className="w-32 h-32 rounded-2xl bg-(--background) border-2 border-(--border)/20 flex items-center justify-center text-(--text-muted) shadow-lg relative z-10">
						<ImageIcon className="w-12 h-12" />
					</div>
				)}
				<div className="flex-1 relative z-10">
					<div className="flex items-center gap-3 mb-2">
						<h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{server.name}
						</h1>
						{server.verified && <Shield className="w-6 h-6 text-green-500" />}
					</div>
					<p className="text-lg text-(--text-muted) mb-4 max-w-2xl">{server.description || 'No description provided.'}</p>

					<div className="flex flex-wrap items-center gap-4">
						{(server as any).bot !== false && (
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-(--background)/80 border border-(--border)/10 shadow-sm backdrop-blur-md">
								<Users className="w-4 h-4 text-(--accent)" />
								<span className="text-sm font-semibold text-(--text)">
									{server.stats && server.stats.length > 0 ? server.stats[server.stats.length - 1].members.toLocaleString() : 'N/A'} Members
								</span>
							</div>
						)}
					</div>
				</div>

				<div className="flex flex-col gap-3 min-w-[200px] relative z-10 w-full md:w-auto mt-6 md:mt-0">
					<Button variant="primary" className="w-full justify-center shadow-lg hover:shadow-xl transition-shadow" onClick={() => window.open(server.links?.website || '#', '_blank')}>
						Join Server
					</Button>
					<Button
						variant={canVote ? 'secondary' : 'ghost'}
						className={`w-full justify-center ${canVote ? 'hover:border-(--accent) hover:text-(--accent)' : 'opacity-70 cursor-not-allowed border-(--border)/5 bg-(--foreground)/30'}`}
						onClick={handleVote}
						disabled={!canVote || voting}
						loading={voting}
					>
						{canVote ? `Vote for Server (${server.voteCount || 0})` : `Vote available in ${timeLeft}`}
					</Button>
				</div>
			</div>
		);
	};

	// Contextual: Profile View
	const renderProfile = () => (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<div className="lg:col-span-2 flex flex-col gap-8">
				{/* About Section */}
				<div className="p-8 rounded-3xl bg-(--foreground)/30 border border-(--border)/10 shadow-sm flex flex-col h-full">
					<h3 className="text-2xl font-bold mb-6 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						About {server.name}
					</h3>
					<div className="prose prose-invert max-w-none text-(--text-muted) flex-1 prose-headings:font-fredoka prose-a:text-(--accent) hover:prose-a:text-(--accent)/80">
						{server.info ? <ReactMarkdown>{server.info}</ReactMarkdown> : 'This server has not provided a detailed description yet.'}
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-8">
				{/* Information Card */}
				<div className="p-6 rounded-3xl bg-(--foreground)/30 border border-(--border)/10 shadow-sm">
					<h4 className="text-lg font-bold mb-4 flex items-center gap-2">
						<Server className="w-5 h-5 text-(--text-muted)" /> Information
					</h4>
					<div className="flex flex-col gap-4">
						{server.links?.website && (
							<div className="flex flex-col gap-1">
								<span className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">Website</span>
								<a
									href={server.links.website}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 text-sm font-medium text-(--accent) hover:underline break-all"
								>
									<LinkIcon className="w-4 h-4" /> {new URL(server.links.website).hostname}
								</a>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);

	// Contextual: Stats View
	const renderStats = () => {
		const stats = (server.stats || []).map((s: any) => ({
			...s,
			timestamp: new Date(s.timestamp).getTime(),
		}));

		if (stats.length === 0) return <div className="text-center text-(--text-muted) py-12 border border-(--border)/10 rounded-3xl">No statistics have been recorded for this server yet.</div>;

		const currentStats = stats[stats.length - 1];

		// Filter chart data based on timeframe
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

		// Calculate gain/loss and highest ever for the active metric
		const highestValue = Math.max(...stats.map((s) => s[activeMetric] || 0));
		const firstPoint = chartData[0]?.[activeMetric] || 0;
		const lastPoint = chartData[chartData.length - 1]?.[activeMetric] || 0;
		const gainLoss = lastPoint - firstPoint;
		const gainPercentage = firstPoint > 0 ? ((gainLoss / firstPoint) * 100).toFixed(1) : '0';

		return (
			<div className="flex flex-col gap-6">
				{/* Metrics Row */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{[
						{ id: 'members', label: 'Members', value: currentStats.members, icon: Users },
						{ id: 'messages', label: 'Messages', value: currentStats.messages, icon: MessageSquare },
						{ id: 'voteCount', label: 'Votes', value: currentStats.voteCount || server.voteCount, icon: ShieldCheck },
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
				</div>

				{/* Chart Section */}
				<div className="bg-(--foreground)/50 border border-(--border)/10 p-6 md:p-8 rounded-3xl backdrop-blur-md">
					<div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
						<div>
							<h3 className="text-2xl font-bold mb-1 capitalize" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{activeMetric === 'voteCount' ? 'Votes' : activeMetric} over time
							</h3>
							<div className="flex flex-wrap items-center gap-4 text-sm font-medium">
								<span className={`${gainLoss >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-md`}>
									{gainLoss > 0 ? '+' : ''}
									{gainLoss.toLocaleString()} ({gainPercentage}%)
								</span>
								<span className="text-(--text-muted) bg-(--background) px-2 py-1 rounded-md border border-(--border)/10">Highest: {highestValue.toLocaleString()}</span>
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
								/>

								<Line
									type="monotone"
									dataKey={activeMetric}
									name={activeMetric === 'voteCount' ? 'Votes' : activeMetric}
									stroke="var(--accent)"
									strokeWidth={4}
									dot={chartData.length <= 1 ? { r: 6, fill: 'var(--accent)', strokeWidth: 0 } : false}
									activeDot={{ r: 8, fill: 'var(--accent)', strokeWidth: 0, stroke: 'var(--background)', strokeOpacity: 0.5 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-col w-full min-h-screen pb-24">
			{renderHeader()}

			<div className="w-full">{view === 'statistics' ? renderStats() : renderProfile()}</div>
		</div>
	);
}
