/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Computer, DollarSign, KeyRound, Link, Paintbrush, ShieldCheck, User } from 'lucide-react';

import Account from '@/components/Account';
import Appearance from '@/components/Appearance';
import Billing from '@/components/Billing';
import Connections from '@/components/Connections';
import Devices from '@/components/Devices';
import Notifications from '@/components/Notifications';
import Profile from '@/components/Profile';
import Tokens from '@/components/Tokens';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSidebar } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';

// Mapped all your sidebar views to their respective imported component files
const COMPONENT_MAP: Record<string, React.ReactNode> = {
	account: <Account />,
	appearance: <Appearance />,
	billing: <Billing />,
	connections: <Connections />,
	devices: <Devices />,
	notifications: <Notifications />,
	profile: <Profile />,
	tokens: <Tokens />,
};

export default function Home() {
	const { data: session, status } = useSession();
	const { hide, show, setNavItems, view, setView } = useSidebar();

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
			{ category: 'Account', icon: User, label: 'Account', view: 'account', onClick: () => setView('account') },
			{ category: 'Account', icon: ShieldCheck, label: 'Profile', view: 'profile', onClick: () => setView('profile') },
			{ category: 'Account', icon: Link, label: 'Connections', view: 'connections', onClick: () => setView('connections') },
			{ category: 'Account', icon: Computer, label: 'Devices', view: 'devices', onClick: () => setView('devices') },
			{ category: 'Preferences', icon: Paintbrush, label: 'Appearance', view: 'appearance', onClick: () => setView('appearance') },
			{ category: 'Preferences', icon: Bell, label: 'Notifications', view: 'notifications', onClick: () => setView('notifications') },
			{ category: 'Billing', icon: DollarSign, label: 'Billing', view: 'billing', onClick: () => setView('billing') },
			{ category: 'Developer', icon: KeyRound, label: 'Tokens', view: 'tokens', onClick: () => setView('tokens') },
		]);

		// Default to the first available view if none is selected yet
		if (!view) {
			setView('account');
		}
	}, [session, status, hide, show, setNavItems, view, setView]);

	if (!session && status !== 'loading') return redirect('/login');

	if (status === 'loading') return <Loading />;

	const currentView = view || 'account';
	// Fallback safely to Account if an unknown view param slips through
	const ActiveComponent = COMPONENT_MAP[currentView] || <Account />;

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={currentView}
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -8 }}
				transition={{ duration: 0.2, ease: 'easeInOut' }}
				className="flex flex-col w-full">
				{ActiveComponent}
			</motion.div>
		</AnimatePresence>
	);
}
