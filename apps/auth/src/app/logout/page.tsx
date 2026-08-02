/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useDictionary, useSidebar } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import Banner from '@/../public/banner.svg';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const { hide } = useSidebar();
	const { t } = useDictionary();

	useEffect(() => {
		hide();
	}, [hide]);

	async function handleSignOut() {
		setLoading(true);
		await signOut({ callbackUrl: '/' });
	}

	return (
		<div className='flex h-full min-h-screen items-center justify-center' style={{ padding: 'var(--ui-gap)', fontSize: 'var(--text-scale, 14px)' }}>
			<AnimatePresence>
				<motion.div
					initial={{ opacity: 0, scale: 0.96, y: 12 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
					className='flex w-full max-w-sm flex-col items-center text-center rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-2xl'
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
					{/* LOGO */}
					<div className='flex flex-col items-center'>
						<Banner className='h-auto w-40 text-(--accent)' />
					</div>

					{/* TEXT CONTENT */}
					<div className='flex flex-col' style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h2 className='text-xl font-semibold text-(--text)'>{t('auth.signout.title', {}, 'Sign Out')}</h2>
						<p className='text-sm text-(--text-muted)'>{t('auth.signout.description', {}, 'Are you sure you want to log out? You will need to authenticate again to access your dashboard.')}</p>
					</div>

					{/* ACTION BUTTONS */}
					<div className='flex w-full flex-col' style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<motion.button
							onClick={handleSignOut}
							disabled={loading}
							whileHover={!loading ? { scale: 1.02, y: -1 } : undefined}
							whileTap={!loading ? { scale: 0.985 } : undefined}
							className='w-full rounded-xl border border-red-500/20 bg-red-500/10 font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60'
							style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)' }}>
							{loading ? t('auth.signout.signingOut', {}, 'Signing out…') : t('auth.signout.confirmButton', {}, 'Yes, log me out')}
						</motion.button>

						<motion.button
							onClick={() => router.back()}
							disabled={loading}
							whileHover={!loading ? { scale: 1.02, y: -1 } : undefined}
							whileTap={!loading ? { scale: 0.985 } : undefined}
							className='w-full rounded-xl border border-(--border)/10 bg-(--background) font-medium text-(--text) transition-colors hover:border-(--text-muted) disabled:cursor-not-allowed disabled:opacity-60'
							style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)' }}>
							{t('auth.signout.cancelButton', {}, 'Cancel')}
						</motion.button>
					</div>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
