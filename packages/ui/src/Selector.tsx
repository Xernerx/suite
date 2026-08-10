/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search } from 'lucide-react';
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
	items?: boolean;
}

// Helper to extract plain text string from any ReactNode (handles strings, elements, arrays)
function getLabelString(label: React.ReactNode): string {
	if (typeof label === 'string') return label;
	if (typeof label === 'number') return String(label);
	if (React.isValidElement(label)) {
		return getLabelString((label.props as { children?: React.ReactNode })?.children);
	}
	if (Array.isArray(label)) {
		return label.map(getLabelString).join('');
	}
	return '';
}

export function Selector({ value, options, onChange, placeholder = 'Select...', items }: SelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const ref = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Close the dropdown when clicking outside of it
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				setIsOpen(false);
				setQuery('');
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Focus input when opened
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => {
				inputRef.current?.focus();
			}, 50);
		} else {
			setQuery('');
		}
	}, [isOpen]);

	const selectedOption = options.find((opt) => opt.value === value);

	const filteredOptions = options.filter((option) => {
		const q = query.toLowerCase();

		const valueMatch = option.value.toLowerCase().includes(q);
		const labelString = getLabelString(option.label);
		const labelMatch = labelString.toLowerCase().includes(q);

		return valueMatch || labelMatch;
	});

	return (
		<div className="relative w-full" ref={ref}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex w-full items-center justify-between rounded-xl p-3 border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm text-(--text) shadow-sm transition-all hover:border-(--accent)/50 hover:bg-(--foreground)/50 focus:border-(--accent) focus:outline-none"
				style={{ gap: 'var(--ui-gap)' }}
			>
				<span className="font-medium">{selectedOption ? selectedOption.label : placeholder}</span>
				<ChevronDown className={`h-4 w-4 text-(--text-muted) transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.15, ease: 'easeOut' }}
						className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-lg"
						style={{ padding: 'calc(var(--ui-gap) * 0.25)', display: 'flex', flexDirection: 'column', gap: 'calc(var(--ui-gap) * 0.25)' }}
					>
						{/* Search Filter Input */}
						{!items && (
							<div className="relative w-full" style={{ padding: 'calc(var(--ui-gap) * 0.25)' }}>
								<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
								<input
									ref={inputRef}
									type="text"
									placeholder="Search..."
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="w-full rounded-xl border border-(--border)/10 bg-(--background) text-xs text-(--text) focus:outline-none focus:ring-1 focus:ring-(--accent)"
									style={{ padding: 'calc(var(--ui-gap) * 0.4) calc(var(--ui-gap) * 0.5) calc(var(--ui-gap) * 0.4) calc(var(--ui-gap) * 2)' }}
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
						)}

						{/* Options List */}
						<div className="overflow-y-auto max-h-52 flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
							{filteredOptions.length === 0 ? (
								<div className="py-3 text-center text-xs text-(--text-muted)">No options found</div>
							) : (
								filteredOptions.map((option) => {
									const isSelected = option.value === value;
									return (
										<button
											type="button"
											key={option.value}
											onClick={() => {
												onChange(option.value);
												setIsOpen(false);
												setQuery('');
											}}
											className={`flex w-full items-center justify-between rounded-xl text-sm transition-colors ${
												isSelected ? 'bg-(--active-accent)/20 text-(--accent)' : 'text-(--text) hover:bg-(--border)/5'
											}`}
											style={{ padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)' }}
										>
											<div className="flex items-center gap-2">
												<span className="font-medium">{option.label}</span>
												{option.badge && <span className="opacity-90">{option.badge}</span>}
											</div>
											{isSelected && <Check className="h-4 w-4" />}
										</button>
									);
								})
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
