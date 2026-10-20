/** @format */
'use client';

import { useEffect, useState, use } from 'react';
import { useDictionary, useEnvironment, useSidebar, useSession, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';
import {
	ArrowLeft,
	Server,
	Users,
	Shield,
	Link as LinkIcon,
	Image as ImageIcon,
	Activity,
	MessageSquare,
	ShieldCheck,
	Settings,
	Copy,
	Share2,
	Check,
	Globe,
	LifeBuoy,
	Code2,
	FileText,
	ExternalLink,
	Building2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import PublicWidgetModalButton from '@/components/PublicWidgetModalButton';
import { ServerStatsView } from '@/components/servers/ServerStatsView';

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
	const { data: session } = useSession();
	const { toast } = useToast();

	const [server, setServer] = useState<GuildProfile | null>(null);
	const [organizationData, setOrganizationData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [canManageServer, setCanManageServer] = useState(false);
	const [copiedId, setCopiedId] = useState(false);
	const [copiedShare, setCopiedShare] = useState(false);

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

	const handleCopyId = () => {
		if (!server) return;
		navigator.clipboard.writeText(server.id).then(() => {
			setCopiedId(true);
			toast({ type: 'success', title: t('app.servers.idCopied'), description: server.id });
			setTimeout(() => setCopiedId(false), 2000);
		});
	};

	const handleShareProfile = () => {
		const url = window.location.href;
		navigator.clipboard.writeText(url).then(() => {
			setCopiedShare(true);
			toast({ type: 'success', title: t('app.servers.profileLinkCopied'), description: url });
			setTimeout(() => setCopiedShare(false), 2000);
		});
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
		const sessionData = session as any;
		const uid = sessionData?.user?.id;
		if (!uid) {
			setCanManageServer(false);
			return;
		}
		fetch(getEnvUrl(`https://api.xernerx.com/core/users/${uid}/discord/guilds`))
			.then((res) => (res.ok ? res.json() : []))
			.then((guilds: any[]) => {
				if (!Array.isArray(guilds)) return;
				const match = guilds.find((g) => g.id === id);
				if (match) {
					const perms = BigInt(match.permissions || 0);
					const hasAdmin = (perms & BigInt(0x8)) === BigInt(0x8);
					const hasManage = (perms & BigInt(0x20)) === BigInt(0x20);
					setCanManageServer(hasAdmin || hasManage);
				} else {
					setCanManageServer(false);
				}
			})
			.catch(() => setCanManageServer(false));
	}, [session, id, getEnvUrl]);

	useEffect(() => {
		show();
		const items: any[] = [
			{ label: t('app.servers.nav.backToServers'), href: '/servers', icon: ArrowLeft, category: t('app.portal.categories.navigation') },
			{ label: t('app.organization.nav.profile'), view: 'profile', icon: Server, category: t('app.servers.nav.serverDetails') },
			{ label: t('app.bots.tabs.statistics'), view: 'statistics', icon: Activity, category: t('app.servers.nav.serverDetails') },
		];
		if (canManageServer) {
			items.push({ label: t('app.servers.manageServer'), href: `/dashboard?guild=${id}`, icon: Settings, category: t('app.bots.tabs.categoryManagement') });
		}
		setNavItems(items);
		return () => hide();
	}, [setNavItems, show, hide, t, canManageServer, id]);

	// Fetch Server Profile
	useEffect(() => {
		const fetchServer = async () => {
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}`));
				if (res.ok) {
					const data = await res.json();
					setServer(data);
					if (data?.organization) {
						try {
							const orgRes = await fetch(getEnvUrl(`https://api.xernerx.com/secure/organizations/${data.organization}`));
							if (orgRes.ok) {
								setOrganizationData(await orgRes.json());
							}
						} catch {}
					}
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

	if (!server || server.name === 'Unknown Guild' || (server.privacy === 'private' && !canManageServer)) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center">
				<h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('app.servers.notFoundTitle')}
				</h2>
				<p className="text-(--text-muted) mb-8">{t('app.servers.notFoundDesc')}</p>
				<Link href="/servers">
					<Button variant="primary">{t('app.servers.backToExplore')}</Button>
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
					<div className="flex flex-wrap items-center gap-3 mb-2">
						<h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{server.name}
						</h1>
						{server.verified && <Shield className="w-6 h-6 text-green-500" />}
						<button
							type="button"
							onClick={handleCopyId}
							title={t('app.servers.copyId')}
							className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-(--background)/80 hover:bg-(--background) border border-(--border)/10 hover:border-(--accent)/40 text-xs font-mono text-(--text-muted) hover:text-(--text) transition-all cursor-pointer"
						>
							{copiedId ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
							<span>{server.id}</span>
						</button>
					</div>
					<p className="text-lg text-(--text-muted) mb-4 max-w-2xl">{server.description || t('common.noDescription')}</p>

					<div className="flex flex-wrap items-center gap-4">
						{(server as any).bot !== false && (
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
							className="flex-1 justify-center shadow-lg hover:shadow-xl transition-shadow"
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
							{copiedShare ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
						</Button>
						{(server as any).widgets && <PublicWidgetModalButton entityType="guilds" entityId={server.id} entityName={server.name} />}
					</div>
					<Button
						variant={canVote ? 'secondary' : 'ghost'}
						className={`w-full justify-center ${canVote ? 'hover:border-(--accent) hover:text-(--accent)' : 'opacity-70 cursor-not-allowed border-(--border)/5 bg-(--foreground)/30'}`}
						onClick={handleVote}
						disabled={!canVote || voting}
						loading={voting}
					>
						{canVote ? t('app.servers.voteForServer', { count: server.voteCount || 0 }) : t('app.servers.voteAvailableIn', { time: timeLeft })}
					</Button>
				</div>
			</div>
		);
	};

	// Contextual: Profile View
	const renderProfile = () => {
		const configuredLinks = Object.entries(server.links || {}).filter(([, val]) => Boolean(val && String(val).trim()));

		return (
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 flex flex-col gap-8">
					{/* About Section */}
					<div className="p-8 rounded-3xl bg-(--foreground)/30 border border-(--border)/10 shadow-sm flex flex-col h-full">
						<h3 className="text-2xl font-bold mb-6 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('app.servers.about', { name: server.name })}
						</h3>
						<div className="prose max-w-none text-(--text-muted) flex-1 prose-headings:font-fredoka prose-a:text-(--accent) hover:prose-a:text-(--accent)/80">
							{server.info ? <ReactMarkdown>{server.info}</ReactMarkdown> : t('app.servers.noDetailedDesc')}
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-8">
					{/* Information Card */}
					<div className="p-6 rounded-3xl bg-(--foreground)/30 border border-(--border)/10 shadow-sm">
						<h4 className="text-lg font-bold mb-4 flex items-center gap-2">
							<Server className="w-5 h-5 text-(--text-muted)" /> {t('app.servers.information')}
						</h4>
						<div className="flex flex-col gap-4">
							{organizationData?.name && (
								<div className="flex flex-col gap-1">
									<span className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">{t('app.servers.publishedBy')}</span>
									{organizationData.privacy === 'public' || organizationData.config?.privacy === 'public' ? (
										<Link href={`/organization/${organizationData._id}`} className="flex items-center gap-2 text-sm font-semibold text-(--accent) hover:underline">
											<Building2 className="w-4 h-4 shrink-0" />
											<span>{organizationData.name}</span>
										</Link>
									) : (
										<span className="flex items-center gap-2 text-sm font-medium text-(--text)">
											<Building2 className="w-4 h-4 shrink-0 text-(--text-muted)" />
											<span>{organizationData.name}</span>
										</span>
									)}
								</div>
							)}
							{configuredLinks.map(([key, rawUrl]) => {
								let Icon: any = LinkIcon;
								if (key === 'website') Icon = Globe;
								else if (key === 'support') Icon = LifeBuoy;
								else if (key === 'github') Icon = Code2;
								else if (key === 'community' || key === 'invite') Icon = MessageSquare;
								else if (key === 'privacy') Icon = Shield;
								else if (key === 'terms') Icon = FileText;
								else Icon = ExternalLink;

								let displayUrl = rawUrl;
								try {
									const parsed = new URL(rawUrl);
									displayUrl = parsed.hostname + (parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '');
								} catch {}

								return (
									<div key={key} className="flex flex-col gap-1">
										<span className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">{key}</span>
										<a href={rawUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-(--accent) hover:underline break-all">
											<Icon className="w-4 h-4 shrink-0" /> {displayUrl}
										</a>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-col w-full min-h-screen pb-24">
			{renderHeader()}

			<div className="w-full">
				{view === 'statistics' ? (
					<ServerStatsView server={server} activeMetric={activeMetric} handleMetricSwitch={handleMetricSwitch} timeframe={timeframe} setTimeframe={setTimeframe} isUndrawing={isUndrawing} />
				) : (
					renderProfile()
				)}
			</div>
		</div>
	);
}
