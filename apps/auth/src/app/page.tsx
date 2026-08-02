/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
	Bell,
	Computer,
	DollarSign,
	Globe,
	KeyRound,
	Link,
	Paintbrush,
	ShieldCheck,
	User,
} from 'lucide-react';

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
import { useDictionary } from '@xernerx/providers';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSidebar } from '@xernerx/providers';

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
				category: t('common.nav.categories.account', {}, 'Account'),
				icon: User,
				label: t('common.nav.items.account', {}, 'Account'),
				view: 'account',
				onClick: () => setView('account'),
			},
			{
				category: t('common.nav.categories.account', {}, 'Account'),
				icon: ShieldCheck,
				label: t('common.nav.items.profile', {}, 'Profile'),
				view: 'profile',
				onClick: () => setView('profile'),
			},
			{
				category: t('common.nav.categories.account', {}, 'Account'),
				icon: Link,
				label: t('common.nav.items.connections', {}, 'Connections'),
				view: 'connections',
				onClick: () => setView('connections'),
			},
			{
				category: t('common.nav.categories.account', {}, 'Account'),
				icon: Computer,
				label: t('common.nav.items.devices', {}, 'Devices'),
				view: 'devices',
				onClick: () => setView('devices'),
			},
			{
				category: t('common.nav.categories.preferences', {}, 'Preferences'),
				icon: Paintbrush,
				label: t('common.nav.items.appearance', {}, 'Appearance'),
				view: 'appearance',
				onClick: () => setView('appearance'),
			},
			{
				category: t('common.nav.categories.preferences', {}, 'Preferences'),
				icon: Globe,
				label: t('common.nav.items.language', {}, 'Language'),
				view: 'language',
				onClick: () => setView('language'),
			},
			{
				category: t('common.nav.categories.preferences', {}, 'Preferences'),
				icon: Bell,
				label: t('common.nav.items.notifications', {}, 'Notifications'),
				view: 'notifications',
				onClick: () => setView('notifications'),
			},
			{
				category: t('common.nav.categories.billing', {}, 'Billing'),
				icon: DollarSign,
				label: t('common.nav.items.billing', {}, 'Billing'),
				view: 'billing',
				onClick: () => setView('billing'),
			},
			{
				category: t('common.nav.categories.developer', {}, 'Developer'),
				icon: KeyRound,
				label: t('common.nav.items.tokens', {}, 'Tokens'),
				view: 'tokens',
				onClick: () => setView('tokens'),
			},
		]);

		if (!view) setView('account');
	}, [session, status, hide, show, setNavItems, view, setView, t]);

	if (!session && status !== 'loading') return redirect('/login');

	if (status === 'loading') return <Loading />;

	const currentView = view || 'account';
	const ActiveComponent = COMPONENT_MAP[currentView] || <Account />;

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
