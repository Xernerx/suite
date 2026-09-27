'use client';
import { useState, useEffect } from 'react';
import { useEnvironment, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { motion } from 'framer-motion';

export default function RoadmapPage() {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [roadmap, setRoadmap] = useState([]);
	const [metrics, setMetrics] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([fetch(getEnvUrl('https://api.xernerx.com/core/roadmap')).then((res) => res.json()), fetch(getEnvUrl('https://api.xernerx.com/core/issues/metrics')).then((res) => res.json())])
			.then(([roadmapData, metricsData]) => {
				setRoadmap(roadmapData.data || []);
				setMetrics(metricsData.data || null);
				setLoading(false);
			})
			.catch((err) => {
				toast({ type: 'error', title: 'Error', description: err.message });
				setLoading(false);
			});
	}, [getEnvUrl, toast]);

	if (loading) return <Loading />;

	const formatTime = (ms: number) => {
		if (!ms) return 'N/A';
		const hours = (ms / (1000 * 60 * 60)).toFixed(1);
		return `${hours} hours`;
	};

	const columns = [
		{ id: 'idea', title: 'Ideas (Later)' },
		{ id: 'planned', title: 'Planned (Next)' },
		{ id: 'active', title: 'Active (Now)' },
		{ id: 'released', title: 'Released' },
	];

	return (
		<div className="flex flex-col w-full min-h-screen">
			{/* Header & Metrics */}
			<div className="flex flex-col items-center justify-center p-12 bg-transparent border-b border-(--border)/10 backdrop-blur-sm">
				<h1 className="text-5xl font-bold mb-4">Platform Roadmap</h1>
				<p className="text-gray-500 mb-8 max-w-2xl text-center">See what we're working on, what's coming next, and our track record of maintaining a healthy ecosystem.</p>

				<div className="flex gap-8 mt-4">
					<div className="flex flex-col items-center p-6 bg-(--accent)/10 backdrop-blur-md rounded-xl border border-(--accent)/20 shadow-sm">
						<span className="text-3xl font-bold text-(--accent)">{formatTime(metrics?.avgTimeMs)}</span>
						<span className="text-sm text-gray-500 uppercase tracking-widest mt-1">Avg Bug Resolution Time</span>
					</div>
					<div className="flex flex-col items-center p-6 bg-(--accent)/10 rounded-xl border border-(--accent)/20">
						<span className="text-3xl font-bold text-(--accent)">{metrics?.recentResolutions?.length || 0}</span>
						<span className="text-sm text-gray-500 uppercase tracking-widest mt-1">Issues Resolved Recently</span>
					</div>
				</div>
			</div>

			{/* Horizontal Roadmap Board */}
			<div className="flex-1 overflow-x-auto p-8">
				<div className="flex gap-6 min-w-max h-full">
					{columns.map((col) => {
						const items = roadmap.filter((i: any) => i.status === col.id);
						return (
							<div key={col.id} className="flex flex-col w-[350px] shrink-0 bg-(--foreground)/30 backdrop-blur-md p-4 rounded-2xl border border-(--border)/10">
								<div className="flex justify-between items-center mb-6 px-2">
									<h2 className="font-bold text-lg">{col.title}</h2>
									<span className="text-sm bg-(--foreground)/50 backdrop-blur-sm px-2 py-1 rounded-full border border-(--border)/10">{items.length}</span>
								</div>

								<div className="flex flex-col gap-4">
									{items.map((item: any) => (
										<motion.div
											key={item.id}
											layout
											className="flex flex-col p-5 bg-(--foreground)/30 backdrop-blur-md rounded-xl border border-(--border)/10 shadow-sm transition-colors hover:border-(--accent)/50 hover:bg-(--foreground)/50 gap-2"
										>
											<div className="flex justify-between items-start">
												<span className="text-xs font-bold uppercase text-(--accent)">{item.productId}</span>
												{item.targetQuarter && <span className="text-xs bg-(--foreground)/50 border border-(--border)/10 px-2 py-1 rounded">{item.targetQuarter}</span>}
											</div>
											<h3 className="font-bold text-lg mt-1">{item.title}</h3>
											<p className="text-sm text-gray-500">{item.description}</p>

											{item.status === 'released' && item.changelogUrl && (
												<a href={item.changelogUrl} className="mt-2 text-sm text-(--accent) hover:underline">
													Read Changelog →
												</a>
											)}
										</motion.div>
									))}
									{items.length === 0 && (
										<div className="p-4 text-center text-gray-400 text-sm border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm rounded-xl">
											No items in this stage
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
