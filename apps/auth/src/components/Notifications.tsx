/** @format */
'use client';

import { useDictionary, useEnvironment, useToast, useUser } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { Toggle } from '@xernerx/ui';

export default function Notifications() {
	const { getEnvUrl } = useEnvironment();
	const { user } = useUser();
	const { toast } = useToast();
	const { t } = useDictionary();

	const [notifications, setNotifications] = useState<Record<string, Record<string, Record<string, boolean>>>>({
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
			toast({ type: 'success', title: t('auth.notifications.toast.success', {}, 'Updated notification preferences') });
		} catch (e) {
			console.error('Failed to update notifications', e);
			toast({ type: 'error', title: t('auth.notifications.toast.error', {}, 'Failed to save changes') });
		}
	};

	return (
		<div
			className='flex flex-col max-w-4xl mx-auto w-full'
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}>
			<div className='flex flex-col' style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h1 className='text-3xl font-black tracking-tight text-(--text)'>{t('auth.notifications.title', {}, 'Notifications')}</h1>
				<p className='text-sm text-(--text-muted)'>{t('auth.notifications.description', {}, 'Manage how you receive notifications and alerts across channels.')}</p>
			</div>

			<div className='flex flex-col' style={{ gap: 'var(--ui-gap)' }}>
				{Object.entries(notifications).map(([category, items]) => (
					<div key={category} className='flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm overflow-hidden'>
						<div
							className='bg-(--background)/50 border-b border-(--border)/10 font-semibold uppercase tracking-wider text-xs text-(--text-muted)'
							style={{ padding: 'calc(var(--ui-gap) * 0.75) var(--ui-gap)' }}>
							{t(`auth.notifications.categories.${category}`, {}, category)}
						</div>
						<div className='flex flex-col'>
							{Object.entries(items).map(([itemKey, channels]) => (
								<div
									key={itemKey}
									className='flex flex-col sm:flex-row sm:items-center justify-between border-b border-(--border)/5 last:border-none'
									style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
									<div className='flex flex-col max-w-xl' style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
										<h3 className='text-base font-semibold text-(--text) capitalize'>{t(`auth.notifications.items.${itemKey}`, {}, itemKey)}</h3>
										<p className='text-xs text-(--text-muted)'>{t('auth.notifications.itemDescription', { item: itemKey }, `Configure alerts for ${itemKey}.`)}</p>
									</div>
									<div className='flex items-center' style={{ gap: 'calc(var(--ui-gap) * 1.5)' }}>
										{Object.entries(channels).map(([channelKey, enabled]) => (
											<div key={channelKey} className='flex flex-col items-center' style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
												<span className='text-[10px] font-bold uppercase tracking-wider text-(--text-muted)'>{t(`auth.notifications.channels.${channelKey}`, {}, channelKey)}</span>
												<Toggle checked={enabled} onChange={(val) => handleToggle(category, itemKey, channelKey, typeof val === 'boolean' ? val : val.target.checked)} suppressHydrationWarning />
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
