'use client';
import { useState, useEffect } from 'react';
import { useEnvironment, useToast } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { motion } from 'framer-motion';

export default function RoadmapPage() {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [roadmap, setRoadmap] = useState<any[]>([]);
	const [issues, setIssues] = useState([]);
	const [metrics, setMetrics] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([
			fetch(getEnvUrl('https://api.xernerx.com/core/roadmap')).then((res) => res.json()),
			fetch(getEnvUrl('https://api.xernerx.com/core/issues/metrics')).then((res) => res.json()),
			fetch(getEnvUrl('https://api.xernerx.com/core/issues')).then((res) => res.json()),
		])
			.then(([roadmapData, metricsData, issuesData]) => {
				setRoadmap(roadmapData.data || []);
				setMetrics(metricsData.data || null);
				setIssues(issuesData.data || []);
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

	// Process Roadmap into Timeline
	// 1. Extract all unique quarters, replace empty with 'Backlog/TBD'
	const itemsWithQ = roadmap.map((i) => ({ ...i, targetQuarter: i.targetQuarter?.trim() ? i.targetQuarter : 'Backlog' }));
	const rawQuarters = [...new Set(itemsWithQ.map((i) => i.targetQuarter))];

	// Sort quarters: 'Backlog' goes first (or last), followed by actual quarters like 'Q1 2026'
	const sortedQuarters = rawQuarters.sort((a, b) => {
		if (a === 'Backlog') return 1; // push backlog to end
		if (b === 'Backlog') return -1;
		// e.g. Q4 2026 vs Q1 2027
		const [qA, yA] = a.split(' ');
		const [qB, yB] = b.split(' ');
		if (yA !== yB) return (parseInt(yA) || 0) - (parseInt(yB) || 0);
		return qA.localeCompare(qB);
	});

	const statusColors: any = {
		idea: 'bg-gray-500',
		planned: 'bg-blue-500',
		active: 'bg-yellow-500',
		released: 'bg-green-500',
	};

	return (
		<div className="flex flex-col w-full min-h-screen overflow-hidden">
			{/* Header & Metrics */}
			<div className="flex flex-col items-center justify-center p-12 bg-transparent border-b border-(--border)/10 backdrop-blur-sm relative z-10">
				<h1 className="text-5xl font-bold mb-4">Platform Roadmap</h1>
				<p className="text-(--text-muted) mb-8 max-w-2xl text-center">Our chronological journey of features, optimizations, and releases. See exactly what is arriving and when.</p>

				<div className="flex gap-8 mt-4">
					<div className="flex flex-col items-center p-6 bg-(--accent)/5 backdrop-blur-md rounded-xl border border-(--accent)/20 shadow-sm">
						<span className="text-3xl font-bold text-(--accent)">{formatTime(metrics?.avgTimeMs)}</span>
						<span className="text-sm text-(--text-muted) uppercase tracking-widest mt-1">Avg Bug Resolution Time</span>
					</div>
					<div className="flex flex-col items-center p-6 bg-(--accent)/5 rounded-xl border border-(--accent)/20">
						<span className="text-3xl font-bold text-(--accent)">{metrics?.recentResolutions?.length || 0}</span>
						<span className="text-sm text-(--text-muted) uppercase tracking-widest mt-1">Issues Resolved Recently</span>
					</div>
				</div>
			</div>

			{/* Beautiful Horizontal Timeline */}
			<div className="w-full relative py-16 px-8 overflow-x-auto custom-scrollbar flex-1">
				<div className="flex gap-12 min-w-max pb-8 pt-4 items-start relative px-12">
					{/* The Continuous Center Line */}
					<div className="absolute top-[28px] left-0 right-0 h-1 bg-(--border)/20 z-0"></div>

					{sortedQuarters.map((quarter, idx) => {
						const qItems = itemsWithQ.filter((i) => i.targetQuarter === quarter);

						return (
							<div key={quarter} className="flex flex-col w-[380px] shrink-0 relative z-10">
								{/* Timeline Node & Label */}
								<div className="flex items-center gap-4 mb-8">
									<div className="w-6 h-6 rounded-full bg-(--accent) border-4 border-(--background) shadow-[0_0_15px_var(--accent)] z-20"></div>
									<h2 className="text-2xl font-black tracking-wider uppercase text-(--text)">{quarter}</h2>
								</div>

								{/* Items Stack */}
								<div className="flex flex-col gap-5">
									{qItems.map((item: any) => (
										<motion.div
											key={item.id}
											layout
											className="flex flex-col p-6 bg-(--foreground)/30 backdrop-blur-xl rounded-2xl border border-(--border)/10 shadow-lg transition-all hover:border-(--accent)/50 hover:bg-(--foreground)/50 gap-3 relative overflow-hidden group"
										>
											<div className="absolute top-0 left-0 w-1 h-full bg-(--border)/10 group-hover:bg-(--accent)/50 transition-colors"></div>

											<div className="flex justify-between items-start gap-4">
												<span className="text-xs font-bold uppercase text-(--accent) bg-(--accent)/10 px-2 py-1 rounded-md tracking-wider border border-(--accent)/20">
													{item.productId}
												</span>
												<div className="flex items-center gap-2">
													<span className={`w-2 h-2 rounded-full ${statusColors[item.status] || 'bg-gray-500'}`}></span>
													<span className="text-xs uppercase font-bold text-(--text-muted)">{item.status}</span>
												</div>
											</div>

											<div className="flex flex-col mt-2">
												<h3 className="font-bold text-xl">{item.title}</h3>
												<p className="text-sm text-(--text-muted) mt-2 leading-relaxed">{item.description}</p>
											</div>

											{item.status === 'released' && item.changelogUrl && (
												<a href={item.changelogUrl} className="mt-4 text-sm font-semibold text-(--accent) hover:underline flex items-center gap-1 w-fit">
													Read Changelog ↗
												</a>
											)}
										</motion.div>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Known Issues Section */}
			<div className="flex flex-col max-w-7xl mx-auto w-full p-8 md:p-12 border-t border-(--border)/10 gap-8 bg-(--background)">
				<div className="flex flex-col gap-2 text-center md:text-left">
					<h2 className="text-3xl font-bold">Known Issues Tracker</h2>
					<p className="text-(--text-muted)">A transparent log of active bugs and recently resolved problems across our ecosystem.</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div className="flex flex-col gap-4">
						<h3 className="font-bold flex items-center gap-2">
							<span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span> Open Issues
						</h3>
						<div className="flex flex-col gap-3">
							{issues.filter((i: any) => i.status === 'open').length === 0 ? (
								<div className="p-4 text-center text-(--text-muted) text-sm border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md rounded-xl">No active issues known!</div>
							) : (
								issues
									.filter((i: any) => i.status === 'open')
									.map((issue: any) => (
										<div key={issue.id} className="p-4 rounded-xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm">
											<div className="flex justify-between items-start mb-2">
												<span className="text-xs font-mono bg-(--accent)/10 text-(--accent) px-2 py-1 rounded w-fit border border-(--accent)/20">{issue.productId}</span>
												<span className="text-xs text-(--text-muted)">{new Date(issue.createdAt).toLocaleDateString()}</span>
											</div>
											<div className="font-bold">{issue.title}</div>
											<div className="text-sm text-(--text-muted) mt-1">{issue.description}</div>
										</div>
									))
							)}
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<h3 className="font-bold flex items-center gap-2">
							<span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span> Recently Resolved
						</h3>
						<div className="flex flex-col gap-3">
							{issues.filter((i: any) => i.status === 'resolved').length === 0 ? (
								<div className="p-4 text-center text-(--text-muted) text-sm border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md rounded-xl">
									No recently resolved issues.
								</div>
							) : (
								issues
									.filter((i: any) => i.status === 'resolved')
									.slice(0, 5)
									.map((issue: any) => (
										<div key={issue.id} className="p-4 rounded-xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm opacity-70">
											<div className="flex justify-between items-start mb-2">
												<span className="text-xs font-mono bg-(--accent)/10 text-(--accent) px-2 py-1 rounded w-fit border border-(--accent)/20">{issue.productId}</span>
												<span className="text-xs text-(--text-muted)">Fixed {new Date(issue.resolvedAt || issue.updatedAt).toLocaleDateString()}</span>
											</div>
											<div className="font-bold line-through">{issue.title}</div>
										</div>
									))
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
