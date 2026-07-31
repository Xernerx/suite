/** @format */
'use client';

import { AlertTriangle, LogOut, Trash2, User as UserIcon } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useDictionary, useEnvironment, useUser } from '@xernerx/providers';

import Image from 'next/image';

export default function Account() {
	const { data: session } = useSession();
	const { user: discordUser } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();

	const activeUser = discordUser || session?.user;
	const avatarUrl = activeUser?.image || (activeUser?.id && activeUser?.avatar ? `https://cdn.discordapp.com/avatars/${activeUser.id}/${activeUser.avatar}.png` : null);

	const handleLogout = () => {
		const authLoginUrl = getEnvUrl('https://auth.xernerx.com/login');
		signOut({ callbackUrl: authLoginUrl });
	};

	const handleDeleteAccount = () => {
		// Placeholder for future logic
		console.log('Delete account triggered');
	};

	return (
		<div className='flex flex-col gap-8 max-w-4xl mx-auto p-6 md:p-12 w-full'>
			{/* Welcome Header */}
			<div>
				<h1 className='text-3xl font-black tracking-tight text-(--text)'>{t('auth.account.title')}</h1>
				<p className='text-sm text-(--text-muted) mt-1'>{t('auth.account.description')}</p>
			</div>

			{/* Profile Summary Card */}
			<div className='flex items-center gap-5 p-6 rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm'>
				{avatarUrl ? (
					<Image src={avatarUrl} alt='Profile Avatar' width={80} height={80} className='h-20 w-20 rounded-full border border-(--border)/10 object-cover shrink-0' unoptimized draggable={false} />
				) : (
					<div className='flex h-20 w-20 items-center justify-center rounded-full bg-(--border)/10 shrink-0'>
						<UserIcon size={36} className='text-(--text-muted)' />
					</div>
				)}
				<div className='flex flex-col overflow-hidden'>
					<h2 className='text-xl font-bold text-(--text) truncate'>{activeUser?.global_name || activeUser?.name || t('auth.account.fallbackName')}</h2>
					<p className='text-sm text-(--text-muted) truncate'>@{activeUser?.username || activeUser?.name?.toLowerCase().replace(/\s/g, '')}</p>
					{activeUser?.id && <span className='text-xs text-(--text-muted)/60 mt-1 font-mono'>ID: {activeUser.id}</span>}
				</div>
			</div>

			{/* Settings Sections Grid / Stack */}
			<div className='flex flex-col gap-6'>
				{/* Session Section */}
				<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm'>
					<div className='flex flex-col max-w-xl'>
						<h3 className='text-base font-semibold text-(--text)'>{t('auth.account.session.title')}</h3>
						<p className='text-xs text-(--text-muted) mt-0.5'>{t('auth.account.session.description')}</p>
					</div>
					<button
						onClick={handleLogout}
						className='flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 shrink-0'>
						<LogOut size={16} />
						<span>{t('auth.account.session.button')}</span>
					</button>
				</div>

				{/* Danger Zone: Data & Account Deletion */}
				<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-red-500/20 bg-red-500/5 shadow-sm'>
					<div className='flex flex-col max-w-xl'>
						<div className='flex items-center gap-2 text-red-500 font-semibold text-base'>
							<AlertTriangle size={18} />
							<h3>{t('auth.account.danger.title')}</h3>
						</div>
						<p className='text-xs text-red-500/80 mt-0.5'>{t('auth.account.danger.description')}</p>
					</div>
					<button
						onClick={handleDeleteAccount}
						className='flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 shrink-0 shadow-sm'>
						<Trash2 size={16} />
						<span>{t('auth.account.danger.button')}</span>
					</button>
				</div>
			</div>
		</div>
	);
}
