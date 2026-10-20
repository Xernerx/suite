/** @format */
'use client';

import { LogOut, Settings, Info, User as UserIcon, ExternalLink, Copy, Check, Code2 } from 'lucide-react';
import { signOut, useDictionary, useEnvironment, useSession, useUser, useToast } from '@xernerx/providers';
import { Button, Selector, Toggle } from '@xernerx/ui';
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
	const [copiedId, setCopiedId] = useState(false);
	const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
	const activeUser = discordUser || session?.user;
	const userId = activeUser?.id;
	const [privacy, setPrivacy] = useState(activeUser?.privacy || 'private');
	const [widgets, setWidgets] = useState(Boolean((activeUser as any)?.widgets));
	const avatarUrl = activeUser?.image || (userId && activeUser?.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${activeUser.avatar}.png` : null);

	const handleCopyId = () => {
		if (!userId) return;
		navigator.clipboard.writeText(userId);
		setCopiedId(true);
		toast({ title: t('account.profile.idCopied'), type: 'success' });
		setTimeout(() => setCopiedId(false), 2000);
	};

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

	const apiBase = getEnvUrl('https://api.xernerx.com');
	const appBase = getEnvUrl('https://app.xernerx.com');
	const baseEndpoint = `${apiBase}/core/users/${userId || ''}`;
	const pngUrl = `${baseEndpoint}?type=png`;
	const svgUrl = `${baseEndpoint}?type=svg`;
	const iframeUrl = `${baseEndpoint}?type=iframe`;
	const profileUrl = `${appBase}/users/${userId || ''}`;
	const displayName = activeUser?.global_name || activeUser?.name || t('account.account.fallbackName');
	const safeName = displayName.replace(/"/g, '&quot;');

	const widgetTabs = [
		{
			id: 'iframe',
			label: t('app.widgets.formatIframe'),
			language: 'html',
			code: `<iframe\n  src="${iframeUrl}"\n  width="420"\n  height="172"\n  style="border:0;border-radius:20px;overflow:hidden"\n  loading="lazy"\n  title="${safeName}"\n></iframe>`,
		},
		{
			id: 'markdown',
			label: t('app.widgets.formatMarkdown'),
			language: 'markdown',
			code: `[![${displayName}](${svgUrl})](${profileUrl})`,
		},
		{
			id: 'html',
			label: t('app.widgets.formatHtmlImg'),
			language: 'html',
			code: `<a href="${profileUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${svgUrl}" alt="${safeName}" width="420" height="172" />\n</a>`,
		},
		{
			id: 'image',
			label: t('app.widgets.formatPngImage'),
			language: 'url',
			code: pngUrl,
		},
		{
			id: 'svg',
			label: t('app.widgets.formatDirectSvg'),
			language: 'url',
			code: svgUrl,
		},
		{
			id: 'raw-svg',
			label: t('app.widgets.formatRawSvg'),
			language: 'svg',
			code: `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="172" viewBox="0 0 420 172" fill="none" role="img" aria-label="${safeName}">\n  <a href="${profileUrl}" target="_blank" rel="noopener noreferrer">\n    <image href="${svgUrl}" width="420" height="172" />\n  </a>\n</svg>`,
		},
		{
			id: 'json',
			label: t('app.widgets.formatDirectJson'),
			language: 'json',
			code: baseEndpoint,
		},
	];
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
						<h2 className="text-xl font-bold text-(--text) truncate">{activeUser?.global_name || activeUser?.name || t('account.account.fallbackName')}</h2>
						<p className="text-sm text-(--text-muted) truncate">@{activeUser?.username || activeUser?.name?.toLowerCase().replace(/\s/g, '')}</p>
						{userId && (
							<button
								type="button"
								onClick={handleCopyId}
								className="inline-flex items-center gap-1.5 w-fit text-xs text-(--text-muted) hover:text-(--text) bg-(--background)/50 hover:bg-(--background) px-2 py-0.5 rounded-md border border-(--border)/10 font-mono transition-colors cursor-pointer"
							>
								<span>
									{t('account.common.description', {
										userId,
									})}
								</span>
								{copiedId ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
							</button>
						)}
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
						className="flex items-center justify-center rounded-xl bg-red-500/15 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 shrink-0"
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
							<Settings size={18} />
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

				{/* Public Embed Widget Card */}
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
							<Code2 size={18} />
							<h3>{t('app.widgets.title')}</h3>
						</div>
						<div className="flex items-center gap-1 text-xs text-(--text-muted)">{t('app.widgets.description')}</div>
					</div>
					<div
						className="flex items-center shrink-0"
						style={{
							gap: 'calc(var(--ui-gap) * 0.75)',
						}}
					>
						<button
							type="button"
							onClick={() => setIsWidgetModalOpen(true)}
							className="flex items-center justify-center rounded-xl border border-(--border)/15 bg-(--background)/60 text-xs font-semibold text-(--text) transition-colors hover:border-(--accent)/40 hover:text-(--accent)"
							style={{
								padding: 'calc(var(--ui-gap) * 0.5) calc(var(--ui-gap) * 0.75)',
								gap: 'calc(var(--ui-gap) * 0.35)',
							}}
						>
							<Code2 size={15} />
							<span>{t('app.widgets.embedButton')}</span>
						</button>
						<Toggle checked={Boolean(widgets)} onChange={(e) => handleWidgetsChange(e.target.checked)} />
					</div>
				</div>

				<AccountDangerZone
					activeUser={activeUser}
					widgets={Boolean(widgets)}
					widgetTabs={widgetTabs}
					isConfirmDataOpen={isConfirmDataOpen}
					setIsConfirmDataOpen={setIsConfirmDataOpen}
					isDeletingData={isDeletingData}
					handleDeleteData={handleDeleteData}
					isConfirmAccountOpen={isConfirmAccountOpen}
					setIsConfirmAccountOpen={setIsConfirmAccountOpen}
					isDeletingAccount={isDeletingAccount}
					handleDeleteAccount={handleDeleteAccount}
					isWidgetModalOpen={isWidgetModalOpen}
					setIsWidgetModalOpen={setIsWidgetModalOpen}
				/>
			</div>
		</div>
	);
}
