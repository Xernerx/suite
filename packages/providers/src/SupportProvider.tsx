/** @format */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

const SupportContext = createContext(null);

export function SupportProvider({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession();

	const [support, setSupport] = useState(false);

	const handleClick = () => {
		const appUrl = 'discord://-/channels/687429190165069838/1136354838872068186';
		const webUrl = 'https://discord.com/channels/687429190165069838/1136354838872068186';

		const start = Date.now();

		// Try opening app
		window.location.href = appUrl;

		// Fallback after delay
		setTimeout(() => {
			if (Date.now() - start < 1500) {
				window.open(webUrl, '_blank');
			}
		}, 1200);
	};

	useEffect(() => {
		(async () => {
			try {
				const sessionWithError = session as { accessToken?: string };
				if (!sessionWithError?.accessToken) return;

				// Call Discord API directly to get the user's guild list
				const guilds = await fetch('https://discord.com/api/v10/users/@me/guilds', {
					headers: { Authorization: `Bearer ${sessionWithError.accessToken}` },
				}).then((res) => res.json());

				if (Array.isArray(guilds)) {
					const guild = guilds.find((g: any) => g.id === '687429190165069838');
					setSupport(!!guild);
				}
			} catch (error) {
				console.error('Failed to fetch Discord guilds:', error);
			}
		})();
	}, [session]);

	return (
		<SupportContext.Provider value={null}>
			{children}

			{support && (
				<motion.div
					initial={{ scale: 0, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ type: 'spring', stiffness: 260, damping: 20 }}
					className='fixed z-[9999]'
					style={{ bottom: 'var(--ui-gap)', right: 'var(--ui-gap)' }}>
					<button
						onClick={handleClick}
						className='group flex h-14 w-14 hover:w-auto cursor-pointer items-center overflow-hidden rounded-full border-none bg-(--accent) text-white shadow-xl transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)'>
						<div className='flex h-14 w-14 shrink-0 items-center justify-center'>
							<MessageCircle size={24} className='transition-transform duration-500 ease-in-out group-hover:-rotate-360' />
						</div>

						<div className='max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:max-w-[150px] group-hover:opacity-100 pr-6 text-sm font-medium'>
							Get Support
						</div>
					</button>
				</motion.div>
			)}
		</SupportContext.Provider>
	);
}

export function useSupport() {
	return useContext(SupportContext);
}
