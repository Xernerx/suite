/** @format */
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useEnvironment, useToast, useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Confirm, Input, Selector } from '@xernerx/ui';
import { Copy, Check, ExternalLink } from 'lucide-react';

export default function Suggestions({ initialSearch = '' }: { initialSearch?: string }) {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [data, setData] = useState<any[]>([]);
	const [orgBots, setOrgBots] = useState<{ id: string; name: string; avatarUrl: string | null }[]>([]);
	const [botProfiles, setBotProfiles] = useState<Record<string, { name: string; avatarUrl: string | null }>>({});
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState(initialSearch);
	const [productFilter, setProductFilter] = useState('all');
	const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [confirmRejectItem, setConfirmRejectItem] = useState<any | null>(null);

	useEffect(() => {
		if (initialSearch) setSearch(initialSearch);
	}, [initialSearch]);

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
		fetch(getEnvUrl('https://api.xernerx.com/secure/core/suggestions'), { credentials: 'include' })
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
				toast({ type: 'error', title: t('admin.dashboard.suggestions.toasts.error'), description: err.message });
				setLoading(false);
			});

		fetch(getEnvUrl('https://api.xernerx.com/info/roadmap/products'))
			.then((res) => res.json())
			.then((d) => {
				if (Array.isArray(d.bots)) {
					setOrgBots(d.bots);
					d.bots.forEach((b: any) => {
						if (b.id && /^\d{17,20}$/.test(String(b.id))) {
							fetchBotDiscordProfile(String(b.id));
						}
					});
				}
			})
			.catch(() => {});
	};

	useEffect(() => {
		fetchData();
	}, [getEnvUrl, toast]);

	const resolveItemBot = (item: any) => {
		const matchedOrgBot = orgBots.find((b) => b.id === item.botId || b.id === item.productId || b.name.toLowerCase() === String(item.productId || '').toLowerCase());
		const targetBotId = item.botId || matchedOrgBot?.id || (/^\d{17,20}$/.test(String(item.productId || '')) ? String(item.productId) : null);
		if (!targetBotId) return null;
		const profile = botProfiles[targetBotId] || (matchedOrgBot ? { name: matchedOrgBot.name, avatarUrl: matchedOrgBot.avatarUrl } : null);
		return profile ? { id: targetBotId, ...profile } : null;
	};

	const declineSuggestion = async () => {
		if (!confirmRejectItem) return;
		const id = confirmRejectItem.id;
		setConfirmRejectItem(null);
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/suggestions/${id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			toast({ type: 'success', title: t('admin.dashboard.suggestions.toasts.declined'), description: t('admin.dashboard.suggestions.toasts.declinedDesc') });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.suggestions.toasts.error'), description: err.message });
		}
	};

	const acceptSuggestion = async (item: any) => {
		const resolvedBot = resolveItemBot(item);
		try {
			// 1. Create a Roadmap item
			await fetch(getEnvUrl('https://api.xernerx.com/secure/core/roadmap'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					title: item.title,
					description: item.description,
					productId: item.productId,
					botId: item.botId || resolvedBot?.id || null,
					status: 'idea',
				}),
			});

			// 2. Delete the suggestion
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/suggestions/${item.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});

			toast({ type: 'success', title: t('admin.dashboard.suggestions.toasts.accepted'), description: t('admin.dashboard.suggestions.toasts.acceptedDesc') });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.dashboard.suggestions.toasts.error'), description: err.message });
		}
	};

	const productOptions = useMemo(() => {
		const set = new Set<string>();
		data.forEach((item) => {
			const resolved = resolveItemBot(item);
			const label = resolved?.name || item.productId;
			if (label) set.add(String(label));
		});
		return [{ value: 'all', label: t('admin.dashboard.suggestions.allProducts') }, ...Array.from(set).map((p) => ({ value: p, label: p }))];
	}, [data, orgBots, botProfiles, t]);

	const filteredData = useMemo(() => {
		const q = search.trim().toLowerCase();
		const list = data.filter((item) => {
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

		list.sort((a, b) => {
			if (sortBy === 'newest') {
				return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
			}
			const votesA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
			const votesB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
			return votesB - votesA;
		});

		return list;
	}, [data, search, productFilter, sortBy, orgBots, botProfiles]);

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<h2 className="text-2xl font-bold">{t('admin.dashboard.suggestions.title')}</h2>
				<div className="flex flex-wrap items-center gap-2">
					<div className="w-full sm:w-64">
						<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.dashboard.suggestions.searchPlaceholder')} />
					</div>
					<div className="w-full sm:w-44">
						<Selector value={productFilter} onChange={setProductFilter} options={productOptions} />
					</div>
					<div className="w-full sm:w-40">
						<Selector
							value={sortBy}
							onChange={(val) => setSortBy(val as 'top' | 'newest')}
							options={[
								{ value: 'top', label: t('admin.dashboard.suggestions.sortTop') },
								{ value: 'newest', label: t('admin.dashboard.suggestions.sortNewest') },
							]}
						/>
					</div>
				</div>
			</div>
			<div className="flex flex-col gap-2">
				{filteredData.map((item: any) => {
					const netVotes = (item.upvotes?.length || 0) - (item.downvotes?.length || 0);
					const resolvedBot = resolveItemBot(item);
					const authorId = item.authorId || item.author?.id;
					return (
						<div
							key={item.id}
							className="p-4 rounded-xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4"
						>
							<div>
								<div className="font-bold flex flex-wrap gap-2 items-center">
									<span className="bg-(--foreground)/50 px-2 py-1 rounded-xl text-xs border border-(--border)/10 font-mono">
										{t('admin.dashboard.suggestions.votes')}: {netVotes}
									</span>
									{item.title}
								</div>
								<div className="text-sm text-(--text-muted) mb-2 mt-2">{item.description}</div>
								<div className="flex flex-wrap items-center gap-2 mt-2">
									<div className="inline-flex items-center gap-1.5 text-xs bg-(--accent)/10 text-(--accent) w-fit px-2 py-1 rounded-xl border border-(--accent)/20">
										{resolvedBot?.avatarUrl && (
											<Image src={resolvedBot.avatarUrl} alt={resolvedBot.name} width={16} height={16} unoptimized className="w-4 h-4 rounded-full object-cover" />
										)}
										{resolvedBot ? resolvedBot.name : item.productId}
									</div>
									{authorId && /^\d{17,20}$/.test(String(authorId)) && (
										<div className="inline-flex items-center gap-1.5 text-xs bg-(--background)/60 text-(--text-muted) px-2 py-1 rounded-xl border border-(--border)/10 font-mono">
											<a
												href={`${getEnvUrl('https://app.xernerx.com')}/users/${authorId}`}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 hover:text-(--accent) transition-colors"
											>
												<span>{item.author?.username || authorId}</span>
												<ExternalLink size={11} />
											</a>
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
								</div>
							</div>
							<div className="flex gap-2 shrink-0">
								<Button onClick={() => acceptSuggestion(item)}>{t('admin.dashboard.suggestions.moveToRoadmap')}</Button>
								<Button variant="danger" onClick={() => setConfirmRejectItem(item)}>
									{t('admin.dashboard.suggestions.rejected')}
								</Button>
							</div>
						</div>
					);
				})}
				{filteredData.length === 0 && <div className="text-(--text-muted) text-center p-8 bg-(--foreground)/10 rounded-xl">{t('admin.dashboard.suggestions.noSuggestions')}</div>}
			</div>

			<Confirm
				open={Boolean(confirmRejectItem)}
				onOpenChange={(open) => !open && setConfirmRejectItem(null)}
				title={t('admin.dashboard.suggestions.rejectConfirmTitle')}
				description={t('admin.dashboard.suggestions.rejectConfirmDesc')}
				confirmText={t('admin.dashboard.suggestions.rejected')}
				cancelText={t('common.buttons.cancel')}
				variant="danger"
				onConfirm={declineSuggestion}
			/>
		</div>
	);
}
