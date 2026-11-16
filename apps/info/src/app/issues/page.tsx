/** @format */
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useEnvironment, useUser, useToast, useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { AnimatePresence } from 'framer-motion';
import { IssueSubmitForm } from '@/components/issues/IssueSubmitForm';
import { IssuesHeaderFilters } from '@/components/issues/IssuesHeaderFilters';
import { fuzzySearch, IssueLoginPrompt, IssuesResultsList } from '@/components/issues/IssuesListSection';

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
	const [highlightedId, setHighlightedId] = useState<string | null>(null);
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
			const idParam = params.get('id') || window.location.hash.replace(/^#(?:issue-)?/, '');
			const prodParam = params.get('product');
			const statusParam = params.get('status');
			const reportParam = params.get('report');
			const pageParam = params.get('page');
			const screenshotParam = params.get('screenshot');
			const savedDraft = sessionStorage.getItem('xernerx_issue_draft') || sessionStorage.getItem('xernerx_bug_draft');
			if (idParam) {
				setHighlightedId(idParam.trim());
			}
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
				fetch(getEnvUrl('https://api.xernerx.com/info/issues'), { credentials: 'include' }),
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
		const openIssues = issues.filter(
			(s: any) =>
				s.status !== 'resolved' ||
				(s.resolvedApp && s.resolvedVersion && s.releaseStatus !== 'production') ||
				(highlightedId && (String(s.id) === highlightedId || String(s._id) === highlightedId))
		);
		return openIssues.filter((s: any) => {
			if (highlightedId && (String(s.id) === highlightedId || String(s._id) === highlightedId) && !search && selectedProducts.length === 0 && selectedStatuses.length === 0) {
				return true;
			}
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
	}, [search, selectedProducts, selectedStatuses, issues, orgBots, botProfiles, user?.id, highlightedId]);

	useEffect(() => {
		if (!highlightedId || loading || typeof document === 'undefined') return;
		const timer = setTimeout(() => {
			const el = document.getElementById(`issue-${highlightedId}`);
			if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 150);
		return () => clearTimeout(timer);
	}, [highlightedId, loading, filteredIssues.length]);

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
			<IssuesHeaderFilters
				search={search}
				setSearch={setSearch}
				selectedProducts={selectedProducts}
				setSelectedProducts={setSelectedProducts}
				availableProducts={availableProducts}
				resolveBot={resolveBot}
				selectedStatuses={selectedStatuses}
				setSelectedStatuses={setSelectedStatuses}
				hasUser={Boolean(user)}
			/>

			<div className="w-full">
				{loading ? (
					<div className="flex items-center justify-center py-24">
						<Loading variant="small" />
					</div>
				) : (
					<AnimatePresence mode="wait">
						{user && showForm ? (
							<IssueSubmitForm
								key="create-form"
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
							<IssueLoginPrompt key="login-prompt" onCancel={() => setShowForm(false)} />
						) : (
							<IssuesResultsList
								key="search-list"
								filteredIssues={filteredIssues}
								search={search}
								highlightedId={highlightedId}
								hasUser={Boolean(user)}
								resolveBot={resolveBot}
								onToggleProduct={toggleProduct}
								onReportAsNew={() => {
									setTitle(search);
									setSearch('');
									setShowForm(true);
								}}
							/>
						)}
					</AnimatePresence>
				)}
			</div>
		</div>
	);
}
