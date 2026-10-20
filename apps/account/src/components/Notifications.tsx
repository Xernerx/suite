/** @format */
'use client';

import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import { useEffect, useMemo, useState } from 'react';

import { Input, Toggle } from '@xernerx/ui';

export default function Notifications() {
	const { getEnvUrl } = useEnvironment();
	const { user } = useUser();
	const { toast } = useToast();
	const { t } = useDictionary();

	const hasSubscription = user?.staffSubscription || user?.subscriptions?.some((sub: any) => sub.status === 'active' || sub.status === 'trialing');

	const [search, setSearch] = useState('');
	const [notifications, setNotifications] = useState<Record<string, Record<string, Record<string, boolean>>>>({
		api: {
			rateLimitWarning: { discord: false, mail: false, inApp: true },
			tokenCreated: { discord: false, mail: false, inApp: true },
			tokenRevoked: { discord: false, mail: false, inApp: true },
			downtime: { discord: false, mail: false, inApp: true },
		},
		billing: {
			invoicePaid: { discord: false, mail: false, inApp: true },
			subscriptionExpiring: { discord: false, mail: false, inApp: true },
			paymentFailed: { discord: false, mail: false, inApp: true },
		},
		apps: {
			botApproved: { discord: false, mail: false, inApp: true },
			botRejected: { discord: false, mail: false, inApp: true },
		},
		community: {
			roadmapReleased: { discord: false, mail: false, inApp: true },
			issueStatusUpdate: { discord: false, mail: false, inApp: true },
			suggestionStatusUpdate: { discord: false, mail: false, inApp: true },
			applicationReviewed: { discord: false, mail: false, inApp: true },
		},
		general: {
			birthday: { discord: false, mail: false, inApp: true },
		},
		virtue: {
			levelup: { discord: true, inApp: true },
		},
	});

	useEffect(() => {
		if (user?.notifications) {
			setNotifications((prev) => {
				const merged = { ...prev };

				for (const [category, items] of Object.entries(user.notifications)) {
					merged[category] = { ...merged[category] };
					for (const [itemKey, channels] of Object.entries(items as Record<string, Record<string, boolean>>)) {
						merged[category][itemKey] = {
							...(merged[category][itemKey] || {}),
							...channels,
						};
					}
				}

				return merged;
			});
		}
	}, [user]);

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

		setNotifications(updated);

		const userId = user?.id;
		if (!userId) return;

		try {
			const apiUrl = getEnvUrl('https://api.xernerx.com/');
			await fetch(`${apiUrl}secure/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ notifications: updated }),
			});
			toast({ type: 'success', title: t('account.notifications.toast.success') });
		} catch (e) {
			console.error('Failed to update notifications', e);
			toast({ type: 'error', title: t('account.notifications.toast.error') });
		}
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

			{filteredCategories.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 py-16 text-center">
					<p className="text-sm text-(--text-muted)">{t('account.notifications.noMatchingAlerts')}</p>
				</div>
			) : (
				<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
					{filteredCategories.map(([category, items]) => (
						<div key={category} className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm overflow-hidden">
							<div
								className="bg-(--background)/50 border-b border-(--border)/10 font-semibold uppercase tracking-wider text-xs text-(--text-muted)"
								style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)' }}
							>
								{t(`account.notifications.categories.${category}`)}
							</div>
							<div className="flex flex-col">
								{Object.entries(items).map(([itemKey, channels]) => (
									<div
										key={itemKey}
										className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5 last:border-none"
										style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
									>
										<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
											<h3 className="text-base font-semibold text-(--text) capitalize">{t(`account.notifications.items.${itemKey}`)}</h3>
											<p className="text-xs text-(--text-muted)">{t('account.notifications.itemDescription', { item: t(`account.notifications.items.${itemKey}`) })}</p>
										</div>
										<div className="flex items-center" style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
											{Object.entries(channels).map(([channelKey, enabled]) => {
												const isMailChannel = channelKey === 'mail';
												const isDisabled = isMailChannel && !hasSubscription && category !== 'community';

												return (
													<div
														key={channelKey}
														className={`flex flex-col items-center ${isDisabled ? 'opacity-50 grayscale' : ''}`}
														style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}
													>
														<span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t(`account.notifications.channels.${channelKey}`)}</span>
														<Toggle
															checked={enabled && !isDisabled}
															onChange={(val) => handleToggle(category, itemKey, channelKey, typeof val === 'boolean' ? val : val.target.checked)}
															disabled={isDisabled}
															suppressHydrationWarning
														/>
													</div>
												);
											})}
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
