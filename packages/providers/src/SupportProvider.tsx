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
			// If user is still here, assume app didn't open
			if (Date.now() - start < 1500) {
				window.open(webUrl, '_blank');
			}
		}, 1200);
	};

	useEffect(() => {
		(async () => {
			try {
				const response = await fetch('/api/v1/discord/guilds').then((res) => res.json());
				const guild = response.guilds?.find((g: any) => g.id === '687429190165069838');
				if (session) setSupport(!!guild);
			} catch {}
		})();
	}, [session]);

	return (
		<SupportContext.Provider value={null}>
			{children}

			{support && (
				<motion.button
					onClick={handleClick}
					// Keep width in Framer Motion since it needs to animate dynamically
					initial={{ scale: 0, opacity: 0, width: 56 }}
					animate={{ scale: 1, opacity: 1 }}
					whileHover='hover'
					whileTap={{ scale: 0.95 }}
					variants={{
						hover: { width: 170 }, // Width expanded to fit the text + padding
					}}
					transition={{ type: 'spring', stiffness: 260, damping: 20 }}
					// Translated all inline styles to Tailwind classes
					className='fixed bottom-6 right-6 z-[9999] flex h-14 cursor-pointer items-center overflow-hidden rounded-full border-none bg-(--accent) text-white shadow-xl transition-colors hover:bg-(--accent-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)'>
					{/* ICON "WHEEL" */}
					<motion.div
						variants={{
							hover: {
								rotate: [0, -180, -360],
							},
						}}
						transition={{
							rotate: { duration: 0.5, ease: 'easeInOut' },
						}}
						// shrink-0 prevents the icon container from getting squished during the spring animation
						className='flex h-14 w-14 shrink-0 items-center justify-center'>
						<MessageCircle size={24} />
					</motion.div>

					{/* TEXT CONTAINER */}
					<motion.div
						variants={{
							hover: { opacity: 1, x: 0 },
						}}
						initial={{ opacity: 0, x: 20 }}
						transition={{ duration: 0.25, delay: 0.1 }}
						className='whitespace-nowrap pr-6 text-sm font-medium'>
						Get Support
					</motion.div>
				</motion.button>
			)}
		</SupportContext.Provider>
	);
}

export function useSupport() {
	return useContext(SupportContext);
}
