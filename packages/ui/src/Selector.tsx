/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useDictionary } from '@xernerx/providers';
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
	required?: boolean;
	disabled?: boolean;
	toggleClassName?: string;
}

// Helper to extract plain text string from any ReactNode (handles strings, elements, arrays)
function getLabelString(label: React.ReactNode): string {
	if (typeof label === 'string') return label;
	if (typeof label === 'number') return String(label);
	if (React.isValidElement(label)) {
		return getLabelString(
			(
				label.props as {
					children?: React.ReactNode;
				}
			)?.children
		);
	}
	if (Array.isArray(label)) {
		return label.map(getLabelString).join('');
	}
	return '';
}
export function Selector({ value, options, onChange, placeholder, items, required, disabled = false, toggleClassName = '' }: SelectorProps) {
	const { t } = useDictionary();
	const resolvedPlaceholder = placeholder ?? t('common.selector.defaultPlaceholder');
	const [isOpen, setIsOpen] = useState(false);
	const [openUpwards, setOpenUpwards] = useState(false);
	const [alignRight, setAlignRight] = useState(false);
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

	// Focus input and determine placement when opened
	useEffect(() => {
		if (isOpen) {
			if (ref.current) {
				const rect = ref.current.getBoundingClientRect();
				const spaceBelow = window.innerHeight - rect.bottom;
				const spaceAbove = rect.top;
				if (spaceBelow < 260 && spaceAbove > spaceBelow) {
					setOpenUpwards(true);
				} else {
					setOpenUpwards(false);
				}
				const spaceRight = window.innerWidth - rect.left;
				setAlignRight(spaceRight < 320 && rect.right > 320);
			}
			setTimeout(() => {
				inputRef.current?.focus();
			}, 50);

			const elevated: Array<{ el: HTMLElement; prevZ: string; prevPos: string }> = [];
			let curr = ref.current?.parentElement;
			let depth = 0;
			while (curr && curr !== document.body && curr.tagName !== 'MAIN' && curr.getAttribute('role') !== 'dialog' && depth < 6) {
				const computed = window.getComputedStyle(curr);
				const prevZ = curr.style.zIndex;
				const prevPos = curr.style.position;
				if (computed.position === 'static') {
					curr.style.position = 'relative';
				}
				curr.style.zIndex = '60';
				elevated.push({ el: curr, prevZ, prevPos });
				curr = curr.parentElement;
				depth++;
			}

			return () => {
				elevated.forEach(({ el, prevZ, prevPos }) => {
					el.style.zIndex = prevZ;
					el.style.position = prevPos;
				});
			};
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
		<div className={`relative w-full ${isOpen ? 'z-[100]' : ''}`} ref={ref}>
			{required && (
				<input tabIndex={-1} autoComplete="off" value={value} onChange={() => {}} required className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px -translate-x-1/2 opacity-0" />
			)}
			<button
				type="button"
				disabled={disabled}
				onClick={() => {
					if (!disabled) setIsOpen(!isOpen);
				}}
				className={`flex h-10 px-4 w-full min-w-max items-center justify-between gap-2 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm text-(--text) shadow-sm transition-all ${
					disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-(--accent)/50 hover:bg-(--foreground)/50 focus:border-(--accent) focus:outline-none cursor-pointer'
				} ${isOpen ? 'border-(--accent)/50 bg-(--foreground)/50' : ''} ${toggleClassName}`}
			>
				<span className="font-medium whitespace-nowrap truncate">{selectedOption ? selectedOption.label : resolvedPlaceholder}</span>
				<ChevronDown className={`h-4 w-4 shrink-0 text-(--text-muted) transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{
							opacity: 0,
							y: openUpwards ? 4 : -4,
						}}
						animate={{
							opacity: 1,
							y: 0,
						}}
						exit={{
							opacity: 0,
							y: openUpwards ? 4 : -4,
						}}
						transition={{
							duration: 0.15,
							ease: 'easeOut',
						}}
						className={`absolute ${alignRight ? 'right-0' : 'left-0'} ${openUpwards ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'} z-[100] min-w-full w-max max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-(--border)/10 bg-(--foreground) backdrop-blur-md shadow-2xl`}
						style={{
							padding: 'calc(var(--ui-gap) * 0.25)',
							display: 'flex',
							flexDirection: 'column',
							gap: 'calc(var(--ui-gap) * 0.25)',
						}}
					>
						{/* Search Filter Input */}
						{!items && (
							<div
								className="relative w-full"
								style={{
									padding: 'calc(var(--ui-gap) * 0.25)',
								}}
							>
								<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
								<input
									ref={inputRef}
									type="text"
									placeholder={t('common.selector.placeholder')}
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="w-full rounded-xl border border-(--border)/10 bg-(--background) text-xs text-(--text) focus:outline-none focus:ring-1 focus:ring-(--accent)"
									style={{
										padding: 'calc(var(--ui-gap) * 0.4) calc(var(--ui-gap) * 0.5) calc(var(--ui-gap) * 0.4) calc(var(--ui-gap) * 2)',
									}}
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
						)}

						{/* Options List */}
						<div
							className="overflow-y-auto overflow-x-hidden max-h-52 flex flex-col"
							style={{
								gap: 'calc(var(--ui-gap) * 0.25)',
							}}
						>
							{filteredOptions.length === 0 ? (
								<div className="py-3 text-center text-xs text-(--text-muted)">{t('common.selector.description')}</div>
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
											className={`flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-xl text-sm transition-colors ${isSelected ? 'bg-(--active-accent)/20 text-(--accent)' : 'text-(--text) hover:bg-(--border)/5'}`}
											style={{
												padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)',
											}}
										>
											<div className="flex items-center gap-2 whitespace-nowrap">
												<span className="font-medium whitespace-nowrap">{option.label}</span>
												{option.badge && <span className="opacity-90 shrink-0">{option.badge}</span>}
											</div>
											{isSelected && <Check className="h-4 w-4 shrink-0" />}
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
