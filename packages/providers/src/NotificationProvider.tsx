/** @format */
'use client';

import React, { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useDictionary } from './DictionaryProvider';
import { useEnvironment } from './EnvironmentProvider';
import { useUser } from './UserProvider';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MUTATION_GRACE_MS = 15000;

export interface Notification {
	id: string;
	userId: string;
	title: string;
	message: string;
	type: 'success' | 'error' | 'info' | 'warning';
	read: boolean;
	readAt?: string | null;
	link: string | null;
	createdAt: string;
	isInvite?: boolean;
	inAppAllowed?: boolean;
	desktopAllowed?: boolean;
}

function getChannelPrefsForDispatch(d: any, userNotifications: Record<string, Record<string, Record<string, boolean>>> | undefined): { inApp: boolean; desktop: boolean } {
	if (!userNotifications || typeof userNotifications !== 'object') return { inApp: true, desktop: true };
	const checkItem = (cat: string, item: string): { inApp: boolean; desktop: boolean } | null => {
		const entry = userNotifications?.[cat]?.[item];
		if (!entry || typeof entry !== 'object') return null;
		return { inApp: entry.inApp !== false, desktop: entry.desktop !== false };
	};
	if (d.category === 'invite') return checkItem('general', 'orgInvite') || { inApp: true, desktop: true };
	const explicitKey = d.data?.notificationKey || d.type;
	if (typeof explicitKey === 'string') {
		for (const cat of Object.keys(userNotifications)) {
			const matched = checkItem(cat, explicitKey);
			if (matched) return matched;
		}
	}
	const link = String(d.data?.link || '').toLowerCase();
	const title = String(d.data?.title || '').toLowerCase();
	if (link.includes('/roadmap') || title.includes('roadmap')) return checkItem('community', 'roadmapReleased') || { inApp: true, desktop: true };
	if (link.includes('/bugs') || title.includes('issue') || title.includes('bug')) return checkItem('community', 'issueStatusUpdate') || { inApp: true, desktop: true };
	if (link.includes('/suggestions') || title.includes('suggestion')) return checkItem('community', 'suggestionStatusUpdate') || { inApp: true, desktop: true };
	if (title.includes('application')) return checkItem('community', 'applicationReviewed') || { inApp: true, desktop: true };
	if (link.includes('tab=tokens') || title.includes('token')) return checkItem('api', 'tokenCreated') || { inApp: true, desktop: true };
	if (link.includes('tab=billing') || title.includes('invoice') || title.includes('subscription')) return checkItem('billing', 'invoicePaid') || { inApp: true, desktop: true };
	return { inApp: true, desktop: true };
}

export interface NativeNotificationPayload {
	id?: string;
	title: string;
	body?: string;
	subtitle?: string;
	link?: string | null;
	silent?: boolean;
	urgency?: 'normal' | 'critical' | 'low';
	force?: boolean;
}

interface NotificationContextType {
	notifications: Notification[];
	unreadCount: number;
	isLoading: boolean;
	markAsRead: (id: string) => Promise<void>;
	markAsUnread: (id: string) => Promise<void>;
	markAllAsRead: () => Promise<void>;
	deleteNotification: (id: string) => Promise<void>;
	refresh: () => Promise<void>;
	notifyNative: (payload: NativeNotificationPayload) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
	const { user } = useUser();
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();

	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const pendingMutationsRef = useRef<Map<string, { state: 'read' | 'unread' | 'deleted'; timestamp: number }>>(new Map());
	const inFlightRequestsRef = useRef<Map<string, Promise<any>>>(new Map());

	const enqueueRequest = useCallback((id: string, task: () => Promise<any>) => {
		const prev = inFlightRequestsRef.current.get(id) || Promise.resolve();
		const next = prev.catch(() => {}).then(task);
		inFlightRequestsRef.current.set(id, next);
		next.finally(() => {
			if (inFlightRequestsRef.current.get(id) === next) inFlightRequestsRef.current.delete(id);
		});
		return next;
	}, []);

	const notifyNative = useCallback(async (payload: NativeNotificationPayload): Promise<boolean> => {
		if (typeof window === 'undefined' || !payload?.title) return false;
		const bridge = (window as any).electron;
		if (bridge?.notify) {
			try {
				return (await bridge.notify(payload)) !== false;
			} catch {
				return false;
			}
		}
		if ('Notification' in window) {
			try {
				const showWebNotification = () => {
					const n = new window.Notification(payload.title, { body: payload.body || '', icon: '/icon.png', silent: Boolean(payload.silent) });
					if (payload.link) {
						n.onclick = () => {
							window.focus();
							window.location.assign(payload.link!);
						};
					}
					return true;
				};
				if (window.Notification.permission === 'granted') return showWebNotification();
				if (payload.force && window.Notification.permission !== 'denied') {
					const perm = await window.Notification.requestPermission();
					if (perm === 'granted') return showWebNotification();
				}
			} catch {}
		}
		return false;
	}, []);

	// Fetch notifications based on the current user
	const fetchNotifications = useCallback(
		async (silent = false) => {
			if (!isReady || !user?.id) {
				if (!user?.id) setNotifications([]);
				setIsLoading(false);
				return;
			}

			if (!silent) setIsLoading(true);
			try {
				const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/dispatch?targetId=${user.id}`), {
					credentials: 'include',
					cache: 'no-store',
				});

				let combined: Notification[] = [];

				if (res.ok) {
					let dispatchData = await res.json();
					if (!Array.isArray(dispatchData)) dispatchData = [];

					// Use localStorage + server readBy/deletedBy so read/deleted state persists across all subdomains & devices
					let readGlobals: string[] = [];
					let deletedGlobals: string[] = [];
					let readInvites: string[] = [];
					if (typeof window !== 'undefined') {
						readGlobals = JSON.parse(localStorage.getItem('xernerx-read-globals') || '[]');
						deletedGlobals = JSON.parse(localStorage.getItem('xernerx-deleted-globals') || '[]');
						readInvites = JSON.parse(localStorage.getItem('xernerx-read-invites') || '[]');
					}

					const nowMs = Date.now();
					for (const [mutId, mut] of pendingMutationsRef.current.entries()) {
						if (nowMs - mut.timestamp > MUTATION_GRACE_MS && !inFlightRequestsRef.current.has(mutId)) {
							pendingMutationsRef.current.delete(mutId);
						}
					}

					// Filter out deleted items (server deletedBy, localStorage deletedGlobals, or pending delete mutation)
					dispatchData = dispatchData.filter((d: any) => {
						const pending = pendingMutationsRef.current.get(d.id);
						if (pending?.state === 'deleted') return false;
						if (Array.isArray(d.deletedBy) && d.deletedBy.includes(user.id)) return false;
						if (d.targetId === 'global' && deletedGlobals.includes(d.id)) return false;
						return true;
					});

					const cutoff30dMs = nowMs - THIRTY_DAYS_MS;

					combined = dispatchData
						.map((d: any) => {
							const prefs = getChannelPrefsForDispatch(d, user?.notifications);
							if (!prefs.inApp && !prefs.desktop) return null;

							const pending = pendingMutationsRef.current.get(d.id);
							const serverReadByMe = Array.isArray(d.readBy) && d.readBy.includes(user.id);

							if (d.category === 'invite' && d.status === 'pending') {
								const isRead = pending?.state === 'read' ? true : pending?.state === 'unread' ? false : serverReadByMe || readInvites.includes(d.id);
								return {
									id: d.id,
									userId: d.targetId,
									title: t('common.notifications.orgInviteTitle'),
									message: t('common.notifications.orgInviteMessage', { name: d.data?.organizationName || '' }),
									type: 'info' as const,
									read: isRead,
									readAt: d.readAt || null,
									link: '/portal',
									createdAt: d.createdAt,
									isInvite: true,
									inAppAllowed: prefs.inApp,
									desktopAllowed: prefs.desktop,
								};
							} else {
								const isGlobal = d.targetId === 'global';
								const rawRead = isGlobal ? serverReadByMe || readGlobals.includes(d.id) : d.status === 'read' || serverReadByMe;
								const isRead = pending?.state === 'read' ? true : pending?.state === 'unread' ? false : rawRead;

								// Auto-hide read notifications older than 30 days
								if (isRead) {
									const refDate = d.readAt || d.updatedAt || d.createdAt;
									const refMs = refDate ? new Date(refDate).getTime() : NaN;
									if (!Number.isNaN(refMs) && refMs <= cutoff30dMs) {
										return null;
									}
								}

								return {
									id: d.id,
									userId: d.targetId,
									title: d.data?.title || t('common.notifications.defaultTitle'),
									message: d.data?.message || '',
									type: (d.data?.type || 'info') as 'success' | 'error' | 'info' | 'warning',
									read: isRead,
									readAt: d.readAt || null,
									link: d.data?.link || null,
									createdAt: d.createdAt,
									isInvite: false,
									inAppAllowed: prefs.inApp,
									desktopAllowed: prefs.desktop,
								};
							}
						})
						.filter((item: Notification | null): item is Notification => Boolean(item));
				}

				const sorted = combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
				setNotifications(sorted.filter((n) => n.inAppAllowed !== false));

				if (typeof window !== 'undefined' && sorted.length > 0) {
					try {
						const storageKey = `xernerx-notified-dispatch-ids:${user.id}`;
						const rawNotified = localStorage.getItem(storageKey);
						const isFirstRun = rawNotified === null;
						const notifiedSet = new Set<string>(rawNotified ? JSON.parse(rawNotified) : []);
						const nowMs = Date.now();

						const newlyArrived = sorted.filter((n) => {
							if (n.read || n.desktopAllowed === false || notifiedSet.has(n.id)) return false;
							if (isFirstRun) {
								const createdMs = new Date(n.createdAt).getTime();
								return !Number.isNaN(createdMs) && nowMs - createdMs < 10 * 60 * 1000;
							}
							return true;
						});

						for (const item of newlyArrived.slice(0, isFirstRun ? 1 : 3)) {
							notifyNative({
								id: item.id,
								title: item.title,
								body: item.message,
								link: item.link,
							});
						}

						for (const item of sorted) {
							notifiedSet.add(item.id);
						}
						localStorage.setItem(storageKey, JSON.stringify(Array.from(notifiedSet).slice(-250)));
					} catch {}
				}
			} catch (err) {
				console.warn('Failed to fetch notifications:', err);
			} finally {
				if (!silent) setIsLoading(false);
			}
		},
		[user?.id, getEnvUrl, isReady, t, notifyNative]
	);

	// Automatically fetch when the user ID changes and poll periodically in the background
	useEffect(() => {
		fetchNotifications(false);
		if (!isReady || !user?.id) return;

		let pollMs = 30000;
		let interval = setInterval(() => {
			fetchNotifications(true);
		}, pollMs);

		const updatePollRate = (onBatterySaver: boolean) => {
			const nextMs = onBatterySaver ? 90000 : 30000;
			if (nextMs !== pollMs) {
				pollMs = nextMs;
				clearInterval(interval);
				interval = setInterval(() => {
					fetchNotifications(true);
				}, pollMs);
			}
		};

		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		bridge
			?.getPowerState?.()
			?.then?.((state: any) => {
				if (state) updatePollRate(Boolean(state.effectiveBatterySaver));
			})
			?.catch?.(() => {});

		const unsubPower = bridge?.onPowerStateChange?.((state: any) => {
			if (!state) return;
			updatePollRate(Boolean(state.effectiveBatterySaver));
			if (state.event === 'resume' || state.event === 'unlock-screen' || state.event === 'on-ac') {
				fetchNotifications(true);
			}
		});

		const handleFocus = () => {
			fetchNotifications(true);
		};
		window.addEventListener('focus', handleFocus);
		return () => {
			clearInterval(interval);
			unsubPower?.();
			window.removeEventListener('focus', handleFocus);
		};
	}, [fetchNotifications, isReady, user?.id]);

	// Derived state for the notification bell badge
	const unreadCount = notifications.filter((n) => !n.read).length;

	// Sync unread count with native OS Dock / Taskbar / System Tray badge
	useEffect(() => {
		if (typeof window !== 'undefined') {
			(window as any).electron?.setBadgeCount?.(unreadCount);
		}
	}, [unreadCount]);

	const markAsRead = async (id: string) => {
		const notification = notifications.find((n) => n.id === id);
		if (!notification) return;
		pendingMutationsRef.current.set(id, { state: 'read', timestamp: Date.now() });
		setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)));
		if (typeof window !== 'undefined') {
			if (notification.userId === 'global') {
				const readGlobals = JSON.parse(localStorage.getItem('xernerx-read-globals') || '[]');
				if (!readGlobals.includes(id)) localStorage.setItem('xernerx-read-globals', JSON.stringify([...readGlobals, id]));
			} else if (notification.isInvite) {
				const readInvites = JSON.parse(localStorage.getItem('xernerx-read-invites') || '[]');
				if (!readInvites.includes(id)) localStorage.setItem('xernerx-read-invites', JSON.stringify([...readInvites, id]));
			}
		}
		await enqueueRequest(id, async () => {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/dispatch/${id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ status: 'read', userId: user?.id }),
			});
			if (!res.ok) throw new Error('Failed to mark notification as read');
		}).catch((err) => console.warn('Failed to mark notification as read:', err));
	};

	const markAsUnread = async (id: string) => {
		const notification = notifications.find((n) => n.id === id);
		pendingMutationsRef.current.set(id, { state: 'unread', timestamp: Date.now() });
		setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false, readAt: null } : n)));
		if (typeof window !== 'undefined') {
			if (notification?.userId === 'global') {
				const readGlobals = JSON.parse(localStorage.getItem('xernerx-read-globals') || '[]');
				localStorage.setItem('xernerx-read-globals', JSON.stringify(readGlobals.filter((gid: string) => gid !== id)));
			} else if (notification?.isInvite) {
				const readInvites = JSON.parse(localStorage.getItem('xernerx-read-invites') || '[]');
				localStorage.setItem('xernerx-read-invites', JSON.stringify(readInvites.filter((iid: string) => iid !== id)));
			}
		}
		await enqueueRequest(id, async () => {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/dispatch/${id}`), {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ status: 'unread', userId: user?.id }),
			});
			if (!res.ok) throw new Error('Failed to mark notification as unread');
		});
	};

	const deleteNotification = async (id: string) => {
		const notification = notifications.find((n) => n.id === id);
		pendingMutationsRef.current.set(id, { state: 'deleted', timestamp: Date.now() });
		setNotifications((prev) => prev.filter((n) => n.id !== id));
		if (typeof window !== 'undefined' && notification?.userId === 'global') {
			const deletedGlobals = JSON.parse(localStorage.getItem('xernerx-deleted-globals') || '[]');
			if (!deletedGlobals.includes(id)) localStorage.setItem('xernerx-deleted-globals', JSON.stringify([...deletedGlobals, id]));
		}
		await enqueueRequest(id, async () => {
			const query = user?.id ? `?userId=${encodeURIComponent(user.id)}` : '';
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/dispatch/${id}${query}`), { method: 'DELETE', credentials: 'include' });
			if (!res.ok) throw new Error('Failed to delete notification');
		});
	};

	const markAllAsRead = async () => {
		const unreadNotifications = notifications.filter((n) => !n.read);
		if (unreadNotifications.length === 0) return;
		const now = Date.now();
		for (const n of unreadNotifications) pendingMutationsRef.current.set(n.id, { state: 'read', timestamp: now });
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: n.readAt || new Date().toISOString() })));
		const unreadGlobals = unreadNotifications.filter((n) => n.userId === 'global');
		if (unreadGlobals.length > 0 && typeof window !== 'undefined') {
			const readGlobals = JSON.parse(localStorage.getItem('xernerx-read-globals') || '[]');
			localStorage.setItem('xernerx-read-globals', JSON.stringify(Array.from(new Set([...readGlobals, ...unreadGlobals.map((n) => n.id)]))));
		}
		const unreadInvites = unreadNotifications.filter((n) => n.isInvite);
		if (unreadInvites.length > 0 && typeof window !== 'undefined') {
			const readInvites = JSON.parse(localStorage.getItem('xernerx-read-invites') || '[]');
			localStorage.setItem('xernerx-read-invites', JSON.stringify(Array.from(new Set([...readInvites, ...unreadInvites.map((n) => n.id)]))));
		}
		try {
			await Promise.all(
				unreadNotifications.map((n) =>
					enqueueRequest(n.id, () =>
						fetch(getEnvUrl(`https://api.xernerx.com/secure/dispatch/${n.id}`), {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							credentials: 'include',
							body: JSON.stringify({ status: 'read', userId: user?.id }),
						})
					)
				)
			);
		} catch (err) {
			console.warn('Failed to mark all notifications as read:', err);
		}
	};

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const bridge = (window as any).electron;
		if (!bridge?.onNotificationClick) return;
		return bridge.onNotificationClick((payload: any) => {
			if (payload?.id) markAsRead(payload.id);
		});
	});

	return (
		<NotificationContext.Provider
			value={{ notifications, unreadCount, isLoading, markAsRead, markAsUnread, markAllAsRead, deleteNotification, refresh: () => fetchNotifications(false), notifyNative }}
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
