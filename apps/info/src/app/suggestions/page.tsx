/** @format */
'use client';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useEnvironment, useUser, useToast, useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Selector, MultiSelector, Input } from '@xernerx/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { SuggestionCard } from '@/components/suggestions/SuggestionCard';

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
	const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
	const [sortBy, setSortBy] = useState<'top' | 'newest' | 'mine'>('top');
	const [search, setSearch] = useState('');
	const [highlightedId, setHighlightedId] = useState<string | null>(null);
	const [showForm, setShowForm] = useState(false);

	const toggleProduct = (prod: string) => {
		setSelectedProducts((prev) => (prev.includes(prod) ? prev.filter((p) => p !== prod) : [...prev, prod]));
	};

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const qParam = params.get('q');
			const idParam = params.get('id') || window.location.hash.replace(/^#(?:suggestion-)?/, '');
			const prodParam = params.get('product');
			const statusParam = params.get('status');
			const sortParam = params.get('sort') as any;
			const savedDraft = sessionStorage.getItem('xernerx_suggestion_draft');
			if (idParam) {
				setHighlightedId(idParam.trim());
			}
			if (qParam) {
				setSearch(qParam);
			} else if (savedDraft) {
				setSearch(savedDraft);
				sessionStorage.removeItem('xernerx_suggestion_draft');
			}
			if (prodParam) setSelectedProducts(prodParam.split(',').filter(Boolean));
			if (statusParam) {
				const valid = statusParam.split(',').filter((s) => ['open', 'planned', 'implemented'].includes(s));
				if (valid.length > 0) setSelectedStatuses(valid);
			}
			if (sortParam && ['top', 'newest', 'mine'].includes(sortParam)) {
				setSortBy(sortParam);
			}
		}
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined' || loading) return;
		const params = new URLSearchParams(window.location.search);
		if (selectedProducts.length > 0) params.set('product', selectedProducts.join(','));
		else params.delete('product');
		if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','));
		else params.delete('status');
		if (sortBy !== 'top') params.set('sort', sortBy);
		else params.delete('sort');
		const qs = params.toString();
		window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
	}, [selectedProducts, selectedStatuses, sortBy, loading]);

	const fetchSuggestions = async () => {
		const botIds = new Set<string>();
		let resolvedOrgBots: { id: string; name: string; avatarUrl: string | null }[] = [];

		try {
			const [sugRes, prodRes] = await Promise.all([
				fetch(getEnvUrl('https://api.xernerx.com/info/suggestions'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/info/roadmap/products'), { credentials: 'include' }),
			]);

			if (!sugRes.ok) throw new Error(`HTTP ${sugRes.status}`);
			const d = await sugRes.json();
			const list = d.data || [];
			setSuggestions(list);
			list.forEach((s: any) => {
				if (s?.botId && /^\d{17,20}$/.test(String(s.botId).trim())) {
					botIds.add(String(s.botId).trim());
				} else if (s?.productId && /^\d{17,20}$/.test(String(s.productId).trim())) {
					botIds.add(String(s.productId).trim());
				}
			});

			if (prodRes.ok) {
				const pd = await prodRes.json();
				setProducts(pd.data || []);
				if (Array.isArray(pd.bots)) {
					resolvedOrgBots = pd.bots;
					setOrgBots(pd.bots);
					pd.bots.forEach((b: any) => {
						if (b?.id && /^\d{17,20}$/.test(String(b.id).trim()) && (!b.name || !b.avatarUrl)) {
							botIds.add(String(b.id).trim());
						}
					});
				}
			}
		} catch (err: any) {
			toast({ type: 'error', title: t('info.suggestions.toasts.error'), description: err.message });
		}

		const alreadyResolvedIds = new Set(resolvedOrgBots.filter((b) => b.name && b.avatarUrl).map((b) => String(b.id).trim()));
		botIds.forEach((id) => {
			if (alreadyResolvedIds.has(id)) return;
			fetch(getEnvUrl(`https://api.xernerx.com/core/users/${id}/discord`), { credentials: 'include' })
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
		if (!user) return toast({ type: 'error', title: t('info.suggestions.toasts.notAuthenticated'), description: t('info.suggestions.toasts.mustBeLoggedIn') });
		if (!product) return toast({ type: 'error', title: t('info.suggestions.toasts.error'), description: t('info.suggestions.toasts.productRequired') });
		if (!title || !description) return;

		const resolved = resolveBot(product);

		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/info/suggestions'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ title, description, productId: resolved?.name || product, botId: resolved?.id || null }),
			});
			if (res.status === 409) return toast({ type: 'error', title: t('info.suggestions.toasts.duplicate'), description: t('info.suggestions.toasts.duplicateTitle') });
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: t('info.suggestions.toasts.success'), description: t('info.suggestions.toasts.submitted') });
			setTitle('');
			setDescription('');
			setProduct('');
			setSearch('');
			setShowForm(false);
			fetchSuggestions();
		} catch {
			toast({ type: 'error', title: t('info.suggestions.toasts.error'), description: t('info.suggestions.toasts.failedToPost') });
		}
	};

	const vote = async (id: string, action: 'upvote' | 'downvote') => {
		if (!user) return toast({ type: 'error', title: t('info.suggestions.toasts.notAuthenticated'), description: t('info.suggestions.toasts.mustBeLoggedInVote') });
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/info/suggestions/${id}/vote`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action }),
			});
			if (!res.ok) throw new Error('Failed to vote');
			fetchSuggestions();
		} catch {
			toast({ type: 'error', title: t('info.suggestions.toasts.error'), description: t('info.suggestions.toasts.failedToVote') });
		}
	};

	const availableProducts = useMemo(() => {
		if (products.length > 0) return products;
		const set = new Set<string>();
		suggestions.forEach((s: any) => {
			if (s.productId) set.add(s.productId);
		});
		return Array.from(set).filter(Boolean);
	}, [products, suggestions]);

	const filteredSuggestions = useMemo(() => {
		const filtered = suggestions.filter((s: any) => {
			if (sortBy === 'mine' && !(user && (s.upvotes?.includes(user.id) || s.authorId === user.id || s.author?.id === user.id))) {
				return false;
			}
			if (selectedStatuses.length > 0) {
				const rawStatus = String(s.status || 'open').toLowerCase();
				const normalizedStatus =
					rawStatus === 'planned' || rawStatus === 'active' || rawStatus === 'approved' || rawStatus === 'accepted' || rawStatus === 'in_progress'
						? 'planned'
						: rawStatus === 'implemented' || rawStatus === 'completed' || rawStatus === 'released'
							? 'implemented'
							: 'open';
				if (!selectedStatuses.includes(normalizedStatus)) return false;
			}
			const botInfo = resolveBot(s);
			const prodName = botInfo?.name || s.productId || '';
			if (selectedProducts.length > 0) {
				const matchesAny = selectedProducts.some((sp) => {
					const selectedBot = resolveBot(sp);
					const selectedName = selectedBot?.name || sp;
					return prodName.toLowerCase() === selectedName.toLowerCase() || s.productId === sp;
				});
				if (!matchesAny) return false;
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
	}, [search, selectedProducts, sortBy, selectedStatuses, user, suggestions, orgBots, botProfiles]);

	useEffect(() => {
		if (!highlightedId || loading || typeof document === 'undefined') return;
		const timer = setTimeout(() => {
			const el = document.getElementById(`suggestion-${highlightedId}`);
			if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 150);
		return () => clearTimeout(timer);
	}, [highlightedId, loading, filteredSuggestions.length]);

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full min-h-screen pt-24 px-4 sm:px-8 pb-24">
			<div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 mb-8 border-b border-(--border)/10 relative z-30">
				<div className="flex flex-col gap-1.5">
					<h1 className="text-3xl sm:text-4xl font-black tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('info.suggestions.title')}
					</h1>
					<p className="text-sm sm:text-base text-(--text-muted) max-w-2xl">{t('info.suggestions.description')}</p>
				</div>

				<div className="flex flex-col gap-1.5 w-full lg:w-auto">
					<div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
						<div className="w-full sm:w-80 xl:w-96">
							<Input variant="search" shortcut={true} placeholder={t('info.suggestions.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
						</div>
						<MultiSelector
							className="w-full sm:w-auto shrink-0"
							placeholder={t('info.suggestions.allProducts')}
							value={selectedProducts}
							onChange={setSelectedProducts}
							options={availableProducts.map((prod) => {
								const botInfo = resolveBot(prod);
								return {
									value: prod,
									label: botInfo ? botInfo.name : prod,
								};
							})}
						/>
						<MultiSelector
							className="w-full sm:w-auto shrink-0"
							searchable={false}
							placeholder={t('info.suggestions.filters.all')}
							value={selectedStatuses}
							onChange={setSelectedStatuses}
							options={[
								{ value: 'open', label: t('info.suggestions.filters.open'), color: 'var(--text-muted)' },
								{ value: 'planned', label: t('info.suggestions.filters.planned'), color: 'var(--accent)' },
								{ value: 'implemented', label: t('info.suggestions.filters.implemented'), color: 'var(--accent-green)' },
							]}
						/>
						<div className="w-full sm:w-auto shrink-0">
							<Selector
								value={sortBy}
								onChange={(val) => setSortBy(val as any)}
								options={(['top', 'newest', ...(user ? (['mine'] as const) : [])] as const).map((id) => ({
									value: id,
									label: t(`info.suggestions.sort.${id}`),
								}))}
							/>
						</div>
					</div>
					<p className="text-xs text-(--text-muted) px-2">{t('info.suggestions.startTyping')}</p>
				</div>
			</div>

			<div className="w-full">
				{loading ? (
					<div className="flex items-center justify-center py-24">
						<Loading variant="small" />
					</div>
				) : (
					<AnimatePresence mode="wait">
						{user && showForm ? (
							<motion.div
								key="create-form"
								initial={{ opacity: 0, scale: 0.96, y: 10 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.96, y: -10 }}
								transition={{ duration: 0.25, ease: 'easeOut' }}
								className="bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm p-6 rounded-3xl flex flex-col gap-4 w-full"
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
														{botInfo.avatarUrl && (
															<Image src={botInfo.avatarUrl} alt={botInfo.name} width={16} height={16} unoptimized className="w-4 h-4 rounded-full object-cover" />
														)}
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
								<AnimatePresence mode="popLayout">
									{filteredSuggestions.map((s: any) => (
										<SuggestionCard
											key={s.id}
											suggestion={s}
											userId={user?.id}
											botInfo={resolveBot(s)}
											onToggleProduct={toggleProduct}
											onVote={vote}
											highlighted={Boolean(highlightedId && (String(s.id) === highlightedId || String(s._id) === highlightedId))}
										/>
									))}
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
				)}
			</div>
		</div>
	);
}
