'use client';
import { useState, useEffect, useMemo } from 'react';
import { useEnvironment, useUser, useToast, useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Selector, Input, Tooltip } from '@xernerx/ui';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function BugsPage() {
	const { getEnvUrl, isReady } = useEnvironment();
	const { user } = useUser();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [bugs, setBugs] = useState([]);
	const [products, setProducts] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [product, setProduct] = useState('');
	const [search, setSearch] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [attachment, setAttachment] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);

	const fetchBugs = async () => {
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/info/issues?status=open'));
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const d = await res.json();
			setBugs(d.data || []);
		} catch (err: any) {
			toast({ type: 'error', title: t('info.bugs.toasts.error'), description: err.message });
		}

		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/info/roadmap/products'));
			if (res.ok) {
				const d = await res.json();
				setProducts(d.data || []);
			}
		} catch {}
		setLoading(false);
	};

	useEffect(() => {
		if (!isReady) return;
		fetchBugs();
	}, [isReady, getEnvUrl]);

	const submitBug = async (e: any) => {
		e.preventDefault();
		if (!user)
			return toast({
				type: 'error',
				title: t('info.bugs.toasts.notAuthenticated'),
				description: t('info.bugs.toasts.mustBeLoggedIn'),
			});
		if (!title || !description || !product) return;

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

		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/info/issues'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ title, description: finalDescription, productId: product }),
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
			fetchBugs();
		} catch (err) {
			setUploading(false);
			toast({ type: 'error', title: t('info.bugs.toasts.error'), description: t('info.bugs.toasts.failedToPost') });
		}
	};

	const filteredBugs = useMemo(() => {
		const openBugs = bugs.filter((s: any) => s.status !== 'resolved');
		if (!search) return openBugs;
		return openBugs.filter((s: any) => fuzzySearch(search, s.title) || fuzzySearch(search, s.description));
	}, [search, bugs]);

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col max-w-[1600px] mx-auto w-full p-8 md:p-12 pb-24 gap-12">
			<motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="text-center">
				<h1 className="text-4xl font-bold mb-4 text-(--text)">{t('info.bugs.title')}</h1>
				<p className="text-(--text-muted)">{t('info.bugs.description')}</p>
			</motion.div>

			<div className={`grid grid-cols-1 ${user && showForm ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-8`}>
				{/* Form (Only show to logged-in users) */}
				<AnimatePresence>
					{user && showForm && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: -10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: -10 }}
							transition={{ duration: 0.25, ease: 'easeOut' }}
							className="col-span-1 bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm p-6 rounded-xl flex flex-col gap-4 h-fit"
						>
							<h2 className="text-xl font-bold text-(--text)">{t('info.bugs.newBug')}</h2>
							<form onSubmit={submitBug} className="flex flex-col gap-4">
								<Input placeholder={t('info.bugs.titlePlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} required />
								<Input
									variant="textarea"
									rows={4}
									placeholder={t('info.bugs.descriptionPlaceholder')}
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									required
								/>
								<Selector
									value={product}
									options={products.map((p) => ({ value: p, label: p }))}
									onChange={setProduct}
									placeholder={t('info.bugs.selectProduct')}
								/>
								<div className="flex flex-col gap-2">
									<label className="text-xs font-bold text-(--text-muted) uppercase">{t('info.bugs.attachFile')}</label>
									<input
										type="file"
										onChange={(e) => setAttachment(e.target.files?.[0] || null)}
										className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-(--accent) file:text-(--background) hover:file:opacity-90"
										accept="image/*,.txt,.log,.json"
									/>
								</div>
								<div className="flex gap-2 w-full">
									<Button type="submit" className="flex-1" disabled={uploading}>
										{uploading ? t('info.bugs.uploading') : t('info.bugs.submit')}
									</Button>
									<Button variant="danger" type="button" onClick={() => setShowForm(false)}>
										{t('info.bugs.cancel')}
									</Button>
								</div>
							</form>
						</motion.div>
					)}
				</AnimatePresence>

				{/* List & Search */}
				<div className={`flex flex-col gap-4 ${user && showForm ? 'col-span-2' : 'col-span-1 max-w-3xl mx-auto w-full'}`}>
					<Input variant="search" placeholder={t('info.bugs.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />

					<AnimatePresence mode="popLayout">
						{filteredBugs.map((s: any) => {
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
									<div className="flex flex-col justify-center w-full min-w-0">
										<div className="flex justify-between items-start gap-4">
											<div className="font-bold text-lg text-(--text)">{s.title}</div>
										</div>
										<div className="text-(--text-muted) text-sm mb-2 mt-1 whitespace-pre-wrap">{s.description}</div>
										<div className="flex items-center gap-2 mt-2">
											<Tooltip
												content={
													s.status === 'resolved'
														? t('info.bugs.tooltips.resolved')
														: s.acknowledged
															? t('info.bugs.tooltips.verified')
															: t('info.bugs.tooltips.submitted')
												}
											>
												<div className="flex items-center gap-1.5 bg-(--background)/50 px-2 py-1 rounded-md border border-(--border)/10 cursor-help transition-colors hover:border-(--border)/30">
													<span className={`w-2 h-2 rounded-full ${s.status === 'resolved' ? 'bg-green-500' : s.acknowledged ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
													<span className="text-xs uppercase font-bold text-(--text-muted)">
														{s.status === 'resolved'
															? t('info.bugs.status.resolved')
															: s.acknowledged
																? t('info.bugs.status.verified')
																: t('info.bugs.status.submitted')}
													</span>
												</div>
											</Tooltip>

											<span className="text-xs font-mono bg-(--accent)/10 text-(--accent) px-2 py-1 rounded border border-(--accent)/20 w-fit">{s.productId}</span>
										</div>
									</div>
								</motion.div>
							);
						})}
					</AnimatePresence>

					{filteredBugs.length === 0 && !search.trim() && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.25 }}
							className="p-8 text-center border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm rounded-xl flex flex-col items-center justify-center gap-2 text-(--text-muted)"
						>
							<div>{t('info.roadmap.knownIssues.noOpenIssues')}</div>
						</motion.div>
					)}

					{filteredBugs.length === 0 && search.trim() && (
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
								<div>{t('info.suggestions.loginToSubmit')}</div>
							)}
						</motion.div>
					)}
				</div>
			</div>
		</div>
	);
}
