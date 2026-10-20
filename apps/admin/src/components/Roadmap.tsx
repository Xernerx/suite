/** @format */
import { Button, Confirm, Input, Modal, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@xernerx/feedback';

export default function Roadmap() {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [productFilter, setProductFilter] = useState('all');

	const [modalOpen, setModalOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [product, setProduct] = useState('');
	const [botId, setBotId] = useState('');
	const [status, setStatus] = useState('idea');
	const [targetQuarter, setTargetQuarter] = useState('');
	const [confirmDeleteItem, setConfirmDeleteItem] = useState<any | null>(null);

	const [products, setProducts] = useState<string[]>([]);
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
				avatarUrl: d.avatarUrl || `https://cdn.discordapp.com/embed/avatars/0.png`,
			};
			setBotProfiles((prev) => ({ ...prev, [cleanId]: profile }));
			return profile;
		} catch {
			return null;
		}
	};

	const fetchData = () => {
		fetch(getEnvUrl('https://api.xernerx.com/secure/core/roadmap'), { credentials: 'include' })
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
			})
			.catch((err) => {
				console.error(err);
				setLoading(false);
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

	const openCreate = () => {
		setEditId(null);
		setTitle('');
		setDescription('');
		setProduct('');
		setBotId('');
		setStatus('idea');
		setTargetQuarter('');
		setModalOpen(true);
	};

	const openEdit = (item: any) => {
		setEditId(item.id);
		setTitle(item.title || '');
		setDescription(item.description || '');
		setProduct(item.productId || '');
		const matchedBot = orgBots.find((b) => b.name.toLowerCase() === (item.productId || '').toLowerCase() || b.id === item.productId);
		setBotId(item.botId || matchedBot?.id || (/^\d{17,20}$/.test(item.productId || '') ? item.productId : ''));
		setStatus(item.status || 'idea');
		setTargetQuarter(item.targetQuarter || '');
		setModalOpen(true);
	};

	const saveItem = async () => {
		const finalProduct = product.trim() || (botId && botProfiles[botId.trim()]?.name) || botId.trim();
		if (!title || !description || !finalProduct || !status)
			return toast({ type: 'error', title: t('admin.dashboard.roadmap.toasts.error'), description: t('admin.dashboard.roadmap.toasts.fillRequired') });
		try {
			await fetch(getEnvUrl(editId ? `https://api.xernerx.com/secure/core/roadmap/${editId}` : 'https://api.xernerx.com/secure/core/roadmap'), {
				method: editId ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					title,
					description,
					productId: finalProduct,
					botId: botId.trim() || null,
					status,
					targetQuarter,
				}),
			});
			toast({
				type: 'success',
				title: editId ? t('admin.dashboard.roadmap.toasts.updated') : t('admin.dashboard.roadmap.toasts.created'),
				description: editId ? t('admin.dashboard.roadmap.toasts.updatedDesc') : t('admin.dashboard.roadmap.toasts.createdDesc'),
			});
			setModalOpen(false);
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.roadmap.toasts.error'), description: err.message });
		}
	};

	const updateStatus = async (id: string, newStatus: string) => {
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/roadmap/${id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ status: newStatus }),
			});
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.roadmap.toasts.error'), description: err.message });
		}
	};

	const deleteItem = async () => {
		if (!confirmDeleteItem) return;
		const id = confirmDeleteItem.id;
		setConfirmDeleteItem(null);
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/roadmap/${id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			toast({ type: 'success', title: t('admin.dashboard.roadmap.toasts.deleted'), description: t('admin.dashboard.roadmap.toasts.deletedDesc') });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.roadmap.toasts.error'), description: err.message });
		}
	};

	const resolveItemBot = (item: any) => {
		const matchedOrgBot = orgBots.find((b) => b.id === item.botId || b.id === item.productId || b.name.toLowerCase() === String(item.productId || '').toLowerCase());
		const targetBotId = item.botId || matchedOrgBot?.id || (/^\d{17,20}$/.test(String(item.productId || '')) ? String(item.productId) : null);
		if (!targetBotId) return null;
		return botProfiles[targetBotId] || (matchedOrgBot ? { name: matchedOrgBot.name, avatarUrl: matchedOrgBot.avatarUrl } : null);
	};

	const productFilterOptions = useMemo(() => {
		const set = new Set<string>();
		data.forEach((item) => {
			const resolved = resolveItemBot(item);
			const label = resolved?.name || item.productId;
			if (label) set.add(String(label));
		});
		return [{ value: 'all', label: t('admin.dashboard.roadmap.allProducts') }, ...Array.from(set).map((p) => ({ value: p, label: p }))];
	}, [data, orgBots, botProfiles, t]);

	const filteredData = useMemo(() => {
		const q = search.trim().toLowerCase();
		return data.filter((item) => {
			const resolved = resolveItemBot(item);
			const prodLabel = String(resolved?.name || item.productId || '');
			if (productFilter !== 'all' && prodLabel !== productFilter) return false;
			if (!q) return true;
			return (
				String(item.title || '')
					.toLowerCase()
					.includes(q) ||
				String(item.description || '')
					.toLowerCase()
					.includes(q) ||
				prodLabel.toLowerCase().includes(q) ||
				String(item.targetQuarter || '')
					.toLowerCase()
					.includes(q)
			);
		});
	}, [data, search, productFilter, orgBots, botProfiles]);

	if (loading) return <Loading />;

	const activePreviewBot = botId.trim() ? botProfiles[botId.trim()] || orgBots.find((b) => b.id === botId.trim()) : null;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<h2 className="text-2xl font-bold">{t('admin.dashboard.roadmap.title')}</h2>
				<div className="flex flex-wrap items-center gap-2">
					<div className="w-full sm:w-64">
						<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.dashboard.roadmap.searchPlaceholder')} />
					</div>
					<div className="w-full sm:w-44">
						<Selector value={productFilter} onChange={setProductFilter} options={productFilterOptions} />
					</div>
					<Button onClick={openCreate}>{t('admin.dashboard.roadmap.addItem')}</Button>
				</div>
			</div>

			<Modal open={modalOpen} onOpenChange={setModalOpen} title={editId ? t('admin.dashboard.roadmap.modalTitle') : t('admin.dashboard.roadmap.modalTitle')}>
				<div className="flex flex-col gap-4 pt-4">
					<Input placeholder={t('admin.dashboard.roadmap.titlePlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} />
					<Input variant="textarea" rows={3} placeholder={t('admin.dashboard.roadmap.descPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} />

					<div className="flex gap-4">
						<div className="w-full">
							<Input placeholder={t('admin.dashboard.roadmap.productPlaceholder')} list="product-tags" value={product} onChange={(e) => handleProductChange(e.target.value)} />
							<datalist id="product-tags">
								{products.map((p) => (
									<option key={p} value={p} />
								))}
							</datalist>
						</div>
						<Selector
							placeholder={t('admin.dashboard.roadmap.statusPlaceholder')}
							value={status}
							options={['idea', 'planned', 'active', 'released'].map((s) => ({ value: s, label: t(`info.roadmap.timeline.status.${s}`) }))}
							onChange={setStatus}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Input placeholder={t('admin.dashboard.roadmap.botIdPlaceholder')} list="bot-id-tags" value={botId} onChange={(e) => setBotId(e.target.value)} />
						<datalist id="bot-id-tags">
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

					<Input placeholder={t('admin.dashboard.roadmap.quarterPlaceholder')} value={targetQuarter} onChange={(e) => setTargetQuarter(e.target.value)} />

					<div className="flex justify-end mt-4">
						<Button onClick={saveItem}>{t('admin.dashboard.roadmap.save')}</Button>
					</div>
				</div>
			</Modal>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				{['idea', 'planned', 'active', 'released'].map((colStatus) => (
					<div key={colStatus} className="flex flex-col gap-2 p-2 bg-(--foreground)/10 rounded-2xl">
						<h3 className="font-bold capitalize px-2">{t(`info.roadmap.timeline.status.${colStatus}`)}</h3>
						{filteredData
							.filter((i: any) => i.status === colStatus)
							.map((item: any) => {
								const resolvedBot = resolveItemBot(item);
								return (
									<div key={item.id} className="p-4 rounded-xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm text-sm flex flex-col gap-2 group">
										<div className="font-bold">{item.title}</div>
										<div className="text-(--text-muted) flex items-center gap-1.5 flex-wrap">
											{resolvedBot ? (
												<span className="inline-flex items-center gap-1.5 bg-(--foreground)/50 px-2 py-0.5 rounded-full border border-(--border)/10 text-(--text) text-xs font-medium">
													{resolvedBot.avatarUrl && <img src={resolvedBot.avatarUrl} alt={resolvedBot.name} className="w-4 h-4 rounded-full object-cover" />}
													{resolvedBot.name}
												</span>
											) : (
												<span>{item.productId}</span>
											)}
											{item.targetQuarter ? <span>({item.targetQuarter})</span> : null}
										</div>

										<div className="flex flex-col gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
											<Selector
												value={item.status}
												options={['idea', 'planned', 'active', 'released'].map((s) => ({
													value: s,
													label: t('admin.dashboard.roadmap.moveTo', { status: t(`info.roadmap.timeline.status.${s}`) }),
												}))}
												onChange={(val) => updateStatus(item.id, val)}
											/>
											<div className="flex gap-2 w-full">
												<Button className="flex-1" onClick={() => openEdit(item)}>
													{t('common.edit')}
												</Button>
												<Button variant="danger" className="flex-1" onClick={() => setConfirmDeleteItem(item)}>
													{t('common.buttons.delete')}
												</Button>
											</div>
										</div>
									</div>
								);
							})}
					</div>
				))}
			</div>

			<Confirm
				open={Boolean(confirmDeleteItem)}
				onOpenChange={(open) => !open && setConfirmDeleteItem(null)}
				title={t('admin.dashboard.roadmap.deleteConfirmTitle')}
				description={t('admin.dashboard.roadmap.deleteConfirmDesc')}
				confirmText={t('common.buttons.delete')}
				cancelText={t('common.buttons.cancel')}
				variant="danger"
				onConfirm={deleteItem}
			/>
		</div>
	);
}
