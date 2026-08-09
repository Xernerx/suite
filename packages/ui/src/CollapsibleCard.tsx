/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface CollapsibleCardProps {
	message: string;
	description: React.ReactNode | string;
	defaultOpen?: boolean;
	className?: string;
}

export function CollapsibleCard({ message, description, defaultOpen = false, className = '' }: CollapsibleCardProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<div className={`flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm overflow-hidden transition-colors ${className}`} style={{ padding: 'var(--ui-gap)' }}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center justify-between w-full text-left cursor-pointer group bg-transparent border-none p-0"
				style={{ gap: 'var(--ui-gap)' }}
			>
				<span className="font-semibold text-(--text) text-base">{message}</span>
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-(--border)/5 text-(--text-muted) group-hover:bg-(--border)/10 transition-colors">
					<motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
						<ChevronDown size={16} />
					</motion.div>
				</div>
			</button>

			<AnimatePresence initial={false}>
				{isOpen && (
					<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }}>
						<div className="border-t border-(--border)/10 text-sm text-(--text-muted) leading-relaxed pt-4 mt-4">{description}</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
