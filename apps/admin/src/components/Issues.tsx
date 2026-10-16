/** @format */
import { Button, Input, Modal } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { Loading } from '@xernerx/feedback';

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

	const markResolved = async (id: string) => {
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/issues/${id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ status: 'resolved' }),
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

	const resolveItemBot = (item: any) => {
		const matchedOrgBot = orgBots.find((b) => b.id === item.botId || b.id === item.productId || b.name.toLowerCase() === String(item.productId || '').toLowerCase());
		const targetBotId = item.botId || matchedOrgBot?.id || (/^\d{17,20}$/.test(String(item.productId || '')) ? String(item.productId) : null);
		if (!targetBotId) return null;
		return botProfiles[targetBotId] || (matchedOrgBot ? { name: matchedOrgBot.name, avatarUrl: matchedOrgBot.avatarUrl } : null);
	};

	if (loading) return <Loading />;

	const activePreviewBot = botId.trim() ? botProfiles[botId.trim()] || orgBots.find((b) => b.id === botId.trim()) : null;

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

			<div className="flex flex-col gap-2">
				{data.map((item: any) => {
					const resolvedBot = resolveItemBot(item);
					return (
						<div key={item.id} className="flex justify-between items-center p-4 rounded-xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm">
							<div>
								<div className="font-bold flex items-center gap-2">
									<span className={item.status === 'resolved' ? 'text-green-500' : 'text-red-500'}>●</span>
									{item.title}
								</div>
								<div className="text-sm text-(--text-muted) mt-1">{item.description}</div>
								<div className="flex items-center gap-2 mt-2">
									<div className="inline-flex items-center gap-1.5 text-xs bg-(--accent)/10 text-(--accent) w-fit px-2 py-1 rounded border border-(--accent)/20">
										{resolvedBot?.avatarUrl && <img src={resolvedBot.avatarUrl} alt={resolvedBot.name} className="w-4 h-4 rounded-full object-cover" />}
										{resolvedBot ? resolvedBot.name : item.productId}
									</div>
									{item.acknowledged === false && (
										<span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20 font-medium">
											{t('admin.dashboard.issues.submitted')}
										</span>
									)}
								</div>
							</div>
							<div className="flex items-center gap-2">
								{item.acknowledged === false && <Button onClick={() => markAcknowledged(item.id)}>{t('admin.dashboard.issues.verify')}</Button>}
								{item.status === 'open' && <Button onClick={() => markResolved(item.id)}>{t('admin.dashboard.issues.resolved')}</Button>}
								<Button onClick={() => deleteIssue(item.id)}>{t('common.buttons.delete')}</Button>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
