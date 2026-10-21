/** @format */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, User as UserIcon, X } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Input } from '@xernerx/ui';
import type { UserOption } from './types';

export interface AsyncUserMultiSelectorProps {
	values: string[];
	onChange: (vals: string[]) => void;
	getEnvUrl: (url: string) => string;
	placeholder?: string;
	preloadUsers?: boolean;
}

export function AsyncUserMultiSelector({ values, onChange, getEnvUrl, placeholder, preloadUsers = false }: AsyncUserMultiSelectorProps) {
	const { t } = useDictionary();
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [users, setUsers] = useState<UserOption[]>([]);
	const [loading, setLoading] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const fetchedIds = useRef(new Set<string>());

	// Optional preload of all users (used in Admin portal)
	useEffect(() => {
		if (!preloadUsers) return;
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
	}, [getEnvUrl, preloadUsers]);

	// Fetch Discord profile for selected values if missing
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
									return prev.map((u) => (u.id === data.id ? { ...u, ...data } : u));
								}
								return [...prev, data];
							});
						}
					})
					.catch(() => {});
			}
		});
	}, [values, users, getEnvUrl]);

	// Fetch Discord profile dynamically if the user types a valid Discord ID
	const isValidId = /^\d{17,20}$/.test(query);
	useEffect(() => {
		if (isValidId && !fetchedIds.current.has(query)) {
			if (!preloadUsers) setLoading(true);
			fetchedIds.current.add(query);
			fetch(getEnvUrl(`https://api.xernerx.com/core/users/${query}/discord`), {
				credentials: 'include',
			})
				.then((res) => (res.ok ? res.json() : null))
				.then((data) => {
					if (data && data.id) {
						setUsers((prev) => {
							if (prev.some((u) => u.id === data.id)) {
								return prev.map((u) => (u.id === data.id ? { ...u, ...data } : u));
							}
							return [...prev, data];
						});
					}
				})
				.catch(() => {})
				.finally(() => {
					if (!preloadUsers) setLoading(false);
				});
		}
	}, [query, isValidId, getEnvUrl, preloadUsers]);

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

	const searchedUser = users.find((u) => u.id === query);
	const canAddSingle = isValidId && searchedUser && !values.includes(searchedUser.id);

	return (
		<div className="flex flex-col gap-2 w-full overflow-visible" ref={ref}>
			{/* Selected Pills */}
			{values.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{values.map((id) => {
						const u = users.find((user) => user.id === id);
						return (
							<div
								key={id}
								className="flex items-center gap-1.5 rounded-xl border border-(--border)/15 bg-(--background)/50 backdrop-blur-md pl-2 pr-1.5 py-1 text-xs text-(--text) shadow-sm transition hover:border-(--accent)/50"
							>
								{u?.avatar ? (
									<Image
										src={`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`}
										alt=""
										width={16}
										height={16}
										unoptimized
										className="h-4 w-4 rounded-full object-cover shrink-0"
									/>
								) : (
									<UserIcon size={12} className="text-(--text-muted) shrink-0" />
								)}
								<span className="font-medium truncate max-w-[120px]">{u ? u.global_name || u.name || u.username || u.id : id}</span>
								<button
									type="button"
									onClick={() => handleRemove(id)}
									aria-label="Remove"
									className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-(--accent-red)/10 text-(--text-muted) hover:text-(--accent-red) transition-colors cursor-pointer"
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
					className="flex w-full items-center justify-between rounded-2xl border border-(--border)/15 bg-(--foreground)/30 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-(--text) shadow-sm transition-all hover:border-(--accent)/50 focus:border-(--accent) outline-none cursor-pointer"
				>
					<span className="text-(--text-muted) font-medium">{placeholder || t('account.tokens.manage.ownersPlaceholder')}</span>
					<ChevronDown className={`h-4 w-4 text-(--text-muted) transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
				</button>

				<AnimatePresence>
					{isOpen && (
						<motion.div
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -4 }}
							transition={{ duration: 0.15, ease: 'easeOut' }}
							className="absolute left-0 top-[calc(100%+8px)] z-999 w-full overflow-hidden rounded-3xl border border-(--border)/10 bg-(--background)/95 backdrop-blur-xl shadow-2xl"
							style={{
								padding: 'calc(var(--ui-gap) * 0.25)',
								display: 'flex',
								flexDirection: 'column',
								gap: 'calc(var(--ui-gap) * 0.25)',
							}}
						>
							<div className="relative w-full" style={{ padding: 'calc(var(--ui-gap) * 0.25)' }} onClick={(e) => e.stopPropagation()}>
								<Input
									ref={inputRef}
									variant="search"
									shortcut={false}
									placeholder={t('account.tokens.manage.ownersPlaceholder')}
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="text-xs"
								/>
							</div>

							<div className="overflow-y-auto max-h-52 flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
								{preloadUsers ? (
									loading && users.length === 0 ? (
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
												className="flex w-full items-center justify-between rounded-xl text-sm transition-colors text-(--text) hover:bg-(--border)/5 cursor-pointer"
												style={{ padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)' }}
											>
												<div className="flex items-center gap-2 truncate">
													{u.avatar ? (
														<Image
															src={`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`}
															alt=""
															width={20}
															height={20}
															unoptimized
															className="w-5 h-5 rounded-full object-cover shrink-0"
														/>
													) : (
														<UserIcon size={16} className="text-(--text-muted) shrink-0" />
													)}
													<span className="font-medium truncate">{u.global_name || u.name || u.username || u.id}</span>
												</div>
											</button>
										))
									)
								) : !isValidId ? (
									<div className="py-4 text-center text-xs text-(--text-muted)">{t('account.tokens.manage.invalidIdPrompt')}</div>
								) : loading ? (
									<div className="py-6 flex justify-center">
										<Loading />
									</div>
								) : canAddSingle ? (
									<button
										type="button"
										onClick={() => handleSelect(searchedUser.id)}
										className="flex w-full items-center justify-between rounded-xl text-sm transition-colors text-(--text) hover:bg-(--border)/5 cursor-pointer"
										style={{ padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)' }}
									>
										<div className="flex items-center gap-2 truncate">
											{searchedUser.avatar ? (
												<Image
													src={`https://cdn.discordapp.com/avatars/${searchedUser.id}/${searchedUser.avatar}.png`}
													alt=""
													width={20}
													height={20}
													unoptimized
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

export default AsyncUserMultiSelector;
