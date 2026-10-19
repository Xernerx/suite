/** @format */
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useEnvironment, useUser, useToast, useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Selector, Input } from '@xernerx/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn } from 'lucide-react';

function fuzzySearch(query: string, text: string) {
	if (!query) return true;
	const q = query.toLowerCase().replace(/\s+/g, '');
	const t = text.toLowerCase();
	let i = 0,
		j = 0;
	while (i < q.length && j < t.length) {
		if (q[i] === t[j]) i++;
		j++;
	}
	return i === q.length;
}

export default function SuggestionsPage() {
	const { getEnvUrl, isReady } = useEnvironment();
	const { user } = useUser();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [suggestions, setSuggestions] = useState<any[]>([]);
	const [products, setProducts] = useState<string[]>([]);
	const [orgBots, setOrgBots] = useState<{ id: string; name: string; avatarUrl: string | null }[]>([]);
	const [botProfiles, setBotProfiles] = useState<Record<string, { name: string; avatarUrl: string | null }>>({});
	const [loading, setLoading] = useState(true);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [product, setProduct] = useState('');
	const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<'top' | 'newest' | 'mine'>('top');
	const [search, setSearch] = useState('');
	const [showForm, setShowForm] = useState(false);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const qParam = params.get('q');
			const savedDraft = sessionStorage.getItem('xernerx_suggestion_draft');
			if (qParam) {
				setSearch(qParam);
			} else if (savedDraft) {
				setSearch(savedDraft);
				sessionStorage.removeItem('xernerx_suggestion_draft');
			}
		}
	}, []);

	const fetchSuggestions = async () => {
		const botIds = new Set<string>();

		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/info/suggestions'));
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const d = await res.json();
			const list = d.data || [];
			setSuggestions(list);
			list.forEach((s: any) => {
				if (s?.botId && /^\d{17,20}$/.test(String(s.botId).trim())) {
					botIds.add(String(s.botId).trim());
				} else if (s?.productId && /^\d{17,20}$/.test(String(s.productId).trim())) {
					botIds.add(String(s.productId).trim());
				}
			});
		} catch (err: any) {
			toast({ type: 'error', title: t('info.suggestions.toasts.error'), description: err.message });
		}

		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/info/roadmap/products'));
			if (res.ok) {
				const d = await res.json();
				setProducts(d.data || []);
				if (Array.isArray(d.bots)) {
					setOrgBots(d.bots);
					d.bots.forEach((b: any) => {
						if (b?.id && /^\d{17,20}$/.test(String(b.id).trim())) {
							botIds.add(String(b.id).trim());
						}
					});
				}
			}
		} catch {}

		botIds.forEach((id) => {
			fetch(getEnvUrl(`https://api.xernerx.com/core/users/${id}/discord`))
				.then((res) => (res.ok ? res.json() : null))
				.then((d) => {
					if (!d) return;
					setBotProfiles((prev) => ({
						...prev,
						[id]: {
							name: d.global_name || d.username || id,
							avatarUrl: d.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
						},
					}));
				})
				.catch(() => {});
		});

		setLoading(false);
	};

	useEffect(() => {
		if (!isReady) return;
		fetchSuggestions();
	}, [isReady, getEnvUrl]);

	const resolveBot = (itemOrProd: any): { id: string; name: string; avatarUrl: string | null } | null => {
		const isObj = itemOrProd && typeof itemOrProd === 'object';
		const rawBotId = isObj ? itemOrProd.botId : null;
		const rawProd = isObj ? itemOrProd.productId : itemOrProd;

		const matchedOrgBot = orgBots.find((b) => b.id === rawBotId || b.id === rawProd || (rawProd && b.name.toLowerCase() === String(rawProd).toLowerCase()));

		const targetId = rawBotId || matchedOrgBot?.id || (rawProd && /^\d{17,20}$/.test(String(rawProd).trim()) ? String(rawProd).trim() : null);

		if (!targetId) return null;
		const discordProfile = botProfiles[targetId];
		if (discordProfile) return { id: targetId, ...discordProfile };
		if (matchedOrgBot) return matchedOrgBot;
		return null;
	};

	const submitSuggestion = async (e: any) => {
		e.preventDefault();
		if (!user)
			return toast({
				type: 'error',
				title: t('info.suggestions.toasts.notAuthenticated'),
				description: t('info.suggestions.toasts.mustBeLoggedIn'),
			});
		if (!product) {
			return toast({
				type: 'error',
				title: t('info.suggestions.toasts.error'),
				description: t('info.suggestions.toasts.productRequired'),
			});
		}
		if (!title || !description) return;

		const resolved = resolveBot(product);

		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/info/suggestions'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					title,
					description,
					productId: resolved?.name || product,
					botId: resolved?.id || null,
				}),
			});
			if (res.status === 409)
				return toast({
					type: 'error',
					title: t('info.suggestions.toasts.duplicate'),
					description: t('info.suggestions.toasts.duplicateTitle'),
				});
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: t('info.suggestions.toasts.success'), description: t('info.suggestions.toasts.submitted') });
			setTitle('');
			setDescription('');
			setProduct('');
			setSearch('');
			setShowForm(false);
			fetchSuggestions();
		} catch (err) {
			toast({ type: 'error', title: t('info.suggestions.toasts.error'), description: t('info.suggestions.toasts.failedToPost') });
		}
	};

	const vote = async (id: string, action: 'upvote' | 'downvote') => {
		if (!user)
			return toast({
				type: 'error',
				title: t('info.suggestions.toasts.notAuthenticated'),
				description: t('info.suggestions.toasts.mustBeLoggedInVote'),
			});
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/info/suggestions/${id}/vote`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action }),
			});
			if (!res.ok) throw new Error('Failed to vote');
			fetchSuggestions();
		} catch (err) {
			toast({ type: 'error', title: t('info.suggestions.toasts.error'), description: t('info.suggestions.toasts.failedToVote') });
		}
	};

	const availableProducts = useMemo(() => {
		const set = new Set<string>(products);
		suggestions.forEach((s: any) => {
			if (s.productId) set.add(s.productId);
		});
		return Array.from(set).filter(Boolean);
	}, [products, suggestions]);

	const filteredSuggestions = useMemo(() => {
		const filtered = suggestions.filter((s: any) => {
			if (sortBy === 'mine' && !(user && s.upvotes?.includes(user.id))) {
				return false;
			}
			const botInfo = resolveBot(s);
			const prodName = botInfo?.name || s.productId || '';
			if (selectedProduct) {
				const selectedBot = resolveBot(selectedProduct);
				const selectedName = selectedBot?.name || selectedProduct;
				if (prodName.toLowerCase() !== selectedName.toLowerCase() && s.productId !== selectedProduct) {
					return false;
				}
			}
			if (!search) return true;
			return fuzzySearch(search, s.title) || fuzzySearch(search, s.description) || fuzzySearch(search, prodName);
		});

		return [...filtered].sort((a, b) => {
			if (sortBy === 'newest') {
				const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
				const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
				return timeB - timeA;
			}
			const votesA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
			const votesB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
			return votesB - votesA;
		});
	}, [search, selectedProduct, sortBy, user, suggestions, orgBots, botProfiles]);

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col max-w-[1600px] mx-auto w-full p-8 md:p-12 pb-24 gap-12">
			<motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="text-center">
				<h1 className="text-4xl font-bold mb-4 text-(--text)">{t('info.suggestions.title')}</h1>
				<p className="text-(--text-muted)">{t('info.suggestions.description')}</p>
			</motion.div>

			<div className="max-w-3xl mx-auto w-full">
				<AnimatePresence mode="wait">
					{user && showForm ? (
						<motion.div
							key="create-form"
							initial={{ opacity: 0, scale: 0.96, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.96, y: -10 }}
							transition={{ duration: 0.25, ease: 'easeOut' }}
							className="bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm p-6 rounded-xl flex flex-col gap-4 w-full"
						>
							<h2 className="text-xl font-bold text-(--text)">{t('info.suggestions.newSuggestion')}</h2>
							<form onSubmit={submitSuggestion} className="flex flex-col gap-4">
								<Input placeholder={t('info.suggestions.titlePlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} required />
								<Input
									variant="textarea"
									rows={4}
									placeholder={t('info.suggestions.descriptionPlaceholder')}
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									required
								/>
								<Selector
									value={product}
									options={products.map((p) => {
										const botInfo = resolveBot(p);
										return {
											value: p,
											label: botInfo ? (
												<span className="inline-flex items-center gap-2">
													{botInfo.avatarUrl && <img src={botInfo.avatarUrl} alt={botInfo.name} className="w-4 h-4 rounded-full object-cover" />}
													<span>{botInfo.name}</span>
												</span>
											) : (
												p
											),
										};
									})}
									onChange={setProduct}
									placeholder={t('info.suggestions.selectProduct')}
									required
								/>
								<div className="flex gap-2 w-full">
									<Button type="submit" className="flex-1">
										{t('info.suggestions.submit')}
									</Button>
									<Button variant="danger" type="button" onClick={() => setShowForm(false)}>
										{t('info.suggestions.cancel')}
									</Button>
								</div>
							</form>
						</motion.div>
					) : (
						<motion.div
							key="search-list"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2, ease: 'easeOut' }}
							className="flex flex-col gap-4 w-full"
						>
							<div className="flex flex-col gap-2.5">
								<Input variant="search" shortcut={true} placeholder={t('info.suggestions.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
								<div className="flex flex-wrap items-center justify-between gap-2 px-1">
									<p className="text-xs text-(--text-muted)">{t('info.suggestions.startTyping')}</p>
									<div className="flex items-center gap-1 p-0.5 rounded-full bg-(--foreground)/40 border border-(--border)/10">
										{(
											[
												{ id: 'top', label: t('info.suggestions.sort.top') },
												{ id: 'newest', label: t('info.suggestions.sort.newest') },
												...(user ? [{ id: 'mine', label: t('info.suggestions.sort.mine') }] : []),
											] as Array<{ id: 'top' | 'newest' | 'mine'; label: string }>
										).map((opt) => (
											<button
												key={opt.id}
												type="button"
												onClick={() => setSortBy(opt.id)}
												className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
													sortBy === opt.id ? 'bg-(--accent) text-white shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
												}`}
											>
												{opt.label}
											</button>
										))}
									</div>
								</div>

								{availableProducts.length > 0 && (
									<div className="flex flex-wrap items-center gap-1.5 pt-1">
										<button
											type="button"
											onClick={() => setSelectedProduct(null)}
											className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
												selectedProduct === null
													? 'bg-(--accent) text-white border-(--accent) shadow-xs'
													: 'bg-(--foreground)/30 text-(--text-muted) border-(--border)/10 hover:border-(--accent)/40 hover:text-(--text)'
											}`}
										>
											{t('info.suggestions.allProducts')}
										</button>
										{availableProducts.map((prod) => {
											const botInfo = resolveBot(prod);
											const isSelected = selectedProduct === prod;
											return (
												<button
													key={prod}
													type="button"
													onClick={() => setSelectedProduct(isSelected ? null : prod)}
													className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
														isSelected
															? 'bg-(--accent) text-white border-(--accent) shadow-xs'
															: 'bg-(--foreground)/30 text-(--text-muted) border-(--border)/10 hover:border-(--accent)/40 hover:text-(--text)'
													}`}
												>
													{botInfo?.avatarUrl && <img src={botInfo.avatarUrl} alt={botInfo.name} className="w-4 h-4 rounded-full object-cover" />}
													<span>{botInfo ? botInfo.name : prod}</span>
												</button>
											);
										})}
									</div>
								)}
							</div>

							<AnimatePresence mode="popLayout">
								{filteredSuggestions.map((s: any) => {
									const hasUpvoted = user && s.upvotes?.includes(user.id);
									const hasDownvoted = user && s.downvotes?.includes(user.id);
									const netVotes = (s.upvotes?.length || 0) - (s.downvotes?.length || 0);
									const botInfo = resolveBot(s);
									return (
										<motion.div
											key={s.id}
											layout
											initial={{ opacity: 0, y: 15 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, scale: 0.95 }}
											transition={{ duration: 0.25, ease: 'easeOut' }}
											whileHover={{ y: -2 }}
											className="flex gap-4 p-4 rounded-xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm transition-colors hover:border-(--accent)/30"
										>
											<div className="flex flex-col items-center gap-1 justify-center shrink-0">
												<motion.button
													whileHover={{ scale: 1.15 }}
													whileTap={{ scale: 0.85 }}
													onClick={() => vote(s.id, 'upvote')}
													className={`p-2 rounded cursor-pointer ${hasUpvoted ? 'bg-(--accent) text-white' : 'bg-(--foreground)/50 border border-(--border)/10 hover:border-(--accent)/50 transition-colors'}`}
												>
													▲
												</motion.button>
												<span className="font-bold">{netVotes}</span>
												<motion.button
													whileHover={{ scale: 1.15 }}
													whileTap={{ scale: 0.85 }}
													onClick={() => vote(s.id, 'downvote')}
													className={`p-2 rounded cursor-pointer ${hasDownvoted ? 'bg-red-500 text-white' : 'bg-(--foreground)/50 border border-(--border)/10 hover:border-(--accent)/50 transition-colors'}`}
												>
													▼
												</motion.button>
											</div>
											<div className="flex flex-col justify-center w-full min-w-0">
												<div className="flex justify-between items-start gap-4">
													<div className="font-bold text-lg text-(--text)">{s.title}</div>
													{s.author && (
														<div className="flex items-center gap-2 shrink-0 bg-(--foreground)/50 border border-(--border)/10 rounded-full pr-3 pl-1 py-1">
															{s.author.icon ? (
																<img src={s.author.icon} alt={s.author.name} className="w-6 h-6 rounded-full" />
															) : (
																<div className="w-6 h-6 rounded-full bg-(--accent) flex items-center justify-center text-[10px] text-white font-bold">
																	{s.author.name?.charAt(0) || '?'}
																</div>
															)}
															<span className="text-xs text-(--text-muted) font-medium truncate max-w-[100px]">{s.author.name}</span>
														</div>
													)}
												</div>
												<div className="text-(--text-muted) text-sm mb-2 mt-1">{s.description}</div>
												<button
													type="button"
													onClick={() => setSelectedProduct(selectedProduct === s.productId ? null : s.productId)}
													className="inline-flex items-center gap-1.5 text-xs font-mono bg-(--accent)/10 text-(--accent) px-2 py-1 rounded border border-(--accent)/20 w-fit cursor-pointer hover:bg-(--accent)/20 transition-colors"
												>
													{botInfo?.avatarUrl && <img src={botInfo.avatarUrl} alt={botInfo.name} className="w-4 h-4 rounded-full object-cover" />}
													{botInfo ? botInfo.name : s.productId}
												</button>
											</div>
										</motion.div>
									);
								})}
							</AnimatePresence>

							{filteredSuggestions.length === 0 && !search.trim() && (
								<motion.div
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.25 }}
									className="p-8 text-center border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm rounded-xl flex flex-col items-center justify-center gap-2 text-(--text-muted)"
								>
									<div>{t('admin.dashboard.suggestions.noSuggestions')}</div>
								</motion.div>
							)}

							{filteredSuggestions.length === 0 && search.trim() && (
								<motion.div
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.25 }}
									className="p-8 text-center border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm rounded-xl flex flex-col items-center justify-center gap-4 text-(--text-muted)"
								>
									<div>{t('info.suggestions.noMatch', { query: search })}</div>
									{user ? (
										<Button
											onClick={() => {
												setTitle(search);
												setSearch('');
												setShowForm(true);
											}}
										>
											{t('info.suggestions.addAsNew')}
										</Button>
									) : (
										<div className="flex flex-col items-center gap-3">
											<div>{t('info.suggestions.loginToSubmit')}</div>
											<Button
												onClick={() => {
													if (typeof window !== 'undefined') {
														sessionStorage.setItem('xernerx_suggestion_draft', search);
														window.location.href = `${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(window.location.href)}`;
													}
												}}
											>
												<LogIn size={16} />
												{t('common.sidebar.login')}
											</Button>
										</div>
									)}
								</motion.div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
