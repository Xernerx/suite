import { useState, useEffect } from 'react';
import { useEnvironment, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';

export default function Suggestions() {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
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
	}, [getEnvUrl, toast]);

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col gap-4">
			<h2 className="text-2xl font-bold">Suggestions Triage</h2>
			<div className="flex flex-col gap-2">
				{data.map((item: any) => (
					<div key={item.id} className="p-4 rounded-lg bg-(--background) border border-(--border)">
						<div className="font-bold">
							{item.title} ({item.upvotes?.length || 0} votes)
						</div>
						<div className="text-sm text-gray-500 mb-2">{item.description}</div>
						<div className="flex gap-2">
							<Button>Accept</Button>
							<Button variant="danger">Decline</Button>
						</div>
					</div>
				))}
				{data.length === 0 && <div>No pending suggestions.</div>}
			</div>
		</div>
	);
}
