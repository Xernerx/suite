/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search } from 'lucide-react';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDictionary } from '@xernerx/providers';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface MultiPortalCoords {
	top?: number;
	bottom?: number;
	left?: number;
	right?: number;
	minWidth: number;
	maxWidth: number;
	maxListHeight: number;
	openUpwards: boolean;
}

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
	const [mounted, setMounted] = useState(false);
	const [open, setOpen] = useState(false);
	const [coords, setCoords] = useState<MultiPortalCoords | null>(null);
	const [query, setQuery] = useState('');
	const ref = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	const updatePosition = useCallback(() => {
		const btn = buttonRef.current;
		if (!btn || typeof window === 'undefined') return;
		const rect = btn.getBoundingClientRect();
		const scale = btn.offsetWidth > 0 ? rect.width / btn.offsetWidth : 1;
		const vw = window.innerWidth / scale;
		const vh = window.innerHeight / scale;
		const rTop = rect.top / scale;
		const rBottom = rect.bottom / scale;
		const rLeft = rect.left / scale;
		const rRight = rect.right / scale;
		const rWidth = rect.width / scale;

		const spaceBelow = vh - rBottom;
		const spaceAbove = rTop;
		const openUpwards = spaceBelow < 260 && spaceAbove > spaceBelow;
		const availableVertical = Math.max(120, (openUpwards ? spaceAbove : spaceBelow) - 16);
		const headerAllowance = searchable ? 64 : 18;
		const maxListHeight = Math.max(96, Math.min(280, availableVertical - headerAllowance));

		const alignRight = vw - rLeft < 280 && rRight > 280;
		const clampedLeft = Math.max(8, rLeft);
		const clampedRight = Math.max(8, vw - rRight);
		const maxWidth = alignRight ? Math.max(180, rRight - 8) : Math.max(180, vw - clampedLeft - 8);

		setCoords({
			top: openUpwards ? undefined : rBottom + 6,
			bottom: openUpwards ? vh - rTop + 6 : undefined,
			left: alignRight ? undefined : clampedLeft,
			right: alignRight ? clampedRight : undefined,
			minWidth: rWidth,
			maxWidth,
			maxListHeight,
			openUpwards,
		});
	}, [searchable]);

	useEffect(() => {
		if (!open) return;

		function handleClickOutside(event: MouseEvent) {
			const target = event.target as Node;
			if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) {
				setOpen(false);
				setQuery('');
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.stopPropagation();
				event.stopImmediatePropagation?.();
				setOpen(false);
				setQuery('');
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		window.addEventListener('keydown', handleKeyDown, true);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			window.addEventListener('keydown', handleKeyDown, true);
		};
	}, [open]);

	useIsomorphicLayoutEffect(() => {
		if (!open) {
			setQuery('');
			return;
		}
		updatePosition();

		const handleScroll = (e: Event) => {
			if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return;
			updatePosition();
		};

		window.addEventListener('scroll', handleScroll, true);
		window.addEventListener('resize', updatePosition);
		const focusTimer = searchable
			? setTimeout(() => {
					inputRef.current?.focus({ preventScroll: true });
				}, 30)
			: null;

		return () => {
			if (focusTimer) clearTimeout(focusTimer);
			window.removeEventListener('scroll', handleScroll, true);
			window.removeEventListener('resize', updatePosition);
		};
	}, [open, searchable, updatePosition]);
	function toggle(option: string) {
		if (value.includes(option)) {
			onChange(value.filter((x) => x !== option));
			return;
		}
		onChange([...value, option]);
	}
	const effectiveOptions = React.useMemo(() => {
		const knownValues = new Set(options.map((o) => o.value));
		const missingSelected: MultiSelectorOption[] = value
			.filter((v) => Boolean(v) && !knownValues.has(v))
			.map((v) => ({
				value: v,
				label: v,
				color: 'var(--accent-red)',
			}));
		return missingSelected.length > 0 ? [...missingSelected, ...options] : options;
	}, [options, value]);

	function displayValue() {
		if (!value.length) return resolvedPlaceholder;
		if (value.length === 1) {
			return effectiveOptions.find((x) => x.value === value[0])?.label ?? value[0] ?? resolvedPlaceholder;
		}
		if (value.length === 2) {
			return value
				.map((v) => effectiveOptions.find((x) => x.value === v)?.label ?? v)
				.filter(Boolean)
				.join(', ');
		}
		return t('common.multiselector.selectedCount', { count: value.length });
	}
	const filteredOptions = effectiveOptions.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()) || opt.value.toLowerCase().includes(query.toLowerCase()));
	const openUpwards = coords?.openUpwards ?? false;

	return (
		<div ref={ref} className={`relative w-full min-w-0 ${className ?? ''}`}>
			{label && <label className="mb-2 block text-sm font-medium text-(--text)">{label}</label>}

			<button
				ref={buttonRef}
				type="button"
				onClick={() => setOpen((v) => !v)}
				className={`flex h-10 px-4 w-full min-w-0 items-center justify-between gap-2.5 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm text-(--text) shadow-sm transition-all hover:border-(--accent)/50 hover:bg-(--foreground)/50 focus:border-(--accent) focus:outline-none cursor-pointer ${toggleClassName ?? ''} ${open ? 'border-(--accent)/50 bg-(--foreground)/50' : ''}`}
			>
				<div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
					{!!value.length && (
						<div className="flex -space-x-1.5 shrink-0">
							{value.slice(0, 3).map((selectedValue) => {
								const option = effectiveOptions.find((x) => x.value === selectedValue);
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

			{mounted &&
				typeof document !== 'undefined' &&
				createPortal(
					<AnimatePresence>
						{open && coords && (
							<motion.div
								ref={menuRef}
								data-xrx-portal-dropdown="true"
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
								className="fixed z-[100050] w-max overflow-hidden rounded-2xl border border-(--border)/10 bg-(--foreground) backdrop-blur-md shadow-2xl p-2 font-sans antialiased text-(--text)"
								style={{
									top: coords.top,
									bottom: coords.bottom,
									left: coords.left,
									right: coords.right,
									minWidth: `${coords.minWidth}px`,
									maxWidth: `${coords.maxWidth}px`,
								}}
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

									<div className="overflow-y-auto overflow-x-hidden pr-1 flex flex-col gap-1" style={{ maxHeight: `${coords.maxListHeight}px` }}>
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
													<div className="flex items-center gap-2.5 min-w-0 whitespace-nowrap">
														<div
															className="size-2.5 rounded-full shadow-inner border border-(--border)/20 shrink-0"
															style={{
																background: option.color ?? 'var(--accent)',
															}}
														/>
														<span className="whitespace-nowrap truncate">{option.label}</span>
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
					</AnimatePresence>,
					document.body
				)}
		</div>
	);
}
