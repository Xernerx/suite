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
			className={`absolute bottom-full mb-2 z-50 flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-2xl backdrop-blur-md
                ${isCollapsed ? 'left-1 w-56 origin-bottom-left' : 'left-0 right-0 origin-bottom'}
            `}
			style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.5)', fontSize: 'var(--text-scale, 14px)' }}
		>
			<div
				className="flex items-center text-(--text-muted)"
				style={{
					gap: 'calc(var(--ui-gap) * 0.5)',
					paddingLeft: 'calc(var(--ui-gap) * 0.75)',
					paddingRight: 'calc(var(--ui-gap) * 0.75)',
					paddingTop: 'calc(var(--ui-gap) * 0.25)',
					paddingBottom: 'calc(var(--ui-gap) * 0.25)',
				}}
			>
				<Compass size={14} className="text-(--accent)" />
				<span className="text-[11px] uppercase font-bold tracking-wider">Suite</span>
			</div>

			<Divider />

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				{navigation.map((service, sIdx) => {
					const resolvedHref = getEnvUrl(service.href);
					return (
						<Link
							key={sIdx}
							href={resolvedHref}
							onClick={onClose}
							className="flex items-center rounded-xl font-medium text-(--text-muted) transition-colors hover:bg-(--background) hover:text-(--text)"
							style={{ padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.75)' }}
						>
							<span>{service.label}</span>
						</Link>
					);
				})}
			</div>
		</motion.div>
	);
}
