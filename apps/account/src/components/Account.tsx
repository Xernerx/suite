/** @format */
'use client';

import { LogOut, Settings, Info, User as UserIcon, ExternalLink, Download } from 'lucide-react';
import { signOut, useDictionary, useEnvironment, useSession, useUser, useToast } from '@xernerx/providers';
import { Button, CopyButton, Selector } from '@xernerx/ui';
import { WidgetSettingsCard } from '@xernerx/components';
import Image from 'next/image';
import { useState } from 'react';
import { AccountDangerZone } from './AccountDangerZone';
export default function Account() {
	const { t } = useDictionary();
	const { data: session } = useSession();
	const { user: discordUser } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [isDeletingAccount, setIsDeletingAccount] = useState(false);
	const [isConfirmAccountOpen, setIsConfirmAccountOpen] = useState(false);
	const [isDeletingData, setIsDeletingData] = useState(false);
	const [isConfirmDataOpen, setIsConfirmDataOpen] = useState(false);
	const [isExportingData, setIsExportingData] = useState(false);
	const activeUser = discordUser || session?.user;
	const userId = activeUser?.id;
	const [privacy, setPrivacy] = useState(activeUser?.privacy || 'private');
	const [widgets, setWidgets] = useState(Boolean((activeUser as any)?.widgets));
	const avatarUrl = activeUser?.image || (userId && activeUser?.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${activeUser.avatar}.png` : null);

	const handleLogout = () => {
		const authLoginUrl = getEnvUrl('https://account.xernerx.com/login');
		signOut({
			callbackUrl: authLoginUrl,
		});
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
				throw new Error(t('account.account.danger.toasts.deleteUserError'));
			}
			const authLoginUrl = getEnvUrl('https://account.xernerx.com/login');
			await signOut({
				callbackUrl: authLoginUrl,
			});
		} catch (error: any) {
			console.error('Error deleting account:', error);
			toast({
				type: 'error',
				title: t('account.account.danger.toasts.deleteAccountFailed'),
				description: error.message,
			});
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
					widgets: false,
				}),
			});
			if (!res.ok) {
				throw new Error(t('account.account.danger.toasts.deleteDataFailed'));
			}
			toast({
				type: 'success',
				title: t('account.account.danger.toasts.dataDeletedTitle'),
				description: t('account.account.danger.toasts.dataDeletedDesc'),
			});
			setIsConfirmDataOpen(false);

			// Force reload to get updated data from provider
			setTimeout(() => {
				window.location.reload();
			}, 1000);
		} catch (error: any) {
			console.error('Error deleting data:', error);
			toast({
				type: 'error',
				title: t('account.account.danger.toasts.deleteDataFailed'),
				description: error.message,
			});
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
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					privacy: val,
				}),
			});
			if (!res.ok) throw new Error(t('account.profile.privacy.toast.error'));
			toast({
				type: 'success',
				title: t('account.profile.privacy.toast.title'),
				description: t('account.profile.privacy.toast.description'),
			});
		} catch (error: any) {
			toast({
				type: 'error',
				title: t('account.profile.privacy.toast.error'),
				description: error.message,
			});
		}
	};
	const handleWidgetsChange = async (enabled: boolean) => {
		if (!userId) return;
		setWidgets(enabled);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					widgets: enabled,
				}),
			});
			if (!res.ok) throw new Error(t('account.profile.privacy.toast.error'));
			toast({
				type: 'success',
				title: t('account.profile.privacy.toast.title'),
				description: t('account.profile.privacy.toast.widgetsSaved'),
			});
		} catch (error: any) {
			toast({
				type: 'error',
				title: t('account.profile.privacy.toast.error'),
				description: error.message,
			});
		}
	};
	const handleExportData = async () => {
		if (!userId) return;
		setIsExportingData(true);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/core/users/${userId}/export`, {
				method: 'GET',
				credentials: 'include',
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || t('account.account.export.toastError'));
			}
			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'xernerx-data-export.json';
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
			toast({
				type: 'success',
				title: t('account.account.export.toastSuccess'),
			});
		} catch (error: any) {
			toast({
				type: 'error',
				title: t('account.account.export.toastError'),
				description: error.message,
			});
		} finally {
			setIsExportingData(false);
		}
	};

	const displayName = activeUser?.global_name || activeUser?.name || t('account.account.fallbackName');

	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<div
				className="flex flex-col"
				style={{
					gap: 'calc(var(--ui-gap) * 0.25)',
				}}
			>
				<h1
					className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm"
					style={{
						fontFamily: 'var(--font-fredoka)',
					}}
				>
					{t('account.account.title')}
				</h1>
				<p className="text-sm text-(--text-muted)">{t('account.account.description')}</p>
			</div>

			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{
					padding: 'var(--ui-gap)',
					gap: 'var(--ui-gap)',
				}}
			>
				<div
					className="flex items-center"
					style={{
						gap: 'var(--ui-gap)',
					}}
				>
					{avatarUrl ? (
						<Image
							src={avatarUrl}
							alt={t('account.common.alt')}
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
					<div
						className="flex flex-col overflow-hidden"
						style={{
							gap: 'calc(var(--ui-gap) * 0.25)',
						}}
					>
						<h2 className="text-xl font-bold text-(--text) truncate">{displayName}</h2>
						<p className="text-sm text-(--text-muted) truncate">@{activeUser?.username || activeUser?.name?.toLowerCase().replace(/\s/g, '')}</p>
						{userId && <CopyButton value={userId} label={t('account.common.description', { userId })} toastTitle={t('account.profile.idCopied')} className="w-fit" />}
					</div>
				</div>
				{userId && (
					<div className="flex items-center shrink-0">
						<Button variant="secondary" onClick={() => window.open(`${getEnvUrl('https://app.xernerx.com/')}users/${userId}`, '_blank')} className="gap-2">
							<ExternalLink size={16} />
							{t('account.profile.viewPublicProfile')}
						</Button>
					</div>
				)}
			</div>

			<div
				className="flex flex-col"
				style={{
					gap: 'var(--ui-gap)',
				}}
			>
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{
						padding: 'var(--ui-gap)',
						gap: 'var(--ui-gap)',
					}}
				>
					<div
						className="flex flex-col max-w-xl"
						style={{
							gap: 'calc(var(--ui-gap) * 0.25)',
						}}
					>
						<h3 className="text-base font-semibold text-(--text)">{t('account.account.session.title')}</h3>
						<p className="text-xs text-(--text-muted)">{t('account.account.session.description')}</p>
					</div>
					<button
						onClick={handleLogout}
						className="flex items-center justify-center rounded-2xl bg-(--accent-red)/15 text-sm font-medium text-(--accent-red) transition-colors hover:bg-(--accent-red)/20 shrink-0"
						style={{
							padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
							gap: 'calc(var(--ui-gap) * 0.5)',
						}}
					>
						<LogOut size={16} />
						<span>{t('account.account.session.button')}</span>
					</button>
				</div>

				{/* Privacy Setting Card */}
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{
						padding: 'var(--ui-gap)',
						gap: 'var(--ui-gap)',
					}}
				>
					<div
						className="flex flex-col max-w-xl"
						style={{
							gap: 'calc(var(--ui-gap) * 0.25)',
						}}
					>
						<div
							className="flex items-center text-(--text) font-semibold text-base"
							style={{
								gap: 'calc(var(--ui-gap) * 0.5)',
							}}
						>
							<Settings size={18} className="text-(--accent)" />
							<h3>{t('account.common.title')}</h3>
						</div>
						<div className="flex items-center gap-1 text-xs text-(--text-muted)">
							{t('account.common.description2')}
							<div className="group relative flex items-center">
								<Info size={14} className="cursor-pointer hover:text-(--text)" />
								<div
									className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-72 rounded-2xl border border-(--border)/10 bg-(--background) text-xs text-(--text-muted) shadow-2xl z-55 pointer-events-none"
									style={{
										padding: 'var(--ui-gap)',
									}}
								>
									<p className="font-semibold text-(--text) mb-1.5">{t('account.profile.privacy.tooltip.title')}</p>
									<ul className="space-y-1.5">
										<li>
											<span className="font-medium text-(--text)">{t('account.profile.privacy.tooltip.privateTitle')}</span> {t('account.profile.privacy.tooltip.privateDesc')}
										</li>
										<li>
											<span className="font-medium text-(--text)">{t('account.profile.privacy.tooltip.limitedTitle')}</span> {t('account.profile.privacy.tooltip.limitedDesc')}
										</li>
										<li>
											<span className="font-medium text-(--text)">{t('account.profile.privacy.tooltip.publicTitle')}</span> {t('account.profile.privacy.tooltip.publicDesc')}
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
								{
									label: t('account.profile.privacy.public'),
									value: 'public',
								},
								{
									label: t('account.profile.privacy.limited'),
									value: 'limited',
								},
								{
									label: t('account.profile.privacy.private'),
									value: 'private',
								},
							]}
						/>
					</div>
				</div>

				{userId && <WidgetSettingsCard entityType="users" entityId={userId} entityName={displayName} enabled={Boolean(widgets)} onChange={handleWidgetsChange} />}

				{/* Personal Data Archive Export Card */}
				<div
					className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{
						padding: 'var(--ui-gap)',
						gap: 'var(--ui-gap)',
					}}
				>
					<div
						className="flex flex-col max-w-xl"
						style={{
							gap: 'calc(var(--ui-gap) * 0.25)',
						}}
					>
						<div
							className="flex items-center text-(--text) font-semibold text-base"
							style={{
								gap: 'calc(var(--ui-gap) * 0.5)',
							}}
						>
							<Download size={18} className="text-(--accent)" />
							<h3>{t('account.account.export.title')}</h3>
						</div>
						<p className="text-xs text-(--text-muted)">{t('account.account.export.description')}</p>
					</div>
					<Button variant="secondary" onClick={handleExportData} loading={isExportingData} className="gap-2 shrink-0">
						<Download size={16} />
						<span>{t('account.account.export.button')}</span>
					</Button>
				</div>

				<AccountDangerZone
					isConfirmDataOpen={isConfirmDataOpen}
					setIsConfirmDataOpen={setIsConfirmDataOpen}
					isDeletingData={isDeletingData}
					handleDeleteData={handleDeleteData}
					isConfirmAccountOpen={isConfirmAccountOpen}
					setIsConfirmAccountOpen={setIsConfirmAccountOpen}
					isDeletingAccount={isDeletingAccount}
					handleDeleteAccount={handleDeleteAccount}
				/>
			</div>
		</div>
	);
}
