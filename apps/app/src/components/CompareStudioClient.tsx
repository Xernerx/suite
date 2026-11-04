/** @format */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowLeftRight, Bot, CheckCircle2, ExternalLink, Scale, Server, Share2, Sparkles, Star, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDictionary, useEnvironment, useSidebar, useToast } from '@xernerx/providers';
import { Button, Selector } from '@xernerx/ui';
import { Loading } from '@xernerx/feedback';

interface BotCompareItem {
	id: string;
	name: string;
	avatar?: string | null;
	vanitySlug?: string | null;
	verified?: boolean;
	status?: string;
	description?: string;
	tags?: string[];
	commandsCount?: number;
	voteCount?: number;
	reviewCount?: number;
	reviewAverage?: number;
	stats?: {
		guildCount?: number;
		userCount?: number;
		shardCount?: number;
		voteCount?: number;
	} | null;
}

interface ServerCompareItem {
	id: string;
	name: string;
	icon?: string | null;
	vanitySlug?: string | null;
	verified?: boolean;
	description?: string;
	tags?: string[];
	voteCount?: number;
	memberCount?: number;
	botsCount?: number;
	boostsCount?: number;
	messagesCount?: number;
}

function getBotAvatarUrl(bot: BotCompareItem): string | null {
	if (!bot.avatar) return null;
	if (bot.avatar.startsWith('http')) return bot.avatar;
	return `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png?size=256`;
}

function getServerIconUrl(server: ServerCompareItem): string | null {
	if (!server.icon) return null;
	if (server.icon.startsWith('http')) return server.icon;
	return `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=256`;
}

export default function CompareStudioClient() {
	const { t } = useDictionary();
	const { getEnvUrl, isReady } = useEnvironment();
	const { hide } = useSidebar();
	const { toast } = useToast();
	const router = useRouter();
	const searchParams = useSearchParams();

	const initialMode = searchParams.get('type') === 'servers' ? 'servers' : 'bots';
	const [mode, setMode] = useState<'bots' | 'servers'>(initialMode);
	const [bots, setBots] = useState<BotCompareItem[]>([]);
	const [servers, setServers] = useState<ServerCompareItem[]>([]);
	const [loading, setLoading] = useState(true);

	const [firstId, setFirstId] = useState<string>(searchParams.get('a') || '');
	const [secondId, setSecondId] = useState<string>(searchParams.get('b') || '');

	useEffect(() => {
		hide();
	}, [hide]);

	useEffect(() => {
		if (!isReady) return;
		setLoading(true);
		Promise.all([
			fetch(getEnvUrl('https://api.xernerx.com/secure/bots?limit=150&sort=servers'))
				.then((r) => (r.ok ? r.json() : []))
				.catch(() => []),
			fetch(getEnvUrl('https://api.xernerx.com/secure/guilds?limit=150&category=biggest'))
				.then((r) => (r.ok ? r.json() : []))
				.catch(() => []),
		])
			.then(([botList, serverList]) => {
				const validBots: BotCompareItem[] = Array.isArray(botList) ? botList : [];
				const validServers: ServerCompareItem[] = Array.isArray(serverList) ? serverList : [];
				setBots(validBots);
				setServers(validServers);

				const paramA = searchParams.get('a') || '';
				const paramB = searchParams.get('b') || '';
				const activeList = initialMode === 'servers' ? validServers : validBots;

				const resolvedA = activeList.find((x) => x.id === paramA || x.vanitySlug === paramA)?.id || activeList[0]?.id || '';
				const resolvedB = activeList.find((x) => (x.id === paramB || x.vanitySlug === paramB) && x.id !== resolvedA)?.id || activeList.find((x) => x.id !== resolvedA)?.id || '';

				setFirstId(resolvedA);
				setSecondId(resolvedB);
			})
			.finally(() => setLoading(false));
	}, [isReady, getEnvUrl]);

	const handleSwitchMode = (nextMode: 'bots' | 'servers') => {
		setMode(nextMode);
		const list = nextMode === 'servers' ? servers : bots;
		setFirstId(list[0]?.id || '');
		setSecondId(list[1]?.id || '');
	};

	const handleSwap = () => {
		setFirstId(secondId);
		setSecondId(firstId);
	};

	const handleCopyShareLink = async () => {
		if (typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		url.searchParams.set('type', mode);
		if (firstId) url.searchParams.set('a', firstId);
		if (secondId) url.searchParams.set('b', secondId);
		try {
			await navigator.clipboard.writeText(url.toString());
			toast({
				type: 'success',
				title: t('app.compare.linkCopied'),
				description: url.toString(),
			});
		} catch {}
	};

	const options = useMemo(() => {
		const list = mode === 'bots' ? bots : servers;
		return list.map((item) => ({
			label: item.name || item.id,
			value: item.id,
		}));
	}, [mode, bots, servers]);

	const firstBot = useMemo(() => (mode === 'bots' ? bots.find((b) => b.id === firstId) || null : null), [mode, bots, firstId]);
	const secondBot = useMemo(() => (mode === 'bots' ? bots.find((b) => b.id === secondId) || null : null), [mode, bots, secondId]);

	const firstServer = useMemo(() => (mode === 'servers' ? servers.find((s) => s.id === firstId) || null : null), [mode, servers, firstId]);
	const secondServer = useMemo(() => (mode === 'servers' ? servers.find((s) => s.id === secondId) || null : null), [mode, servers, secondId]);

	const metricRows = useMemo(() => {
		if (mode === 'bots' && firstBot && secondBot) {
			const aServers = Number(firstBot.stats?.guildCount || 0);
			const bServers = Number(secondBot.stats?.guildCount || 0);
			const aUsers = Number(firstBot.stats?.userCount || 0);
			const bUsers = Number(secondBot.stats?.userCount || 0);
			const aShards = Number(firstBot.stats?.shardCount || 1);
			const bShards = Number(secondBot.stats?.shardCount || 1);
			const aVotes = Number(firstBot.voteCount || 0);
			const bVotes = Number(secondBot.voteCount || 0);
			const aRating = Number(firstBot.reviewAverage || 0);
			const bRating = Number(secondBot.reviewAverage || 0);
			const aCmds = Number(firstBot.commandsCount || 0);
			const bCmds = Number(secondBot.commandsCount || 0);

			return [
				{
					label: t('app.compare.serversCount'),
					valA: aServers.toLocaleString(),
					valB: bServers.toLocaleString(),
					winner: aServers > bServers ? 'a' : bServers > aServers ? 'b' : null,
				},
				{
					label: t('app.compare.usersCount'),
					valA: aUsers.toLocaleString(),
					valB: bUsers.toLocaleString(),
					winner: aUsers > bUsers ? 'a' : bUsers > aUsers ? 'b' : null,
				},
				{
					label: t('app.compare.votesCount'),
					valA: aVotes.toLocaleString(),
					valB: bVotes.toLocaleString(),
					winner: aVotes > bVotes ? 'a' : bVotes > aVotes ? 'b' : null,
				},
				{
					label: t('app.compare.ratingLabel'),
					valA: `${aRating.toFixed(1)} ★ (${firstBot.reviewCount || 0})`,
					valB: `${bRating.toFixed(1)} ★ (${secondBot.reviewCount || 0})`,
					winner: aRating > bRating ? 'a' : bRating > aRating ? 'b' : null,
				},
				{
					label: t('app.compare.commandsCount'),
					valA: aCmds.toLocaleString(),
					valB: bCmds.toLocaleString(),
					winner: aCmds > bCmds ? 'a' : bCmds > aCmds ? 'b' : null,
				},
				{
					label: t('app.compare.shardsCount'),
					valA: aShards.toLocaleString(),
					valB: bShards.toLocaleString(),
					winner: aShards > bShards ? 'a' : bShards > aShards ? 'b' : null,
				},
			];
		}

		if (mode === 'servers' && firstServer && secondServer) {
			const aMembers = Number(firstServer.memberCount || 0);
			const bMembers = Number(secondServer.memberCount || 0);
			const aVotes = Number(firstServer.voteCount || 0);
			const bVotes = Number(secondServer.voteCount || 0);
			const aBoosts = Number(firstServer.boostsCount || 0);
			const bBoosts = Number(secondServer.boostsCount || 0);
			const aBots = Number(firstServer.botsCount || 0);
			const bBots = Number(secondServer.botsCount || 0);
			const aMsgs = Number(firstServer.messagesCount || 0);
			const bMsgs = Number(secondServer.messagesCount || 0);

			return [
				{
					label: t('app.compare.membersCount'),
					valA: aMembers.toLocaleString(),
					valB: bMembers.toLocaleString(),
					winner: aMembers > bMembers ? 'a' : bMembers > aMembers ? 'b' : null,
				},
				{
					label: t('app.compare.votesCount'),
					valA: aVotes.toLocaleString(),
					valB: bVotes.toLocaleString(),
					winner: aVotes > bVotes ? 'a' : bVotes > aVotes ? 'b' : null,
				},
				{
					label: t('app.compare.boostsCount'),
					valA: aBoosts.toLocaleString(),
					valB: bBoosts.toLocaleString(),
					winner: aBoosts > bBoosts ? 'a' : bBoosts > aBoosts ? 'b' : null,
				},
				{
					label: t('app.compare.botsInServer'),
					valA: aBots.toLocaleString(),
					valB: bBots.toLocaleString(),
					winner: aBots > bBots ? 'a' : bBots > aBots ? 'b' : null,
				},
				{
					label: t('app.compare.messagesCount'),
					valA: aMsgs.toLocaleString(),
					valB: bMsgs.toLocaleString(),
					winner: aMsgs > bMsgs ? 'a' : bMsgs > aMsgs ? 'b' : null,
				},
			];
		}

		return [];
	}, [mode, firstBot, secondBot, firstServer, secondServer, t]);

	if (loading) {
		return <Loading />;
	}

	const activeFirst = mode === 'bots' ? firstBot : firstServer;
	const activeSecond = mode === 'bots' ? secondBot : secondServer;

	const renderSummaryCard = (item: BotCompareItem | ServerCompareItem | null) => {
		if (!item) return null;
		const isBot = mode === 'bots';
		const avatarUrl = isBot ? getBotAvatarUrl(item as BotCompareItem) : getServerIconUrl(item as ServerCompareItem);
		const detailHref = isBot ? `/bots/${item.vanitySlug || item.id}` : `/servers/${item.vanitySlug || item.id}`;
		const tags = Array.isArray(item.tags) ? item.tags : [];

		return (
			<div className="flex flex-col justify-between rounded-3xl bg-(--foreground)/40 backdrop-blur-md border border-(--border)/10 p-6 shadow-sm gap-5">
				<div className="flex items-start gap-4">
					<div className="w-16 h-16 rounded-2xl bg-(--background)/60 border border-(--border)/10 flex items-center justify-center overflow-hidden shrink-0">
						{avatarUrl ? (
							<img src={avatarUrl} alt={item.name} className="w-full h-full object-cover" />
						) : isBot ? (
							<Bot className="w-8 h-8 text-(--accent)" />
						) : (
							<Server className="w-8 h-8 text-(--accent)" />
						)}
					</div>
					<div className="flex flex-col min-w-0 flex-1 gap-1">
						<div className="flex items-center gap-2 flex-wrap">
							<h3 className="text-xl font-extrabold text-(--text) truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{item.name}
							</h3>
							{item.verified && (
								<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 px-2.5 py-0.5 text-xs font-bold text-(--accent)">
									<CheckCircle2 className="w-3.5 h-3.5" />
									{t('app.compare.verified')}
								</span>
							)}
						</div>
						<p className="text-sm text-(--text-muted) line-clamp-2">{item.description || '—'}</p>
					</div>
				</div>

				<div className="flex flex-wrap gap-1.5">
					{tags.length > 0 ? (
						tags.slice(0, 6).map((tag) => (
							<span key={tag} className="rounded-full bg-(--background)/60 border border-(--border)/10 px-3 py-1 text-xs font-semibold text-(--text-muted)">
								#{tag}
							</span>
						))
					) : (
						<span className="text-xs text-(--text-muted)/60">{t('app.compare.noTags')}</span>
					)}
				</div>

				<Link
					href={detailHref}
					className="inline-flex items-center justify-center gap-2 rounded-2xl bg-(--accent) hover:bg-(--hover-accent) px-4 py-3 text-sm font-bold text-(--background) transition-all shadow-sm"
				>
					<span>{t('app.compare.viewProfile')}</span>
					<ExternalLink className="w-4 h-4" />
				</Link>
			</div>
		);
	};

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			{/* Top Bar */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex flex-col gap-1.5">
					<Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-(--text-muted) hover:text-(--accent) transition-colors w-fit">
						<ArrowLeft className="w-4 h-4" />
						{t('app.compare.backToExplore')}
					</Link>
					<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-(--text) flex items-center gap-3" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<Scale className="w-8 h-8 text-(--accent)" />
						{t('app.compare.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('app.compare.subtitle')}</p>
				</div>

				<div className="flex items-center gap-2 flex-wrap">
					<div className="flex items-center p-1 bg-(--foreground)/40 backdrop-blur-md rounded-2xl border border-(--border)/10">
						<button
							type="button"
							onClick={() => handleSwitchMode('bots')}
							className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
								mode === 'bots' ? 'bg-(--accent) text-(--background) shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
							}`}
						>
							{t('app.compare.compareBots')}
						</button>
						<button
							type="button"
							onClick={() => handleSwitchMode('servers')}
							className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
								mode === 'servers' ? 'bg-(--accent) text-(--background) shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
							}`}
						>
							{t('app.compare.compareServers')}
						</button>
					</div>

					<Button variant="ghost" onClick={handleCopyShareLink}>
						<Share2 className="w-4 h-4 text-(--accent)" />
						<span className="ml-2 text-xs font-bold">{t('app.compare.shareComparison')}</span>
					</Button>
				</div>
			</div>

			{/* Selector Controls */}
			<div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 p-5 gap-4">
				<Selector value={firstId} onChange={(val) => setFirstId(String(val))} options={options} placeholder={t('app.compare.selectFirst', { type: mode === 'bots' ? 'bot' : 'server' })} />
				<div className="flex justify-center">
					<Button variant="ghost" onClick={handleSwap} title={t('app.compare.swapButton')}>
						<ArrowLeftRight className="w-4 h-4 text-(--accent)" />
					</Button>
				</div>
				<Selector value={secondId} onChange={(val) => setSecondId(String(val))} options={options} placeholder={t('app.compare.selectSecond', { type: mode === 'bots' ? 'bot' : 'server' })} />
			</div>

			{activeFirst && activeSecond ? (
				<>
					{/* Side-by-Side Profile Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
						{renderSummaryCard(activeFirst)}
						{renderSummaryCard(activeSecond)}
					</div>

					{/* Head-to-Head Metrics Table */}
					<div className="flex flex-col rounded-3xl bg-(--foreground)/40 backdrop-blur-md border border-(--border)/10 p-6 gap-4 shadow-sm">
						<h2 className="text-xl font-extrabold text-(--text) flex items-center gap-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
							<Trophy className="w-5 h-5 text-(--accent)" />
							{t('app.compare.metricsHeader')}
						</h2>

						<div className="flex flex-col divide-y divide-(--border)/10">
							{metricRows.map((row) => (
								<div key={row.label} className="grid grid-cols-3 items-center py-4 gap-3">
									<div className="flex items-center gap-2">
										<span className={`text-base font-extrabold ${row.winner === 'a' ? 'text-(--accent)' : 'text-(--text)'}`}>{row.valA}</span>
										{row.winner === 'a' && (
											<span className="rounded-full bg-(--accent)/15 border border-(--accent)/30 px-2 py-0.5 text-[10px] font-bold text-(--accent)">
												{t('app.compare.winnerBadge')}
											</span>
										)}
									</div>

									<div className="text-center text-xs font-bold uppercase tracking-wider text-(--text-muted)">{row.label}</div>

									<div className="flex items-center justify-end gap-2">
										{row.winner === 'b' && (
											<span className="rounded-full bg-(--accent)/15 border border-(--accent)/30 px-2 py-0.5 text-[10px] font-bold text-(--accent)">
												{t('app.compare.winnerBadge')}
											</span>
										)}
										<span className={`text-base font-extrabold ${row.winner === 'b' ? 'text-(--accent)' : 'text-(--text)'}`}>{row.valB}</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</>
			) : (
				<div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-(--foreground)/30 border border-dashed border-(--border)/10 text-center">
					<p className="text-sm font-semibold text-(--text-muted)">{t('app.compare.emptyPrompt')}</p>
				</div>
			)}
		</div>
	);
}
