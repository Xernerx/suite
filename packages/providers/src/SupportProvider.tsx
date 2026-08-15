/** @format */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useSidebar } from './SidebarProvider';
import { useEnvironment } from './EnvironmentProvider';
import { useDictionary } from '@xernerx/providers';
const SupportContext = createContext(null);
export function SupportProvider({ children }: { children: React.ReactNode }) {
	const { t } = useDictionary();
	const { data: session } = useSession();
	const { isMobileOpen } = useSidebar();
	const { getEnvUrl, isReady } = useEnvironment();
	const [support, setSupport] = useState(false);
	const [adminServerId, setAdminServerId] = useState('687429190165069838'); // Fallback

	const handleClick = () => {
		const appUrl = `discord://-/channels/${adminServerId}/1136354838872068186`;
		const webUrl = `https://discord.com/channels/${adminServerId}/1136354838872068186`;
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
		if (!isReady) return;
		(async () => {
			try {
				const sessionWithError = session as {
					accessToken?: string;
				};
				if (!sessionWithError?.accessToken) return;

				// Fetch admin_server_id first
				let serverId = '687429190165069838'; // Default fallback
				try {
					const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/core/settings/admin_server_id'), {
						credentials: 'include',
					});
					if (res.ok) {
						const data = await res.json();
						if (data?.data?.value) {
							serverId = data.data.value;
							setAdminServerId(serverId);
						}
					}
				} catch (err) {
					console.warn('Failed to fetch admin_server_id setting:', err);
				}
				const sessionWithId = session as {
					user?: {
						id?: string;
					};
					accessToken?: string;
				};
				if (!sessionWithId?.user?.id || !sessionWithId?.accessToken) return;

				// Call via our proxy to avoid CORS issues
				const guildsUrl = getEnvUrl(`https://api.xernerx.com/core/users/${sessionWithId.user.id}/discord/guilds`);
				const guilds = await fetch(guildsUrl, {
					headers: {
						Authorization: `Bearer ${sessionWithId.accessToken}`,
					},
				}).then((res) => res.json());
				if (Array.isArray(guilds)) {
					const guild = guilds.find((g: any) => g.id === serverId);
					setSupport(!!guild);
				}
			} catch (error) {
				console.warn('Failed to fetch Discord guilds:', error);
			}
		})();
	}, [session, isReady, getEnvUrl]);
	return (
		<SupportContext.Provider value={null}>
			{children}

			{support && !isMobileOpen && (
				<motion.div
					initial={{
						scale: 0,
						opacity: 0,
					}}
					animate={{
						scale: 1,
						opacity: 1,
					}}
					transition={{
						type: 'spring',
						stiffness: 260,
						damping: 20,
					}}
					className="fixed z-[9999]"
					style={{
						bottom: 'var(--ui-gap)',
						right: 'var(--ui-gap)',
					}}
				>
					<button
						onClick={handleClick}
						className="group flex h-14 w-14 hover:w-auto cursor-pointer items-center overflow-hidden rounded-full border-none bg-(--accent) text-white shadow-xl transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)"
					>
						<div className="flex h-14 w-14 shrink-0 items-center justify-center">
							<MessageCircle size={24} className="transition-transform duration-500 ease-in-out group-hover:-rotate-360" />
						</div>

						<div className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:max-w-[150px] group-hover:opacity-100 pr-6 text-sm font-medium">
							{t('common.supportprovider.description')}
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
