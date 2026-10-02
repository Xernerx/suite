import { useState, useEffect } from 'react';
import { useEnvironment, useToast, useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';

export default function Suggestions() {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);

	const fetchData = () => {
		fetch(getEnvUrl('https://api.xernerx.com/secure/core/suggestions'), { credentials: 'include' })
			.then((res) => res.json())
			.then((d) => {
				setData(d.data || []);
				setLoading(false);
			})
			.catch((err) => {
				toast({ type: 'error', title: 'Error', description: err.message });
				setLoading(false);
			});
	};

	useEffect(() => {
		fetchData();
	}, [getEnvUrl, toast]);

	const declineSuggestion = async (id: string) => {
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/suggestions/${id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			toast({ type: 'success', title: 'Declined', description: 'Suggestion deleted.' });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: 'Error', description: err.message });
		}
	};

	const acceptSuggestion = async (item: any) => {
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
					status: 'idea',
				}),
			});

			// 2. Delete the suggestion
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/suggestions/${item.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});

			toast({ type: 'success', title: 'Accepted', description: 'Promoted to Roadmap Ideas.' });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: 'Error', description: err.message });
		}
	};

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col gap-4">
			<h2 className="text-2xl font-bold">{t('admin.dashboard.suggestions.title')}</h2>
			<div className="flex flex-col gap-2">
				{data.map((item: any) => {
					const netVotes = (item.upvotes?.length || 0) - (item.downvotes?.length || 0);
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
								<div className="text-xs bg-(--accent)/10 text-(--accent) w-fit px-2 py-1 rounded border border-(--accent)/20 mt-2">{item.productId}</div>
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
				{data.length === 0 && <div className="text-(--text-muted) text-center p-8 bg-(--foreground)/10 rounded-xl">No pending suggestions.</div>}
			</div>
		</div>
	);
}
