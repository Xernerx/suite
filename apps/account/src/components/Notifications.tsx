/** @format */
'use client';

import { Bell, BellRing, Flame, Monitor } from 'lucide-react';
import { Badge, Button, Input, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment, useNotifications, usePlatform, useToast, useUser } from '@xernerx/providers';
import { useEffect, useMemo, useState } from 'react';
import { NotificationRemindersCard } from './NotificationRemindersCard';

const VALID_CHANNELS = new Set(['discord', 'mail', 'inApp', 'desktop']);

const DEFAULT_NOTIFICATIONS: Record<string, Record<string, Record<string, boolean>>> = {
	api: {
		rateLimitWarning: { discord: false, mail: false, inApp: true, desktop: true },
		tokenCreated: { discord: false, mail: false, inApp: true, desktop: true },
		tokenRevoked: { discord: false, mail: false, inApp: true, desktop: true },
		downtime: { discord: false, mail: false, inApp: true, desktop: true },
	},
	billing: {
		invoicePaid: { discord: false, mail: false, inApp: true, desktop: true },
		subscriptionExpiring: { discord: false, mail: false, inApp: true, desktop: true },
		paymentFailed: { discord: false, mail: false, inApp: true, desktop: true },
	},
	apps: {
		botApproved: { discord: false, mail: false, inApp: true, desktop: true },
		botRejected: { discord: false, mail: false, inApp: true, desktop: true },
	},
	community: {
		roadmapReleased: { discord: false, mail: false, inApp: true, desktop: true },
		issueStatusUpdate: { discord: false, mail: false, inApp: true, desktop: true },
		suggestionStatusUpdate: { discord: false, mail: false, inApp: true, desktop: true },
		applicationReviewed: { discord: false, mail: false, inApp: true, desktop: true },
	},
	general: {
		birthday: { discord: false, mail: false, inApp: true, desktop: true },
		orgInvite: { discord: false, mail: false, inApp: true, desktop: true },
	},
	virtue: {
		levelup: { discord: true, inApp: true, desktop: true },
	},
};

export default function Notifications() {
	const { getEnvUrl } = useEnvironment();
	const { user, mutate: mutateUser } = useUser();
	const { toast } = useToast();
	const { t } = useDictionary();
	const { type } = usePlatform();
	const { notifyNative } = useNotifications();

	const hasSubscription = user?.staffSubscription || user?.subscriptions?.some((sub: any) => sub.status === 'active' || sub.status === 'trialing');

	const [hasElectronBridge, setHasElectronBridge] = useState(false);
	const [systemEnabled, setSystemEnabled] = useState(true);
	const [streakGuardianEnabled, setStreakGuardianEnabled] = useState(true);

	const isDesktopApp = type === 'application' || hasElectronBridge;

	const [search, setSearch] = useState('');
	const [notifications, setNotifications] = useState<Record<string, Record<string, Record<string, boolean>>>>(DEFAULT_NOTIFICATIONS);
	const [voteReminders, setVoteReminders] = useState<Record<string, string>>({});
	const [dailyGiftReminderAt, setDailyGiftReminderAt] = useState<string | null>(null);
	const [targetNames, setTargetNames] = useState<Record<string, string>>({});

	useEffect(() => {
		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (!bridge) return;
		setHasElectronBridge(true);

		const applyMeta = (meta: any) => {
			if (!meta || typeof meta !== 'object') return;
			setSystemEnabled(meta.desktopNotifications !== false);
			setStreakGuardianEnabled(meta.dailyStreakReminder !== false);
		};

		if (bridge.metadata && typeof bridge.metadata === 'object') {
			applyMeta(bridge.metadata);
		}
		bridge
			.getMetadata?.()
			.then(applyMeta)
			.catch(() => {});

		const unsub = bridge.onMetadataUpdated?.(applyMeta);
		const onCustom = (e: Event) => applyMeta((e as CustomEvent)?.detail);
		window.addEventListener('xernerx:metadata-updated', onCustom);
		return () => {
			unsub?.();
			window.removeEventListener('xernerx:metadata-updated', onCustom);
		};
	}, []);

	useEffect(() => {
		if (user?.notifications && typeof user.notifications === 'object') {
			setNotifications(() => {
				const merged: Record<string, Record<string, Record<string, boolean>>> = {};
				for (const [catKey, defaultItems] of Object.entries(DEFAULT_NOTIFICATIONS)) {
					merged[catKey] = {};
					const savedCat = (user.notifications as any)?.[catKey];
					for (const [itemKey, defaultChannels] of Object.entries(defaultItems)) {
						const savedItem = savedCat && typeof savedCat === 'object' && !Array.isArray(savedCat) ? savedCat[itemKey] : null;
						const nextChannels: Record<string, boolean> = { ...defaultChannels };
						if (savedItem && typeof savedItem === 'object' && !Array.isArray(savedItem)) {
							for (const [chKey, chVal] of Object.entries(savedItem)) {
								if (VALID_CHANNELS.has(chKey) && typeof chVal === 'boolean') {
									nextChannels[chKey] = chVal;
								}
							}
						}
						merged[catKey][itemKey] = nextChannels;
					}
				}
				return merged;
			});

			const rawVote = (user.notifications as any)?.voteReminders;
			const parsedVote: Record<string, string> = {};
			if (rawVote && typeof rawVote === 'object' && !Array.isArray(rawVote)) {
				for (const [k, v] of Object.entries(rawVote)) {
					if (typeof v === 'string' && v.trim()) {
						parsedVote[k] = v;
					}
				}
			}
			setVoteReminders(parsedVote);

			const rawGift = (user.notifications as any)?.dailyGiftReminderAt;
			setDailyGiftReminderAt(typeof rawGift === 'string' && rawGift.trim() ? rawGift : null);
		}
	}, [user]);

	useEffect(() => {
		const keys = Object.keys(voteReminders);
		if (keys.length === 0) return;
		let isMounted = true;

		keys.forEach((reminderKey) => {
			if (targetNames[reminderKey]) return;
			const isServer = reminderKey.startsWith('server:') || reminderKey.startsWith('guild:');
			const cleanId = reminderKey.replace(/^(bot|server|guild):/, '');
			const endpoint = isServer ? `https://api.xernerx.com/secure/guilds/${cleanId}` : `https://api.xernerx.com/secure/bots/${cleanId}`;

			fetch(getEnvUrl(endpoint), { credentials: 'include' })
				.then((r) => (r.ok ? r.json() : null))
				.then((data) => {
					if (!isMounted || !data) return;
					const resolvedName = data.name || data.username || cleanId;
					setTargetNames((prev) => ({ ...prev, [reminderKey]: resolvedName }));
				})
				.catch(() => {});
		});

		return () => {
			isMounted = false;
		};
	}, [voteReminders, targetNames, getEnvUrl]);

	const saveUserNotifications = async (
		updated: Record<string, Record<string, Record<string, boolean>>>,
		nextVoteReminders: Record<string, string> = voteReminders,
		nextGiftReminderAt: string | null = dailyGiftReminderAt
	) => {
		setNotifications(updated);
		const userId = user?.id;
		if (!userId) return;

		try {
			const apiUrl = getEnvUrl('https://api.xernerx.com/');
			await fetch(`${apiUrl}secure/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					notifications: {
						...updated,
						voteReminders: nextVoteReminders,
						dailyGiftReminderAt: nextGiftReminderAt,
					},
				}),
			});
			await mutateUser?.();
			toast({ type: 'success', title: t('account.notifications.toast.success') });
		} catch (e) {
			console.error('Failed to update notifications', e);
			toast({ type: 'error', title: t('account.notifications.toast.error') });
		}
	};

	const handleRemoveReminder = async (key: string) => {
		if (key === 'dailyGift') {
			setDailyGiftReminderAt(null);
			await saveUserNotifications(notifications, voteReminders, null);
			return;
		}
		const copy = { ...voteReminders };
		delete copy[key];
		setVoteReminders(copy);
		await saveUserNotifications(notifications, copy, dailyGiftReminderAt);
	};

	const handleClearAllReminders = async () => {
		setVoteReminders({});
		setDailyGiftReminderAt(null);
		await saveUserNotifications(notifications, {}, null);
	};

	const handleToggle = async (category: string, item: string, channel: string, value: boolean) => {
		const updated = {
			...notifications,
			[category]: {
				...notifications[category],
				[item]: {
					...notifications[category]?.[item],
					[channel]: value,
				},
			},
		};
		await saveUserNotifications(updated);
	};

	const handleBulkCategory = async (category: string, enable: boolean) => {
		const catItems = notifications[category] || {};
		const updatedCat: Record<string, Record<string, boolean>> = {};
		for (const [itemKey, channels] of Object.entries(catItems)) {
			updatedCat[itemKey] = {};
			for (const channelKey of Object.keys(channels)) {
				const isMailChannel = channelKey === 'mail';
				const isDesktopChannel = channelKey === 'desktop';
				const isDisabled = (isMailChannel && !hasSubscription && category !== 'community') || (isDesktopChannel && !systemEnabled);
				updatedCat[itemKey][channelKey] = isDisabled ? false : enable;
			}
		}

		await saveUserNotifications({
			...notifications,
			[category]: updatedCat,
		});
	};

	const handleBulkSystemChannel = async (enable: boolean) => {
		const updated: Record<string, Record<string, Record<string, boolean>>> = {};
		for (const [catKey, catItems] of Object.entries(notifications)) {
			updated[catKey] = {};
			for (const [itemKey, channels] of Object.entries(catItems)) {
				updated[catKey][itemKey] = {
					...channels,
					desktop: enable,
				};
			}
		}
		await saveUserNotifications(updated);
	};

	const handleDesktopMetaToggle = async (key: 'desktopNotifications' | 'dailyStreakReminder', val: boolean | React.ChangeEvent<HTMLInputElement>) => {
		const checked = typeof val === 'boolean' ? val : val.target.checked;
		if (key === 'desktopNotifications') setSystemEnabled(checked);
		if (key === 'dailyStreakReminder') setStreakGuardianEnabled(checked);

		const bridge = typeof window !== 'undefined' ? (window as any).electron : undefined;
		if (bridge?.updateMetadata) {
			try {
				const saved = await bridge.updateMetadata({ [key]: checked });
				if (saved && typeof window !== 'undefined') {
					window.dispatchEvent(new CustomEvent('xernerx:metadata-updated', { detail: saved }));
				}
			} catch {}
		}
		toast({ type: 'success', title: t('account.notifications.toast.success') });
	};

	const handleTestSystemNotification = async () => {
		await notifyNative({
			title: t('account.preferences.desktop.testNotificationTitle'),
			body: t('account.preferences.desktop.testNotificationBody'),
			link: 'https://account.xernerx.com/?tab=notifications',
			force: true,
		});
		toast({
			type: 'success',
			title: t('account.preferences.desktop.testNotificationSent'),
		});
	};

	const filteredCategories = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return Object.entries(notifications);
		return Object.entries(notifications)
			.map(([category, items]) => {
				const catTitle = String(t(`account.notifications.categories.${category}`) || category).toLowerCase();
				if (catTitle.includes(q)) return [category, items] as const;
				const matchingItems = Object.fromEntries(
					Object.entries(items).filter(([itemKey]) => {
						const itemLabel = String(t(`account.notifications.items.${itemKey}`) || itemKey).toLowerCase();
						return itemLabel.includes(q) || itemKey.toLowerCase().includes(q);
					})
				);
				return [category, matchingItems] as const;
			})
			.filter(([, items]) => Object.keys(items).length > 0);
	}, [notifications, search, t]);

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('account.notifications.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('account.notifications.description')}</p>
				</div>
				<div className="w-full sm:w-80">
					<Input variant="search" shortcut={true} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('account.notifications.searchPlaceholder')} />
				</div>
			</div>

			{/* Desktop System Notifications Configuration Card (Shown when running in Xernerx Desktop App) */}
			{isDesktopApp && (
				<div className="flex flex-col rounded-3xl border border-(--accent)/30 bg-(--foreground)/30 backdrop-blur-md shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_12%,transparent)] overflow-hidden">
					<div
						className="bg-(--background)/60 border-b border-(--border)/10 flex flex-wrap items-center justify-between gap-3"
						style={{ padding: 'calc(var(--ui-gap) * 0.85) var(--ui-gap)' }}
					>
						<div className="flex items-center gap-3">
							<div className="h-9 w-9 rounded-2xl bg-(--accent)/15 border border-(--accent)/30 flex items-center justify-center text-(--accent) shrink-0">
								<Monitor size={18} />
							</div>
							<div className="flex flex-col">
								<div className="flex items-center gap-2">
									<h2 className="text-sm font-bold text-(--text)">{t('account.notifications.systemCard.title')}</h2>
									<Badge variant="accent">{t('account.notifications.systemCard.badge')}</Badge>
								</div>
								<p className="text-xs text-(--text-muted)">{t('account.notifications.systemCard.description')}</p>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<Button variant="secondary" onClick={handleTestSystemNotification} className="rounded-xl text-xs px-3 py-1.5 flex items-center gap-1.5">
								<BellRing size={13} className="text-(--accent)" />
								{t('account.notifications.systemCard.testButton')}
							</Button>
							<button
								type="button"
								onClick={() => handleBulkSystemChannel(true)}
								disabled={!systemEnabled}
								className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-(--accent)/10 text-(--accent) hover:bg-(--accent) hover:text-white border border-(--accent)/20 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
							>
								{t('account.notifications.systemCard.enableAllSystem')}
							</button>
							<button
								type="button"
								onClick={() => handleBulkSystemChannel(false)}
								disabled={!systemEnabled}
								className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-(--foreground)/50 text-(--text-muted) hover:text-(--text) border border-(--border)/10 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
							>
								{t('account.notifications.systemCard.muteAllSystem')}
							</button>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-(--border)/10">
						<div className="flex items-center justify-between gap-4" style={{ padding: 'var(--ui-gap)' }}>
							<div className="flex items-start gap-3">
								<div className="h-9 w-9 rounded-2xl bg-(--accent)/10 border border-(--accent)/25 flex items-center justify-center text-(--accent) shrink-0 mt-0.5">
									<Bell size={16} />
								</div>
								<div className="flex flex-col gap-0.5">
									<h3 className="text-sm font-semibold text-(--text)">{t('account.notifications.systemCard.masterTitle')}</h3>
									<p className="text-xs text-(--text-muted) leading-relaxed">{t('account.notifications.systemCard.masterDesc')}</p>
								</div>
							</div>
							<Toggle checked={systemEnabled} onChange={(val) => handleDesktopMetaToggle('desktopNotifications', val)} suppressHydrationWarning />
						</div>

						<div className="flex items-center justify-between gap-4" style={{ padding: 'var(--ui-gap)' }}>
							<div className="flex items-start gap-3">
								<div className="h-9 w-9 rounded-2xl bg-(--accent)/10 border border-(--accent)/25 flex items-center justify-center text-(--accent) shrink-0 mt-0.5">
									<Flame size={16} />
								</div>
								<div className="flex flex-col gap-0.5">
									<h3 className="text-sm font-semibold text-(--text)">{t('account.notifications.systemCard.streakTitle')}</h3>
									<p className="text-xs text-(--text-muted) leading-relaxed">{t('account.notifications.systemCard.streakDesc')}</p>
								</div>
							</div>
							<Toggle
								checked={streakGuardianEnabled && systemEnabled}
								disabled={!systemEnabled}
								onChange={(val) => handleDesktopMetaToggle('dailyStreakReminder', val)}
								suppressHydrationWarning
							/>
						</div>
					</div>
				</div>
			)}

			{filteredCategories.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 py-16 text-center">
					<p className="text-sm text-(--text-muted)">{t('account.notifications.noMatchingAlerts')}</p>
				</div>
			) : (
				<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					{filteredCategories.map(([category, items]) => (
						<div key={category} className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden">
							<div className="bg-(--background)/50 border-b border-(--border)/10 flex items-center justify-between" style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)' }}>
								<h2 className="font-semibold uppercase tracking-wider text-xs text-(--text-muted)">{t(`account.notifications.categories.${category}`)}</h2>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => handleBulkCategory(category, true)}
										className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-(--accent)/10 text-(--accent) hover:bg-(--accent) hover:text-white border border-(--accent)/20 transition-colors cursor-pointer"
									>
										{t('account.notifications.enableCategory')}
									</button>
									<button
										type="button"
										onClick={() => handleBulkCategory(category, false)}
										className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-(--foreground)/50 text-(--text-muted) hover:text-(--text) border border-(--border)/10 transition-colors cursor-pointer"
									>
										{t('account.notifications.muteCategory')}
									</button>
								</div>
							</div>
							<div className="flex flex-col">
								{Object.entries(items).map(([itemKey, channels]) => {
									const visibleChannels = Object.entries(channels).filter(([channelKey]) => channelKey !== 'desktop' || isDesktopApp);
									return (
										<div
											key={itemKey}
											className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5 last:border-none"
											style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
										>
											<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
												<h3 className="text-base font-semibold text-(--text) capitalize">{t(`account.notifications.items.${itemKey}`)}</h3>
												<p className="text-xs text-(--text-muted)">{t('account.notifications.itemDescription', { item: t(`account.notifications.items.${itemKey}`) })}</p>
											</div>
											<div className="flex items-center flex-wrap" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
												{visibleChannels.map(([channelKey, enabled]) => {
													const isMailChannel = channelKey === 'mail';
													const isDesktopChannel = channelKey === 'desktop';
													const isDisabled = (isMailChannel && !hasSubscription && category !== 'community') || (isDesktopChannel && !systemEnabled);

													return (
														<div
															key={channelKey}
															className={`flex flex-col items-center ${isDisabled ? 'opacity-50 grayscale' : ''}`}
															style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}
														>
															<span className={`text-[10px] font-bold uppercase tracking-wider ${isDesktopChannel ? 'text-(--accent)' : 'text-(--text-muted)'}`}>
																{t(`account.notifications.channels.${channelKey}`)}
															</span>
															<Toggle
																checked={Boolean(enabled) && !isDisabled}
																onChange={(val) => handleToggle(category, itemKey, channelKey, typeof val === 'boolean' ? val : val.target.checked)}
																disabled={isDisabled}
																suppressHydrationWarning
															/>
														</div>
													);
												})}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					))}

					<NotificationRemindersCard
						voteReminders={voteReminders}
						dailyGiftReminderAt={dailyGiftReminderAt}
						targetNames={targetNames}
						onRemoveReminder={handleRemoveReminder}
						onClearAllReminders={handleClearAllReminders}
					/>
				</div>
			)}
		</div>
	);
}
