/** @format */
'use client';

import { Compass } from 'lucide-react';
import { Divider } from '@xernerx/ui';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { navigation } from '@xernerx/lib';
import { useEnvironment } from '@xernerx/providers';

export default function SidebarSuite({ isCollapsed, onClose }: { isCollapsed: boolean; onClose: () => void }) {
	const { getEnvUrl } = useEnvironment();

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 8 }}
			transition={{ duration: 0.15, ease: 'easeOut' }}
			className={`absolute bottom-full mb-2 z-50 flex flex-col gap-1 rounded-2xl border border-(--border)/10 bg-(--foreground) p-2 shadow-2xl backdrop-blur-md
                ${isCollapsed ? 'left-1 w-56 origin-bottom-left' : 'left-0 right-0 origin-bottom'}
            `}>
			<div className='flex items-center gap-2 px-3 py-2 text-(--text-muted)'>
				<Compass size={14} className='text-(--accent)' />
				<span className='text-[11px] uppercase font-bold tracking-wider'>Suite</span>
			</div>

			<Divider />

			{navigation.map((service, sIdx) => {
				const resolvedHref = getEnvUrl(service.href);
				return (
					<Link
						key={sIdx}
						href={resolvedHref}
						onClick={onClose}
						className='flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-(--text-muted) transition-colors hover:bg-(--background) hover:text-(--text)'>
						<span>{service.label}</span>
					</Link>
				);
			})}
		</motion.div>
	);
}
