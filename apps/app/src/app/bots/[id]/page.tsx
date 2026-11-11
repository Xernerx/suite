/** @format */
'use client';

import { Suspense, useEffect, useState, use } from 'react';
import { useDictionary, useEnvironment, useSidebar, useSession } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';
import { User, Activity, Terminal, ArrowLeft, Star, Settings, Trophy, Tag, LayoutDashboard, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import Header from '@/components/bots/Header';
import Profile from '@/components/bots/Profile';
import Stats from '@/components/bots/Stats';
import Commands from '@/components/bots/Commands';
import Reviews from '@/components/bots/Reviews';
import Milestones from '@/components/bots/Milestones';
import Releases from '@/components/bots/Releases';

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
	releases?: any[];
	discord?: any;
	ownersData?: any[];
	isMainOrgBot?: boolean;
	hasSuiteDashboard?: boolean;
	vanitySlug?: string;
}

function BotPageContent({ id }: { id: string }) {
	const { getEnvUrl, isReady } = useEnvironment();
	const { view, setNavItems, show, hide } = useSidebar();
	const { t } = useDictionary();
	const { data: session } = useSession();
	const router = useRouter();
	const searchParams = useSearchParams();

	const [bot, setBot] = useState<BotProfile | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		show();

		const items: any[] = [
			{ label: t('app.bots.id.text16'), href: '/bots', icon: ArrowLeft, category: t('app.portal.categories.navigation') },
			{ label: t('app.bots.tabs.profile'), view: 'profile', icon: User, category: t('app.bots.tabs.categoryBotDetails') },
			{ label: t('app.bots.tabs.statistics'), view: 'stats', icon: Activity, category: t('app.bots.tabs.categoryBotDetails') },
			{ label: t('app.bots.tabs.milestones'), view: 'milestones', icon: Trophy, category: t('app.bots.tabs.categoryBotDetails') },
			{ label: t('app.bots.tabs.commands'), view: 'commands', icon: Terminal, category: t('app.bots.tabs.categoryBotDetails') },
			{ label: t('app.bots.tabs.releases'), view: 'releases', icon: Tag, category: t('app.bots.tabs.categoryBotDetails') },
			{ label: t('app.bots.tabs.reviews'), view: 'reviews', icon: Star, category: t('app.bots.tabs.categoryBotDetails') },
		];

		const uid = (session as any)?.user?.id;
		if (bot && uid && (bot.owners?.includes(uid) || bot.owners?.[0] === uid)) {
			items.push({ label: t('app.bots.tabs.settings'), href: getEnvUrl(`https://portal.xernerx.com/bots/${bot.id}`), icon: Settings, category: t('app.bots.tabs.categoryManagement') });
		}

		setNavItems(items);
		return () => hide();
	}, [setNavItems, show, hide, bot, session, t]);

	useEffect(() => {
		setBot(null);
		setLoading(true);
	}, [id]);

	useEffect(() => {
		if (!bot) return;
		const displayName = bot.discord?.global_name || bot.discord?.username || bot.name;
		if (displayName) {
			const hasBotWord = /\bbot\b/i.test(displayName);
			document.title = `Xernerx App | ${displayName}${bot.verified ? ' ✓' : ''} — ${hasBotWord ? 'Discord App & Commands' : 'Discord Bot'}`;
		}
	}, [bot]);

	useEffect(() => {
		if (!isReady) return;
		const fetchBot = async () => {
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/bots/${id}/profile`));
				if (res.ok) {
					const botData = await res.json();
					const uid = (session as any)?.user?.id;
					const isOwner = Boolean(uid && Array.isArray(botData.owners) && botData.owners.includes(uid));

					if (botData.privacy === 'private' && !isOwner) {
						setBot(null);
						return;
					}

					// Redirect post-invite Discord OAuth2 callbacks to the dedicated onboarding page
					const skipOnboarding = searchParams.get('skipOnboarding') === '1';
					const hasInviteParams = Boolean(searchParams.get('guild_id') || searchParams.get('code') || searchParams.get('onboarding') === '1');
					if (!skipOnboarding && hasInviteParams) {
						const onboardingQuery = new URLSearchParams();
						const guildId = searchParams.get('guild_id');
						const perms = searchParams.get('permissions');
						const tour = searchParams.get('tour');
						if (guildId) onboardingQuery.set('guild_id', guildId);
						if (perms) onboardingQuery.set('permissions', perms);
						if (tour) onboardingQuery.set('tour', tour);
						const qs = onboardingQuery.toString();
						router.replace(`/bots/${botData.vanitySlug || id}/onboarding${qs ? `?${qs}` : ''}`);
						return;
					}

					const targetSnowflake = botData.id || id;
					if (!botData.discord || (!botData.discord.username && !botData.discord.global_name)) {
						try {
							const discordRes = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${targetSnowflake}/discord`));
							if (discordRes.ok) {
								botData.discord = await discordRes.json();
							}
						} catch {
							// Ignore discord fetch failure
						}
					}

					if (Array.isArray(botData.owners) && botData.owners.length > 0 && (!botData.ownersData || botData.ownersData.length === 0)) {
						const ownersData = await Promise.all(
							botData.owners.map(async (ownerId: string) => {
								try {
									const oRes = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${ownerId}/discord`));
									if (oRes.ok) return await oRes.json();
								} catch {
									// Ignore individual owner lookup failure
								}
								return null;
							})
						);
						botData.ownersData = ownersData.filter(Boolean);
					}

					setBot(botData);
				}
			} catch (error) {
				console.error('Failed to fetch bot profile', error);
			} finally {
				setLoading(false);
			}
		};
		fetchBot();
	}, [id, getEnvUrl, isReady, session]);

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
				<h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('app.bots.id.text1')}
				</h1>
				<p className="text-(--text-muted) mb-8">{t('app.bots.id.text2')}</p>
				<Link href="/bots">
					<Button variant="primary">{t('app.bots.id.text3')}</Button>
				</Link>
			</div>
		);
	}

	const currentView = view || 'profile';
	const resolvedBotId = bot.id || id;
	const isVirtueBot = resolvedBotId === '1484880634844287138' || String(bot.vanitySlug || id).toLowerCase() === 'virtue';
	const hasBotDashboard = Boolean(bot.isMainOrgBot && (isVirtueBot || bot.hasSuiteDashboard || bot.links?.dashboard));
	const botDisplayName = bot.discord?.global_name || bot.discord?.username || bot.name || id;
	const dashboardHref = isVirtueBot ? '/dashboard?tab=virtue' : bot.links?.dashboard || '/dashboard';

	return (
		<div className="flex flex-col w-full max-w-(--page-width) mx-auto min-h-screen pb-24">
			<Header bot={bot} id={resolvedBotId} setBot={setBot} />

			{hasBotDashboard && (
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl bg-(--foreground)/40 border border-(--accent)/35 backdrop-blur-md shadow-sm mb-4"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex items-start sm:items-center gap-3.5">
						<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
							<LayoutDashboard className="w-5 h-5" />
						</div>
						<div>
							<h2 className="text-base font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('app.bots.onboarding.banner.title', { name: botDisplayName })}
							</h2>
							<p className="text-xs text-(--text-muted) mt-0.5">
								{t(isVirtueBot ? 'app.bots.onboarding.banner.subtitle' : 'app.bots.onboarding.banner.genericSubtitle', { name: botDisplayName })}
							</p>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2 shrink-0">
						<Link href={`/bots/${bot.vanitySlug || id}/onboarding`}>
							<Button variant="secondary" className="gap-1.5 text-xs">
								<Sparkles className="w-3.5 h-3.5 text-(--accent)" />
								<span>{t('app.bots.onboarding.banner.setupGuideBtn')}</span>
							</Button>
						</Link>
						<Link href={dashboardHref}>
							<Button variant="primary" className="gap-1.5 text-xs">
								<LayoutDashboard className="w-3.5 h-3.5" />
								<span>{t('app.bots.onboarding.banner.openDashboardBtn')}</span>
							</Button>
						</Link>
					</div>
				</div>
			)}

			<div className="mt-4">
				{currentView === 'profile' && <Profile bot={bot} />}
				{currentView === 'stats' && <Stats bot={bot} id={resolvedBotId} />}
				{currentView === 'milestones' && <Milestones bot={bot} id={resolvedBotId} />}
				{currentView === 'commands' && <Commands bot={bot} />}
				{currentView === 'releases' && <Releases bot={bot} id={resolvedBotId} />}
				{currentView === 'reviews' && <Reviews bot={bot} id={resolvedBotId} />}
			</div>
		</div>
	);
}

export default function BotPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	return (
		<Suspense
			fallback={
				<div className="flex-1 flex items-center justify-center min-h-screen">
					<Loading />
				</div>
			}
		>
			<BotPageContent id={id} />
		</Suspense>
	);
}
