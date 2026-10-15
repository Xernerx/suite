/** @format */
'use client';

import { ChevronDown, Search, User as UserIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDictionary } from '@xernerx/providers';
import { useEffect, useRef, useState } from 'react';
import { Loading } from '@xernerx/feedback';
import { UserOption } from './types';

interface AsyncUserMultiSelectorProps {
	values: string[];
	onChange: (vals: string[]) => void;
	getEnvUrl: (url: string) => string;
	placeholder?: string;
}

export default function AsyncUserMultiSelector({ values, onChange, getEnvUrl, placeholder }: AsyncUserMultiSelectorProps) {
	const { t } = useDictionary();
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [users, setUsers] = useState<UserOption[]>([]);
	const [loading, setLoading] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const fetchedIds = useRef(new Set<string>());

	// 1. Fetch full Discord profile for selected values on mount (to render chips correctly)
	useEffect(() => {
		values.forEach((val) => {
			if (val && !users.find((u) => u.id === val) && !fetchedIds.current.has(val)) {
				fetchedIds.current.add(val);
				fetch(getEnvUrl(`https://api.xernerx.com/core/users/${val}/discord`), {
					credentials: 'include',
				})
					.then((res) => (res.ok ? res.json() : null))
					.then((data) => {
						if (data && data.id) {
							setUsers((prev) => {
								if (prev.some((u) => u.id === data.id)) return prev;
								return [...prev, data];
							});
						}
					})
					.catch(() => {});
			}
		});
	}, [values, users, getEnvUrl]);

	// 2. Fetch full Discord profile dynamically if the user types a valid Discord ID
	const isValidId = /^\d{17,20}$/.test(query);
	useEffect(() => {
		if (isValidId && !fetchedIds.current.has(query)) {
			setLoading(true);
			fetchedIds.current.add(query);
			fetch(getEnvUrl(`https://api.xernerx.com/core/users/${query}/discord`), {
				credentials: 'include',
			})
				.then((res) => (res.ok ? res.json() : null))
				.then((data) => {
					if (data && data.id) {
						setUsers((prev) => {
							if (prev.some((u) => u.id === data.id)) return prev;
							return [...prev, data];
						});
					}
				})
				.catch(() => {})
				.finally(() => setLoading(false));
		}
	}, [query, isValidId, getEnvUrl]);

	// Close on click outside
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
			setTimeout(() => inputRef.current?.focus(), 50);
		} else {
			setQuery('');
		}
	}, [isOpen]);

	const handleRemove = (idToRemove: string) => {
		onChange(values.filter((id) => id !== idToRemove));
	};

	const handleSelect = (idToAdd: string) => {
		if (!values.includes(idToAdd)) {
			onChange([...values, idToAdd]);
		}
		setIsOpen(false);
		setQuery('');
	};

	const searchedUser = users.find((u) => u.id === query);
	const canAdd = isValidId && searchedUser && !values.includes(searchedUser.id);

	return (
		<div className="flex flex-col gap-2 w-full overflow-visible" ref={ref}>
			{/* Selected Pills */}
			{values.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{values.map((id) => {
						const u = users.find((u) => u.id === id);
						return (
							<div
								key={id}
								className="flex items-center gap-1.5 rounded-xl border border-(--border)/20 bg-(--foreground)/30 backdrop-blur-md pl-2 pr-1.5 py-1.5 text-xs text-(--text) shadow-sm transition hover:border-(--accent)/50"
							>
								{u?.avatar ? (
									<img src={`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`} alt="" className="h-4 w-4 rounded-full object-cover shrink-0" />
								) : (
									<UserIcon size={12} className="text-(--text-muted) shrink-0" />
								)}
								<span className="font-medium truncate max-w-[120px]">{u ? u.global_name || u.name || u.username || u.id : id}</span>
								<button
									type="button"
									onClick={() => handleRemove(id)}
									className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-red-500/10 text-(--text-muted) hover:text-red-500 transition-colors"
								>
									<X size={10} />
								</button>
							</div>
						);
					})}
				</div>
			)}

			<div className="relative w-full">
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="flex w-full items-center justify-between rounded-xl border border-(--border)/20 bg-(--background) px-4 py-2.5 text-sm font-medium text-(--text) outline-none transition focus:border-(--accent)"
				>
					<span className="text-(--text-muted) font-medium">{placeholder || t('account.tokens.manage.ownersPlaceholder')}</span>
					<ChevronDown className={`h-4 w-4 text-(--text-muted) transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
				</button>

				<AnimatePresence>
					{isOpen && (
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
							className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-2xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-2xl"
							style={{
								padding: 'calc(var(--ui-gap) * 0.25)',
								display: 'flex',
								flexDirection: 'column',
								gap: 'calc(var(--ui-gap) * 0.25)',
							}}
						>
							{/* Search Filter Input */}
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
									placeholder={t('account.tokens.manage.ownersPlaceholder')}
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="w-full rounded-xl border border-(--border)/10 bg-(--background) text-xs text-(--text) focus:outline-none focus:ring-1 focus:ring-(--accent)"
									style={{
										padding: 'calc(var(--ui-gap) * 0.4) calc(var(--ui-gap) * 0.5) calc(var(--ui-gap) * 0.4) calc(var(--ui-gap) * 2)',
									}}
									onClick={(e) => e.stopPropagation()}
								/>
							</div>

							{/* Options List */}
							<div
								className="overflow-y-auto max-h-52 flex flex-col"
								style={{
									gap: 'calc(var(--ui-gap) * 0.25)',
								}}
							>
								{!isValidId ? (
									<div className="py-4 text-center text-xs text-(--text-muted)">{t('account.tokens.manage.invalidIdPrompt')}</div>
								) : loading ? (
									<div className="py-6 flex justify-center">
										<Loading />
									</div>
								) : canAdd ? (
									<button
										type="button"
										onClick={() => handleSelect(searchedUser.id)}
										className="flex w-full items-center justify-between rounded-xl text-sm transition-colors text-(--text) hover:bg-(--border)/5"
										style={{
											padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)',
										}}
									>
										<div className="flex items-center gap-2 truncate">
											{searchedUser.avatar ? (
												<img
													src={`https://cdn.discordapp.com/avatars/${searchedUser.id}/${searchedUser.avatar}.png`}
													alt=""
													className="w-5 h-5 rounded-full object-cover shrink-0"
												/>
											) : (
												<UserIcon size={16} className="text-(--text-muted) shrink-0" />
											)}
											<span className="font-medium truncate">{searchedUser.global_name || searchedUser.name || searchedUser.username || searchedUser.id}</span>
										</div>
									</button>
								) : searchedUser && values.includes(searchedUser.id) ? (
									<div className="py-4 text-center text-xs text-(--text-muted)">{t('account.tokens.manage.userAlreadyAdded')}</div>
								) : (
									<div className="py-4 text-center text-xs text-(--text-muted)">{t('account.tokens.manage.userNotFound')}</div>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
