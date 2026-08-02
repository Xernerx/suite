/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Home, Info, KeyRound, Palette, Smartphone, User } from 'lucide-react';

import Account from '@/components/account/Account';
import Appearance from '@/components/account/Appearance';
import Devices from '@/components/account/Devices';
import Notifications from '@/components/account/Notifications';
import Profile from '@/components/account/Profile';
import Tokens from '@/components/account/Tokens';
import { useEffect } from 'react';
import { useSidebar } from '@/providers/SidebarProvider';

export default function Page() {
	const { setNavItems, clearNavItems, view, setView } = useSidebar();

	useEffect(() => {
		setView('Account');

		setNavItems([
			{ icon: <Home />, label: 'Home', href: '/' },
			{ icon: <User />, label: 'Account', onClick: () => setView('Account'), view: 'Account' },
			{ icon: <Info />, label: 'Profile', onClick: () => setView('Profile'), view: 'Profile' },
			{ icon: <Smartphone />, label: 'Devices', onClick: () => setView('Devices'), view: 'Devices' },
			{ icon: <Palette />, label: 'Appearance', onClick: () => setView('Appearance'), view: 'Appearance' },
			{ icon: <Bell />, label: 'Notifications', onClick: () => setView('Notifications'), view: 'Notifications' },
			{ icon: <KeyRound />, label: 'Tokens', onClick: () => setView('Tokens'), view: 'Tokens' },
		]);

		return () => clearNavItems();
	}, []);

	return (
		<div
			className="flex flex-col w-full"
			style={{
				padding: 'calc(var(--ui-gap) * 2)',
				gap: 'calc(var(--ui-gap) * 2)',
			}}
		>
			{/* HEADER */}
			<div className="flex flex-col" style={{ gap: 4 }}>
				<h1 className="text-xl font-semibold">Account Settings</h1>
				<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
					Manage your account, profile, and preferences.
				</p>
			</div>

			{/* CONTENT */}
			<AnimatePresence mode="wait">
				<motion.div
					key={view}
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -6 }}
					transition={{ duration: 0.15 }}
					className="flex flex-col w-full"
					style={{ gap: 'calc(var(--ui-gap) * 2)' }}
				>
					{view === 'Account' && <Account />}
					{view === 'Profile' && <Profile />}
					{view === 'Devices' && <Devices />}
					{view === 'Appearance' && <Appearance />}
					{view === 'Tokens' && <Tokens />}
					{view === 'Notifications' && <Notifications />}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
