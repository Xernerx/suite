import { useState, useEffect } from 'react';
import { useEnvironment, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button } from '@xernerx/ui';

export default function Issues() {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(getEnvUrl('https://api.xernerx.com/secure/core/issues'), { credentials: 'include' })
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
				<h2 className="text-2xl font-bold">Issues Tracker</h2>
				<Button>Log Bug</Button>
			</div>
			<div className="flex flex-col gap-2">
				{data.map((item: any) => (
					<div key={item.id} className="flex justify-between items-center p-4 rounded-lg bg-(--background) border border-(--border)">
						<div>
							<div className="font-bold flex items-center gap-2">
								<span className={item.status === 'resolved' ? 'text-green-500' : 'text-red-500'}>●</span>
								{item.title}
							</div>
							<div className="text-sm text-gray-500">{item.productId}</div>
						</div>
						{item.status === 'open' && <Button>Mark Resolved</Button>}
					</div>
				))}
			</div>
		</div>
	);
}
