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
			const [res, appsRes] = await Promise.all([
				fetch(getEnvUrl(`https://api.xernerx.com/secure/content/notifications?userId=${user.id}`), { credentials: 'include' }),
				fetch(getEnvUrl(`https://api.xernerx.com/secure/content/applications?userId=${user.id}`), { credentials: 'include' }),
			]);

			let combined: Notification[] = [];

			if (res.ok) {
				combined = await res.json();
			}

			if (appsRes.ok) {
				const appsData = await appsRes.json();
				const invites = appsData
					.filter((app: any) => app.type === 'organization_invite' && app.status === 'pending')
					.map((app: any) => ({
						id: app.id,
						userId: app.userId,
						title: 'Organization Invitation',
						message: `You have been invited to join ${app.metadata?.organizationName || 'an organization'}.`,
						type: 'info',
						read: false,
						link: null,
						createdAt: app.createdAt,
						isInvite: true,
					}));

				combined = [...combined, ...invites];
			}

			setNotifications(combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
		} catch (err) {
			console.error('Failed to fetch notifications:', err);
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

		// 2. Database Update
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/content/notifications/${id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ read: true }),
			});
		} catch (err) {
			console.error('Failed to mark notification as read:', err);
			// Optionally, revert the optimistic update here if the request fails
			setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
		}
	};

	// Optimistically mark all notifications as read
	const markAllAsRead = async () => {
		const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
		if (unreadIds.length === 0) return;

		// 1. Optimistic UI Update
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

		// 2. Database Update (Firing Promises in parallel)
		// Note: If users get thousands of notifications, you might want to create a dedicated
		// PATCH /secure/content/notifications route to mass-update them in one DB query.
		try {
			await Promise.all(
				unreadIds.map((id) =>
					fetch(getEnvUrl(`https://api.xernerx.com/secure/content/notifications/${id}`), {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ read: true }),
					})
				)
			);
		} catch (err) {
			console.error('Failed to mark all notifications as read:', err);
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
