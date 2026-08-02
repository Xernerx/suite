/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import Banner from '@/../public/banner.svg';

export default function SignInPage() {
	const { data: session, status } = useSession();

	const [loading, setLoading] = useState(false);
	const [about, setAbout] = useState<boolean>(false);

	async function handleLogin() {
		setLoading(true);
		await signIn('discord', { callbackUrl: '/' });
	}

	useEffect(() => {
		if (status == 'authenticated' && session) window.location.replace('/');
	}, [session]);

	return (
		<div className="h-full flex items-center justify-center px-6">
			<AnimatePresence>
				<motion.div
					initial={{ opacity: 0, scale: 0.96, y: 12 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
					className="flex flex-col items-center text-center"
					style={{
						gap: 'calc(var(--ui-gap) * 1.5)',
					}}
				>
					<div className="flex flex-col items-center gap-4 m-6">
						<Banner className="w-full h-50" style={{ color: 'var(--accent)' }} />
					</div>

					<motion.button
						onClick={handleLogin}
						disabled={loading}
						whileHover={!loading ? { scale: 1.02, y: -1 } : undefined}
						whileTap={!loading ? { scale: 0.985 } : undefined}
						className="rounded-xl px-6 py-3 text-sm font-medium border transition disabled:opacity-60 disabled:cursor-not-allowed"
						style={{
							background: 'var(--accent)',
							borderColor: 'color-mix(in srgb, var(--accent) 18%, white 8%)',
							color: 'var(--text-main)',
							boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
							minWidth: 240,
						}}
					>
						{loading ? 'Redirecting…' : 'Continue with Discord'}
					</motion.button>

					{/* ABOUT TOGGLE */}
					<button onClick={() => setAbout(!about)} className="flex items-center gap-2 text-xs uppercase tracking-wide transition" style={{ color: 'var(--text-muted)' }}>
						About permissions
						{about ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
					</button>

					{about && (
						<motion.div
							initial={{ opacity: 0, y: -6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -6 }}
							transition={{ duration: 0.2 }}
							className="w-full max-w-md rounded-xl p-4 text-left"
							style={{
								background: 'var(--container)',
								border: '1px solid var(--border)',
							}}
						>
							<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.9)' }}>
								{/* ITEM */}
								<div>
									<h3 className="text-sm font-medium">Username & Profile</h3>
									<p className="text-xs opacity-70">Used to display your profile inside the app.</p>
								</div>

								<div>
									<h3 className="text-sm font-medium">Email Address</h3>
									<p className="text-xs opacity-70">Used for notifications and important account updates.</p>
								</div>

								<div>
									<h3 className="text-sm font-medium">Connections</h3>
									<p className="text-xs opacity-70">Displayed on your profile for personalization.</p>
								</div>

								<div>
									<h3 className="text-sm font-medium">Join Servers</h3>
									<p className="text-xs opacity-70">Used to join Xernerx Studios managed servers. Does not add you to any server without your input!</p>
								</div>

								<div>
									<h3 className="text-sm font-medium">Servers</h3>
									<p className="text-xs opacity-70">Used to power your dashboard experience.</p>
								</div>

								<div>
									<h3 className="text-sm font-medium">Server Member Info</h3>
									<p className="text-xs opacity-70">Used for roles, nicknames, and server-specific features.</p>
								</div>

								{/* DIVIDER */}
								<div
									className="mt-2 pt-3 text-xs"
									style={{
										borderTop: '1px solid var(--border)',
										color: 'var(--text-muted)',
										lineHeight: 1.4,
									}}
								>
									Xernerx does not sell your data. All data is either public via the Discord API or used internally for features.
								</div>
							</div>
						</motion.div>
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
