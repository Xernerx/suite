/** @format */
'use client';

import { Check, Clock, FileText, Loader2, ShieldAlert, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEnvironment, useToast, useUser } from '@xernerx/providers';
import { useDictionary } from '@xernerx/providers';
import { motion, AnimatePresence } from 'framer-motion';

interface Application {
	id: string;
	ownerId: string;
	targetId: string;
	status: 'pending' | 'approved' | 'denied';
	data: Record<string, any>;
	createdAt: string;
	reviewNote?: string;
	reviewedBy?: string;
}

interface Question {
	id: string;
	type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';
	question: string;
	required: boolean;
	options?: string[];
}

interface ApplicationConfig {
	id: string;
	name: string;
	description: string;
	questions: Question[];
}

interface AppUser {
	id: string;
	name: string;
	icon?: string;
}

export default function ApplicationReviews() {
	const { t } = useDictionary();
	const { user } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [applications, setApplications] = useState<Application[]>([]);
	const [appConfigs, setAppConfigs] = useState<Record<string, ApplicationConfig>>({});
	const [appUsers, setAppUsers] = useState<Record<string, AppUser>>({});
	const [isLoading, setIsLoading] = useState(true);

	// Modal State
	const [selectedApp, setSelectedApp] = useState<Application | null>(null);
	const [reviewNote, setReviewNote] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);

	const fetchApplications = async () => {
		setIsLoading(true);
		try {
			const [appsRes, configsRes] = await Promise.all([
				fetch(getEnvUrl('https://api.xernerx.com/secure/dispatch/applications/reviews'), { credentials: 'include', cache: 'no-store' }),
				fetch(getEnvUrl('https://api.xernerx.com/secure/dispatch/applications'), { credentials: 'include', cache: 'no-store' }),
			]);

			if (!appsRes.ok) throw new Error('Failed to fetch applications');
			const data: Application[] = await appsRes.json();
			const configsData: ApplicationConfig[] = configsRes.ok ? await configsRes.json() : [];

			const configMap: Record<string, ApplicationConfig> = {};
			configsData.forEach((c) => {
				configMap[c.id] = c;
			});
			setAppConfigs(configMap);

			const uniqueUserIds = [...new Set(data.map((app) => app.ownerId).filter((id) => id !== 'anonymous'))];
			const fetchedUsers: Record<string, AppUser> = {};

			await Promise.all(
				uniqueUserIds.map(async (id) => {
					try {
						const userRes = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${id}/discord`));
						if (userRes.ok) {
							const userData = await userRes.json();
							fetchedUsers[id] = {
								id,
								name: userData.global_name || userData.username,
								icon: userData.avatarUrl || undefined,
							};
						}
					} catch (err) {
						console.error(`Failed to fetch Discord data for ${id}`, err);
					}
				})
			);

			setAppUsers(fetchedUsers);
			setApplications(data);
		} catch (err: any) {
			toast({ title: err.message, type: 'error' });
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchApplications();
	}, []);

	const handleAction = async (newStatus: 'approved' | 'denied') => {
		if (!selectedApp) return;
		setIsProcessing(true);

		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/dispatch/applications/reviews/${selectedApp.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					status: newStatus,
					reviewedBy: user?.id,
					reviewNote: reviewNote.trim() || undefined,
				}),
			});

			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData.error || 'Failed to update application');
			}

			// Fire a generic notification if the user isn't anonymous
			if (selectedApp.ownerId !== 'anonymous') {
				const config = appConfigs[selectedApp.targetId];
				const appName = config?.name || 'Application';
				const notificationMessage = `Your request for ${appName} has been ${newStatus}.${reviewNote.trim() ? `\n\nReviewer Note: ${reviewNote.trim()}` : ''}`;

				await fetch(getEnvUrl(`https://api.xernerx.com/secure/dispatch`), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({
						targetId: selectedApp.ownerId,
						senderId: 'system',
						category: 'notification',
						type: 'system_notification',
						data: {
							title: `Application ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
							message: notificationMessage,
							alertType: newStatus === 'approved' ? 'success' : 'error',
						},
					}),
				}).catch((err) => console.error('Failed to send notification', err));
			}

			toast({ title: `Application ${newStatus} successfully.`, type: 'success' });

			setApplications((prev) => prev.map((app) => (app.id === selectedApp.id ? { ...app, status: newStatus, reviewNote: reviewNote.trim() || undefined } : app)));
			closeModal();
		} catch (err: any) {
			toast({ title: err.message, type: 'error' });
		} finally {
			setIsProcessing(false);
		}
	};

	const closeModal = () => {
		setSelectedApp(null);
		setReviewNote('');
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'approved':
				return <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase">Approved</span>;
			case 'denied':
				return <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 uppercase">Denied</span>;
			default:
				return <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 uppercase">Pending</span>;
		}
	};

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full relative"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: `var(--font-fredoka)` }}>
						{t('admin.reviews.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.reviews.description')}</p>
				</div>

				<button
					onClick={fetchApplications}
					disabled={isLoading}
					className="flex items-center justify-center gap-2 rounded-xl text-sm font-medium bg-(--border)/5 hover:bg-(--border)/10 text-(--text) transition-colors disabled:opacity-50"
					style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
				>
					<Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
					{isLoading ? 'Refreshing...' : 'Refresh List'}
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
				{applications.map((app) => {
					const applicant = appUsers[app.ownerId];
					const config = appConfigs[app.targetId];

					return (
						<motion.div
							key={app.id}
							layout
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="group flex flex-col justify-between rounded-[2rem] border border-(--border)/20 bg-(--foreground) shadow-sm hover:shadow-xl hover:border-(--accent)/30 transition-all cursor-pointer overflow-hidden relative"
							onClick={() => setSelectedApp(app)}
							style={{ padding: 'var(--ui-gap)' }}
						>
							<div className="flex justify-between items-start mb-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-(--border)/10 flex items-center justify-center overflow-hidden shrink-0 border border-(--border)/20">
										{app.ownerId === 'anonymous' ? (
											<User className="w-5 h-5 text-(--text-muted)" />
										) : applicant?.icon ? (
											<img src={applicant.icon} alt="Avatar" className="w-full h-full object-cover" />
										) : (
											<User className="w-5 h-5 text-(--text-muted)" />
										)}
									</div>
									<div className="flex flex-col">
										<span className="font-bold text-(--text) line-clamp-1">{app.ownerId === 'anonymous' ? 'Anonymous User' : applicant?.name || 'Unknown User'}</span>
										<span className="text-xs text-(--text-muted)">{new Date(app.createdAt).toLocaleDateString()}</span>
									</div>
								</div>
							</div>

							<div className="flex flex-col gap-2 mb-6">
								<span className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">Application</span>
								<div className="flex items-center gap-2">
									<FileText className="w-4 h-4 text-(--accent)" />
									<span className="font-medium text-(--text)">{config?.name || 'Unknown Form'}</span>
								</div>
							</div>

							<div className="flex items-center justify-between mt-auto pt-4 border-t border-(--border)/10">
								{getStatusBadge(app.status)}
								{app.status === 'pending' ? (
									<span className="flex items-center gap-1.5 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
										<Clock className="w-3 h-3" /> Needs Review
									</span>
								) : (
									<span className="flex items-center gap-1 text-xs text-(--text-muted)">
										<Check className="w-3 h-3 text-emerald-500" /> Reviewed
									</span>
								)}
							</div>
						</motion.div>
					);
				})}

				{!isLoading && applications.length === 0 && (
					<div className="col-span-full py-20 flex flex-col items-center justify-center text-(--text-muted) border-2 border-dashed border-(--border)/20 rounded-[3rem]">
						<ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
						<h3 className="text-lg font-semibold">No Applications Found</h3>
						<p className="text-sm opacity-80">There are no applications waiting for review.</p>
					</div>
				)}
			</div>

			<AnimatePresence>
				{selectedApp && (
					<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="relative flex flex-col w-full max-w-3xl max-h-[85vh] bg-(--foreground)/90 backdrop-blur-md rounded-[2.5rem] border border-(--border)/10 shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_10%,transparent)] overflow-hidden"
						>
							<div className="flex items-center justify-between px-8 py-6 border-b border-(--border)/10 bg-transparent">
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 rounded-full bg-(--border)/10 flex items-center justify-center overflow-hidden shrink-0 border border-(--border)/20">
										{selectedApp.ownerId === 'anonymous' ? (
											<User className="w-6 h-6 text-(--text-muted)" />
										) : appUsers[selectedApp.ownerId]?.icon ? (
											<img src={appUsers[selectedApp.ownerId].icon} alt="Avatar" className="w-full h-full object-cover" />
										) : (
											<User className="w-6 h-6 text-(--text-muted)" />
										)}
									</div>
									<div className="flex flex-col">
										<span className="text-xl font-bold text-(--text)">
											{selectedApp.ownerId === 'anonymous' ? 'Anonymous User' : appUsers[selectedApp.ownerId]?.name || 'Unknown User'}
										</span>
										<span className="text-sm text-(--accent) font-medium">{appConfigs[selectedApp.targetId]?.name || 'Unknown Application'}</span>
									</div>
								</div>
								<button onClick={closeModal} className="p-2 rounded-full hover:bg-(--border)/10 text-(--text-muted) hover:text-(--text) transition-colors">
									<X className="w-5 h-5" />
								</button>
							</div>

							<div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-8 custom-scrollbar">
								<div className="flex flex-col gap-6">
									<h3 className="text-sm font-bold text-(--text-muted) uppercase tracking-widest border-b border-(--border)/10 pb-2">Form Responses</h3>

									{!appConfigs[selectedApp.targetId] ? (
										<p className="text-sm text-red-400 italic">Error: Original application form configuration not found.</p>
									) : (
										appConfigs[selectedApp.targetId].questions?.map((q, idx) => (
											<div key={q.id} className="flex flex-col gap-2 p-4 rounded-2xl bg-(--background)/50 border border-(--border)/10">
												<span className="text-sm font-semibold text-(--text) flex items-center gap-2">
													<span className="text-(--accent)">{idx + 1}.</span> {q.question}
												</span>
												<div className="pl-6 pt-1 text-sm text-(--text-muted)">
													{Array.isArray(selectedApp.data[q.id]) ? (
														selectedApp.data[q.id].length > 0 ? (
															<ul className="list-disc pl-4 flex flex-col gap-1">
																{selectedApp.data[q.id].map((ans: string, i: number) => (
																	<li key={i}>{ans}</li>
																))}
															</ul>
														) : (
															<span className="italic opacity-50">No options selected</span>
														)
													) : (
														<span className="whitespace-pre-wrap">{selectedApp.data[q.id] || <span className="italic opacity-50">No answer provided</span>}</span>
													)}
												</div>
											</div>
										))
									)}
								</div>

								<div className="flex flex-col gap-3 pt-6 border-t border-(--border)/10">
									<label className="text-sm font-bold text-(--text-muted) uppercase tracking-widest">Reviewer Notes (Optional)</label>
									<textarea
										value={reviewNote}
										onChange={(e) => setReviewNote(e.target.value)}
										placeholder="Add a note to be sent to the applicant..."
										className="w-full rounded-2xl border border-(--border)/10 bg-(--background)/50 p-4 text-sm text-(--text) placeholder-(--text-muted) outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent) min-h-[100px] resize-y transition-all"
										disabled={isProcessing || selectedApp.status !== 'pending'}
									/>
								</div>
							</div>

							<div className="flex items-center justify-between px-8 py-6 border-t border-(--border)/10 bg-transparent">
								<div className="flex items-center gap-3">
									<span className="text-sm text-(--text-muted)">Current Status:</span>
									{getStatusBadge(selectedApp.status)}
								</div>

								{selectedApp.status === 'pending' && (
									<div className="flex items-center gap-3">
										<button
											onClick={() => handleAction('denied')}
											disabled={isProcessing}
											className="px-6 py-2.5 rounded-xl text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
										>
											Deny
										</button>
										<button
											onClick={() => handleAction('approved')}
											disabled={isProcessing}
											className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-(--accent) hover:opacity-90 shadow-lg shadow-(--accent)/20 transition-all disabled:opacity-50"
										>
											{isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
											Approve & Assign Role
										</button>
									</div>
								)}
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
}
