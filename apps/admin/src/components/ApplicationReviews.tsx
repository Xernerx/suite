/** @format */
'use client';

import { Check, Clock, Copy, ExternalLink, FileText, Loader2, ShieldAlert, User } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useEnvironment, useToast, useUser } from '@xernerx/providers';
import { UserProfilePopover } from '@xernerx/components';
import { useDictionary } from '@xernerx/providers';
import { Loading } from '@xernerx/feedback';
import { Button, Input, Modal, Selector } from '@xernerx/ui';
import { motion } from 'framer-motion';

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

export default function ApplicationReviews({ initialSearch = '' }: { initialSearch?: string }) {
	const { t } = useDictionary();
	const { user } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();

	const [applications, setApplications] = useState<Application[]>([]);
	const [appConfigs, setAppConfigs] = useState<Record<string, ApplicationConfig>>({});
	const [appUsers, setAppUsers] = useState<Record<string, AppUser>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState(initialSearch);
	const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');

	useEffect(() => {
		if (initialSearch) setSearch(initialSearch);
	}, [initialSearch]);

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
			const rawData = await appsRes.json();
			const data: Application[] = Array.isArray(rawData) ? rawData : [];
			const rawConfigs = configsRes.ok ? await configsRes.json() : [];
			const configsData: ApplicationConfig[] = Array.isArray(rawConfigs) ? rawConfigs : [];

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
				throw new Error(errData.error || t('common.toast.error'));
			}

			// Fire a generic notification if the user isn't anonymous
			if (selectedApp.ownerId !== 'anonymous') {
				const config = appConfigs[selectedApp.targetId];
				const appName = config?.name || t('admin.dashboard.applicationReviews.application');
				const baseMessage = t('admin.dashboard.applicationReviews.notificationMessage', {
					appName,
					status: t(`admin.reviews.status.${newStatus}`).toLowerCase(),
				});
				const notificationMessage = reviewNote.trim() ? `${baseMessage}\n\n${t('admin.dashboard.applicationReviews.notificationNotePrefix', { note: reviewNote.trim() })}` : baseMessage;

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
							title: newStatus === 'approved' ? t('admin.dashboard.applicationReviews.notificationApprovedTitle') : t('admin.dashboard.applicationReviews.notificationDeniedTitle'),
							message: notificationMessage,
							alertType: newStatus === 'approved' ? 'success' : 'error',
						},
					}),
				}).catch((err) => console.error('Failed to send notification', err));
			}

			toast({
				title: newStatus === 'approved' ? t('admin.dashboard.applicationReviews.toasts.approvedSuccess') : t('admin.dashboard.applicationReviews.toasts.deniedSuccess'),
				type: 'success',
			});

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
				return (
					<span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-(--accent-green)/10 text-(--accent-green) uppercase">
						{t('admin.reviews.status.approved')}
					</span>
				);
			case 'denied':
				return <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-(--accent-red)/10 text-(--accent-red) uppercase">{t('admin.reviews.status.denied')}</span>;
			default:
				return (
					<span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-(--accent-orange)/10 text-(--accent-orange) uppercase">
						{t('admin.reviews.status.pending')}
					</span>
				);
		}
	};

	const filteredApplications = useMemo(() => {
		const q = search.trim().toLowerCase();
		return applications.filter((app) => {
			if (statusFilter !== 'all' && app.status !== statusFilter) return false;
			if (!q) return true;
			const applicant = appUsers[app.ownerId];
			const config = appConfigs[app.targetId];
			return (
				String(app.ownerId || '')
					.toLowerCase()
					.includes(q) ||
				String(applicant?.name || '')
					.toLowerCase()
					.includes(q) ||
				String(config?.name || '')
					.toLowerCase()
					.includes(q) ||
				String(app.id || '')
					.toLowerCase()
					.includes(q)
			);
		});
	}, [applications, search, statusFilter, appUsers, appConfigs]);

	if (isLoading && applications.length === 0) return <Loading />;

	return (
		<div
			className="flex flex-col max-w-(--page-width) mx-auto w-full relative"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<div className="flex flex-col lg:flex-row lg:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: `var(--font-fredoka)` }}>
						{t('admin.reviews.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('admin.reviews.description')}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<div className="w-full sm:w-64">
						<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.dashboard.applicationReviews.searchPlaceholder')} />
					</div>
					<div className="w-full sm:w-40">
						<Selector
							value={statusFilter}
							onChange={(val) => setStatusFilter(val as any)}
							options={[
								{ value: 'all', label: t('admin.dashboard.applicationReviews.filterAll') },
								{ value: 'pending', label: t('admin.dashboard.applicationReviews.filterPending') },
								{ value: 'approved', label: t('admin.dashboard.applicationReviews.filterApproved') },
								{ value: 'denied', label: t('admin.dashboard.applicationReviews.filterDenied') },
							]}
						/>
					</div>
					<button
						onClick={fetchApplications}
						disabled={isLoading}
						className="flex items-center justify-center gap-2 rounded-xl text-sm font-medium bg-(--border)/5 hover:bg-(--border)/10 text-(--text) transition-colors disabled:opacity-50"
						style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
					>
						<Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
						{isLoading ? t('admin.dashboard.applicationReviews.refreshing') : t('admin.dashboard.applicationReviews.refreshList')}
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
				{filteredApplications.map((app) => {
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
											<Image src={applicant.icon} alt="Avatar" width={40} height={40} unoptimized className="w-full h-full object-cover" />
										) : (
											<User className="w-5 h-5 text-(--text-muted)" />
										)}
									</div>
									<div className="flex flex-col">
										<span className="font-bold text-(--text) line-clamp-1">
											{app.ownerId === 'anonymous'
												? t('admin.dashboard.applicationReviews.anonymousUser')
												: applicant?.name || t('admin.dashboard.applicationReviews.unknownUser')}
										</span>
										<span className="text-xs text-(--text-muted)">{new Date(app.createdAt).toLocaleDateString()}</span>
									</div>
								</div>
							</div>

							<div className="flex flex-col gap-2 mb-6">
								<span className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">{t('admin.dashboard.applicationReviews.application')}</span>
								<div className="flex items-center gap-2">
									<FileText className="w-4 h-4 text-(--accent)" />
									<span className="font-medium text-(--text)">{config?.name || t('admin.dashboard.applicationReviews.unknownForm')}</span>
								</div>
							</div>

							<div className="flex items-center justify-between mt-auto pt-4 border-t border-(--border)/10">
								{getStatusBadge(app.status)}
								{app.status === 'pending' ? (
									<span className="flex items-center gap-1.5 text-xs font-medium text-(--accent-orange) bg-(--accent-orange)/10 px-2 py-1 rounded-full">
										<Clock className="w-3 h-3" /> {t('admin.dashboard.applicationReviews.needsReview')}
									</span>
								) : (
									<span className="flex items-center gap-1 text-xs text-(--text-muted)">
										<Check className="w-3 h-3 text-(--accent-green)" /> {t('admin.dashboard.applicationReviews.reviewed')}
									</span>
								)}
							</div>
						</motion.div>
					);
				})}

				{!isLoading && filteredApplications.length === 0 && (
					<div className="col-span-full py-20 flex flex-col items-center justify-center text-(--text-muted) border-2 border-dashed border-(--border)/20 rounded-[3rem]">
						<ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
						<h3 className="text-lg font-semibold">{t('admin.dashboard.applicationReviews.noApplicationsFound')}</h3>
						<p className="text-sm opacity-80">{t('admin.dashboard.applicationReviews.noApplicationsWaiting')}</p>
					</div>
				)}
			</div>

			<Modal
				open={Boolean(selectedApp)}
				onOpenChange={(open) => {
					if (!open) closeModal();
				}}
				title={
					selectedApp
						? selectedApp.ownerId === 'anonymous'
							? t('admin.dashboard.applicationReviews.anonymousUser')
							: appUsers[selectedApp.ownerId]?.name || t('admin.dashboard.applicationReviews.unknownUser')
						: ''
				}
				description={selectedApp ? appConfigs[selectedApp.targetId]?.name || t('admin.dashboard.applicationReviews.unknownApplication') : ''}
				maxWidth="max-w-3xl"
			>
				{selectedApp && (
					<div className="flex flex-col gap-6 pt-2">
						{selectedApp.ownerId && selectedApp.ownerId !== 'anonymous' && (
							<div className="flex items-center gap-2">
								<UserProfilePopover userId={selectedApp.ownerId} initialUser={appUsers[selectedApp.ownerId]}>
									<span className="text-xs font-mono text-(--text-muted) hover:text-(--accent) transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-(--background)/60 border border-(--border)/10">
										{selectedApp.ownerId}
										<ExternalLink size={11} />
									</span>
								</UserProfilePopover>
								<button
									type="button"
									onClick={() => {
										navigator.clipboard.writeText(selectedApp.ownerId);
										toast({ title: t('admin.dashboard.suggestions.idCopied'), type: 'success' });
									}}
									className="p-1.5 rounded-xl text-(--text-muted) hover:text-(--text) transition-colors cursor-pointer"
								>
									<Copy size={12} />
								</button>
							</div>
						)}

						<div className="flex flex-col gap-4 max-h-[52dvh] overflow-y-auto pr-1 custom-scrollbar">
							<h3 className="text-xs font-bold text-(--text-muted) uppercase tracking-widest border-b border-(--border)/10 pb-2">
								{t('admin.dashboard.applicationReviews.formResponses')}
							</h3>

							{!appConfigs[selectedApp.targetId] ? (
								<p className="text-sm text-(--accent-red) italic">{t('admin.dashboard.applicationReviews.errorConfigNotFound')}</p>
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
													<span className="italic opacity-50">{t('admin.dashboard.applicationReviews.noOptionsSelected')}</span>
												)
											) : (
												<span className="whitespace-pre-wrap">
													{selectedApp.data[q.id] || <span className="italic opacity-50">{t('admin.dashboard.applicationReviews.noAnswerProvided')}</span>}
												</span>
											)}
										</div>
									</div>
								))
							)}
						</div>

						<div className="flex flex-col gap-2 pt-4 border-t border-(--border)/10">
							<label className="text-xs font-bold text-(--text-muted) uppercase tracking-widest">{t('admin.dashboard.applicationReviews.reviewerNotes')}</label>
							<Input
								variant="textarea"
								value={reviewNote}
								onChange={(e) => setReviewNote(e.target.value)}
								placeholder={t('admin.dashboard.applicationReviews.addNotePlaceholder')}
								rows={3}
								disabled={isProcessing || selectedApp.status !== 'pending'}
							/>
						</div>

						<div className="flex items-center justify-between pt-4 border-t border-(--border)/10">
							<div className="flex items-center gap-3">
								<span className="text-sm text-(--text-muted)">{t('admin.dashboard.applicationReviews.currentStatus')}</span>
								{getStatusBadge(selectedApp.status)}
							</div>

							{selectedApp.status === 'pending' && (
								<div className="flex items-center gap-3">
									<Button variant="danger" onClick={() => handleAction('denied')} disabled={isProcessing}>
										{t('admin.dashboard.applicationReviews.deny')}
									</Button>
									<Button variant="primary" onClick={() => handleAction('approved')} loading={isProcessing} disabled={isProcessing}>
										{t('admin.dashboard.applicationReviews.approveAssignRole')}
									</Button>
								</div>
							)}
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}
