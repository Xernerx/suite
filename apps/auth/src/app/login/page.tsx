/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import Banner from '@/../public/banner.svg';
import { Button } from '@xernerx/ui';
import { useSidebar } from '@xernerx/providers';

export default function SignInPage() {
	const { data: session, status } = useSession();
	const { hide } = useSidebar();

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
		<div className='flex h-full min-h-screen items-center justify-center px-6'>
			<AnimatePresence>
				<motion.div
					initial={{ opacity: 0, scale: 0.96, y: 12 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
					className='flex w-full flex-col items-center gap-6 text-center'>
					{/* LOGO */}
					<div className='m-4 flex flex-col items-center'>
						<Banner className='h-auto w-48 text-accent md:w-56' />
					</div>

					{/* LOGIN BUTTON */}
					<Button
						variant='primary'
						size='lg'
						onClick={handleLogin}
						isLoading={loading}
						// We pass the custom width and glowing shadow via className
						className='w-full max-w-65 shadow-[0_10px_30px_var(--color-accent-hover)]'>
						{loading ? 'Redirecting…' : 'Continue with Discord'}
					</Button>

					{/* ABOUT TOGGLE */}
					<button onClick={() => setAbout(!about)} className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-(--text-muted) transition-colors hover:text-(--text)'>
						About permissions
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
								className='w-full max-w-md overflow-hidden'>
								{/* Applied border-(--border)/10 rule here */}
								<div className='mt-2 rounded-2xl border border-(--border)/10 bg-(--foreground) p-6 text-left shadow-xl'>
									<div className='flex flex-col gap-4'>
										<div className='flex flex-col gap-0.5'>
											<h3 className='text-sm font-medium text-(--text)'>Username & Profile</h3>
											<p className='text-xs text-(--text-muted)'>Used to display your profile inside the app.</p>
										</div>

										<div className='flex flex-col gap-0.5'>
											<h3 className='text-sm font-medium text-(--text)'>Email Address</h3>
											<p className='text-xs text-(--text-muted)'>Used for notifications and important account updates.</p>
										</div>

										<div className='flex flex-col gap-0.5'>
											<h3 className='text-sm font-medium text-(--text)'>Connections</h3>
											<p className='text-xs text-(--text-muted)'>Displayed on your profile for personalization.</p>
										</div>

										<div className='flex flex-col gap-0.5'>
											<h3 className='text-sm font-medium text-(--text)'>Join Servers</h3>
											<p className='text-xs text-(--text-muted)'>Used to join Xernerx Studios managed servers. Does not add you to any server without your input!</p>
										</div>

										<div className='flex flex-col gap-0.5'>
											<h3 className='text-sm font-medium text-(--text)'>Servers</h3>
											<p className='text-xs text-(--text-muted)'>Used to power your dashboard experience.</p>
										</div>

										<div className='flex flex-col gap-0.5'>
											<h3 className='text-sm font-medium text-(--text)'>Server Member Info</h3>
											<p className='text-xs text-(--text-muted)'>Used for roles, nicknames, and server-specific features.</p>
										</div>

										{/* DIVIDER - Applied border-(--border)/10 rule here */}
										<div className='mt-2 border-t border-(--border)/10 pt-4 text-xs leading-relaxed text-(--text-muted)'>
											Xernerx does not sell your data. All data is either public via the Discord API or used internally for features.
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
