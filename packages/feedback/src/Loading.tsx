/** @format */
'use client';

import Banner from '../../public/banner.svg';
import { motion } from 'framer-motion';

export function Loading({ message }: { message?: string }) {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="relative block w-full max-w-[420px] shrink-0 pointer-events-none select-none">
				{/* 1. Base Layer: Dimmed out background version of the logo */}
				<Banner
					className="h-auto w-full text-(--text-muted) opacity-20 fill-current"
					style={{
						imageRendering: '-webkit-optimize-contrast',
						display: 'block',
					}}
				/>

				{/* 2. Shine Layer: Bright version with an animated CSS mask */}
				<motion.div
					className="absolute inset-0"
					style={
						{
							// Include both WebKit and standard mask properties
							WebkitMaskImage: 'linear-gradient(75deg, transparent 35%, black 50%, transparent 65%)',
							WebkitMaskSize: '400% 100%',
							maskImage: 'linear-gradient(75deg, transparent 35%, black 50%, transparent 65%)',
							maskSize: '400% 100%',
						} as React.CSSProperties
					}
					// Append 'as any' to bypass TypeScript's strict vendor-prefix check
					initial={{ WebkitMaskPosition: '100% 0', maskPosition: '100% 0' } as any}
					animate={{ WebkitMaskPosition: '0% 0', maskPosition: '0% 0' } as any}
					transition={{
						duration: 2,
						ease: 'easeInOut',
						repeat: Infinity,
						repeatDelay: 0.2,
					}}
				>
					<Banner
						className="h-auto w-full text-(--accent) fill-current"
						style={{
							imageRendering: '-webkit-optimize-contrast',
							display: 'block',
						}}
					/>
				</motion.div>
			</div>

			{message && <div className="font-medium text-(--accent)">{message}</div>}
		</div>
	);
}
