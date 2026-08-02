/** @format */
'use client';

import { ArrowLeft, Home } from 'lucide-react';

import { Button } from '@xernerx/ui';
import Logo from '../../public/logo.svg';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function NotFound() {
	const router = useRouter();

	return (
		<div className='flex min-h-screen w-full flex-col items-center justify-center overflow-hidden font-sans' style={{ padding: 'var(--ui-gap)' }}>
			<div className='relative z-10 flex flex-col items-center text-center' style={{ gap: 'var(--ui-gap)' }}>
				{/* Logo Presentation */}
				<motion.div
					initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
					animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
					transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
					className='relative flex h-16 w-16 items-center justify-center'>
					{/* The Glow */}
					<Logo viewBox='0 0 1250 1250' className='absolute h-14 w-14 text-(--accent) opacity-40 blur-lg fill-current' style={{ display: 'block', width: '56px', height: '56px' }} />

					{/* The Core */}
					<Logo
						viewBox='0 0 1250 1250'
						className='relative h-14 w-14 text-(--text) drop-shadow-md fill-current transition-colors duration-500 hover:text-(--accent)'
						style={{ display: 'block', width: '56px', height: '56px' }}
					/>
				</motion.div>

				{/* Typography & Status Pill */}
				<motion.div
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
					className='flex flex-col items-center'
					style={{ gap: 'var(--ui-gap)' }}>
					<div
						className='inline-flex items-center rounded-full border border-(--border)/40 bg-(--background)/50 shadow-sm backdrop-blur-md'
						style={{ padding: 'calc(var(--ui-gap) * 0.4) var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<span className='relative flex h-2 w-2'>
							<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75' />
							<span className='relative inline-flex h-2 w-2 rounded-full bg-red-500' />
						</span>
						<span className='text-[11px] font-bold tracking-widest text-(--text-muted) uppercase'>Error 404</span>
					</div>

					<h1 className='text-3xl font-extrabold tracking-tight text-(--text) md:text-5xl'>Signal Lost.</h1>

					<p className='mx-auto max-w-sm text-base leading-relaxed text-(--text-muted)'>The resource you requested cannot be located in the current routing manifest.</p>
				</motion.div>

				{/* Action Buttons */}
				<motion.div
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
					className='flex flex-row items-center justify-center'
					style={{ gap: 'var(--ui-gap)' }}>
					<Button variant='outline' onClick={() => router.back()} className='gap-2 px-6'>
						<ArrowLeft size={16} />
						Go Back
					</Button>

					<Button onClick={() => router.push('/')} className='gap-2 px-6 bg-(--accent) text-white hover:bg-(--accent)/90 border-transparent hover:border-transparent'>
						<Home size={16} />
						Return Home
					</Button>
				</motion.div>
			</div>
		</div>
	);
}
