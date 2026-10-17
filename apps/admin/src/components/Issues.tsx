/** @format */
import { Button, Input, Modal, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { Loading } from '@xernerx/feedback';

interface SuiteAppVersionInfo {
	id: string;
	name: string;
	domain: string;
	localVersion: string | null;
	canaryVersion: string | null;
	prodVersion: string | null;
	versions: string[];
}

export default function Issues() {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const [modalOpen, setModalOpen] = useState(false);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [product, setProduct] = useState('');
	const [botId, setBotId] = useState('');

	const [resolveModalOpen, setResolveModalOpen] = useState(false);
	const [resolvingIssue, setResolvingIssue] = useState<any | null>(null);
	const [selectedResolvedApp, setSelectedResolvedApp] = useState('app');
	const [selectedResolvedVersion, setSelectedResolvedVersion] = useState('');

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

	const deleteIssue = async (id: string) => {
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

	if (loading) return <Loading />;

	const activePreviewBot = botId.trim() ? botProfiles[botId.trim()] || orgBots.find((b) => b.id === botId.trim()) : null;
	const currentSelectedAppInfo = suiteApps.find((a) => a.id === selectedResolvedApp);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">{t('admin.dashboard.issues.title')}</h2>
				<Button onClick={() => setModalOpen(true)}>{t('admin.dashboard.issues.logBug')}</Button>
			</div>

			<Modal open={modalOpen} onOpenChange={setModalOpen} title={t('admin.dashboard.issues.modalTitle')}>
				<div className="flex flex-col gap-4 pt-4">
					<Input placeholder={t('admin.dashboard.issues.titlePlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} />
					<Input variant="textarea" rows={4} placeholder={t('admin.dashboard.issues.descPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} />
					<Input placeholder={t('admin.dashboard.issues.productPlaceholder')} list="product-tags" value={product} onChange={(e) => handleProductChange(e.target.value)} />
					<datalist id="product-tags">
						{products.map((p) => (
							<option key={p} value={p} />
						))}
					</datalist>

					<div className="flex flex-col gap-2">
						<Input placeholder={t('admin.dashboard.roadmap.botIdPlaceholder')} list="issue-bot-id-tags" value={botId} onChange={(e) => setBotId(e.target.value)} />
						<datalist id="issue-bot-id-tags">
							{orgBots.map((b) => (
								<option key={b.id} value={b.id} label={b.name} />
							))}
						</datalist>
						{activePreviewBot && (
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-(--foreground)/40 border border-(--border)/10 w-fit text-xs">
								{activePreviewBot.avatarUrl && <img src={activePreviewBot.avatarUrl} alt={activePreviewBot.name} className="w-5 h-5 rounded-full object-cover" />}
								<span className="font-semibold text-(--text)">{activePreviewBot.name}</span>
								<span className="text-(--text-muted) font-mono">({botId.trim()})</span>
							</div>
						)}
					</div>

					<div className="flex justify-end mt-4">
						<Button onClick={logBug}>{t('admin.dashboard.issues.save')}</Button>
					</div>
				</div>
			</Modal>

			<Modal open={resolveModalOpen} onOpenChange={setResolveModalOpen} title={t('admin.dashboard.issues.resolveModalTitle')}>
				<div className="flex flex-col gap-4 pt-2">
					<p className="text-sm text-(--text-muted)">{t('admin.dashboard.issues.resolveModalDesc')}</p>
					{resolvingIssue && (
						<div className="p-3 rounded-lg bg-(--foreground)/40 border border-(--border)/10 text-sm">
							<div className="font-bold text-(--text)">{resolvingIssue.title}</div>
							<div className="text-xs text-(--text-muted) mt-0.5 line-clamp-2">{resolvingIssue.description}</div>
						</div>
					)}

					<Selector
						value={selectedResolvedApp}
						onChange={handleSubdomainChange}
						placeholder={t('admin.dashboard.issues.selectSubdomain')}
						options={suiteApps.map((app) => ({
							value: app.id,
							label: `${app.name} (${app.domain})`,
						}))}
					/>

					{currentSelectedAppInfo && (
						<div className="flex flex-wrap items-center gap-2 text-xs">
							{currentSelectedAppInfo.prodVersion && (
								<span className="px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 font-mono">
									{t('admin.dashboard.issues.liveProd', { version: currentSelectedAppInfo.prodVersion })}
								</span>
							)}
							{currentSelectedAppInfo.canaryVersion && (
								<span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
									{t('admin.dashboard.issues.liveCanary', { version: currentSelectedAppInfo.canaryVersion })}
								</span>
							)}
						</div>
					)}

					<Selector
						value={selectedResolvedVersion}
						onChange={setSelectedResolvedVersion}
						placeholder={t('admin.dashboard.issues.selectVersion')}
						options={(currentSelectedAppInfo?.versions || []).map((ver, idx) => ({
							value: ver,
							label: idx === 0 ? `v${ver} (Latest)` : `v${ver}`,
						}))}
					/>

					<Input placeholder={t('admin.dashboard.issues.customVersionPlaceholder')} value={selectedResolvedVersion} onChange={(e) => setSelectedResolvedVersion(e.target.value)} />

					<div className="flex justify-end gap-2 mt-2">
						<Button variant="secondary" onClick={() => setResolveModalOpen(false)}>
							{t('admin.dashboard.issues.cancel')}
						</Button>
						<Button onClick={confirmAppResolve}>{t('admin.dashboard.issues.confirmResolve')}</Button>
					</div>
				</div>
			</Modal>

			<div className="flex flex-col gap-2">
				{data.map((item: any) => {
					const resolvedBot = resolveItemBot(item);
					const releaseStatus: 'production' | 'canary' | 'pending' | null = item.resolvedApp && item.resolvedVersion ? item.releaseStatus || 'pending' : null;
					const statusBadgeClass =
						releaseStatus === 'production'
							? 'bg-green-500/10 text-green-400 border-green-500/20'
							: releaseStatus === 'canary'
								? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
								: 'bg-purple-500/10 text-purple-400 border-purple-500/20';

					return (
						<div key={item.id} className="flex justify-between items-center p-4 rounded-xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm">
							<div>
								<div className="font-bold flex items-center gap-2">
									<span className={item.status === 'resolved' ? 'text-green-500' : 'text-red-500'}>●</span>
									{item.title}
								</div>
								<div className="text-sm text-(--text-muted) mt-1">{item.description}</div>
								<div className="flex flex-wrap items-center gap-2 mt-2">
									<div className="inline-flex items-center gap-1.5 text-xs bg-(--accent)/10 text-(--accent) w-fit px-2 py-1 rounded border border-(--accent)/20">
										{resolvedBot?.avatarUrl && <img src={resolvedBot.avatarUrl} alt={resolvedBot.name} className="w-4 h-4 rounded-full object-cover" />}
										{resolvedBot ? resolvedBot.name : item.productId}
									</div>
									{releaseStatus && (
										<button
											type="button"
											onClick={() => handleResolveClick(item)}
											className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border font-mono cursor-pointer transition-opacity hover:opacity-80 ${statusBadgeClass}`}
										>
											<span>{t(`admin.dashboard.issues.releaseStatus.${releaseStatus}`)}</span>
											<span>•</span>
											<span>
												{item.resolvedApp} v{item.resolvedVersion}
											</span>
										</button>
									)}
									{item.acknowledged === false && (
										<span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20 font-medium">
											{t('admin.dashboard.issues.submitted')}
										</span>
									)}
								</div>
							</div>
							<div className="flex items-center gap-2">
								{item.acknowledged === false && <Button onClick={() => markAcknowledged(item.id)}>{t('admin.dashboard.issues.verify')}</Button>}
								{item.status === 'open' && <Button onClick={() => handleResolveClick(item)}>{t('admin.dashboard.issues.resolved')}</Button>}
								<Button onClick={() => deleteIssue(item.id)}>{t('common.buttons.delete')}</Button>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
