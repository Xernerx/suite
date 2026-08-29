/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from './Button';
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
export function MultiSelector({ value, options, onChange, placeholder = 'Select', className, toggleClassName, label, searchable = true, searchPlaceholder = 'Search...' }: MultiSelectorProps) {
	const { t } = useDictionary();
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
	useEffect(() => {
		if (open && searchable) {
			setTimeout(() => inputRef.current?.focus(), 50);
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
		if (!value.length) return placeholder;
		if (value.length === 1) {
			return options.find((x) => x.value === value[0])?.label ?? placeholder;
		}
		if (value.length === 2) {
			return value
				.map((v) => options.find((x) => x.value === v)?.label)
				.filter(Boolean)
				.join(', ');
		}
		return `${value.length} selected`;
	}
	const filteredOptions = options.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()));
	return (
		<div ref={ref} className={`relative w-full ${className ?? ''}`}>
			{label && <label className="mb-2 block text-sm font-medium text-(--text)">{label}</label>}

			<Button
				type="button"
				variant="secondary"
				onClick={() => setOpen((v) => !v)}
				className={`w-full justify-between ${toggleClassName ?? ''} ${open ? 'border-(--accent)/50 bg-(--foreground)/50' : ''}`}
			>
				<div className="flex items-center gap-3 overflow-hidden">
					{!!value.length && (
						<div className="flex -space-x-1.5">
							{value.slice(0, 3).map((selectedValue) => {
								const option = options.find((x) => x.value === selectedValue);
								return (
									<div
										key={selectedValue}
										className="size-3.5 rounded-full border border-white/20 shrink-0 shadow-sm"
										style={{
											background: option?.color ?? 'var(--accent)',
										}}
									/>
								);
							})}
						</div>
					)}

					<span className="truncate font-medium text-(--text)">{displayValue()}</span>
				</div>

				<ChevronDown size={16} className={`text-(--text-muted) transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
			</Button>

			<AnimatePresence>
				{open && (
					<motion.div
						initial={{
							opacity: 0,
							y: -4,
						}}
						animate={{
							opacity: 1,
							y: 0,
						}}
						exit={{
							opacity: 0,
							y: -4,
						}}
						transition={{
							duration: 0.15,
							ease: 'easeOut',
						}}
						className="absolute left-0 top-[calc(100%+8px)] z-[100] w-full overflow-hidden rounded-xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-2xl p-2"
					>
						<div className="flex flex-col gap-1">
							{searchable && (
								<div className="relative w-full mb-1">
									<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
									<input
										ref={inputRef}
										type="text"
										placeholder={searchPlaceholder}
										value={query}
										onChange={(e) => setQuery(e.target.value)}
										className="w-full rounded-lg bg-(--background)/50 px-8 py-2 text-sm text-(--text) placeholder:text-(--text-muted) border border-(--border)/5 focus:border-(--accent)/50 focus:outline-none transition-colors"
									/>
								</div>
							)}

							<div className="max-h-72 overflow-y-auto pr-1 flex flex-col gap-1">
								{filteredOptions.map((option) => {
									const selected = value.includes(option.value);
									return (
										<Button
											key={option.value}
											type="button"
											variant={selected ? 'primary' : 'ghost'}
											onClick={() => toggle(option.value)}
											className={`w-full justify-start ${selected ? '' : 'hover:bg-(--accent)/10 hover:text-(--text)'}`}
										>
											<div className="flex items-center gap-3">
												<div
													className="size-2.5 rounded-full shadow-inner border border-white/20 shrink-0"
													style={{
														background: option.color ?? 'var(--accent)',
													}}
												/>
												<span className={`${selected ? 'font-semibold text-white' : 'font-medium text-(--text)'}`}>{option.label}</span>
											</div>
										</Button>
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
