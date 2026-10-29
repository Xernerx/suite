/** @format */
'use client';

import { useEffect, useState, use } from 'react';
import { useDictionary, useEnvironment, useSidebar, useSession } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';
import { User, Activity, Terminal, ArrowLeft, Star, Settings, Trophy, Tag } from 'lucide-react';
import Link from 'next/link';

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
}

export default function BotPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const { getEnvUrl, isReady } = useEnvironment();
	const { view, setNavItems, show, hide } = useSidebar();
	const { t } = useDictionary();
	const { data: session } = useSession();

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

					const targetSnowflake = botData.id || id;
					try {
						const discordRes = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${targetSnowflake}/discord`));
						if (discordRes.ok) {
							botData.discord = await discordRes.json();
						}
					} catch {
						// Ignore discord fetch failure
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
				<h1 className="sr-only">{t('app.bots.nav.botProfile')}</h1>
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

	return (
		<div className="flex flex-col w-full max-w-(--page-width) mx-auto min-h-screen pb-24">
			<Header bot={bot} id={resolvedBotId} setBot={setBot} />

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
