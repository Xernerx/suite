/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

export interface SelectorOption {
	value: string;
	label: React.ReactNode;
	badge?: React.ReactNode;
}

export interface SelectorProps {
	value: string;
	options: SelectorOption[];
	onChange: (value: string) => void;
	placeholder?: string;
}

export function Selector({ value, options, onChange, placeholder = 'Select...' }: SelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	// Close the dropdown when clicking outside of it
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const selectedOption = options.find((opt) => opt.value === value);

	return (
		<div className='relative w-full' ref={ref}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className='flex w-full items-center justify-between gap-3 rounded-2xl border border-(--border)/10 bg-(--foreground) p-3 text-sm text-(--text) shadow-sm transition-all hover:border-(--border)/40 focus:border-(--accent) focus:outline-none'>
				<span className='font-medium'>{selectedOption ? selectedOption.label : placeholder}</span>
				<ChevronDown className={`h-4 w-4 text-(--text-muted) transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.15, ease: 'easeOut' }}
						className='absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-2xl border border-(--border)/10 bg-(--foreground) p-1 shadow-lg'>
						{options.map((option) => {
							const isSelected = option.value === value;
							return (
								<button
									key={option.value}
									onClick={() => {
										onChange(option.value);
										setIsOpen(false);
									}}
									className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
										isSelected ? 'bg-(--active-accent)/20 text-(--accent)' : 'text-(--text) hover:bg-(--border)/5'
									}`}>
									<div className='flex items-center gap-2'>
										<span className='font-medium'>{option.label}</span>
										{option.badge && <span className='opacity-90'>{option.badge}</span>}
									</div>
									{isSelected && <Check className='h-4 w-4' />}
								</button>
							);
						})}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
