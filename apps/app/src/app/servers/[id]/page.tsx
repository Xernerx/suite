/** @format */
'use client';

import { use, useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useSession, useSidebar } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';
import { Activity, ArrowLeft, Server, Settings } from 'lucide-react';
import Link from 'next/link';
import { ServerHeader } from '@/components/servers/Header';
import { ServerProfile } from '@/components/servers/Profile';
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

	const [server, setServer] = useState<GuildProfile | null>(null);
	const [organizationData, setOrganizationData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [canManageServer, setCanManageServer] = useState(false);

	// Vote State
	const [canVote, setCanVote] = useState(false);
	const [nextVoteAt, setNextVoteAt] = useState<string | null>(null);
	const [voting, setVoting] = useState(false);
	const [timeLeft, setTimeLeft] = useState<string>('');

	useEffect(() => {
		if (!nextVoteAt || canVote) return;
		const updateCountdown = () => {
			const diff = new Date(nextVoteAt).getTime() - Date.now();
			if (diff <= 0) {
				setCanVote(true);
				setNextVoteAt(null);
			} else {
				const h = Math.floor(diff / (1000 * 60 * 60));
				const m = Math.floor((diff / 1000 / 60) % 60);
				setTimeLeft(`${h}h ${m}m`);
			}
		};
		updateCountdown();
		const interval = setInterval(updateCountdown, 60000);
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

	useEffect(() => {
		const fetchVoteStatus = async () => {
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${id}/vote`), { credentials: 'include' });
				if (res.ok) {
					const data = await res.json();
					setCanVote(data.canVote);
					setNextVoteAt(data.nextVoteAt);
				}
			} catch {}
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
				<h1 className="sr-only">{t('app.servers.nav.serverProfile')}</h1>
				<Loading />
			</div>
		);
	}

	if (!server || server.name === 'Unknown Guild' || (server.privacy === 'private' && !canManageServer)) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center">
				<h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('app.servers.notFoundTitle')}
				</h1>
				<p className="text-(--text-muted) mb-8">{t('app.servers.notFoundDesc')}</p>
				<Link href="/servers">
					<Button variant="primary">{t('app.servers.backToExplore')}</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full min-h-screen pb-24">
			<ServerHeader server={server} organizationData={organizationData} canVote={canVote} voting={voting} timeLeft={timeLeft} onVote={handleVote} />
			<div className="w-full">{view === 'statistics' ? <ServerStatsView server={server} /> : <ServerProfile server={server} organizationData={organizationData} />}</div>
		</div>
	);
}
