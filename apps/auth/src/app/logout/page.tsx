/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import Banner from '@/../public/banner.svg';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@xernerx/providers';

export default function SignOutPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const { hide } = useSidebar();

	useEffect(() => {
		hide();
	}, []);

	async function handleSignOut() {
		setLoading(true);
		await signOut({ callbackUrl: '/' });
	}

	return (
		<div className='flex h-full min-h-screen items-center justify-center px-6'>
			<AnimatePresence>
				<motion.div
					initial={{ opacity: 0, scale: 0.96, y: 12 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
					className='flex w-full max-w-sm flex-col items-center text-center gap-6 rounded-3xl border border-(--border)/10 bg-(--foreground) p-8 shadow-2xl'>
					{/* LOGO */}
					<div className='flex flex-col items-center'>
						<Banner className='h-auto w-40 text-accent' />
					</div>

					{/* TEXT CONTENT */}
					<div className='flex flex-col gap-2'>
						<h2 className='text-xl font-semibold text-(--text)'>Sign Out</h2>
						<p className='text-sm text-(--text-muted)'>Are you sure you want to log out? You will need to authenticate again to access your dashboard.</p>
					</div>

					{/* ACTION BUTTONS */}
					<div className='mt-2 flex w-full flex-col gap-3'>
						<motion.button
							onClick={handleSignOut}
							disabled={loading}
							whileHover={!loading ? { scale: 1.02, y: -1 } : undefined}
							whileTap={!loading ? { scale: 0.985 } : undefined}
							// Destructive red styling for the logout button
							className='w-full rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60'>
							{loading ? 'Signing out…' : 'Yes, log me out'}
						</motion.button>

						<motion.button
							onClick={() => router.back()}
							disabled={loading}
							whileHover={!loading ? { scale: 1.02, y: -1 } : undefined}
							whileTap={!loading ? { scale: 0.985 } : undefined}
							// Secondary styling to match your theme
							className='w-full rounded-xl border border-(--border)/10 bg-(--background) px-6 py-3 text-sm font-medium text-(--text) transition-colors hover:border-(--text-muted) disabled:cursor-not-allowed disabled:opacity-60'>
							Cancel
						</motion.button>
					</div>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
