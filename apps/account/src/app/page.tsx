/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Computer, DollarSign, Globe, KeyRound, Link, Paintbrush, ShieldCheck, Store, User } from 'lucide-react';
import { useDictionary, useSession, useSidebar } from '@xernerx/providers';

import Account from '@/components/Account';
import Appearance from '@/components/Appearance';
import Billing from '@/components/Billing';
import Connections from '@/components/Connections';
import Devices from '@/components/Devices';
import Language from '@/components/Language';
import { Loading } from '@xernerx/feedback';
import Notifications from '@/components/Notifications';
import Profile from '@/components/Profile';
import Tokens from '@/components/Tokens';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

const COMPONENT_MAP: Record<string, React.ReactNode> = {
	account: <Account />,
	appearance: <Appearance />,
	billing: <Billing />,
	connections: <Connections />,
	devices: <Devices />,
	language: <Language />,
	notifications: <Notifications />,
	profile: <Profile />,
	tokens: <Tokens />,
};

export default function Home() {
	const { data: session, status } = useSession();
	const { hide, show, setNavItems, view, setView } = useSidebar();
	const { t } = useDictionary();

	useEffect(() => {
		hide();
	}, [hide]);

	useEffect(() => {
		if (status === 'loading') return;

		if (!session) {
			hide();
			return;
		}

		show();

		setNavItems([
			{
				category: t('common.nav.categories.account'),
				icon: ShieldCheck,
				label: t('common.nav.items.profile'),
				view: 'profile',
			},
			{
				category: t('common.nav.categories.account'),
				icon: User,
				label: t('common.nav.items.account'),
				view: 'account',
			},
			// { // todo
			// 	category: t('common.nav.categories.account'),
			// 	icon: Link,
			// 	label: t('common.nav.items.connections'),
			// 	view: 'connections',
			// },
			// { // todo
			// 	category: t('common.nav.categories.account'),
			// 	icon: Computer,
			// 	label: t('common.nav.items.devices'),
			// 	view: 'devices',
			// },
			{
				category: t('common.nav.categories.preferences'),
				icon: Paintbrush,
				label: t('common.nav.items.appearance'),
				view: 'appearance',
			},
			{
				category: t('common.nav.categories.preferences'),
				icon: Globe,
				label: t('common.nav.items.language'),
				view: 'language',
			},
			{
				category: t('common.nav.categories.preferences'),
				icon: Bell,
				label: t('common.nav.items.notifications'),
				view: 'notifications',
			},
			{
				category: t('common.nav.categories.billing'),
				icon: Store,
				label: t('common.nav.items.store'),
				view: 'store',
				href: '/store',
			},
			{
				category: t('common.nav.categories.billing'),
				icon: DollarSign,
				label: t('common.nav.items.billing'),
				view: 'billing',
			},
			{
				category: t('common.nav.categories.developer'),
				icon: KeyRound,
				label: t('common.nav.items.tokens'),
				view: 'tokens',
			},
		]);

		if (!view) setView('profile');
	}, [session, status, hide, show, setNavItems, view, setView, t]);

	if (!session && status !== 'loading') return redirect('/login');

	if (status === 'loading') return <Loading />;

	const currentView = view || 'profile';
	const ActiveComponent = COMPONENT_MAP[currentView] || null;

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={currentView}
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -8 }}
				transition={{ duration: 0.2, ease: 'easeInOut' }}
				className="flex flex-col w-full"
			>
				{ActiveComponent}
			</motion.div>
		</AnimatePresence>
	);
}
