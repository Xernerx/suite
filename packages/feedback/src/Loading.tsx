/** @format */
'use client';

import Banner from '../../public/banner.svg';
import Logo from '../../public/logo.svg';
import { motion } from 'framer-motion';

export function Loading({ message, variant = 'default' }: { message?: string; variant?: 'default' | 'small' }) {
	const Component = variant === 'default' ? Banner : Logo;
	const maxWidth = variant === 'default' ? 'max-w-[420px]' : 'max-w-[48px]';

	return (
		<div className="flex h-full w-full flex-col items-center justify-center" style={{ padding: variant === 'default' ? 'var(--ui-gap)' : 0, gap: 'var(--ui-gap)' }}>
			<div className={`relative block w-full ${maxWidth} shrink-0 pointer-events-none select-none`}>
				{/* 1. Base Layer: Dimmed out background version of the logo/banner */}
				<Component
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
					<Component
						className="h-auto w-full text-(--accent) fill-current"
						style={{
							imageRendering: '-webkit-optimize-contrast',
							display: 'block',
						}}
					/>
				</motion.div>
			</div>

			{message && <div className="font-medium text-(--accent) text-sm">{message}</div>}
		</div>
	);
}
