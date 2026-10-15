/** @format */
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Search, User as UserIcon, X } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import type { UserOption } from './types';

interface AsyncUserMultiSelectorProps {
	values: string[];
	onChange: (vals: string[]) => void;
	getEnvUrl: (url: string) => string;
	placeholder?: string;
}

export function AsyncUserMultiSelector({ values, onChange, getEnvUrl, placeholder }: AsyncUserMultiSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [users, setUsers] = useState<UserOption[]>([]);
	const [loading, setLoading] = useState(false);
	const { t } = useDictionary();
	const ref = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const fetchedIds = useRef(new Set<string>());

	// Fetch all known secure users ONCE
	useEffect(() => {
		let isMounted = true;
		const fetchUsers = async () => {
			setLoading(true);
			try {
				const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/users'), {
					credentials: 'include',
				});
				if (res.ok) {
					const data = await res.json();
					if (isMounted) {
						setUsers((prev) => {
							const map = new Map(prev.map((u) => [u.id, u]));
							data.forEach((u: UserOption) => {
								if (!map.has(u.id)) map.set(u.id, u);
							});
							return Array.from(map.values());
						});
					}
				}
			} catch (err) {
				console.error('Failed to fetch users:', err);
			} finally {
				if (isMounted) setLoading(false);
			}
		};
		fetchUsers();
		return () => {
			isMounted = false;
		};
	}, [getEnvUrl]);

	// Fetch full Discord profile for selected values if missing
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
								if (prev.some((u) => u.id === data.id)) {
									return prev.map((u) =>
										u.id === data.id
											? {
													...u,
													...data,
												}
											: u
									);
								}
								return [...prev, data];
							});
						}
					})
					.catch(() => {});
			}
		});
	}, [values, users, getEnvUrl]);

	// Fetch full Discord profile dynamically if the user types a valid Discord ID
	useEffect(() => {
		if (/^\d{17,20}$/.test(query) && !fetchedIds.current.has(query)) {
			fetchedIds.current.add(query);
			fetch(getEnvUrl(`https://api.xernerx.com/core/users/${query}/discord`), {
				credentials: 'include',
			})
				.then((res) => (res.ok ? res.json() : null))
				.then((data) => {
					if (data && data.id) {
						setUsers((prev) => {
							if (prev.some((u) => u.id === data.id)) {
								return prev.map((u) =>
									u.id === data.id
										? {
												...u,
												...data,
											}
										: u
								);
							}
							return [...prev, data];
						});
					}
				})
				.catch(() => {});
		}
	}, [query, getEnvUrl]);

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

	// Filter, exclude already selected, and limit to 30
	const filteredUsers = useMemo(() => {
		const q = query.toLowerCase();
		return users
			.filter(
				(u) =>
					!values.includes(u.id) &&
					(u.id?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q) || u.global_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q))
			)
			.slice(0, 30);
	}, [users, query, values]);

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

	return (
		<div className="flex flex-col gap-2 w-full" ref={ref}>
			{/* Selected Pills */}
			{values.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{values.map((id) => {
						const u = users.find((u) => u.id === id);
						return (
							<div
								key={id}
								className="flex items-center gap-1.5 rounded-xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md pl-2 pr-1.5 py-1 text-xs text-(--text) shadow-sm"
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
					className="flex w-full items-center justify-between rounded-xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm text-(--text) shadow-sm transition-all hover:border-(--accent)/50 focus:border-(--accent) focus:outline-none"
					style={{
						padding: 'calc(var(--ui-gap) * 0.75)',
						gap: 'var(--ui-gap)',
					}}
				>
					<span className="text-(--text-muted) font-medium">{placeholder || t('admin.tokens.ownersPlaceholder')}</span>
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
							className="absolute left-0 top-[calc(100%+8px)] z-999 w-full overflow-hidden rounded-xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-2xl"
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
									placeholder={t('admin.tokens.ownersPlaceholder')}
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="w-full rounded-xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md text-xs text-(--text) focus:outline-none focus:ring-1 focus:ring-(--accent)"
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
								{loading && users.length === 0 ? (
									<div className="py-6 flex justify-center">
										<Loading />
									</div>
								) : filteredUsers.length === 0 ? (
									<div className="py-4 text-center text-xs text-(--text-muted)">{t('admin.tokens.empty.title')}</div>
								) : (
									filteredUsers.map((u) => (
										<button
											type="button"
											key={u.id}
											onClick={() => handleSelect(u.id)}
											className="flex w-full items-center justify-between rounded-xl text-sm transition-colors text-(--text) hover:bg-(--border)/5"
											style={{
												padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)',
											}}
										>
											<div className="flex items-center gap-2 truncate">
												{u.avatar ? (
													<img src={`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
												) : (
													<UserIcon size={16} className="text-(--text-muted) shrink-0" />
												)}
												<span className="font-medium truncate">{u.global_name || u.name || u.username || u.id}</span>
											</div>
										</button>
									))
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
