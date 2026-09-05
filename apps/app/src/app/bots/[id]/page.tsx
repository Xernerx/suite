/** @format */
'use client';

import { useEffect, useState, use } from 'react';
import { useDictionary, useEnvironment, useSidebar, useSession } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';
import { User, Activity, Terminal, ArrowLeft, Star, Settings } from 'lucide-react';
import Link from 'next/link';

import Header from './components/Header';
import Profile from './components/Profile';
import Stats from './components/Stats';
import Commands from './components/Commands';
import Reviews from './components/Reviews';

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
	const { data: session } = useSession();

	const [bot, setBot] = useState<BotProfile | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		show();

		const items: any[] = [
			{ label: 'Back to Bots', href: '/bots', icon: ArrowLeft, category: 'Navigation' },
			{ label: 'Profile', view: 'profile', icon: User, category: 'Bot Details' },
			{ label: 'Statistics', view: 'stats', icon: Activity, category: 'Bot Details' },
			{ label: 'Commands', view: 'commands', icon: Terminal, category: 'Bot Details' },
			{ label: 'Reviews', view: 'reviews', icon: Star, category: 'Bot Details' },
		];

		const uid = (session as any)?.user?.id;
		if (bot && uid && (bot.owners?.includes(uid) || bot.owners?.[0] === uid)) {
			items.push({ label: 'Settings', href: `/portal/bots/${bot.id}`, icon: Settings, category: 'Management' });
		}

		setNavItems(items);
		return () => hide();
	}, [setNavItems, show, hide, bot, session]);

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

	return (
		<div className="flex flex-col w-full min-h-screen pb-24">
			<Header bot={bot} id={id} setBot={setBot} />

			<div className="mt-4">
				{currentView === 'profile' && <Profile bot={bot} />}
				{currentView === 'stats' && <Stats bot={bot} id={id} />}
				{currentView === 'commands' && <Commands bot={bot} />}
				{currentView === 'reviews' && <Reviews bot={bot} id={id} />}
			</div>
		</div>
	);
}
