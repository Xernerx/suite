/** @format */
'use client';

import { AlertTriangle, LogOut, Settings, Info, Trash2, User as UserIcon } from 'lucide-react';
import { signOut, useDictionary, useEnvironment, useSession, useUser, useToast } from '@xernerx/providers';

import { Button, Confirm, Selector } from '@xernerx/ui';
import Image from 'next/image';
import { useState } from 'react';

export default function Account() {
	const { data: session } = useSession();
	const { user: discordUser } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const { toast } = useToast();

	const [isDeletingAccount, setIsDeletingAccount] = useState(false);
	const [isConfirmAccountOpen, setIsConfirmAccountOpen] = useState(false);
	const [isDeletingData, setIsDeletingData] = useState(false);
	const [isConfirmDataOpen, setIsConfirmDataOpen] = useState(false);

	const activeUser = discordUser || session?.user;
	const userId = activeUser?.id;

	const [privacy, setPrivacy] = useState(activeUser?.privacy || 'private');
	const avatarUrl = activeUser?.image || (userId && activeUser?.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${activeUser.avatar}.png` : null);

	const handleLogout = () => {
		const authLoginUrl = getEnvUrl('https://auth.xernerx.com/login');
		signOut({ callbackUrl: authLoginUrl });
	};

	const handleDeleteAccount = async () => {
		if (!userId) return;

		try {
			setIsDeletingAccount(true);
			const apiUrl = getEnvUrl('https://api.xernerx.com/');

			const res = await fetch(`${apiUrl}secure/users/${userId}`, {
				method: 'DELETE',
			});

			if (!res.ok) {
				throw new Error('Failed to delete user data from database.');
			}

			const authLoginUrl = getEnvUrl('https://auth.xernerx.com/login');
			await signOut({ callbackUrl: authLoginUrl });
		} catch (error: any) {
			console.error('Error deleting account:', error);
			toast({ type: 'error', title: 'Failed to delete account', description: error.message });
			setIsDeletingAccount(false);
			setIsConfirmAccountOpen(false);
		}
	};

	const handleDeleteData = async () => {
		if (!userId) return;

		try {
			setIsDeletingData(true);
			const apiUrl = getEnvUrl('https://api.xernerx.com/');

			const res = await fetch(`${apiUrl}secure/users/${userId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					description: '',
					info: '',
					birthday: '',
					gender: 'other',
					pronouns: '',
					timezone: '',
					privacy: 'private',
				}),
			});

			if (!res.ok) {
				throw new Error('Failed to delete user data.');
			}

			toast({ type: 'success', title: 'Data Deleted', description: 'Your profile data has been successfully reset.' });
			setIsConfirmDataOpen(false);

			// Force reload to get updated data from provider
			setTimeout(() => {
				window.location.reload();
			}, 1000);
		} catch (error: any) {
			console.error('Error deleting data:', error);
			toast({ type: 'error', title: 'Failed to delete data', description: error.message });
		} finally {
			setIsDeletingData(false);
		}
	};

	const handlePrivacyChange = async (val: string) => {
		if (!userId) return;
		setPrivacy(val);

		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ privacy: val }),
			});
			if (!res.ok) throw new Error('Failed to update privacy');
			toast({ type: 'success', title: 'Privacy Updated', description: 'Your privacy settings have been updated.' });
		} catch (error: any) {
			toast({ type: 'error', title: 'Error', description: error.message });
		}
	};

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('auth.account.title')}
				</h1>
				<p className="text-sm text-(--text-muted)">{t('auth.account.description')}</p>
			</div>

			<div className="flex items-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
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
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
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

				{/* Privacy Setting Card */}
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<div className="flex items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
							<Settings size={18} />
							<h3>Privacy Setting</h3>
						</div>
						<div className="flex items-center gap-1 text-xs text-(--text-muted)">
							Choose who can see your profile.
							<div className="group relative flex items-center">
								<Info size={14} className="cursor-pointer hover:text-(--text)" />
								<div
									className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-72 rounded-2xl border border-(--border)/10 bg-(--background) text-xs text-(--text-muted) shadow-2xl z-55 pointer-events-none"
									style={{ padding: 'var(--ui-gap)' }}
								>
									<p className="font-semibold text-(--text) mb-1.5">{t('auth.profile.privacy.tooltip.title')}</p>
									<ul className="space-y-1.5">
										<li>
											<span className="font-medium text-(--text)">{t('auth.profile.privacy.tooltip.privateTitle')}</span> {t('auth.profile.privacy.tooltip.privateDesc')}
										</li>
										<li>
											<span className="font-medium text-(--text)">{t('auth.profile.privacy.tooltip.limitedTitle')}</span> {t('auth.profile.privacy.tooltip.limitedDesc')}
										</li>
										<li>
											<span className="font-medium text-(--text)">{t('auth.profile.privacy.tooltip.publicTitle')}</span> {t('auth.profile.privacy.tooltip.publicDesc')}
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
					<div className="w-full sm:w-48 shrink-0">
						<Selector
							value={privacy}
							onChange={handlePrivacyChange}
							options={[
								{ label: t('auth.profile.privacy.public'), value: 'public' },
								{ label: t('auth.profile.privacy.limited'), value: 'limited' },
								{ label: t('auth.profile.privacy.private'), value: 'private' },
							]}
						/>
					</div>
				</div>

				{/* Reset Data Card */}
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<div className="flex items-center text-(--accent-orange) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
							<AlertTriangle size={18} />
							<h3>Delete Data</h3>
						</div>
						<p className="text-xs text-(--accent-orange)/80">Reset all your profile information back to default without deleting your account.</p>
					</div>
					<button
						onClick={() => setIsConfirmDataOpen(true)}
						className="flex items-center justify-center rounded-xl bg-(--accent-orange) text-sm font-medium text-white transition-colors hover:bg-(--accent-orange)/80 shrink-0 shadow-sm"
						style={{
							padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<Trash2 size={16} />
						<span>Delete Data</span>
					</button>
				</div>

				{/* Delete Account Card */}
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-red)/20 bg-(--accent-red)/5 shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<div className="flex items-center text-(--accent-red) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
							<AlertTriangle size={18} />
							<h3>{t('auth.account.danger.title')}</h3>
						</div>
						<p className="text-xs text-(--accent-red)/80">{t('auth.account.danger.description')}</p>
					</div>
					<button
						onClick={() => setIsConfirmAccountOpen(true)}
						className="flex items-center justify-center rounded-xl bg-(--accent-red) text-sm font-medium text-white transition-colors hover:bg-(--accent-red)/80 shrink-0 shadow-sm"
						style={{
							padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<Trash2 size={16} />
						<span>Delete Account</span>
					</button>
				</div>
			</div>

			<Confirm
				open={isConfirmAccountOpen}
				onOpenChange={setIsConfirmAccountOpen}
				title={t('auth.account.danger.confirmTitle')}
				description={t('auth.account.danger.confirmDescription')}
				confirmText={t('auth.account.danger.confirmButton')}
				onConfirm={handleDeleteAccount}
				loading={isDeletingAccount}
			/>

			<Confirm
				open={isConfirmDataOpen}
				onOpenChange={setIsConfirmDataOpen}
				title="Delete Data"
				description="Are you sure you want to reset all your profile data? Your account will remain active."
				confirmText="Delete Data"
				onConfirm={handleDeleteData}
				loading={isDeletingData}
			/>
		</div>
	);
}
