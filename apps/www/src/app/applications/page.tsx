/** @format */
'use client';

import { ArrowRight, Briefcase, Loader2, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useEnvironment, useSidebar, useUser } from '@xernerx/providers';
import Link from 'next/link';

interface ApplicationConfig {
	_id: string;
	id: string;
	name: string;
	description: string;
	requireLogin?: boolean;
	benefits?: string[];
	requirements?: string[];
	questions?: any[];
}

export default function ApplicationsPage() {
	const { hide } = useSidebar();
	const { getEnvUrl, isReady } = useEnvironment();
	const { user } = useUser();

	const [applications, setApplications] = useState<ApplicationConfig[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		hide();
	}, [hide]);

	useEffect(() => {
		if (!isReady) return;
		async function fetchApplications() {
			try {
				const response = await fetch(getEnvUrl('https://api.xernerx.com/secure/applications/open'), {
					credentials: 'include', // public open roles don't necessarily need cookies, but let's be explicit
				});

				if (!response.ok) throw new Error('Failed to fetch applications');

				const json = await response.json();

				if (json.success) {
					setApplications(json.data);
				} else {
					throw new Error(json.error || 'Unknown error');
				}
			} catch (err) {
				console.warn(err);
				setError('Failed to load open applications.');
			} finally {
				setLoading(false);
			}
		}

		fetchApplications();
	}, [getEnvUrl]);

	return (
		<div className="flex flex-col min-h-screen pt-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
			<div className="mb-12">
				<h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
					Open Applications
				</h1>
				<p className="text-lg text-(--text-muted) max-w-2xl">Join the team! Browse our currently open roles and positions below. If you think you're a good fit, we'd love to hear from you.</p>
			</div>

			{loading ? (
				<div className="flex justify-center items-center py-24">
					<Loader2 className="w-8 h-8 animate-spin text-(--accent)" />
				</div>
			) : error ? (
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl backdrop-blur-md">
					{error}
				</motion.div>
			) : applications.length === 0 ? (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-neutral-500/20 rounded-3xl bg-neutral-500/5 backdrop-blur-xl"
				>
					<Briefcase className="w-12 h-12 text-(--text-muted) mb-4 opacity-50" />
					<h3 className="text-2xl font-bold mb-2">No Open Roles</h3>
					<p className="text-(--text-muted) max-w-sm">Check back later for new opportunities! We're always looking for great talent.</p>
				</motion.div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{applications.map((app, i) => (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.1, duration: 0.4 }}
							key={app.id}
							className="flex flex-col p-6 rounded-3xl border border-neutral-500/10 bg-neutral-500/5 backdrop-blur-2xl hover:bg-neutral-500/10 hover:border-(--accent)/50 transition-all duration-300 group shadow-lg shadow-black/5"
						>
							<div className="flex items-start justify-between mb-4">
								<div className="flex items-center justify-center w-12 h-12 rounded-full bg-(--accent)/20 text-(--accent)">
									<Briefcase className="w-6 h-6" />
								</div>
							</div>
							<h3 className="text-2xl font-bold mb-3 group-hover:text-(--accent) transition-colors">{app.name}</h3>
							<p className="text-(--text-muted) mb-6 line-clamp-2 leading-relaxed">{app.description || 'No description provided.'}</p>

							<div className="flex flex-col gap-5 mb-8 flex-grow">
								{app.requirements && app.requirements.length > 0 && (
									<div className="flex flex-col gap-2">
										<span className="text-xs font-bold uppercase tracking-wider text-(--text)">Requirements</span>
										<ul className="text-sm text-(--text-muted) flex flex-col gap-1.5">
											{app.requirements.slice(0, 3).map((req, idx) => (
												<li key={idx} className="flex items-start gap-2">
													<span className="text-(--accent) mt-[2px] opacity-80">•</span>
													<span className="leading-snug line-clamp-2">{req}</span>
												</li>
											))}
											{app.requirements.length > 3 && <li className="text-xs text-(--text-muted)/60 italic ml-4">+{app.requirements.length - 3} more</li>}
										</ul>
									</div>
								)}
								{app.benefits && app.benefits.length > 0 && (
									<div className="flex flex-col gap-2">
										<span className="text-xs font-bold uppercase tracking-wider text-(--text)">Benefits</span>
										<ul className="text-sm text-(--text-muted) flex flex-col gap-1.5">
											{app.benefits.slice(0, 3).map((ben, idx) => (
												<li key={idx} className="flex items-start gap-2">
													<span className="text-emerald-400 mt-[2px] opacity-80">✓</span>
													<span className="leading-snug line-clamp-2">{ben}</span>
												</li>
											))}
											{app.benefits.length > 3 && <li className="text-xs text-(--text-muted)/60 italic ml-4">+{app.benefits.length - 3} more</li>}
										</ul>
									</div>
								)}
							</div>

							{app.requireLogin !== false && !user ? (
								<Link
									href={`${getEnvUrl('https://account.xernerx.com/login')}?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + `/applications/${app.id}` : '')}`}
									className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-500/20 hover:opacity-90 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98] group"
								>
									Log in to Apply
									<LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
								</Link>
							) : (
								<Link
									href={`/applications/${app.id}`}
									className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-(--accent) text-white font-semibold shadow-md shadow-(--accent)/20 hover:opacity-90 hover:shadow-lg hover:shadow-(--accent)/30 transition-all active:scale-[0.98] group"
								>
									Apply Now
									<ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
								</Link>
							)}
						</motion.div>
					))}
				</div>
			)}
		</div>
	);
}
