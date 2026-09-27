import { useState, useEffect } from 'react';
import { useEnvironment, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';

export default function Roadmap() {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(getEnvUrl('https://api.xernerx.com/secure/core/roadmap'), { credentials: 'include' })
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
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Roadmap Manager</h2>
				<Button>Create Item</Button>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				{['idea', 'planned', 'active', 'released'].map((status) => (
					<div key={status} className="flex flex-col gap-2">
						<h3 className="font-bold capitalize">{status}</h3>
						{data
							.filter((i: any) => i.status === status)
							.map((item: any) => (
								<div key={item.id} className="p-3 rounded-lg bg-(--background) border border-(--border) text-sm">
									<div className="font-bold">{item.title}</div>
									<div className="text-gray-500">
										{item.productId} {item.targetQuarter ? `(${item.targetQuarter})` : ''}
									</div>
								</div>
							))}
					</div>
				))}
			</div>
		</div>
	);
}
