/** @format */
'use client';

import React, { useEffect, useRef } from 'react';
import { Search, Command } from 'lucide-react';
import { usePlatform } from '@xernerx/providers';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
	variant?: 'text' | 'search' | 'textarea' | 'date' | 'number';
	shortcut?: string | boolean;
	onSearch?: (value: string) => void;
	rows?: number;
	ref?: React.Ref<HTMLInputElement | HTMLTextAreaElement>;
}

export function Input({ variant = 'text', shortcut, onSearch, className = '', ref: externalRef, ...props }: InputProps) {
	const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
	const setRefs = (el: HTMLInputElement | HTMLTextAreaElement | null) => {
		(inputRef as React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>).current = el;
		if (typeof externalRef === 'function') externalRef(el);
		else if (externalRef && typeof externalRef === 'object') (externalRef as React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>).current = el;
	};
	const { platform } = usePlatform();

	const activeShortcut = typeof shortcut === 'boolean' && shortcut ? 'K' : typeof shortcut === 'string' ? shortcut : null;

	// Handle global shortcut key listener
	useEffect(() => {
		if (!activeShortcut) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === activeShortcut.toLowerCase()) {
				e.preventDefault();
				inputRef.current?.focus();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [activeShortcut]);

	const baseClasses =
		'bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 text-(--text) placeholder:text-(--text-muted) transition-all outline-none focus:ring-2 focus:ring-(--accent) focus:border-transparent';

	if (variant === 'textarea') {
		return <textarea ref={setRefs} className={`${baseClasses} rounded-2xl p-3 w-full ${className}`} {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />;
	}

	if (variant === 'search') {
		const handleSearchClick = () => {
			if (onSearch && inputRef.current) {
				onSearch(inputRef.current.value);
			}
		};

		const handleKeyDown = (e: React.KeyboardEvent) => {
			if (e.key === 'Enter') handleSearchClick();
			if (props.onKeyDown) props.onKeyDown(e as any);
		};

		// Determine if we should show the shortcut hint
		const showShortcut = activeShortcut && !['iphone', 'ipad', 'android'].includes(platform);
		const shortcutText = platform === 'macos' ? activeShortcut : `Ctrl + ${activeShortcut}`;

		return (
			<div
				className={`${baseClasses} relative group flex items-center gap-1.5 w-full h-10 pl-4 pr-1.5 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-(--accent) focus-within:border-transparent ${className}`}
			>
				<input
					ref={setRefs}
					type="text"
					data-search-shortcut={activeShortcut ? activeShortcut.toLowerCase() : undefined}
					className="flex-1 min-w-0 h-full bg-transparent border-none outline-none text-sm text-(--text) placeholder:text-(--text-muted) truncate"
					onKeyDown={handleKeyDown}
					{...(props as React.InputHTMLAttributes<HTMLInputElement>)}
				/>
				{showShortcut && (
					<div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-(--background) border border-(--border)/10 text-[11px] text-(--text-muted) font-mono shrink-0 pointer-events-none">
						{platform === 'macos' ? <Command className="w-3 h-3" /> : null}
						<span>{shortcutText}</span>
					</div>
				)}
				<button
					type="button"
					aria-label={props.placeholder ? String(props.placeholder) : 'Search'}
					className="rounded-xl bg-(--accent) text-(--accent-contrast) hover:bg-(--hover-accent) shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_35%,transparent)] w-7 h-7 p-0 flex items-center justify-center shrink-0 aspect-square transition-colors cursor-pointer active:scale-95"
					onClick={handleSearchClick}
				>
					<Search className="w-3.5 h-3.5" />
				</button>
			</div>
		);
	}

	// Default for 'text' and 'date'
	return (
		<input
			ref={setRefs}
			type={variant}
			data-search-shortcut={activeShortcut ? activeShortcut.toLowerCase() : undefined}
			className={`${baseClasses} rounded-2xl p-3 w-full ${className}`}
			{...(props as React.InputHTMLAttributes<HTMLInputElement>)}
		/>
	);
}
