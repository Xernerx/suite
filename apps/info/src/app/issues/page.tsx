/** @format */
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useEnvironment, useUser, useToast, useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Input, MultiSelector } from '@xernerx/ui';
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
	const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
	const [search, setSearch] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [attachment, setAttachment] = useState<File | null>(null);
	const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
	const [preUploadedScreenshot, setPreUploadedScreenshot] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);

	const toggleProduct = (prod: string) => {
		setSelectedProducts((prev) => (prev.includes(prod) ? prev.filter((p) => p !== prod) : [...prev, prod]));
	};

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
			const statusParam = params.get('status');
			const reportParam = params.get('report');
			const pageParam = params.get('page');
			const screenshotParam = params.get('screenshot');
			const savedDraft = sessionStorage.getItem('xernerx_issue_draft') || sessionStorage.getItem('xernerx_bug_draft');
			if (qParam) {
				setSearch(qParam);
			} else if (savedDraft) {
				setSearch(savedDraft);
				sessionStorage.removeItem('xernerx_issue_draft');
				sessionStorage.removeItem('xernerx_bug_draft');
			}
			if (reportParam === '1') {
				setShowForm(true);
				setProduct(prodParam || 'App');
				if (pageParam) {
					setDescription((prev) => (prev.trim() ? prev : `**Page:** \`${pageParam}\`\n\n`));
				}
				if (screenshotParam) {
					setPreUploadedScreenshot(screenshotParam);
				}
				const bridge = (window as any).electron;
				if (bridge?.consumeBugReport) {
					bridge
						.consumeBugReport()
						.then(async (report: any) => {
							if (!report?.dataUrl) return;
							if (report.pageUrl && !pageParam) {
								setDescription((prev) => (prev.trim() ? prev : `**Page:** \`${report.pageUrl}\`\n\n`));
							}
							try {
								const res = await fetch(report.dataUrl);
								const blob = await res.blob();
								const file = new File([blob], report.filename || `xernerx-issue-${Date.now()}.png`, { type: 'image/png' });
								setAttachment(file);
							} catch {}
						})
						.catch(() => {});
				}
			} else if (prodParam) {
				setSelectedProducts(prodParam.split(',').filter(Boolean));
			}
			if (statusParam) {
				const valid = statusParam.split(',').filter((s) => ['verified', 'submitted', 'release', 'mine'].includes(s));
				if (valid.length > 0) setSelectedStatuses(valid);
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
		const qs = params.toString();
		window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
	}, [selectedProducts, selectedStatuses, loading]);

	const fetchIssues = async () => {
		const botIds = new Set<string>();
		let resolvedOrgBots: { id: string; name: string; avatarUrl: string | null }[] = [];

		try {
			const [issRes, prodRes] = await Promise.all([
				fetch(getEnvUrl('https://api.xernerx.com/info/issues?status=open'), { credentials: 'include' }),
				fetch(getEnvUrl('https://api.xernerx.com/info/roadmap/products'), { credentials: 'include' }),
			]);
			if (!issRes.ok) throw new Error(`HTTP ${issRes.status}`);
			const d = await issRes.json();
			const list = d.data || [];
			setIssues(list);
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
			toast({ type: 'error', title: t('info.bugs.toasts.error'), description: err.message });
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
		if (!user) return toast({ type: 'error', title: t('info.bugs.toasts.notAuthenticated'), description: t('info.bugs.toasts.mustBeLoggedIn') });
		if (!product) return toast({ type: 'error', title: t('info.bugs.toasts.error'), description: t('info.bugs.toasts.productRequired') });
		if (!title || !description) return;

		setUploading(true);
		let finalDescription = description;

		try {
			if (preUploadedScreenshot) {
				finalDescription += `\n\n**Attachment:** [Screenshot](${preUploadedScreenshot})`;
			} else if (attachment) {
				const formData = new FormData();
				formData.append('file', attachment);
				const cdnRes = await fetch(getEnvUrl(`https://cdn.xernerx.com/upload/${user.id}`), { method: 'POST', credentials: 'include', body: formData });
				if (!cdnRes.ok) throw new Error((await cdnRes.text()) || t('info.bugs.toasts.failedToUpload'));
				const cdnData = await cdnRes.json();
				if (cdnData.url) finalDescription += `\n\n**Attachment:** [${attachment.name}](${cdnData.url})`;
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
				body: JSON.stringify({ title, description: finalDescription, productId: resolved?.name || product, botId: resolved?.id || null }),
			});
			if (res.status === 409) return toast({ type: 'error', title: t('info.bugs.toasts.duplicate'), description: t('info.bugs.toasts.duplicateTitle') });
			if (!res.ok) throw new Error('Failed');
			toast({ type: 'success', title: t('info.bugs.toasts.success'), description: t('info.bugs.toasts.submitted') });
			setTitle('');
			setDescription('');
			setProduct('');
			setSearch('');
			setAttachment(null);
			setPreUploadedScreenshot(null);
			setUploading(false);
			setShowForm(false);
			fetchIssues();
		} catch {
			setUploading(false);
			toast({ type: 'error', title: t('info.bugs.toasts.error'), description: t('info.bugs.toasts.failedToPost') });
		}
	};

	const availableProducts = useMemo(() => {
		if (products.length > 0) return products;
		const openIssues = issues.filter((s: any) => s.status !== 'resolved');
		const set = new Set<string>();
		openIssues.forEach((s: any) => {
			if (s.productId) set.add(s.productId);
		});
		return Array.from(set).filter(Boolean);
	}, [products, issues]);

	const filteredIssues = useMemo(() => {
		const openIssues = issues.filter((s: any) => s.status !== 'resolved');
		return openIssues.filter((s: any) => {
			if (selectedStatuses.length > 0) {
				const matchesStatus = selectedStatuses.some((st) => {
					if (st === 'verified') return Boolean(s.acknowledged);
					if (st === 'submitted') return !s.acknowledged;
					if (st === 'release') return Boolean(s.resolvedApp && s.resolvedVersion);
					if (st === 'mine') return Boolean(user?.id && (s.authorId === user.id || s.author?.id === user.id));
					return false;
				});
				if (!matchesStatus) return false;
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
	}, [search, selectedProducts, selectedStatuses, issues, orgBots, botProfiles, user?.id]);

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
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full min-h-screen pt-24 px-4 sm:px-8 pb-24">
			<div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 mb-8 border-b border-(--border)/10 relative z-30">
				<div className="flex flex-col gap-1.5">
					<h1 className="text-3xl sm:text-4xl font-black tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('info.bugs.title')}
					</h1>
					<p className="text-sm sm:text-base text-(--text-muted) max-w-2xl">{t('info.bugs.description')}</p>
				</div>

				<div className="flex flex-col gap-1.5 w-full lg:w-auto">
					<div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
						<div className="w-full sm:w-80 xl:w-96">
							<Input variant="search" shortcut={true} placeholder={t('info.bugs.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
						</div>
						<MultiSelector
							className="w-full sm:w-auto shrink-0"
							placeholder={t('info.bugs.allProducts')}
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
							placeholder={t('info.bugs.filters.all')}
							value={selectedStatuses}
							onChange={setSelectedStatuses}
							options={[
								{ value: 'verified', label: t('info.bugs.filters.verified'), color: 'var(--accent)' },
								{ value: 'submitted', label: t('info.bugs.filters.submitted'), color: 'var(--accent-orange)' },
								{ value: 'release', label: t('info.bugs.filters.release'), color: 'var(--accent-green)' },
								...(user ? [{ value: 'mine', label: t('info.bugs.filters.mine'), color: 'var(--text-muted)' }] : []),
							]}
						/>
					</div>
					<p className="text-xs text-(--text-muted) px-2">{t('info.bugs.startTyping')}</p>
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
								preUploadedScreenshot={preUploadedScreenshot}
								onClearPreUploaded={() => setPreUploadedScreenshot(null)}
								uploading={uploading}
								submitIssue={submitIssue}
								handlePaste={handlePaste}
								onCancel={() => setShowForm(false)}
							/>
						) : !user && showForm ? (
							<motion.div
								key="login-prompt"
								initial={{ opacity: 0, scale: 0.96, y: 10 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.96, y: -10 }}
								className="p-8 text-center border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm rounded-3xl flex flex-col items-center justify-center gap-4 text-(--text-muted)"
							>
								<div className="text-base font-bold text-(--text)">{t('info.bugs.newBug')}</div>
								<div className="text-sm">{t('info.suggestions.loginToSubmit')}</div>
								<div className="flex items-center gap-2">
									<Button
										onClick={() => {
											if (typeof window !== 'undefined') {
												window.location.href = `${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(window.location.href)}`;
											}
										}}
									>
										<LogIn size={16} />
										{t('common.sidebar.login')}
									</Button>
									<Button variant="secondary" onClick={() => setShowForm(false)}>
										{t('info.bugs.cancel')}
									</Button>
								</div>
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
									{filteredIssues.map((s: any) => (
										<IssueCard key={s.id} issue={s} botInfo={resolveBot(s)} onToggleProduct={toggleProduct} />
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
