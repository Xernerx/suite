/** @format */
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Bug, Compass, ExternalLink, HelpCircle, LifeBuoy, Loader2, MessageCircle, MessageSquare, UserPlus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useSidebar } from './SidebarProvider';
import { useEnvironment } from './EnvironmentProvider';
import { useDictionary } from './DictionaryProvider';
import { useToast } from './ToastProvider';

const SupportContext = createContext(null);

export function SupportProvider({ children }: { children: React.ReactNode }) {
	const { t } = useDictionary();
	const { data: session } = useSession();
	const { isMobileOpen } = useSidebar();
	const { getEnvUrl, isReady } = useEnvironment();
	const { toast } = useToast();

	const [support, setSupport] = useState(false);
	const [adminServerId, setAdminServerId] = useState('687429190165069838');
	const [isPopoverOpen, setPopoverOpen] = useState(false);
	const [isJoinModalOpen, setJoinModalOpen] = useState(false);
	const [isJoining, setIsJoining] = useState(false);
	const popoverRef = useRef<HTMLDivElement>(null);

	const openDiscordChannel = () => {
		const appUrl = `discord://-/channels/${adminServerId}/1136354838872068186`;
		const webUrl = `https://discord.com/channels/${adminServerId}/1136354838872068186`;
		const start = Date.now();

		window.location.href = appUrl;

		setTimeout(() => {
			if (Date.now() - start < 1500) {
				window.open(webUrl, '_blank');
			}
		}, 1200);
	};

	const handleDiscordAction = () => {
		setPopoverOpen(false);
		if (support) {
			openDiscordChannel();
			return;
		}

		const sessionWithId = session as { user?: { id?: string }; accessToken?: string } | null;
		if (!sessionWithId?.user?.id) {
			const loginBaseUrl = getEnvUrl('https://account.xernerx.com/login');
			const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
			window.location.href = currentUrl ? `${loginBaseUrl}?redirect=${encodeURIComponent(currentUrl)}` : loginBaseUrl;
			return;
		}

		setJoinModalOpen(true);
	};

	const handleConfirmJoinServer = async () => {
		const sessionWithId = session as { user?: { id?: string }; accessToken?: string } | null;
		if (!sessionWithId?.user?.id) return;

		setIsJoining(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/guilds/${adminServerId}/discord/join/${sessionWithId.user.id}`), {
				method: 'PUT',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					accessToken: sessionWithId.accessToken,
				}),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData?.error || `HTTP ${res.status}`);
			}

			setSupport(true);
			setJoinModalOpen(false);
			toast({
				type: 'success',
				title: t('common.supportprovider.joinModal.successTitle'),
				description: t('common.supportprovider.joinModal.successDescription'),
			});
			openDiscordChannel();
		} catch (err: any) {
			toast({
				type: 'error',
				title: t('common.supportprovider.joinModal.errorTitle'),
				description: err.message,
			});
		} finally {
			setIsJoining(false);
		}
	};

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
				setPopoverOpen(false);
			}
		};
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setPopoverOpen(false);
				setJoinModalOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, []);

	useEffect(() => {
		if (!isReady) return;
		(async () => {
			try {
				const sessionWithError = session as {
					accessToken?: string;
				};
				if (!sessionWithError?.accessToken) return;

				let serverId = '687429190165069838';
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

	const quickLinks = [
		{
			label: t('common.supportprovider.links.hub'),
			href: getEnvUrl('https://info.xernerx.com'),
			icon: Compass,
			color: 'text-(--accent)',
		},
		{
			label: t('common.supportprovider.links.reportIssue'),
			href: getEnvUrl('https://info.xernerx.com/issues'),
			icon: Bug,
			color: 'text-red-500',
		},
		{
			label: t('common.supportprovider.links.suggestFeature'),
			href: getEnvUrl('https://info.xernerx.com/suggestions'),
			icon: MessageSquare,
			color: 'text-purple-500',
		},
		{
			label: t('common.supportprovider.links.faq'),
			href: getEnvUrl('https://info.xernerx.com/faq'),
			icon: LifeBuoy,
			color: 'text-green-500',
		},
	];

	return (
		<SupportContext.Provider value={null}>
			{children}

			{!isMobileOpen && (
				<div
					ref={popoverRef}
					className="fixed z-[9999]"
					style={{
						bottom: 'var(--ui-gap)',
						right: 'var(--ui-gap)',
					}}
				>
					<AnimatePresence>
						{isPopoverOpen && (
							<motion.div
								initial={{ opacity: 0, y: 10, scale: 0.95 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: 10, scale: 0.95 }}
								transition={{ duration: 0.16, ease: 'easeOut' }}
								className="absolute bottom-[calc(100%+12px)] right-0 w-72 rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl p-4 flex flex-col gap-3"
							>
								<div className="flex items-center justify-between pb-2.5 border-b border-(--border)/10">
									<div className="flex items-center gap-2.5">
										<div className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--accent)/15 text-(--accent)">
											<HelpCircle size={16} />
										</div>
										<div>
											<h4 className="text-sm font-bold text-(--text)">{t('common.supportprovider.popoverTitle')}</h4>
											<p className="text-[11px] text-(--text-muted)">{t('common.supportprovider.popoverSubtitle')}</p>
										</div>
									</div>
									<button
										type="button"
										onClick={() => setPopoverOpen(false)}
										className="p-1.5 rounded-lg text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition cursor-pointer"
									>
										<X size={14} />
									</button>
								</div>

								<div className="flex flex-col gap-1">
									{quickLinks.map((link, idx) => {
										const IconComp = link.icon;
										return (
											<a
												key={idx}
												href={link.href}
												onClick={() => setPopoverOpen(false)}
												className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-(--text) hover:bg-(--background)/70 transition-colors"
											>
												<div className="flex items-center gap-2.5">
													<IconComp size={15} className={link.color} />
													<span>{link.label}</span>
												</div>
												<ExternalLink size={12} className="text-(--text-muted) opacity-60" />
											</a>
										);
									})}
								</div>

								<button
									type="button"
									onClick={handleDiscordAction}
									className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-(--accent) hover:bg-(--hover-accent) text-white text-xs font-semibold shadow-md transition cursor-pointer"
								>
									{support ? <MessageCircle size={15} /> : <UserPlus size={15} />}
									<span>{support ? t('common.supportprovider.description') : t('common.supportprovider.joinButton')}</span>
								</button>
							</motion.div>
						)}
					</AnimatePresence>

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
					>
						<button
							type="button"
							onClick={() => setPopoverOpen((prev) => !prev)}
							className="group flex h-14 w-14 hover:w-auto cursor-pointer items-center overflow-hidden rounded-full border-none bg-(--accent) text-white shadow-xl transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)"
						>
							<div className="flex h-14 w-14 shrink-0 items-center justify-center">
								<MessageCircle size={24} className="transition-transform duration-500 ease-in-out group-hover:-rotate-360" />
							</div>

							<div className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:max-w-[160px] group-hover:opacity-100 pr-6 text-sm font-medium">
								{support ? t('common.supportprovider.description') : t('common.supportprovider.joinButton')}
							</div>
						</button>
					</motion.div>
				</div>
			)}

			<AnimatePresence>
				{isJoinModalOpen && (
					<div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => !isJoining && setJoinModalOpen(false)}
							className="absolute inset-0 bg-black/60 backdrop-blur-sm"
						/>

						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 15 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 15 }}
							transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
							className="relative w-full max-w-md rounded-3xl bg-(--foreground) border border-(--border)/10 shadow-2xl z-10 p-6 flex flex-col gap-5"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center gap-3">
									<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) shrink-0">
										<UserPlus size={20} />
									</div>
									<div>
										<h3 className="text-lg font-bold text-(--text)">{t('common.supportprovider.joinModal.title')}</h3>
									</div>
								</div>
								<button
									type="button"
									onClick={() => setJoinModalOpen(false)}
									disabled={isJoining}
									className="rounded-lg p-1.5 text-(--text-muted) hover:bg-(--background) hover:text-(--text) transition cursor-pointer"
								>
									<X size={18} />
								</button>
							</div>

							<p className="text-sm text-(--text-muted) leading-relaxed">{t('common.supportprovider.joinModal.description')}</p>

							<div className="flex items-center justify-end gap-3 pt-2 border-t border-(--border)/10">
								<button
									type="button"
									onClick={() => setJoinModalOpen(false)}
									disabled={isJoining}
									className="px-4 py-2 rounded-xl border border-(--border)/15 bg-(--background) text-xs font-semibold text-(--text) hover:bg-(--background)/80 transition cursor-pointer disabled:opacity-50"
								>
									{t('common.buttons.cancel')}
								</button>
								<button
									type="button"
									onClick={handleConfirmJoinServer}
									disabled={isJoining}
									className="flex items-center gap-2 px-4 py-2 rounded-xl bg-(--accent) hover:bg-(--hover-accent) text-white text-xs font-semibold shadow-md transition cursor-pointer disabled:opacity-50"
								>
									{isJoining && <Loader2 size={14} className="animate-spin" />}
									<span>{isJoining ? t('common.supportprovider.joinModal.joining') : t('common.supportprovider.joinModal.confirm')}</span>
								</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</SupportContext.Provider>
	);
}

export function useSupport() {
	return useContext(SupportContext);
}
