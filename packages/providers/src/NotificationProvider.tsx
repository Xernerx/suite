/** @format */
'use client';

import React, { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useEnvironment } from './EnvironmentProvider';
import { useUser } from './UserProvider';

export interface Notification {
	id: string;
	userId: string;
	title: string;
	message: string;
	type: 'success' | 'error' | 'info' | 'warning';
	read: boolean;
	link: string | null;
	createdAt: string;
	isInvite?: boolean;
}

interface NotificationContextType {
	notifications: Notification[];
	unreadCount: number;
	isLoading: boolean;
	markAsRead: (id: string) => Promise<void>;
	markAllAsRead: () => Promise<void>;
	refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
	const { user } = useUser();
	const { getEnvUrl } = useEnvironment();

	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Fetch notifications based on the current user
	const fetchNotifications = useCallback(async () => {
		if (!user?.id) {
			setNotifications([]);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/dispatch?targetId=${user.id}`), { credentials: 'include' });

			let combined: Notification[] = [];

			if (res.ok) {
				let dispatchData = await res.json();

				// Use localStorage to track read states for global announcements so one user reading it doesn't hide it for everyone
				let readGlobals: string[] = [];
				let deletedGlobals: string[] = [];
				if (typeof window !== 'undefined') {
					readGlobals = JSON.parse(localStorage.getItem('xernerx-read-globals') || '[]');
					deletedGlobals = JSON.parse(localStorage.getItem('xernerx-deleted-globals') || '[]');
				}

				// Filter out globally deleted announcements
				dispatchData = dispatchData.filter((d: any) => !(d.targetId === 'global' && deletedGlobals.includes(d.id)));

				combined = dispatchData.map((d: any) => {
					if (d.category === 'invite' && d.status === 'pending') {
						return {
							id: d.id,
							userId: d.targetId,
							title: 'Organization Invitation',
							message: `You have been invited to join ${d.data?.organizationName || 'an organization'}.`,
							type: 'info',
							read: false,
							link: null,
							createdAt: d.createdAt,
							isInvite: true,
						};
					} else {
						const isGlobal = d.targetId === 'global';
						return {
							id: d.id,
							userId: d.targetId,
							title: d.data?.title || 'Notification',
							message: d.data?.message || '',
							type: d.data?.type || 'info',
							read: isGlobal ? readGlobals.includes(d.id) : d.status === 'read',
							link: d.data?.link || null,
							createdAt: d.createdAt,
							isInvite: false,
						};
					}
				});
			}

			setNotifications(combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
		} catch (err) {
			console.warn('Failed to fetch notifications:', err);
		} finally {
			setIsLoading(false);
		}
	}, [user?.id, getEnvUrl]);

	// Automatically fetch when the user ID changes (e.g., logging in/out)
	useEffect(() => {
		fetchNotifications();
	}, [fetchNotifications]);

	// Derived state for the notification bell badge
	const unreadCount = notifications.filter((n) => !n.read).length;

	// Optimistically mark a single notification as read
	const markAsRead = async (id: string) => {
		const notification = notifications.find((n) => n.id === id);
		if (!notification || notification.read) return;

		// 1. Optimistic UI Update (instant feedback)
		setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

		if (notification.userId === 'global') {
			if (typeof window !== 'undefined') {
				const readGlobals = JSON.parse(localStorage.getItem('xernerx-read-globals') || '[]');
				if (!readGlobals.includes(id)) {
					localStorage.setItem('xernerx-read-globals', JSON.stringify([...readGlobals, id]));
				}
			}
			return;
		}

		// 2. Database Update
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/dispatch/${id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ status: 'read' }),
			});
		} catch (err) {
			console.warn('Failed to mark notification as read:', err);
			// Optionally, revert the optimistic update here if the request fails
			setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
		}
	};

	// Optimistically mark all notifications as read
	const markAllAsRead = async () => {
		const unreadNotifications = notifications.filter((n) => !n.read);
		if (unreadNotifications.length === 0) return;

		// 1. Optimistic UI Update
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

		// Globals
		const unreadGlobals = unreadNotifications.filter((n) => n.userId === 'global');
		if (unreadGlobals.length > 0 && typeof window !== 'undefined') {
			const readGlobals = JSON.parse(localStorage.getItem('xernerx-read-globals') || '[]');
			localStorage.setItem('xernerx-read-globals', JSON.stringify([...readGlobals, ...unreadGlobals.map((n) => n.id)]));
		}

		const unreadIds = unreadNotifications.filter((n) => n.userId !== 'global').map((n) => n.id);
		if (unreadIds.length === 0) return;

		// 2. Database Update (Firing Promises in parallel)
		try {
			await Promise.all(
				unreadIds.map((id) =>
					fetch(getEnvUrl(`https://api.xernerx.com/secure/dispatch/${id}`), {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ status: 'read' }),
					})
				)
			);
		} catch (err) {
			console.warn('Failed to mark all notifications as read:', err);
		}
	};

	return (
		<NotificationContext.Provider
			value={{
				notifications,
				unreadCount,
				isLoading,
				markAsRead,
				markAllAsRead,
				refresh: fetchNotifications,
			}}
		>
			{children}
		</NotificationContext.Provider>
	);
}

// Custom hook to consume the provider anywhere in the app
export function useNotifications() {
	const context = useContext(NotificationContext);
	if (context === undefined) {
		throw new Error('useNotifications must be used within a NotificationProvider');
	}
	return context;
}
