/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useDictionary } from '@xernerx/providers';
export interface MultiSelectorOption {
	label: string;
	value: string;
	color?: string;
}
export interface MultiSelectorProps {
	label?: string;
	value: string[];
	options: MultiSelectorOption[];
	onChange: (value: string[]) => void;
	placeholder?: string;
	className?: string;
	toggleClassName?: string;
	searchable?: boolean;
	searchPlaceholder?: string;
}
export function MultiSelector({ value, options, onChange, placeholder, className, toggleClassName, label, searchable = true, searchPlaceholder }: MultiSelectorProps) {
	const { t } = useDictionary();
	const resolvedPlaceholder = placeholder ?? t('common.multiselector.defaultPlaceholder');
	const resolvedSearchPlaceholder = searchPlaceholder ?? t('common.multiselector.searchPlaceholder');
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const ref = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (!ref.current?.contains(event.target as Node)) {
				setOpen(false);
				setQuery('');
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);
	const [openUpwards, setOpenUpwards] = useState(false);
	const [alignRight, setAlignRight] = useState(false);

	useEffect(() => {
		if (open) {
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
				setAlignRight(spaceRight < 280 && rect.right > 280);
			}
			if (searchable) {
				setTimeout(() => inputRef.current?.focus(), 50);
			}

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
	}, [open, searchable]);
	function toggle(option: string) {
		if (value.includes(option)) {
			onChange(value.filter((x) => x !== option));
			return;
		}
		onChange([...value, option]);
	}
	function displayValue() {
		if (!value.length) return resolvedPlaceholder;
		if (value.length === 1) {
			return options.find((x) => x.value === value[0])?.label ?? resolvedPlaceholder;
		}
		if (value.length === 2) {
			return value
				.map((v) => options.find((x) => x.value === v)?.label)
				.filter(Boolean)
				.join(', ');
		}
		return t('common.multiselector.selectedCount', { count: value.length });
	}
	const filteredOptions = options.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()));
	return (
		<div ref={ref} className={`relative w-full ${open ? 'z-[100]' : ''} ${className ?? ''}`}>
			{label && <label className="mb-2 block text-sm font-medium text-(--text)">{label}</label>}

			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className={`flex h-10 px-4 w-full min-w-max items-center justify-between gap-2.5 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm text-(--text) shadow-sm transition-all hover:border-(--accent)/50 hover:bg-(--foreground)/50 focus:border-(--accent) focus:outline-none cursor-pointer ${toggleClassName ?? ''} ${open ? 'border-(--accent)/50 bg-(--foreground)/50' : ''}`}
			>
				<div className="flex items-center gap-2.5 overflow-hidden">
					{!!value.length && (
						<div className="flex -space-x-1.5">
							{value.slice(0, 3).map((selectedValue) => {
								const option = options.find((x) => x.value === selectedValue);
								return (
									<div
										key={selectedValue}
										className="size-3.5 rounded-full border border-(--border)/20 shrink-0 shadow-sm"
										style={{
											background: option?.color ?? 'var(--accent)',
										}}
									/>
								);
							})}
						</div>
					)}

					<span className="whitespace-nowrap truncate font-medium text-(--text)">{displayValue()}</span>
				</div>

				<ChevronDown size={16} className={`text-(--text-muted) transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
			</button>

			<AnimatePresence>
				{open && (
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
						className={`absolute ${alignRight ? 'right-0' : 'left-0'} ${openUpwards ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'} z-[100] min-w-full w-max max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-(--border)/10 bg-(--foreground) backdrop-blur-md shadow-2xl p-2`}
					>
						<div className="flex flex-col gap-1">
							{searchable && (
								<div className="relative w-full mb-1">
									<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
									<input
										ref={inputRef}
										type="text"
										placeholder={resolvedSearchPlaceholder}
										value={query}
										onChange={(e) => setQuery(e.target.value)}
										className="w-full rounded-xl bg-(--background)/50 px-8 py-2 text-sm text-(--text) placeholder:text-(--text-muted) border border-(--border)/5 focus:border-(--accent)/50 focus:outline-none transition-colors"
									/>
								</div>
							)}

							<div className="max-h-72 overflow-y-auto overflow-x-hidden pr-1 flex flex-col gap-1">
								{filteredOptions.map((option) => {
									const selected = value.includes(option.value);
									return (
										<button
											key={option.value}
											type="button"
											onClick={() => toggle(option.value)}
											className={`flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition-colors cursor-pointer ${
												selected ? 'bg-(--accent) text-(--accent-contrast) font-semibold' : 'text-(--text) font-medium hover:bg-(--accent)/10'
											}`}
										>
											<div className="flex items-center gap-2.5 whitespace-nowrap">
												<div
													className="size-2.5 rounded-full shadow-inner border border-(--border)/20 shrink-0"
													style={{
														background: option.color ?? 'var(--accent)',
													}}
												/>
												<span className="whitespace-nowrap">{option.label}</span>
											</div>
											{selected && <Check className="h-4 w-4 shrink-0" />}
										</button>
									);
								})}

								{!filteredOptions.length && <div className="py-4 text-center text-sm text-(--text-muted)">{t('common.multiselector.description')}</div>}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
