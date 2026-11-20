/** @format */
'use client';

import { signOut, useDictionary, useEnvironment, useSession, useToast, useUser } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import { AccountDangerZone } from './AccountDangerZone';
import { AccountPrivacyAndDataCards } from './account/AccountPrivacyAndDataCards';
import { AccountProfileSummary } from './account/AccountProfileSummary';
import { AccountSessionAndTourCards } from './account/AccountSessionAndTourCards';

export default function Account() {
	const { t } = useDictionary();
	const { data: session } = useSession();
	const { user: discordUser, mutate } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [isDeletingAccount, setIsDeletingAccount] = useState(false);
	const [isConfirmAccountOpen, setIsConfirmAccountOpen] = useState(false);
	const [isDeletingData, setIsDeletingData] = useState(false);
	const [isConfirmDataOpen, setIsConfirmDataOpen] = useState(false);
	const [isDeletingVirtue, setIsDeletingVirtue] = useState(false);
	const [isConfirmVirtueOpen, setIsConfirmVirtueOpen] = useState(false);
	const [isDeletingYourApps, setIsDeletingYourApps] = useState(false);
	const [isConfirmYourAppsOpen, setIsConfirmYourAppsOpen] = useState(false);
	const [isExportingData, setIsExportingData] = useState(false);
	const [isRevokingAllSessions, setIsRevokingAllSessions] = useState(false);
	const [isConfirmRevokeAllOpen, setIsConfirmRevokeAllOpen] = useState(false);
	const activeUser = discordUser || session?.user;
	const userId = activeUser?.id;
	const isBlacklisted = Boolean((activeUser as any)?.blacklisted);
	const [privacy, setPrivacy] = useState(activeUser?.privacy || 'private');
	const [widgets, setWidgets] = useState(Boolean((activeUser as any)?.widgets));
	const [servicesEnabled, setServicesEnabled] = useState((activeUser as any)?.services !== false);
	const [localTourPostponed, setLocalTourPostponed] = useState(false);
	const avatarUrl = activeUser?.image || (userId && activeUser?.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${activeUser.avatar}.png` : null);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		try {
			setLocalTourPostponed(Boolean(localStorage.getItem('xernerx_tour_postponed')));
		} catch {}
		const onTourPostponedChange = (e: Event) => {
			const detail = (e as CustomEvent<{ postponed?: boolean }>)?.detail;
			if (detail && typeof detail.postponed === 'boolean') {
				setLocalTourPostponed(detail.postponed);
			} else {
				try {
					setLocalTourPostponed(Boolean(localStorage.getItem('xernerx_tour_postponed')));
				} catch {}
			}
		};
		window.addEventListener('xernerx:tour-postponed-change', onTourPostponedChange);
		return () => window.removeEventListener('xernerx:tour-postponed-change', onTourPostponedChange);
	}, []);

	const isTourPostponed = Boolean(
		localTourPostponed || (activeUser as any)?.onboarding?.tourPostponed || (activeUser?.agreedTerms && activeUser?.agreedPrivacy && !(activeUser as any)?.onboarding?.completedAt)
	);

	useEffect(() => {
		if (!activeUser) return;
		if (activeUser.privacy) setPrivacy(activeUser.privacy);
		if ((activeUser as any).widgets !== undefined) setWidgets(Boolean((activeUser as any).widgets));
		if ((activeUser as any).services !== undefined) setServicesEnabled((activeUser as any).services !== false);
	}, [activeUser?.privacy, (activeUser as any)?.widgets, (activeUser as any)?.services]);

	const handleLogout = () => {
		const authLoginUrl = getEnvUrl('https://account.xernerx.com/login');
		signOut({ callbackUrl: authLoginUrl });
	};

	const handleRevokeAllSessions = async () => {
		if (!userId) return;
		try {
			setIsRevokingAllSessions(true);
			const apiUrl = getEnvUrl('https://api.xernerx.com/');
			const res = await fetch(`${apiUrl}secure/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'revoke_sessions' }),
			});
			if (!res.ok) throw new Error(t('account.account.session.revokeAllError'));
			toast({ type: 'success', title: t('account.account.session.revokeAllSuccess') });
			setIsConfirmRevokeAllOpen(false);
			const authLoginUrl = getEnvUrl('https://account.xernerx.com/login');
			await signOut({ callbackUrl: authLoginUrl });
		} catch (error: any) {
			toast({ type: 'error', title: t('account.account.session.revokeAllError'), description: error.message });
		} finally {
			setIsRevokingAllSessions(false);
		}
	};

	const clearLocalNotificationState = (targetUserId: string) => {
		if (typeof window === 'undefined') return;
		try {
			localStorage.removeItem('xernerx-read-globals');
			localStorage.removeItem('xernerx-deleted-globals');
			localStorage.removeItem('xernerx-read-invites');
			localStorage.removeItem(`xernerx-notified-dispatch-ids:${targetUserId}`);
		} catch {}
	};

	const handleDeleteAccount = async () => {
		if (!userId) return;
		try {
			setIsDeletingAccount(true);
			const apiUrl = getEnvUrl('https://api.xernerx.com/');
			const res = await fetch(`${apiUrl}secure/users/${userId}`, {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) throw new Error(t('account.account.danger.toasts.deleteUserError'));
			clearLocalNotificationState(userId);
			const authLoginUrl = getEnvUrl('https://account.xernerx.com/login');
			await signOut({ callbackUrl: authLoginUrl });
		} catch (error: any) {
			console.error('Error deleting account:', error);
			toast({ type: 'error', title: t('account.account.danger.toasts.deleteAccountFailed'), description: error.message });
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
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'reset_data', name: session?.user?.name || 'User' }),
			});
			if (!res.ok) throw new Error(t('account.account.danger.toasts.deleteDataFailed'));
			clearLocalNotificationState(userId);
			toast({
				type: 'success',
				title: t('account.account.danger.toasts.dataDeletedTitle'),
				description: t('account.account.danger.toasts.dataDeletedDesc'),
			});
			setIsConfirmDataOpen(false);
			setTimeout(() => {
				window.location.reload();
			}, 1000);
		} catch (error: any) {
			console.error('Error deleting data:', error);
			toast({ type: 'error', title: t('account.account.danger.toasts.deleteDataFailed'), description: error.message });
		} finally {
			setIsDeletingData(false);
		}
	};

	const handleDeleteVirtueData = async () => {
		if (!userId) return;
		try {
			setIsDeletingVirtue(true);
			const apiUrl = getEnvUrl('https://api.xernerx.com/');
			const res = await fetch(`${apiUrl}secure/users/${userId}/virtue`, {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || t('account.account.virtueData.toastError'));
			}
			toast({
				type: 'success',
				title: t('account.account.virtueData.toastSuccessTitle'),
				description: t('account.account.virtueData.toastSuccessDesc'),
			});
			setIsConfirmVirtueOpen(false);
		} catch (error: any) {
			console.error('Error deleting Virtue data:', error);
			toast({ type: 'error', title: t('account.account.virtueData.toastError'), description: error.message });
		} finally {
			setIsDeletingVirtue(false);
		}
	};

	const handleDeleteYourAppsData = async () => {
		if (!userId) return;
		try {
			setIsDeletingYourApps(true);
			const apiUrl = getEnvUrl('https://api.xernerx.com/');
			const res = await fetch(`${apiUrl}secure/users/${userId}/yourapps`, {
				method: 'DELETE',
				credentials: 'include',
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || t('account.account.yourappsData.toastError'));
			}
			toast({
				type: 'success',
				title: t('account.account.yourappsData.toastSuccessTitle'),
				description: t('account.account.yourappsData.toastSuccessDesc'),
			});
			setIsConfirmYourAppsOpen(false);
		} catch (error: any) {
			console.error('Error deleting YourApps data:', error);
			toast({ type: 'error', title: t('account.account.yourappsData.toastError'), description: error.message });
		} finally {
			setIsDeletingYourApps(false);
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
			if (!res.ok) throw new Error(t('account.profile.privacy.toast.error'));
			toast({
				type: 'success',
				title: t('account.profile.privacy.toast.title'),
				description: t('account.profile.privacy.toast.description'),
			});
		} catch (error: any) {
			toast({ type: 'error', title: t('account.profile.privacy.toast.error'), description: error.message });
		}
	};

	const handleWidgetsChange = async (enabled: boolean) => {
		if (!userId) return;
		setWidgets(enabled);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ widgets: enabled }),
			});
			if (!res.ok) throw new Error(t('account.profile.privacy.toast.error'));
			toast({
				type: 'success',
				title: t('account.profile.privacy.toast.title'),
				description: t('account.profile.privacy.toast.widgetsSaved'),
			});
		} catch (error: any) {
			toast({ type: 'error', title: t('account.profile.privacy.toast.error'), description: error.message });
		}
	};

	const handleServicesChange = async (enabled: boolean) => {
		if (!userId) return;
		setServicesEnabled(enabled);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ services: enabled }),
			});
			if (!res.ok) throw new Error(t('account.account.services.toastError'));
			await mutate().catch(() => {});
			toast({
				type: 'success',
				title: t('account.account.services.toastTitle'),
				description: enabled ? t('account.account.services.toastEnabledDesc') : t('account.account.services.toastDisabledDesc'),
			});
		} catch (error: any) {
			setServicesEnabled(!enabled);
			toast({ type: 'error', title: t('account.account.services.toastError'), description: error.message });
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
			toast({ type: 'success', title: t('account.account.export.toastSuccess') });
		} catch (error: any) {
			toast({ type: 'error', title: t('account.account.export.toastError'), description: error.message });
		} finally {
			setIsExportingData(false);
		}
	};

	const displayName = activeUser?.global_name || activeUser?.name || t('account.account.fallbackName');

	return (
		<div
			className="flex flex-col max-w-(--page-width) mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('account.account.title')}
				</h1>
				<p className="text-sm text-(--text-muted)">{t('account.account.description')}</p>
			</div>

			<AccountProfileSummary activeUser={activeUser} userId={userId} avatarUrl={avatarUrl} displayName={displayName} isBlacklisted={isBlacklisted} />

			<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				<AccountSessionAndTourCards
					isConfirmRevokeAllOpen={isConfirmRevokeAllOpen}
					setIsConfirmRevokeAllOpen={setIsConfirmRevokeAllOpen}
					isRevokingAllSessions={isRevokingAllSessions}
					handleRevokeAllSessions={handleRevokeAllSessions}
					handleLogout={handleLogout}
					isTourPostponed={isTourPostponed}
				/>

				<AccountPrivacyAndDataCards
					userId={userId}
					displayName={displayName}
					isBlacklisted={isBlacklisted}
					privacy={privacy}
					handlePrivacyChange={handlePrivacyChange}
					servicesEnabled={servicesEnabled}
					handleServicesChange={handleServicesChange}
					widgets={widgets}
					handleWidgetsChange={handleWidgetsChange}
					isExportingData={isExportingData}
					handleExportData={handleExportData}
				/>

				<AccountDangerZone
					isConfirmDataOpen={isConfirmDataOpen}
					setIsConfirmDataOpen={setIsConfirmDataOpen}
					isDeletingData={isDeletingData}
					handleDeleteData={handleDeleteData}
					isConfirmVirtueOpen={isConfirmVirtueOpen}
					setIsConfirmVirtueOpen={setIsConfirmVirtueOpen}
					isDeletingVirtue={isDeletingVirtue}
					handleDeleteVirtueData={handleDeleteVirtueData}
					isConfirmYourAppsOpen={isConfirmYourAppsOpen}
					setIsConfirmYourAppsOpen={setIsConfirmYourAppsOpen}
					isDeletingYourApps={isDeletingYourApps}
					handleDeleteYourAppsData={handleDeleteYourAppsData}
					isConfirmAccountOpen={isConfirmAccountOpen}
					setIsConfirmAccountOpen={setIsConfirmAccountOpen}
					isDeletingAccount={isDeletingAccount}
					handleDeleteAccount={handleDeleteAccount}
				/>
			</div>
		</div>
	);
}
