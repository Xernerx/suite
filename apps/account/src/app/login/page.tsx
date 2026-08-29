/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { signIn, useDictionary, useSession, useSidebar } from '@xernerx/providers';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Banner from '@/../public/banner.svg';
import { Button } from '@xernerx/ui';
function SignInContent() {
	const { t } = useDictionary();
	const { data: session, status } = useSession();
	const { hide } = useSidebar();
	const searchParams = useSearchParams();
	const redirectUrl = searchParams.get('redirect') || '/';
	const [loading, setLoading] = useState(false);
	const [about, setAbout] = useState<boolean>(false);
	async function handleLogin() {
		setLoading(true);
		await signIn('discord', {
			callbackUrl: redirectUrl,
		});
	}
	useEffect(() => {
		hide();
	}, [hide]);
	useEffect(() => {
		if (status === 'authenticated' && session) window.location.replace(redirectUrl);
	}, [session, status, redirectUrl]);
	return (
		<div className="flex h-full min-h-screen items-center justify-center px-6">
			<AnimatePresence>
				<motion.div
					initial={{
						opacity: 0,
						scale: 0.96,
						y: 12,
					}}
					animate={{
						opacity: 1,
						scale: 1,
						y: 0,
					}}
					transition={{
						duration: 0.28,
						ease: [0.22, 1, 0.36, 1],
					}}
					className="flex w-full flex-col items-center gap-6 text-center"
				>
					{/* LOGO */}
					<div className="m-4 flex flex-col items-center">
						<Banner className="h-auto w-48 text-(--accent) md:w-56" />
					</div>

					{/* LOGIN BUTTON */}
					<Button
						variant="primary"
						size="lg"
						onClick={handleLogin}
						isLoading={loading}
						className="w-full max-w-65 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_50%,transparent)] transition-all"
					>
						{loading ? t('account.signin.redirecting') : t('account.signin.button')}
					</Button>

					{/* ABOUT TOGGLE */}
					<button
						onClick={() => setAbout(!about)}
						className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-(--text-muted) transition-colors hover:text-(--text)"
					>
						{t('account.signin.aboutToggle')}
						{about ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
					</button>

					{/* PERMISSIONS PANEL */}
					<AnimatePresence>
						{about && (
							<motion.div
								initial={{
									opacity: 0,
									height: 0,
									y: -10,
								}}
								animate={{
									opacity: 1,
									height: 'auto',
									y: 0,
								}}
								exit={{
									opacity: 0,
									height: 0,
									y: -10,
								}}
								transition={{
									duration: 0.25,
									ease: 'easeInOut',
								}}
								className="w-full max-w-md overflow-hidden"
							>
								<div className="mt-2 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md p-6 text-left shadow-xl">
									<div className="flex flex-col gap-4">
										<div className="flex flex-col gap-0.5">
											<h3 className="text-sm font-medium text-(--text)">{t('account.signin.permissions.profile.title')}</h3>
											<p className="text-xs text-(--text-muted)">{t('account.signin.permissions.profile.description')}</p>
										</div>

										<div className="flex flex-col gap-0.5">
											<h3 className="text-sm font-medium text-(--text)">{t('account.signin.permissions.email.title')}</h3>
											<p className="text-xs text-(--text-muted)">{t('account.signin.permissions.email.description')}</p>
										</div>

										<div className="flex flex-col gap-0.5">
											<h3 className="text-sm font-medium text-(--text)">{t('account.signin.permissions.connections.title')}</h3>
											<p className="text-xs text-(--text-muted)">{t('account.signin.permissions.connections.description')}</p>
										</div>

										<div className="flex flex-col gap-0.5">
											<h3 className="text-sm font-medium text-(--text)">{t('account.signin.permissions.joinServers.title')}</h3>
											<p className="text-xs text-(--text-muted)">{t('account.signin.permissions.joinServers.description')}</p>
										</div>

										<div className="flex flex-col gap-0.5">
											<h3 className="text-sm font-medium text-(--text)">{t('account.signin.permissions.servers.title')}</h3>
											<p className="text-xs text-(--text-muted)">{t('account.signin.permissions.servers.description')}</p>
										</div>

										<div className="flex flex-col gap-0.5">
											<h3 className="text-sm font-medium text-(--text)">{t('account.signin.permissions.memberInfo.title')}</h3>
											<p className="text-xs text-(--text-muted)">{t('account.signin.permissions.memberInfo.description')}</p>
										</div>

										{/* DIVIDER */}
										<div className="mt-2 border-t border-(--border)/10 pt-4 text-xs leading-relaxed text-(--text-muted)">{t('account.signin.permissions.footer')}</div>
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
export default function SignInPage() {
	const { t } = useDictionary();
	return (
		<Suspense fallback={<div className="flex h-screen items-center justify-center">{t('account.login.description')}</div>}>
			<SignInContent />
		</Suspense>
	);
}
