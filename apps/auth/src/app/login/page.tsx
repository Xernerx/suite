/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useDictionary, useSidebar } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import Banner from '@/../public/banner.svg';
import { Button } from '@xernerx/ui';

export default function SignInPage() {
	const { data: session, status } = useSession() || {};
	const { hide } = useSidebar();
	const { t } = useDictionary();

	const [loading, setLoading] = useState(false);
	const [about, setAbout] = useState<boolean>(false);

	async function handleLogin() {
		setLoading(true);
		await signIn('discord', { callbackUrl: '/' });
	}

	useEffect(() => {
		hide();
	}, [hide]);

	useEffect(() => {
		if (status === 'authenticated' && session) window.location.replace('/');
	}, [session, status]);

	return (
		<div
			className="flex h-full min-h-screen items-center justify-center"
			style={{ padding: 'var(--ui-gap)', fontSize: 'var(--text-scale, 14px)' }}
		>
			<AnimatePresence>
				<motion.div
					initial={{ opacity: 0, scale: 0.96, y: 12 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
					className="flex w-full flex-col items-center text-center"
					style={{ gap: 'var(--ui-gap)' }}
				>
					{/* LOGO */}
					<div className="flex flex-col items-center" style={{ margin: 'var(--ui-gap)' }}>
						<Banner className="h-auto w-48 text-(--accent) md:w-56" />
					</div>

					{/* LOGIN BUTTON */}
					<Button
						variant="primary"
						size="lg"
						onClick={handleLogin}
						isLoading={loading}
						className="w-full max-w-65 shadow-[0_10px_30px_var(--color-accent-hover)]"
					>
						{loading
							? t('auth.signin.redirecting', {}, 'Redirecting…')
							: t('auth.signin.button', {}, 'Continue with Discord')}
					</Button>

					{/* ABOUT TOGGLE */}
					<button
						onClick={() => setAbout(!about)}
						className="flex items-center text-xs font-semibold uppercase tracking-wide text-(--text-muted) transition-colors hover:text-(--text)"
						style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}
					>
						{t('auth.signin.aboutToggle', {}, 'About permissions')}
						{about ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
					</button>

					{/* PERMISSIONS PANEL */}
					<AnimatePresence>
						{about && (
							<motion.div
								initial={{ opacity: 0, height: 0, y: -10 }}
								animate={{ opacity: 1, height: 'auto', y: 0 }}
								exit={{ opacity: 0, height: 0, y: -10 }}
								transition={{ duration: 0.25, ease: 'easeInOut' }}
								className="w-full max-w-md overflow-hidden"
							>
								<div
									className="rounded-2xl border border-(--border)/10 bg-(--foreground) text-left shadow-xl"
									style={{
										marginTop: 'calc(var(--ui-gap) * 0.5)',
										padding: 'var(--ui-gap)',
									}}
								>
									<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
										<div
											className="flex flex-col"
											style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}
										>
											<h3 className="text-sm font-medium text-(--text)">
												{t('auth.signin.permissions.profile.title')}
											</h3>
											<p className="text-xs text-(--text-muted)">
												{t('auth.signin.permissions.profile.description')}
											</p>
										</div>

										<div
											className="flex flex-col"
											style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}
										>
											<h3 className="text-sm font-medium text-(--text)">
												{t('auth.signin.permissions.email.title')}
											</h3>
											<p className="text-xs text-(--text-muted)">
												{t('auth.signin.permissions.email.description')}
											</p>
										</div>

										<div
											className="flex flex-col"
											style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}
										>
											<h3 className="text-sm font-medium text-(--text)">
												{t('auth.signin.permissions.connections.title')}
											</h3>
											<p className="text-xs text-(--text-muted)">
												{t(
													'auth.signin.permissions.connections.description'
												)}
											</p>
										</div>

										<div
											className="flex flex-col"
											style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}
										>
											<h3 className="text-sm font-medium text-(--text)">
												{t('auth.signin.permissions.joinServers.title')}
											</h3>
											<p className="text-xs text-(--text-muted)">
												{t(
													'auth.signin.permissions.joinServers.description'
												)}
											</p>
										</div>

										<div
											className="flex flex-col"
											style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}
										>
											<h3 className="text-sm font-medium text-(--text)">
												{t('auth.signin.permissions.servers.title')}
											</h3>
											<p className="text-xs text-(--text-muted)">
												{t('auth.signin.permissions.servers.description')}
											</p>
										</div>

										<div
											className="flex flex-col"
											style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}
										>
											<h3 className="text-sm font-medium text-(--text)">
												{t('auth.signin.permissions.memberInfo.title')}
											</h3>
											<p className="text-xs text-(--text-muted)">
												{t(
													'auth.signin.permissions.memberInfo.description'
												)}
											</p>
										</div>

										{/* DIVIDER */}
										<div
											className="border-t border-(--border)/10 text-xs leading-relaxed text-(--text-muted)"
											style={{
												marginTop: 'calc(var(--ui-gap) * 0.5)',
												paddingTop: 'var(--ui-gap)',
											}}
										>
											{t('auth.signin.permissions.footer')}
										</div>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
