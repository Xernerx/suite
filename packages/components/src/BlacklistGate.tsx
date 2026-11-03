/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { Ban, LogOut, ShieldAlert, Trash2 } from 'lucide-react';
import { signOut, useDictionary, useEnvironment, useUser } from '@xernerx/providers';
import { Button } from '@xernerx/ui';

export function BlacklistGate({ children }: { children: React.ReactNode }) {
	const { user, loading } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const [isAllowedLocation, setIsAllowedLocation] = useState(true);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const allowed =
			window.location.port === '4003' ||
			window.location.hostname.startsWith('account.') ||
			window.location.pathname.startsWith('/login') ||
			window.location.pathname.startsWith('/logout') ||
			window.location.pathname === '/terms' ||
			window.location.pathname === '/privacy' ||
			window.location.pathname === '/cookies' ||
			window.location.pathname === '/security';
		setIsAllowedLocation(allowed);
	}, []);

	const isBlacklisted = !loading && Boolean((user as any)?.blacklisted);

	if (!isBlacklisted || isAllowedLocation) {
		return <>{children}</>;
	}

	const accountManageUrl = getEnvUrl('https://account.xernerx.com/?tab=account');
	const loginUrl = getEnvUrl('https://account.xernerx.com/login');

	return (
		<div
			className="flex flex-col items-center justify-center min-h-[70dvh] max-w-(--page-width) mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
			}}
		>
			<div
				className="flex flex-col items-center text-center max-w-lg w-full rounded-3xl border border-(--accent-red)/30 bg-(--foreground)/40 backdrop-blur-md shadow-xl"
				style={{
					padding: 'calc(var(--ui-gap) * 1.5)',
					gap: 'var(--ui-gap)',
				}}
			>
				<div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-(--accent-red)/15 text-(--accent-red) border border-(--accent-red)/30">
					<Ban size={32} />
				</div>

				<span className="inline-flex items-center gap-1.5 rounded-full bg-(--accent-red)/15 border border-(--accent-red)/30 px-3 py-1 text-xs font-bold text-(--accent-red)">
					<ShieldAlert size={13} />
					{t('components.blacklistGate.badge')}
				</span>

				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.35)' }}>
					<h1 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('components.blacklistGate.title')}
					</h1>
					<p className="text-sm text-(--text-muted) leading-relaxed">{t('components.blacklistGate.description')}</p>
				</div>

				<div className="flex flex-col sm:flex-row items-center justify-center w-full pt-2" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<Button
						variant="primary"
						onClick={() => {
							window.location.href = accountManageUrl;
						}}
						className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl"
					>
						<Trash2 size={16} />
						<span>{t('components.blacklistGate.manageAccountBtn')}</span>
					</Button>
					<Button
						variant="secondary"
						onClick={() => {
							signOut({ callbackUrl: loginUrl });
						}}
						className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl"
					>
						<LogOut size={16} />
						<span>{t('components.blacklistGate.signOutBtn')}</span>
					</Button>
				</div>
			</div>
		</div>
	);
}
