/** @format */
'use client';

import { AlertTriangle, LogOut, Trash2, User as UserIcon } from 'lucide-react';
import { signOut, useDictionary, useEnvironment, useSession, useUser } from '@xernerx/providers';

import { Confirm } from '@xernerx/ui';
import Image from 'next/image';
import { useState } from 'react';

export default function Account() {
	const { data: session } = useSession();
	const { user: discordUser } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();

	const [isDeleting, setIsDeleting] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);

	const activeUser = discordUser || session?.user;
	const userId = activeUser?.id;
	const avatarUrl = activeUser?.image || (userId && activeUser?.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${activeUser.avatar}.png` : null);

	const handleLogout = () => {
		const authLoginUrl = getEnvUrl('https://auth.xernerx.com/login');
		signOut({ callbackUrl: authLoginUrl });
	};

	const handleDeleteAccount = async () => {
		if (!userId) return;

		try {
			setIsDeleting(true);
			const apiUrl = getEnvUrl('https://api.xernerx.com/');

			const res = await fetch(`${apiUrl}secure/users/${userId}`, {
				method: 'DELETE',
			});

			if (!res.ok) {
				throw new Error('Failed to delete user data from database.');
			}

			const authLoginUrl = getEnvUrl('https://auth.xernerx.com/login');
			await signOut({ callbackUrl: authLoginUrl });
		} catch (error) {
			console.error('Error deleting account:', error);
			setIsDeleting(false);
			setIsConfirmOpen(false);
		}
	};

	return (
		<div
			className="flex flex-col max-w-4xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h1 className="text-3xl font-black tracking-tight text-(--text)">{t('auth.account.title')}</h1>
				<p className="text-sm text-(--text-muted)">{t('auth.account.description')}</p>
			</div>

			<div className="flex items-center rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				{avatarUrl ? (
					<Image
						src={avatarUrl}
						alt="Profile Avatar"
						width={80}
						height={80}
						className="h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0"
						unoptimized
						draggable={false}
					/>
				) : (
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--border)/10 shrink-0">
						<UserIcon size={36} className="text-(--text-muted)" />
					</div>
				)}
				<div className="flex flex-col overflow-hidden" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h2 className="text-xl font-bold text-(--text) truncate">{activeUser?.global_name || activeUser?.name || t('auth.account.fallbackName')}</h2>
					<p className="text-sm text-(--text-muted) truncate">@{activeUser?.username || activeUser?.name?.toLowerCase().replace(/\s/g, '')}</p>
					{userId && <span className="text-xs text-(--text-muted)/60 font-mono">ID: {userId}</span>}
				</div>
			</div>

			<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h3 className="text-base font-semibold text-(--text)">{t('auth.account.session.title')}</h3>
						<p className="text-xs text-(--text-muted)">{t('auth.account.session.description')}</p>
					</div>
					<button
						onClick={handleLogout}
						className="flex items-center justify-center rounded-xl bg-red-500/15 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 shrink-0"
						style={{
							padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<LogOut size={16} />
						<span>{t('auth.account.session.button')}</span>
					</button>
				</div>

				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-red-500/20 bg-red-500/5 shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<div className="flex items-center text-red-500 font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
							<AlertTriangle size={18} />
							<h3>{t('auth.account.danger.title')}</h3>
						</div>
						<p className="text-xs text-red-500/80">{t('auth.account.danger.description')}</p>
					</div>
					<button
						onClick={() => setIsConfirmOpen(true)}
						className="flex items-center justify-center rounded-xl bg-red-500 text-sm font-medium text-white transition-colors hover:bg-red-600 shrink-0 shadow-sm"
						style={{
							padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<Trash2 size={16} />
						<span>{t('auth.account.danger.button')}</span>
					</button>
				</div>
			</div>

			<Confirm
				open={isConfirmOpen}
				onOpenChange={setIsConfirmOpen}
				title={t('auth.account.danger.confirmTitle')}
				description={t('auth.account.danger.confirmDescription')}
				confirmText={t('auth.account.danger.confirmButton')}
				onConfirm={handleDeleteAccount}
				loading={isDeleting}
			/>
		</div>
	);
}
