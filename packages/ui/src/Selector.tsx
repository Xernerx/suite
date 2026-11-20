/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search } from 'lucide-react';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDictionary } from '@xernerx/providers';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface PortalCoords {
	top?: number;
	bottom?: number;
	left?: number;
	right?: number;
	minWidth: number;
	maxWidth: number;
	maxListHeight: number;
	openUpwards: boolean;
}

export interface SelectorOption {
	value: string;
	label: React.ReactNode;
	badge?: React.ReactNode;
	backgroundImage?: string;
	backgroundStyle?: React.CSSProperties;
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
	optionClassName?: string;
	backgroundImage?: string;
	backgroundStyle?: React.CSSProperties;
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

export function Selector({ value, options, onChange, placeholder, items, required, disabled = false, toggleClassName = '', optionClassName = '', backgroundImage, backgroundStyle }: SelectorProps) {
	const { t } = useDictionary();
	const resolvedPlaceholder = placeholder ?? t('common.selector.defaultPlaceholder');
	const [mounted, setMounted] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [coords, setCoords] = useState<PortalCoords | null>(null);
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
		const openUpwards = spaceBelow < 250 && spaceAbove > spaceBelow;
		const availableVertical = Math.max(120, (openUpwards ? spaceAbove : spaceBelow) - 16);
		const headerAllowance = items ? 16 : 60;
		const maxListHeight = Math.max(96, Math.min(220, availableVertical - headerAllowance));

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
	}, [items]);

	// Close the dropdown on outside click or Escape (capture phase so Esc closes dropdown before parent Modal)
	useEffect(() => {
		if (!isOpen) return;

		function handleClickOutside(event: MouseEvent) {
			const target = event.target as Node;
			if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) {
				setIsOpen(false);
				setQuery('');
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.stopPropagation();
				event.stopImmediatePropagation?.();
				setIsOpen(false);
				setQuery('');
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		window.addEventListener('keydown', handleKeyDown, true);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			window.removeEventListener('keydown', handleKeyDown, true);
		};
	}, [isOpen]);

	// Track trigger position and focus search input without scrolling parent containers
	useIsomorphicLayoutEffect(() => {
		if (!isOpen) {
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
		const focusTimer = setTimeout(() => {
			inputRef.current?.focus({ preventScroll: true });
		}, 30);

		return () => {
			clearTimeout(focusTimer);
			window.removeEventListener('scroll', handleScroll, true);
			window.removeEventListener('resize', updatePosition);
		};
	}, [isOpen, updatePosition]);

	const selectedOption = options.find((opt) => opt.value === value);
	const activeBg = backgroundImage ?? selectedOption?.backgroundImage;
	const activeBgStyle = backgroundStyle ?? selectedOption?.backgroundStyle;

	const filteredOptions = options.filter((option) => {
		const q = query.toLowerCase();
		const valueMatch = option.value.toLowerCase().includes(q);
		const labelString = getLabelString(option.label);
		const labelMatch = labelString.toLowerCase().includes(q);
		return valueMatch || labelMatch;
	});

	const openUpwards = coords?.openUpwards ?? false;

	return (
		<div className="relative w-full min-w-0" ref={ref}>
			{required && (
				<input tabIndex={-1} autoComplete="off" value={value} onChange={() => {}} required className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px -translate-x-1/2 opacity-0" />
			)}
			<button
				ref={buttonRef}
				type="button"
				disabled={disabled}
				onClick={() => {
					if (!disabled) setIsOpen(!isOpen);
				}}
				className={`group/selector relative overflow-hidden flex h-10 px-4 w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm text-(--text) shadow-sm transition-all ${
					disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-(--accent)/50 hover:bg-(--foreground)/50 focus:border-(--accent) focus:outline-none cursor-pointer'
				} ${isOpen ? 'border-(--accent)/50 bg-(--foreground)/50' : ''} ${toggleClassName}`}
			>
				{activeBg && (
					<>
						<div
							aria-hidden="true"
							className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center transition-transform duration-300 group-hover/selector:scale-[1.03]"
							style={{ backgroundImage: `url("${activeBg}")`, ...activeBgStyle }}
						/>
						<div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-black/60 via-black/30 to-black/55" />
					</>
				)}
				<span className={`relative z-10 flex min-w-0 flex-1 items-center font-medium whitespace-nowrap truncate ${activeBg ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]' : ''}`}>
					{selectedOption ? selectedOption.label : resolvedPlaceholder}
				</span>
				<ChevronDown
					className={`relative z-10 h-4 w-4 shrink-0 transition-transform duration-200 ${
						activeBg ? 'text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]' : 'text-(--text-muted)'
					} ${isOpen ? 'rotate-180' : ''}`}
				/>
			</button>

			{mounted &&
				typeof document !== 'undefined' &&
				createPortal(
					<AnimatePresence>
						{isOpen && coords && (
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
								className="fixed z-[100050] w-max overflow-hidden rounded-2xl border border-(--border)/10 bg-(--foreground) backdrop-blur-md shadow-2xl font-sans antialiased text-(--text)"
								style={{
									top: coords.top,
									bottom: coords.bottom,
									left: coords.left,
									right: coords.right,
									minWidth: `${coords.minWidth}px`,
									maxWidth: `${coords.maxWidth}px`,
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
									className="overflow-y-auto overflow-x-hidden flex flex-col"
									style={{
										maxHeight: `${coords.maxListHeight}px`,
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
													className={`group/opt relative overflow-hidden flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-xl text-sm transition-all cursor-pointer ${
														option.backgroundImage
															? isSelected
																? 'border border-(--accent)/70 shadow-xs'
																: 'border border-(--border)/15 hover:border-(--accent)/45'
															: isSelected
																? 'bg-(--active-accent)/20 text-(--accent)'
																: 'text-(--text) hover:bg-(--border)/5'
													} ${optionClassName}`}
													style={{
														padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)',
													}}
												>
													{option.backgroundImage && (
														<>
															<div
																aria-hidden="true"
																className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center transition-transform duration-300 group-hover/opt:scale-[1.03]"
																style={{ backgroundImage: `url("${option.backgroundImage}")`, ...option.backgroundStyle }}
															/>
															<div
																aria-hidden="true"
																className={`pointer-events-none absolute inset-0 z-0 transition-colors ${
																	isSelected
																		? 'bg-gradient-to-r from-black/50 via-black/25 to-black/50'
																		: 'bg-gradient-to-r from-black/70 via-black/40 to-black/65 group-hover/opt:from-black/55 group-hover/opt:via-black/30 group-hover/opt:to-black/55'
																}`}
															/>
														</>
													)}
													<div
														className={`relative z-10 flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap ${
															option.backgroundImage ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]' : ''
														}`}
													>
														<span className="flex min-w-0 flex-1 items-center font-medium whitespace-nowrap truncate">{option.label}</span>
														{option.badge && <span className="flex items-center opacity-90 shrink-0">{option.badge}</span>}
													</div>
													{isSelected && (
														<Check className={`relative z-10 h-4 w-4 shrink-0 ${option.backgroundImage ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]' : ''}`} />
													)}
												</button>
											);
										})
									)}
								</div>
							</motion.div>
						)}
					</AnimatePresence>,
					document.body
				)}
		</div>
	);
}
