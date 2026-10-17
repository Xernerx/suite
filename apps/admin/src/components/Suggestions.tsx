/** @format */
import { useState, useEffect } from 'react';
import { useEnvironment, useToast, useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';

export default function Suggestions() {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [data, setData] = useState<any[]>([]);
	const [orgBots, setOrgBots] = useState<{ id: string; name: string; avatarUrl: string | null }[]>([]);
	const [botProfiles, setBotProfiles] = useState<Record<string, { name: string; avatarUrl: string | null }>>({});
	const [loading, setLoading] = useState(true);

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

	const declineSuggestion = async (id: string) => {
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

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col gap-4">
			<h2 className="text-2xl font-bold">{t('admin.dashboard.suggestions.title')}</h2>
			<div className="flex flex-col gap-2">
				{data.map((item: any) => {
					const netVotes = (item.upvotes?.length || 0) - (item.downvotes?.length || 0);
					const resolvedBot = resolveItemBot(item);
					return (
						<div key={item.id} className="p-4 rounded-xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm flex justify-between items-start">
							<div>
								<div className="font-bold flex gap-2 items-center">
									<span className="bg-(--foreground)/50 px-2 py-1 rounded text-xs border border-(--border)/10 font-mono">
										{t('admin.dashboard.suggestions.votes')}: {netVotes}
									</span>
									{item.title}
								</div>
								<div className="text-sm text-(--text-muted) mb-2 mt-2">{item.description}</div>
								<div className="inline-flex items-center gap-1.5 text-xs bg-(--accent)/10 text-(--accent) w-fit px-2 py-1 rounded border border-(--accent)/20 mt-2">
									{resolvedBot?.avatarUrl && <img src={resolvedBot.avatarUrl} alt={resolvedBot.name} className="w-4 h-4 rounded-full object-cover" />}
									{resolvedBot ? resolvedBot.name : item.productId}
								</div>
							</div>
							<div className="flex gap-2 shrink-0">
								<Button onClick={() => acceptSuggestion(item)}>{t('admin.dashboard.suggestions.moveToRoadmap')}</Button>
								<Button variant="danger" onClick={() => declineSuggestion(item.id)}>
									{t('admin.dashboard.suggestions.rejected')}
								</Button>
							</div>
						</div>
					);
				})}
				{data.length === 0 && <div className="text-(--text-muted) text-center p-8 bg-(--foreground)/10 rounded-xl">{t('admin.dashboard.suggestions.noSuggestions')}</div>}
			</div>
		</div>
	);
}
