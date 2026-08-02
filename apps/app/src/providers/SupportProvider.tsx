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
			const response = await fetch('/api/v1/discord/guilds').then((res) => res.json());

			const guild = response.guilds?.find((g) => g.id === '687429190165069838');

			if (session) setSupport(!!guild);
		})();
	}, [session]);

	return (
		<SupportContext.Provider value={null}>
			{children}

			{support && (
				<motion.button
					onClick={handleClick}
					initial={{ scale: 0, opacity: 0, width: 56 }}
					animate={{ scale: 1, opacity: 1 }}
					whileHover="hover"
					whileTap={{ scale: 0.95 }}
					variants={{
						hover: { width: 200 },
					}}
					transition={{ type: 'spring', stiffness: 260, damping: 20 }}
					style={{
						position: 'fixed',
						bottom: '24px',
						right: '24px',
						zIndex: 9999,
						height: '56px',
						borderRadius: '9999px',
						background: 'var(--accent)',
						color: 'white',
						border: 'none',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						padding: 0,
						boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
						overflow: 'hidden',
					}}
				>
					{/* ICON "WHEEL" */}
					<motion.div
						variants={{
							hover: {
								rotate: [0, -180, -360],
							},
						}}
						transition={{
							x: { type: 'spring', stiffness: 400, damping: 18 },
							rotate: { duration: 0.5, ease: 'easeInOut' },
						}}
						style={{
							width: 56,
							height: 56,
							minWidth: 56,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<MessageCircle size={24} />
					</motion.div>

					{/* TEXT CONTAINER */}
					<motion.div
						variants={{
							hover: { opacity: 1, x: 0 },
						}}
						initial={{ opacity: 0, x: 20 }}
						transition={{ duration: 0.25, delay: 0.1 }}
						style={{
							whiteSpace: 'nowrap',
							fontSize: '14px',
							fontWeight: 500,
						}}
					>
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
