/** @format */
import { Button, Confirm, Input, Selector } from '@xernerx/ui';
import { UserProfilePopover } from '@xernerx/components';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Copy, Check, ExternalLink } from 'lucide-react';

import { Loading } from '@xernerx/feedback';
import { IssueModals, type SuiteAppVersionInfo } from './issues/IssueModals';

export default function Issues({ initialSearch = '' }: { initialSearch?: string }) {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState(initialSearch);
	const [statusFilter, setStatusFilter] = useState<'all' | 'unverified' | 'open' | 'resolved'>('all');
	const [productFilter, setProductFilter] = useState('all');
	const [copiedId, setCopiedId] = useState<string | null>(null);

	useEffect(() => {
		if (initialSearch) setSearch(initialSearch);
	}, [initialSearch]);

	const [modalOpen, setModalOpen] = useState(false);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [product, setProduct] = useState('');
	const [botId, setBotId] = useState('');

	const [resolveModalOpen, setResolveModalOpen] = useState(false);
	const [resolvingIssue, setResolvingIssue] = useState<any | null>(null);
	const [selectedResolvedApp, setSelectedResolvedApp] = useState('app');
	const [selectedResolvedVersion, setSelectedResolvedVersion] = useState('');
	const [confirmDeleteItem, setConfirmDeleteItem] = useState<any | null>(null);

	const [products, setProducts] = useState<string[]>([]);
	const [suiteApps, setSuiteApps] = useState<SuiteAppVersionInfo[]>([]);
	const [orgBots, setOrgBots] = useState<{ id: string; name: string; avatarUrl: string | null }[]>([]);
	const [botProfiles, setBotProfiles] = useState<Record<string, { name: string; avatarUrl: string | null }>>({});

	const fetchBotDiscordProfile = async (id: string) => {
		if (!id || !/^\d{17,20}$/.test(id.trim())) return null;
		const cleanId = id.trim();
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${cleanId}/discord`));
			if (!res.ok) return null;
			const d = await res.json();
			const profile = {
				name: d.global_name || d.username || cleanId,
				avatarUrl: d.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
			};
			setBotProfiles((prev) => ({ ...prev, [cleanId]: profile }));
			return profile;
		} catch {
			return null;
		}
	};

	const fetchData = () => {
		fetch(getEnvUrl('https://api.xernerx.com/secure/core/issues'), { credentials: 'include' })
			.then((res) => res.json())
			.then((d) => {
				const items = d.data || [];
				setData(items);
				setLoading(false);

				const idsToFetch = new Set<string>();
				items.forEach((item: any) => {
					if (item.botId && /^\d{17,20}$/.test(String(item.botId).trim())) {
						idsToFetch.add(String(item.botId).trim());
					} else if (item.productId && /^\d{17,20}$/.test(String(item.productId).trim())) {
						idsToFetch.add(String(item.productId).trim());
					}
				});
				idsToFetch.forEach((id) => fetchBotDiscordProfile(id));
			});

		fetch(getEnvUrl('https://api.xernerx.com/info/roadmap/products'))
			.then((res) => res.json())
			.then((d) => {
				setProducts(d.data || []);
				if (Array.isArray(d.bots)) {
					setOrgBots(d.bots);
					d.bots.forEach((b: any) => {
						if (b.id && /^\d{17,20}$/.test(String(b.id))) {
							fetchBotDiscordProfile(String(b.id));
						}
					});
				}
			});

		fetch(getEnvUrl('https://api.xernerx.com/secure/core/versions'), { credentials: 'include' })
			.then((res) => (res.ok ? res.json() : { data: [] }))
			.then((d) => {
				if (Array.isArray(d.data)) {
					setSuiteApps(d.data);
				}
			})
			.catch(() => {});
	};

	useEffect(() => {
		fetchData();
	}, [getEnvUrl]);

	useEffect(() => {
		if (botId && /^\d{17,20}$/.test(botId.trim()) && !botProfiles[botId.trim()]) {
			fetchBotDiscordProfile(botId.trim()).then((profile) => {
				if (profile && !product) {
					setProduct(profile.name);
				}
			});
		}
	}, [botId]);

	const handleProductChange = (val: string) => {
		setProduct(val);
		const matchedBot = orgBots.find((b) => b.name.toLowerCase() === val.trim().toLowerCase() || b.id === val.trim());
		if (matchedBot) {
			setBotId(matchedBot.id);
		} else if (/^\d{17,20}$/.test(val.trim())) {
			setBotId(val.trim());
		}
	};

	const resolveItemBot = (item: any) => {
		const matchedOrgBot = orgBots.find((b) => b.id === item.botId || b.id === item.productId || b.name.toLowerCase() === String(item.productId || '').toLowerCase());
		const targetBotId = item.botId || matchedOrgBot?.id || (/^\d{17,20}$/.test(String(item.productId || '')) ? String(item.productId) : null);
		if (!targetBotId) return null;
		return botProfiles[targetBotId] || (matchedOrgBot ? { name: matchedOrgBot.name, avatarUrl: matchedOrgBot.avatarUrl } : null);
	};

	const isSuiteAppIssue = (item: any) => {
		if (resolveItemBot(item)) return false;
		const prodLower = String(item?.productId || '')
			.trim()
			.toLowerCase();
		if (['app', 'suite', 'xernerx', 'website'].includes(prodLower)) return true;
		return suiteApps.some((a) => a.id === prodLower || a.name.toLowerCase() === prodLower);
	};

	const logBug = async () => {
		const finalProduct = product.trim() || (botId && botProfiles[botId.trim()]?.name) || botId.trim();
		if (!title || !description || !finalProduct) return toast({ type: 'error', title: t('admin.dashboard.issues.toasts.error'), description: t('admin.dashboard.issues.toasts.fillAll') });
		try {
			await fetch(getEnvUrl('https://api.xernerx.com/secure/core/issues'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					title,
					description,
					productId: finalProduct,
					botId: botId.trim() || null,
					status: 'open',
				}),
			});
			toast({ type: 'success', title: t('admin.dashboard.issues.toasts.logged'), description: t('admin.dashboard.issues.toasts.loggedDesc') });
			setModalOpen(false);
			setTitle('');
			setDescription('');
			setProduct('');
			setBotId('');
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.issues.toasts.error'), description: err.message });
		}
	};

	const handleResolveClick = (item: any) => {
		if (isSuiteAppIssue(item)) {
			setResolvingIssue(item);
			const prodLower = String(item?.productId || '')
				.trim()
				.toLowerCase();
			const matchedSubApp = suiteApps.find((a) => a.id === item.resolvedApp || a.id === prodLower) || suiteApps.find((a) => a.id === 'app') || suiteApps[0];
			const defaultAppId = matchedSubApp?.id || 'app';
			const defaultVersion = item.resolvedVersion || matchedSubApp?.versions?.[0] || matchedSubApp?.localVersion || '';
			setSelectedResolvedApp(defaultAppId);
			setSelectedResolvedVersion(defaultVersion);
			setResolveModalOpen(true);
		} else {
			markResolved(item.id);
		}
	};

	const handleSubdomainChange = (appId: string) => {
		setSelectedResolvedApp(appId);
		const appInfo = suiteApps.find((a) => a.id === appId);
		if (appInfo) {
			setSelectedResolvedVersion(appInfo.versions?.[0] || appInfo.localVersion || '');
		}
	};

	const confirmAppResolve = async () => {
		if (!resolvingIssue) return;
		if (!selectedResolvedApp || !selectedResolvedVersion.trim()) {
			return toast({
				type: 'error',
				title: t('admin.dashboard.issues.toasts.error'),
				description: t('admin.dashboard.issues.toasts.selectVersionError'),
			});
		}
		await markResolved(resolvingIssue.id, selectedResolvedApp, selectedResolvedVersion.trim().replace(/^v/i, ''));
		setResolveModalOpen(false);
		setResolvingIssue(null);
	};

	const markResolved = async (id: string, resolvedApp?: string, resolvedVersion?: string) => {
		try {
			const payload: Record<string, any> = { status: 'resolved' };
			if (resolvedApp && resolvedVersion) {
				payload.resolvedApp = resolvedApp;
				payload.resolvedVersion = resolvedVersion;
			}
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/issues/${id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload),
			});
			toast({ type: 'success', title: t('admin.dashboard.issues.toasts.resolved'), description: t('admin.dashboard.issues.toasts.resolvedDesc') });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.issues.toasts.error'), description: err.message });
		}
	};

	const markAcknowledged = async (id: string) => {
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/issues/${id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ acknowledged: true }),
			});
			toast({ type: 'success', title: t('admin.dashboard.issues.verified'), description: t('admin.dashboard.issues.toasts.verifiedDesc') });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.issues.toasts.error'), description: err.message });
		}
	};

	const deleteIssue = async () => {
		if (!confirmDeleteItem) return;
		const id = confirmDeleteItem.id;
		setConfirmDeleteItem(null);
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/issues/${id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			toast({ type: 'success', title: t('admin.dashboard.issues.toasts.deleted'), description: t('admin.dashboard.issues.toasts.deletedDesc') });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.issues.toasts.error'), description: err.message });
		}
	};

	const productFilterOptions = useMemo(() => {
		const set = new Set<string>();
		data.forEach((item) => {
			const resolved = resolveItemBot(item);
			const label = resolved?.name || item.productId;
			if (label) set.add(String(label));
		});
		return [{ value: 'all', label: t('admin.dashboard.issues.allProducts') }, ...Array.from(set).map((p) => ({ value: p, label: p }))];
	}, [data, orgBots, botProfiles, t]);

	const filteredData = useMemo(() => {
		const q = search.trim().toLowerCase();
		return data.filter((item) => {
			if (statusFilter === 'unverified' && (item.status !== 'open' || item.acknowledged !== false)) return false;
			if (statusFilter === 'open' && item.status !== 'open') return false;
			if (statusFilter === 'resolved' && item.status !== 'resolved') return false;
			const resolved = resolveItemBot(item);
			const prodLabel = String(resolved?.name || item.productId || '');
			if (productFilter !== 'all' && prodLabel !== productFilter) return false;
			if (!q) return true;
			const authorId = String(item.authorId || item.author?.id || '');
			return (
				String(item.title || '')
					.toLowerCase()
					.includes(q) ||
				String(item.description || '')
					.toLowerCase()
					.includes(q) ||
				prodLabel.toLowerCase().includes(q) ||
				authorId.toLowerCase().includes(q)
			);
		});
	}, [data, search, statusFilter, productFilter, orgBots, botProfiles]);

	if (loading) return <Loading />;

	const activePreviewBot = botId.trim() ? botProfiles[botId.trim()] || orgBots.find((b) => b.id === botId.trim()) : null;
	const currentSelectedAppInfo = suiteApps.find((a) => a.id === selectedResolvedApp);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
				<h2 className="text-2xl font-bold">{t('admin.dashboard.issues.title')}</h2>
				<div className="flex flex-wrap items-center gap-2">
					<div className="w-full sm:w-64">
						<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.dashboard.issues.searchPlaceholder')} />
					</div>
					<div className="w-full sm:w-40">
						<Selector
							value={statusFilter}
							onChange={(val) => setStatusFilter(val as any)}
							options={[
								{ value: 'all', label: t('admin.dashboard.issues.filterAll') },
								{ value: 'unverified', label: t('admin.dashboard.issues.filterUnverified') },
								{ value: 'open', label: t('admin.dashboard.issues.filterOpen') },
								{ value: 'resolved', label: t('admin.dashboard.issues.filterResolved') },
							]}
						/>
					</div>
					<div className="w-full sm:w-44">
						<Selector value={productFilter} onChange={setProductFilter} options={productFilterOptions} />
					</div>
					<Button onClick={() => setModalOpen(true)}>{t('admin.dashboard.issues.logBug')}</Button>
				</div>
			</div>

			<IssueModals
				modalOpen={modalOpen}
				setModalOpen={setModalOpen}
				title={title}
				setTitle={setTitle}
				description={description}
				setDescription={setDescription}
				product={product}
				handleProductChange={handleProductChange}
				products={products}
				botId={botId}
				setBotId={setBotId}
				orgBots={orgBots}
				activePreviewBot={activePreviewBot}
				logBug={logBug}
				resolveModalOpen={resolveModalOpen}
				setResolveModalOpen={setResolveModalOpen}
				resolvingIssue={resolvingIssue}
				selectedResolvedApp={selectedResolvedApp}
				handleSubdomainChange={handleSubdomainChange}
				suiteApps={suiteApps}
				currentSelectedAppInfo={currentSelectedAppInfo}
				selectedResolvedVersion={selectedResolvedVersion}
				setSelectedResolvedVersion={setSelectedResolvedVersion}
				confirmAppResolve={confirmAppResolve}
			/>

			<div className="flex flex-col gap-2">
				{filteredData.map((item: any) => {
					const resolvedBot = resolveItemBot(item);
					const authorId = item.authorId || item.author?.id;
					const releaseStatus: 'production' | 'canary' | 'pending' | null = item.resolvedApp && item.resolvedVersion ? item.releaseStatus || 'pending' : null;
					const statusBadgeClass =
						releaseStatus === 'production'
							? 'bg-(--accent-green)/10 text-(--accent-green) border-(--accent-green)/20'
							: releaseStatus === 'canary'
								? 'bg-(--accent-orange)/10 text-(--accent-orange) border-(--accent-orange)/20'
								: 'bg-(--accent)/10 text-(--accent) border-(--accent)/20';

					return (
						<div
							key={item.id}
							className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-2xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm"
						>
							<div>
								<div className="font-bold flex items-center gap-2">
									<span className={item.status === 'resolved' ? 'text-(--accent-green)' : 'text-(--accent-red)'}>●</span>
									{item.title}
								</div>
								<div className="text-sm text-(--text-muted) mt-1">{item.description}</div>
								<div className="flex flex-wrap items-center gap-2 mt-2">
									<div className="inline-flex items-center gap-1.5 text-xs bg-(--accent)/10 text-(--accent) w-fit px-2.5 py-1 rounded-full border border-(--accent)/20">
										{resolvedBot?.avatarUrl && (
											<Image src={resolvedBot.avatarUrl} alt={resolvedBot.name} width={16} height={16} unoptimized className="w-4 h-4 rounded-full object-cover" />
										)}
										{resolvedBot ? resolvedBot.name : item.productId}
									</div>
									{authorId && /^\d{17,20}$/.test(String(authorId)) && (
										<div className="inline-flex items-center gap-1.5 text-xs bg-(--background)/90 text-(--text-muted) px-2.5 py-1 rounded-full border border-(--border)/10 font-mono">
											<UserProfilePopover userId={String(authorId)} initialUser={item.author}>
												<span className="inline-flex items-center gap-1 hover:text-(--accent) transition-colors">
													<span>{item.author?.username || authorId}</span>
													<ExternalLink size={11} />
												</span>
											</UserProfilePopover>
											<button
												type="button"
												onClick={() => {
													navigator.clipboard.writeText(String(authorId));
													setCopiedId(item.id);
													toast({ type: 'success', title: t('admin.users.idCopied') });
													setTimeout(() => setCopiedId(null), 2000);
												}}
												className="hover:text-(--text) transition-colors cursor-pointer"
											>
												{copiedId === item.id ? <Check size={11} className="text-(--accent-green)" /> : <Copy size={11} />}
											</button>
										</div>
									)}
									{releaseStatus && (
										<button
											type="button"
											onClick={() => handleResolveClick(item)}
											className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-mono cursor-pointer transition-opacity hover:opacity-80 ${statusBadgeClass}`}
										>
											<span>{t(`admin.dashboard.issues.releaseStatus.${releaseStatus}`)}</span>
											<span>•</span>
											<span>
												{item.resolvedApp} v{item.resolvedVersion}
											</span>
										</button>
									)}
									{item.acknowledged === false && (
										<span className="text-xs bg-(--accent-orange)/10 text-(--accent-orange) px-2.5 py-1 rounded-full border border-(--accent-orange)/20 font-medium">
											{t('admin.dashboard.issues.submitted')}
										</span>
									)}
								</div>
							</div>
							<div className="flex items-center gap-2 shrink-0">
								{item.acknowledged === false && <Button onClick={() => markAcknowledged(item.id)}>{t('admin.dashboard.issues.verify')}</Button>}
								{item.status === 'open' && <Button onClick={() => handleResolveClick(item)}>{t('admin.dashboard.issues.resolved')}</Button>}
								<Button variant="danger" onClick={() => setConfirmDeleteItem(item)}>
									{t('common.buttons.delete')}
								</Button>
							</div>
						</div>
					);
				})}
				{filteredData.length === 0 && (
					<div className="text-(--text-muted) text-center p-8 bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl">
						{t('admin.dashboard.issues.noMatchingIssues')}
					</div>
				)}
			</div>

			<Confirm
				open={Boolean(confirmDeleteItem)}
				onOpenChange={(open) => !open && setConfirmDeleteItem(null)}
				title={t('admin.dashboard.issues.deleteConfirmTitle')}
				description={t('admin.dashboard.issues.deleteConfirmDesc')}
				confirmText={t('common.buttons.delete')}
				cancelText={t('common.buttons.cancel')}
				variant="danger"
				onConfirm={deleteIssue}
			/>
		</div>
	);
}
