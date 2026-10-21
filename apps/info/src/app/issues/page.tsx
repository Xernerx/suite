/** @format */
'use client';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useEnvironment, useUser, useToast, useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Input } from '@xernerx/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn } from 'lucide-react';
import IssueCard from '@/components/issues/IssueCard';
import { IssueSubmitForm } from '@/components/issues/IssueSubmitForm';

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

export default function IssuesPage() {
	const { getEnvUrl, isReady } = useEnvironment();
	const { user } = useUser();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [issues, setIssues] = useState<any[]>([]);
	const [products, setProducts] = useState<string[]>([]);
	const [orgBots, setOrgBots] = useState<{ id: string; name: string; avatarUrl: string | null }[]>([]);
	const [botProfiles, setBotProfiles] = useState<Record<string, { name: string; avatarUrl: string | null }>>({});
	const [loading, setLoading] = useState(true);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [product, setProduct] = useState('');
	const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'submitted' | 'release'>('all');
	const [search, setSearch] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [attachment, setAttachment] = useState<File | null>(null);
	const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		if (!attachment || !attachment.type.startsWith('image/')) {
			setAttachmentPreview(null);
			return;
		}
		const url = URL.createObjectURL(attachment);
		setAttachmentPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [attachment]);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const qParam = params.get('q');
			const prodParam = params.get('product');
			const statusParam = params.get('status') as any;
			const savedDraft = sessionStorage.getItem('xernerx_issue_draft') || sessionStorage.getItem('xernerx_bug_draft');
			if (qParam) {
				setSearch(qParam);
			} else if (savedDraft) {
				setSearch(savedDraft);
				sessionStorage.removeItem('xernerx_issue_draft');
				sessionStorage.removeItem('xernerx_bug_draft');
			}
			if (prodParam) setSelectedProduct(prodParam);
			if (statusParam && ['all', 'verified', 'submitted', 'release'].includes(statusParam)) {
				setStatusFilter(statusParam);
			}
		}
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined' || loading) return;
		const params = new URLSearchParams(window.location.search);
		if (selectedProduct) params.set('product', selectedProduct);
		else params.delete('product');
		if (statusFilter !== 'all') params.set('status', statusFilter);
		else params.delete('status');
		const qs = params.toString();
		window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
	}, [selectedProduct, statusFilter, loading]);

	const fetchIssues = async () => {
		const botIds = new Set<string>();

		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/info/issues?status=open'));
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const d = await res.json();
			const list = d.data || [];
			setIssues(list);
			list.forEach((s: any) => {
				if (s?.botId && /^\d{17,20}$/.test(String(s.botId).trim())) {
					botIds.add(String(s.botId).trim());
				} else if (s?.productId && /^\d{17,20}$/.test(String(s.productId).trim())) {
					botIds.add(String(s.productId).trim());
				}
			});
		} catch (err: any) {
			toast({ type: 'error', title: t('info.bugs.toasts.error'), description: err.message });
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
		fetchIssues();
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

	const submitIssue = async (e: any) => {
		e.preventDefault();
		if (!user)
			return toast({
				type: 'error',
				title: t('info.bugs.toasts.notAuthenticated'),
				description: t('info.bugs.toasts.mustBeLoggedIn'),
			});
		if (!product) {
			return toast({
				type: 'error',
				title: t('info.bugs.toasts.error'),
				description: t('info.bugs.toasts.productRequired'),
			});
		}
		if (!title || !description) return;

		setUploading(true);
		let finalDescription = description;

		try {
			if (attachment) {
				const formData = new FormData();
				formData.append('file', attachment);

				const cdnRes = await fetch(getEnvUrl('https://cdn.xernerx.com/upload'), {
					method: 'POST',
					credentials: 'include',
					body: formData,
				});

				if (!cdnRes.ok) {
					const errText = await cdnRes.text();
					throw new Error(errText || t('info.bugs.toasts.failedToUpload'));
				}

				const cdnData = await cdnRes.json();
				if (cdnData.url) {
					finalDescription += `\n\n**Attachment:** [${attachment.name}](${cdnData.url})`;
				}
			}
		} catch (err: any) {
			setUploading(false);
			return toast({ type: 'error', title: t('info.bugs.toasts.uploadFailed'), description: err.message });
		}

		const resolved = resolveBot(product);

		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/info/issues'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					title,
					description: finalDescription,
					productId: resolved?.name || product,
					botId: resolved?.id || null,
				}),
			});
			if (res.status === 409)
				return toast({
					type: 'error',
					title: t('info.bugs.toasts.duplicate'),
					description: t('info.bugs.toasts.duplicateTitle'),
				});
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: t('info.bugs.toasts.success'), description: t('info.bugs.toasts.submitted') });
			setTitle('');
			setDescription('');
			setProduct('');
			setSearch('');
			setAttachment(null);
			setUploading(false);
			setShowForm(false);
			fetchIssues();
		} catch (err) {
			setUploading(false);
			toast({ type: 'error', title: t('info.bugs.toasts.error'), description: t('info.bugs.toasts.failedToPost') });
		}
	};

	const availableProducts = useMemo(() => {
		const openIssues = issues.filter((s: any) => s.status !== 'resolved');
		const set = new Set<string>(products);
		openIssues.forEach((s: any) => {
			if (s.productId) set.add(s.productId);
		});
		return Array.from(set).filter(Boolean);
	}, [products, issues]);

	const filteredIssues = useMemo(() => {
		const openIssues = issues.filter((s: any) => s.status !== 'resolved');
		return openIssues.filter((s: any) => {
			if (statusFilter === 'verified' && !s.acknowledged) return false;
			if (statusFilter === 'submitted' && s.acknowledged) return false;
			if (statusFilter === 'release' && !(s.resolvedApp && s.resolvedVersion)) return false;

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
	}, [search, selectedProduct, statusFilter, issues, orgBots, botProfiles]);

	const handlePaste = (e: React.ClipboardEvent) => {
		const items = e.clipboardData?.items;
		if (!items) return;
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (item.kind === 'file') {
				const file = item.getAsFile();
				if (file) {
					setAttachment(file);
					break;
				}
			}
		}
	};

	return (
		<div className="flex flex-col max-w-[1600px] mx-auto w-full p-8 md:p-12 pb-24 gap-12">
			<motion.div initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="text-center">
				<h1 className="text-4xl font-bold mb-4 text-(--text)">{t('info.bugs.title')}</h1>
				<p className="text-(--text-muted)">{t('info.bugs.description')}</p>
			</motion.div>

			<div className="max-w-3xl mx-auto w-full">
				{loading ? (
					<div className="flex items-center justify-center py-24">
						<Loading />
					</div>
				) : (
					<AnimatePresence mode="wait">
						{user && showForm ? (
							<IssueSubmitForm
								title={title}
								setTitle={setTitle}
								description={description}
								setDescription={setDescription}
								product={product}
								setProduct={setProduct}
								products={products}
								resolveBot={resolveBot}
								attachment={attachment}
								setAttachment={setAttachment}
								attachmentPreview={attachmentPreview}
								uploading={uploading}
								submitIssue={submitIssue}
								handlePaste={handlePaste}
								onCancel={() => setShowForm(false)}
							/>
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
									<Input variant="search" shortcut={true} placeholder={t('info.bugs.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
									<div className="flex flex-wrap items-center justify-between gap-2 px-1">
										<p className="text-xs text-(--text-muted)">{t('info.bugs.startTyping')}</p>
										<div className="flex flex-wrap items-center gap-1 p-0.5 rounded-full bg-(--foreground)/40 border border-(--border)/10">
											{(
												[
													{ id: 'all', label: t('info.bugs.filters.all') },
													{ id: 'verified', label: t('info.bugs.filters.verified') },
													{ id: 'submitted', label: t('info.bugs.filters.submitted') },
													{ id: 'release', label: t('info.bugs.filters.release') },
												] as Array<{ id: 'all' | 'verified' | 'submitted' | 'release'; label: string }>
											).map((opt) => (
												<button
													key={opt.id}
													type="button"
													onClick={() => setStatusFilter(opt.id)}
													className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
														statusFilter === opt.id ? 'bg-(--accent) text-white shadow-xs' : 'text-(--text-muted) hover:text-(--text)'
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
												{t('info.bugs.allProducts')}
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
														{botInfo?.avatarUrl && (
															<Image src={botInfo.avatarUrl} alt={botInfo.name} width={16} height={16} unoptimized className="w-4 h-4 rounded-full object-cover" />
														)}
														<span>{botInfo ? botInfo.name : prod}</span>
													</button>
												);
											})}
										</div>
									)}
								</div>

								<AnimatePresence mode="popLayout">
									{filteredIssues.map((s: any) => (
										<IssueCard key={s.id} issue={s} botInfo={resolveBot(s)} selectedProduct={selectedProduct} onSelectProduct={setSelectedProduct} />
									))}
								</AnimatePresence>

								{filteredIssues.length === 0 && !search.trim() && (
									<motion.div
										initial={{ opacity: 0, scale: 0.95 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ duration: 0.25 }}
										className="p-8 text-center border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm rounded-xl flex flex-col items-center justify-center gap-2 text-(--text-muted)"
									>
										<div>{t('info.roadmap.knownIssues.noOpenIssues')}</div>
									</motion.div>
								)}

								{filteredIssues.length === 0 && search.trim() && (
									<motion.div
										initial={{ opacity: 0, scale: 0.95 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ duration: 0.25 }}
										className="p-8 text-center border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm rounded-xl flex flex-col items-center justify-center gap-4 text-(--text-muted)"
									>
										<div>{t('info.bugs.noMatch', { query: search })}</div>
										{user ? (
											<Button
												onClick={() => {
													setTitle(search);
													setSearch('');
													setShowForm(true);
												}}
											>
												{t('info.bugs.reportAsNew')}
											</Button>
										) : (
											<div className="flex flex-col items-center gap-3">
												<div>{t('info.suggestions.loginToSubmit')}</div>
												<Button
													onClick={() => {
														if (typeof window !== 'undefined') {
															sessionStorage.setItem('xernerx_issue_draft', search);
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
