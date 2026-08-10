/** @format */
'use client';

import { AlertTriangle, Bell, Check, CheckCircle2, ExternalLink, Info, Loader2, Mail, RefreshCw, Trash2, X } from 'lucide-react';
import { Notification, useEnvironment, useNotifications, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

interface SidebarNotificationsProps {
	isCollapsed: boolean;
	onClose: () => void;
}

export default function SidebarNotifications({ isCollapsed, onClose }: SidebarNotificationsProps) {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications();

	const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
	const [mounted, setMounted] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Ensure portal only renders on the client side to prevent hydration mismatches
	useEffect(() => {
		setMounted(true);
	}, []);

	const handleNotificationClick = (notification: Notification) => {
		setSelectedNotification(notification);
		if (!notification.read) {
			markAsRead(notification.id);
		}
	};

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await refresh();
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleMarkUnread = async () => {
		if (!selectedNotification) return;
		setIsProcessing(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/content/notifications/${selectedNotification.id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ read: false }),
			});
			if (!res.ok) throw new Error('Failed to mark as unread');

			await refresh();
			setSelectedNotification(null);
		} catch (err: any) {
			toast({ title: err.message, type: 'error' });
		} finally {
			setIsProcessing(false);
		}
	};

	const handleDelete = async () => {
		if (!selectedNotification) return;
		setIsProcessing(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/content/notifications/${selectedNotification.id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error('Failed to delete notification');

			await refresh();
			setSelectedNotification(null);
			toast({ title: 'Notification deleted', type: 'success' });
		} catch (err: any) {
			toast({ title: err.message, type: 'error' });
		} finally {
			setIsProcessing(false);
		}
	};

	const getIcon = (type: string) => {
		switch (type) {
			case 'success':
				return <CheckCircle2 size={16} className="text-green-500" />;
			case 'error':
				return <AlertTriangle size={16} className="text-red-500" />;
			case 'warning':
				return <AlertTriangle size={16} className="text-yellow-500" />;
			default:
				return <Info size={16} className="text-blue-500" />;
		}
	};

	return (
		<>
			<motion.div
				initial={{ opacity: 0, y: 10, scale: 0.95 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 10, scale: 0.95 }}
				transition={{ duration: 0.2, ease: 'easeOut' }}
				className={`absolute bottom-full mb-3 z-50 flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xl
                    ${isCollapsed ? 'left-0 w-64' : 'left-0 right-0 w-full'}
                `}
				style={{
					padding: 'calc(var(--ui-gap) * 0.5)',
					gap: 'calc(var(--ui-gap) * 0.5)',
				}}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-(--border)/10">
					<div className="flex items-center gap-2">
						<Bell size={14} className="text-(--text-muted)" />
						<span className="text-sm font-semibold text-(--text)">Notifications</span>
						{unreadCount > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">{unreadCount}</span>}
					</div>
					<div className="flex items-center gap-3">
						<button
							onClick={handleRefresh}
							disabled={isRefreshing}
							className="text-[10px] font-medium text-(--text-muted) hover:text-(--text) transition-colors flex items-center gap-1 disabled:opacity-50"
						>
							<RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
							Refresh
						</button>
						{unreadCount > 0 && (
							<button onClick={markAllAsRead} className="text-[10px] font-medium text-(--text-muted) hover:text-(--text) transition-colors flex items-center gap-1">
								<Check size={12} />
								Mark all read
							</button>
						)}
					</div>
				</div>

				{/* Notification List */}
				<div className="flex flex-col max-h-[300px] overflow-y-auto" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					{notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8 text-(--text-muted)">
							<Bell size={24} className="opacity-20 mb-2" />
							<span className="text-xs">No notifications yet</span>
						</div>
					) : (
						notifications.slice(0, 10).map((notification) => (
							<button
								key={notification.id}
								onClick={() => handleNotificationClick(notification)}
								className={`flex items-start text-left rounded-xl transition-colors
                                    ${!notification.read ? 'bg-(--active-accent)/5' : 'hover:bg-(--background)'}
                                `}
								style={{ padding: 'calc(var(--ui-gap) * 0.75)' }}
							>
								<div className="flex items-center justify-center shrink-0 w-6 mt-0.5">{getIcon(notification.type)}</div>
								<div className="flex flex-col flex-1 overflow-hidden" style={{ marginLeft: 'calc(var(--ui-gap) * 0.5)' }}>
									<span className={`text-sm truncate ${!notification.read ? 'font-bold text-(--text)' : 'font-medium text-(--text-muted)'}`}>{notification.title}</span>
									<span className="text-xs text-(--text-muted) truncate mt-0.5">{notification.message}</span>
								</div>
								{!notification.read && <div className="shrink-0 h-2 w-2 rounded-full bg-red-500 ml-2 mt-1.5" />}
							</button>
						))
					)}
				</div>
			</motion.div>

			{/* Read Modal (Portaled to document.body to break out of the sidebar) */}
			{mounted &&
				selectedNotification &&
				createPortal(
					<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200">
						<div
							className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-2xl animate-in zoom-in-95 duration-200"
							style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
						>
							{/* Modal Header (Fixed) */}
							<div className="flex items-start justify-between shrink-0" style={{ gap: 'var(--ui-gap)' }}>
								<div className="flex items-center gap-3">
									<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--background) shadow-sm">{getIcon(selectedNotification.type)}</div>
									<div className="flex flex-col">
										<h2 className="text-lg font-bold text-(--text)">{selectedNotification.title}</h2>
										<span className="text-xs font-medium text-(--text-muted)">
											{new Date(selectedNotification.createdAt).toLocaleString(undefined, {
												dateStyle: 'long',
												timeStyle: 'short',
											})}
										</span>
									</div>
								</div>
								<button
									onClick={() => setSelectedNotification(null)}
									disabled={isProcessing}
									className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-(--border)/10 text-(--text-muted) transition-colors disabled:opacity-50"
								>
									<X size={16} />
								</button>
							</div>

							{/* Modal Body (Scrollable) */}
							<div className="rounded-2xl bg-(--background) border border-(--border)/5 p-6 overflow-y-auto">
								<p className="text-base text-(--text) leading-relaxed whitespace-pre-wrap">{selectedNotification.message}</p>
							</div>

							{/* Modal Footer (Fixed) */}
							<div className="flex items-center justify-between pt-2 shrink-0 border-t border-(--border)/10 mt-1" style={{ paddingTop: 'calc(var(--ui-gap) * 0.75)' }}>
								{/* Left Side Actions (Delete & Unread) */}
								<div className="flex items-center gap-2">
									<button
										onClick={handleDelete}
										disabled={isProcessing}
										title="Delete Notification"
										className="flex items-center justify-center h-10 w-10 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
									>
										{isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
									</button>
									<button
										onClick={handleMarkUnread}
										disabled={isProcessing}
										title="Mark as Unread"
										className="flex items-center justify-center h-10 w-10 rounded-xl text-(--text-muted) hover:bg-(--border)/10 transition-colors disabled:opacity-50"
									>
										{isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
									</button>
								</div>

								{/* Right Side Actions (Link & Close) */}
								<div className="flex items-center gap-2">
									{selectedNotification.link && (
										<a
											href={selectedNotification.link}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2 rounded-xl text-sm font-medium bg-(--accent)/10 text-(--accent) hover:bg-(--accent)/20 transition-colors"
											style={{ padding: 'calc(var(--ui-gap) * 0.65) calc(var(--ui-gap) * 1.5)' }}
										>
											Open Link <ExternalLink size={14} />
										</a>
									)}
									<button
										onClick={() => setSelectedNotification(null)}
										disabled={isProcessing}
										className="rounded-xl text-sm font-medium bg-(--border)/10 hover:bg-(--border)/20 text-(--text) transition-colors disabled:opacity-50"
										style={{ padding: 'calc(var(--ui-gap) * 0.65) calc(var(--ui-gap) * 1.5)' }}
									>
										Close
									</button>
								</div>
							</div>
						</div>
					</div>,
					document.body
				)}
		</>
	);
}
