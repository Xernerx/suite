/** @format */
'use client';

import { Check, Clock, FileText, Loader2, ShieldAlert, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEnvironment, useToast, useUser } from '@xernerx/providers';

// Define the type based on the GET response from your API
interface Application {
	id: string;
	userId: string;
	type: string;
	status: 'pending' | 'approved' | 'denied';
	metadata?: Record<string, any>;
	createdAt: string;
	reviewNote?: string;
	reviewedBy?: string;
}

// Minimal interface for the fetched user data mapped from Discord
interface AppUser {
	id: string;
	name: string;
	icon?: string;
}

export default function Applications() {
	const { user } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [applications, setApplications] = useState<Application[]>([]);
	const [appUsers, setAppUsers] = useState<Record<string, AppUser>>({});
	const [isLoading, setIsLoading] = useState(true);

	// Modal State
	const [selectedApp, setSelectedApp] = useState<Application | null>(null);
	const [reviewNote, setReviewNote] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);

	const fetchApplications = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(getEnvUrl('https://api.xernerx.com/secure/content/applications'), {
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed to fetch applications');
			const data: Application[] = await res.json();

			// Extract unique user IDs to fetch their Discord profiles
			const uniqueUserIds = [...new Set(data.map((app) => app.userId))];
			const fetchedUsers: Record<string, AppUser> = {};

			// Fetch live Discord data in parallel
			await Promise.all(
				uniqueUserIds.map(async (id) => {
					try {
						const userRes = await fetch(getEnvUrl(`https://api.xernerx.com/core/users/${id}/discord`));

						if (userRes.ok) {
							const userData = await userRes.json();
							// Map the Discord response to our local AppUser format
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
			// 1. Process the Application update
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/content/applications/${selectedApp.id}`), {
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

			// 2. Fire the Notification to the user
			const formattedType = selectedApp.type.replace('_', ' ');
			const notificationTitle = `Application ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`;
			const notificationMessage = `Your request for the ${formattedType} role has been ${newStatus}.${reviewNote.trim() ? `\n\nReviewer Note: ${reviewNote.trim()}` : ''}`;

			await fetch(getEnvUrl(`https://api.xernerx.com/secure/content/notifications`), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					userId: selectedApp.userId,
					title: notificationTitle,
					message: notificationMessage,
					type: newStatus === 'approved' ? 'success' : 'error',
					link: newStatus === 'approved' ? getEnvUrl('https://admin.xernerx.com') : undefined,
				}),
			});

			toast({ title: `Application ${newStatus} successfully.`, type: 'success' });

			// Update local state and close modal
			setApplications((prev) => prev.map((app) => (app.id === selectedApp.id ? { ...app, status: newStatus, reviewNote } : app)));
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
				return <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 uppercase">Approved</span>;
			case 'denied':
				return <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 uppercase">Denied</span>;
			default:
				return <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 uppercase">Pending</span>;
		}
	};

	return (
		<div className="flex flex-col max-w-7xl mx-auto w-full relative" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)', fontSize: 'var(--text-scale, 14px)' }}>
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: `var(--font-fredoka)` }}>
						Applications
					</h1>
					<p className="text-sm text-(--text-muted)">Review and manage user requests.</p>
				</div>

				<button
					onClick={fetchApplications}
					disabled={isLoading}
					className="flex items-center justify-center gap-2 rounded-xl text-sm font-medium bg-(--border)/5 hover:bg-(--border)/10 text-(--text) transition-colors disabled:opacity-50"
					style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
				>
					{isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Refresh'}
				</button>
			</div>

			{/* List */}
			<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden">
				{isLoading && applications.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-(--text-muted)">
						<Loader2 size={32} className="animate-spin mb-4 opacity-50" />
						<p>Loading applications...</p>
					</div>
				) : applications.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-(--text-muted)">
						<ShieldAlert size={48} className="mb-4 opacity-20" />
						<p>No applications found.</p>
					</div>
				) : (
					<div className="flex flex-col divide-y divide-(--border)/10">
						{applications.map((app, i) => {
							const applicant = appUsers[app.userId];

							return (
								<div
									key={i}
									onClick={() => {
										setSelectedApp(app);
										setReviewNote(app.reviewNote || '');
									}}
									className="flex items-center justify-between hover:bg-(--border)/5 cursor-pointer transition-colors"
									style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)' }}
								>
									<div className="flex items-center gap-4">
										<div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--border)/5 text-(--text-muted) overflow-hidden border border-(--border)/10">
											{applicant?.icon ? <img src={applicant.icon} alt={applicant.name} className="h-full w-full object-cover" /> : <User size={18} />}
										</div>
										<div className="flex flex-col gap-0.5">
											<span className="font-semibold text-(--text) capitalize">{app.type.replace('_', ' ')}</span>
											<span className="text-xs text-(--text-muted) flex items-center gap-1">
												{applicant?.name ? <span className="font-medium text-(--text)">{applicant.name}</span> : null}
												<span className="font-mono opacity-60">({app.userId})</span>
											</span>
										</div>
									</div>
									<div className="flex items-center gap-4">
										<span className="hidden sm:flex text-xs text-(--text-muted) items-center gap-1">
											<Clock size={12} className="opacity-50" />
											{new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
										</span>
										{getStatusBadge(app.status)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Review Modal */}
			{selectedApp && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
					<div className="flex flex-col w-full max-w-lg rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden">
						{/* Modal Header */}
						<div className="flex items-center justify-between border-b border-(--border)/10 bg-(--background)/50 backdrop-blur-md" style={{ padding: 'var(--ui-gap)' }}>
							<h2 className="text-lg font-bold text-(--text) capitalize">{selectedApp.type.replace('_', ' ')} Application</h2>
							{getStatusBadge(selectedApp.status)}
						</div>

						{/* Modal Body */}
						<div className="flex flex-col" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
							{/* Info Grid */}
							<div className="grid grid-cols-2 gap-4 rounded-2xl border border-(--border)/10 bg-(--background)/50 backdrop-blur-md p-4">
								<div className="flex flex-col gap-1">
									<span className="text-[10px] uppercase font-bold tracking-wider text-(--text-muted)">Applicant</span>
									<div className="text-sm font-medium text-(--text) truncate flex items-center gap-2">
										{appUsers[selectedApp.userId]?.icon ? (
											<img src={appUsers[selectedApp.userId].icon} alt="Avatar" className="h-5 w-5 rounded-full object-cover border border-(--border)/10" />
										) : (
											<User size={14} className="opacity-50" />
										)}
										<span className="truncate">{appUsers[selectedApp.userId]?.name || 'Unknown'}</span>
										<span className="font-mono text-xs opacity-50 shrink-0">({selectedApp.userId})</span>
									</div>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-[10px] uppercase font-bold tracking-wider text-(--text-muted)">Applied On</span>
									<span className="text-sm text-(--text) flex items-center gap-1.5">
										<Clock size={14} className="opacity-50" /> {new Date(selectedApp.createdAt).toLocaleDateString()}
									</span>
								</div>
								{selectedApp.metadata?.locale && (
									<div className="flex flex-col gap-1 col-span-2 border-t border-(--border)/10 pt-3 mt-1">
										<span className="text-[10px] uppercase font-bold tracking-wider text-(--text-muted)">Requested Language</span>
										<span className="text-sm font-medium text-(--text)">{selectedApp.metadata.locale}</span>
									</div>
								)}
							</div>

							{/* Review Note Input (Only editable if pending) */}
							<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
								<label className="text-sm font-semibold text-(--text)">Review Reason (Optional)</label>
								<textarea
									value={reviewNote}
									onChange={(e) => setReviewNote(e.target.value)}
									placeholder="Explain why this was approved or denied (visible to user)..."
									disabled={selectedApp.status !== 'pending' || isProcessing}
									rows={3}
									className="w-full rounded-xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-sm text-(--text) placeholder:text-(--text-muted)/50 focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent) disabled:opacity-50 resize-none p-3"
								/>
							</div>
						</div>

						{/* Modal Footer Actions */}
						<div
							className="flex items-center justify-end bg-(--background)/50 backdrop-blur-md border-t border-(--border)/10"
							style={{ padding: 'var(--ui-gap)', gap: 'calc(var(--ui-gap) * 0.5)' }}
						>
							<button
								type="button"
								disabled={isProcessing}
								onClick={closeModal}
								className="rounded-xl text-sm font-medium text-(--text) hover:bg-(--border)/10 transition-colors disabled:opacity-50"
								style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
							>
								{selectedApp.status === 'pending' ? 'Cancel' : 'Close'}
							</button>

							{selectedApp.status === 'pending' && (
								<>
									<button
										type="button"
										disabled={isProcessing}
										onClick={() => handleAction('denied')}
										className="flex items-center justify-center rounded-xl text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
										style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
									>
										{isProcessing ? <Loader2 size={16} className="animate-spin" /> : 'Deny'}
									</button>
									<button
										type="button"
										disabled={isProcessing}
										onClick={() => handleAction('approved')}
										className="flex items-center justify-center gap-2 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 shadow-sm"
										style={{ padding: 'calc(var(--ui-gap) * 0.5) calc(var(--ui-gap) * 1.25)' }}
									>
										{isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
										<span>Approve</span>
									</button>
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
