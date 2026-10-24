/** @format */
'use client';

import { Badge, Button, Divider, Input, Markdown, Selector } from '@xernerx/ui';
import { XernerxDotLogo } from '@xernerx/feedback';
import { Info, User as UserIcon, ExternalLink, Copy, Check, Coins, Sparkles, Lock } from 'lucide-react';
import { useDictionary, useEnvironment, useSession, useToast, useUser } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { timezones } from '@xernerx/lib';
import { ProfileShowcases } from './ProfileShowcases';
export default function Profile() {
	const { t } = useDictionary();
	const { data: session } = useSession();
	const { user, mutate } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { toast, remind } = useToast();
	const [copiedId, setCopiedId] = useState(false);
	const [markdownPreview, setMarkdownPreview] = useState(false);
	const [unlockingVanity, setUnlockingVanity] = useState(false);
	const activeUser = user || session?.user;
	const userId = activeUser?.id;
	const isVanityUnlocked = Boolean((user as any)?.vanityUnlocked || (user as any)?.vanitySlug || (user as any)?.verified);
	const extraVanitySlots = Number(user?.credits?.extraVanitySlots) || 0;

	const handleUnlockVanity = async () => {
		if (!userId) return;
		setUnlockingVanity(true);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'unlock_vanity' }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toast({
					title: t('account.profile.toast.error'),
					description: data.error,
					type: 'error',
				});
				return;
			}
			if (mutate) await mutate();
			toast({
				title: t('app.dashboard.settings.vanityUnlockSuccessTitle'),
				description: t('app.dashboard.settings.vanityUnlockSuccessDesc'),
				type: 'success',
			});
		} catch (err: any) {
			toast({
				title: t('account.profile.toast.error'),
				description: err.message,
				type: 'error',
			});
		} finally {
			setUnlockingVanity(false);
		}
	};
	const avatarUrl = activeUser?.image || (userId && activeUser?.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${activeUser.avatar}.png` : null);

	const handleCopyId = () => {
		if (!userId) return;
		navigator.clipboard.writeText(userId);
		setCopiedId(true);
		toast({ title: t('account.profile.idCopied'), type: 'success' });
		setTimeout(() => setCopiedId(false), 2000);
	};

	const [formData, setFormData] = useState({
		vanitySlug: '',
		description: '',
		info: '',
		birthday: '',
		gender: 'other',
		pronouns: '',
		timezone: '',
	});
	const [initialData, setInitialData] = useState({
		vanitySlug: '',
		description: '',
		info: '',
		birthday: '',
		gender: 'other',
		pronouns: '',
		timezone: '',
	});
	const [isSaving, setIsSaving] = useState(false);
	useEffect(() => {
		(() => {
			if (user) {
				const loadedData = {
					vanitySlug: (user as any).vanitySlug || '',
					description: user.description || '',
					info: user.info || '',
					birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
					gender: user.gender || 'other',
					pronouns: user.pronouns || '',
					timezone: user.timezone || '',
				};
				setFormData(loadedData);
				setInitialData(loadedData);
			}
		})();
	}, [user]);
	const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
	const handleChange = (field: string, value: unknown) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};
	useEffect(() => {
		if (isDirty) {
			const handleSave = async () => {
				if (!userId || !isDirty) return;
				setIsSaving(true);
				try {
					const updatePayload = {
						vanitySlug: formData.vanitySlug.trim().toLowerCase(),
						description: formData.description,
						info: formData.info,
						birthday: formData.birthday || undefined,
						gender: formData.gender,
						pronouns: formData.pronouns,
						timezone: formData.timezone,
					};
					const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}`, {
						method: 'PATCH',
						headers: {
							'Content-Type': 'application/json',
						},
						credentials: 'include',
						body: JSON.stringify(updatePayload),
					});
					if (!res.ok) {
						const errData = await res.json().catch(() => ({}));
						throw new Error(errData.error || t('account.profile.toast.error'));
					}
					if (mutate) mutate();
					setInitialData(formData);
					toast({
						title: t('account.profile.toast.success'),
						type: 'success',
					});
					remind(false);
				} catch (error: any) {
					toast({
						title: t('account.profile.toast.error'),
						description: error?.message,
						type: 'error',
					});
				} finally {
					setIsSaving(false);
				}
			};
			const handleReset = () => {
				setFormData(initialData);
			};
			remind(true, handleSave, handleReset, isSaving);
		} else {
			remind(false);
		}
	}, [isDirty, isSaving, formData, initialData, userId, getEnvUrl, remind, toast, mutate, t]);
	const tzList = Array.isArray(timezones)
		? timezones
		: [
				{
					value: 'UTC',
					label: 'UTC',
					offset: '+00:00',
					region: 'UTC',
				},
				{
					value: 'Europe/Brussels',
					label: 'Brussels',
					offset: '+02:00',
					region: 'Europe',
				},
			];
	const timezoneOptions = tzList.map((tz: any) => ({
		value: tz.value,
		label: (
			<div className="flex items-center justify-between w-full">
				<span>{tz.label}</span>
				<span className="text-xs text-(--text-muted) font-mono">{tz.offset}</span>
			</div>
		),
	}));
	return (
		<div
			className="flex flex-col max-w-7xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{/* Header */}
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
					{t('account.profile.title')}
				</h1>
				<p className="text-sm text-(--text-muted)">{t('account.profile.description')}</p>
			</div>

			<div
				className="flex flex-col"
				style={{
					gap: 'var(--ui-gap)',
				}}
			>
				{/* Profile Summary Card */}
				<div
					className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{
						padding: 'var(--ui-gap)',
						gap: 'var(--ui-gap)',
					}}
				>
					{Array.isArray(user?.credits?.activeBadges) && user.credits.activeBadges.includes('dot_matrix_banner') && (
						<div className="absolute inset-0 opacity-65 pointer-events-none">
							<XernerxDotLogo variant={(user?.credits?.dotMatrixVariant as any) || 'orbit'} backgroundMode ripple={true} vivid={true} />
						</div>
					)}
					<div
						className="relative z-10 flex items-center"
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
									className="inline-flex items-center gap-1.5 w-fit text-xs text-(--text-muted) hover:text-(--text) bg-(--background)/50 hover:bg-(--background) px-2 py-0.5 rounded-xl border border-(--border)/10 font-mono transition-colors cursor-pointer"
								>
									<span>
										{t('account.common.description', {
											userId,
										})}
									</span>
									{copiedId ? <Check size={12} className="text-(--accent-green)" /> : <Copy size={12} />}
								</button>
							)}
						</div>
					</div>
					{userId && (
						<div className="relative z-10 flex items-center shrink-0">
							<Button variant="secondary" onClick={() => window.open(`${getEnvUrl('https://app.xernerx.com/')}users/${userId}`, '_blank')} className="gap-2">
								<ExternalLink size={16} />
								{t('account.profile.viewPublicProfile')}
							</Button>
						</div>
					)}
				</div>

				{/* Form Inputs Card */}
				<div
					className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{
						padding: 'var(--ui-gap)',
						gap: 'var(--ui-gap)',
					}}
				>
					{/* Vanity Profile URL */}
					<div
						className="flex flex-col"
						style={{
							gap: 'calc(var(--ui-gap) * 0.4)',
						}}
					>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<div className="flex flex-wrap items-center gap-2">
								<label className="block text-sm font-medium text-(--text)">{t('account.profile.vanitySlug.label')}</label>
								{isVanityUnlocked ? (
									<Badge variant="accent" size="sm" icon={<Sparkles size={11} />}>
										{t('app.dashboard.settings.vanityUnlockedBadge')}
									</Badge>
								) : (
									<Badge variant="muted" size="sm" icon={<Coins size={11} />}>
										{extraVanitySlots > 0 ? t('app.dashboard.settings.vanitySlotAvailableBadge', { count: extraVanitySlots }) : t('app.dashboard.settings.vanityCostBadge')}
									</Badge>
								)}
							</div>
							<span className="text-xs font-mono text-(--accent)">xernerx.com/users/{formData.vanitySlug || userId || 'slug'}</span>
						</div>
						{isVanityUnlocked ? (
							<div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-2">
								<span className="text-xs font-mono font-bold text-(--text-muted) px-2 shrink-0">xernerx.com/users/</span>
								<div className="flex-1">
									<Input
										type="text"
										value={formData.vanitySlug}
										onChange={(e) =>
											handleChange(
												'vanitySlug',
												e.target.value
													.toLowerCase()
													.replace(/[^a-z0-9-]/g, '-')
													.replace(/-+/g, '-')
													.slice(0, 32)
											)
										}
										placeholder={t('account.profile.vanitySlug.placeholder')}
									/>
								</div>
							</div>
						) : (
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-(--background)/50 border border-(--border)/10 p-3">
								<p className="text-xs text-(--text-muted) flex items-center gap-1.5">
									<Lock size={13} className="text-(--accent) shrink-0" />
									<span>{t('app.dashboard.settings.vanityLockedHint')}</span>
								</p>
								<Button variant="primary" onClick={handleUnlockVanity} loading={unlockingVanity} className="shrink-0 gap-2">
									{extraVanitySlots > 0 ? <Sparkles size={15} /> : <Coins size={15} />}
									<span>{extraVanitySlots > 0 ? t('app.dashboard.settings.redeemVanitySlotBtn') : t('app.dashboard.settings.unlockVanityBtn')}</span>
								</Button>
							</div>
						)}
						<span className="text-xs text-(--text-muted)">{t('account.profile.vanitySlug.hint', { slug: formData.vanitySlug || userId || 'slug' })}</span>
					</div>

					{/* Description */}
					<div
						className="flex flex-col"
						style={{
							gap: 'calc(var(--ui-gap) * 0.4)',
						}}
					>
						<label className="block text-sm font-medium text-(--text)">{t('account.profile.descriptionField.label')}</label>
						<Input type="text" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder={t('account.profile.descriptionField.placeholder')} />
					</div>

					{/* Info (Long Description) */}
					<Markdown
						editable
						preview={markdownPreview}
						onPreviewChange={setMarkdownPreview}
						label={t('account.profile.infoField.label')}
						value={formData.info}
						onChange={(val) => handleChange('info', val)}
						placeholder={t('account.profile.infoField.placeholder')}
						emptyText={t('account.profile.infoField.nothingToPreview')}
						rows={4}
					/>

					{/* Group 1: Birthday & Timezone */}
					<div
						className="grid grid-cols-1 md:grid-cols-2"
						style={{
							gap: 'var(--ui-gap)',
						}}
					>
						<div
							className="flex flex-col"
							style={{
								gap: 'calc(var(--ui-gap) * 0.4)',
							}}
						>
							<label className="block text-sm font-medium text-(--text)">{t('account.profile.birthday.label')}</label>
							<Input variant="date" value={formData.birthday} onChange={(e) => handleChange('birthday', e.target.value)} />
						</div>
						<div
							className="flex flex-col"
							style={{
								gap: 'calc(var(--ui-gap) * 0.4)',
							}}
						>
							<label className="block text-sm font-medium text-(--text)">{t('account.profile.timezone.label')}</label>
							<Selector
								value={formData.timezone}
								options={timezoneOptions}
								onChange={(val: string) => handleChange('timezone', val)}
								placeholder={t('account.profile.timezone.placeholder')}
							/>
						</div>
					</div>

					{/* Group 2: Gender & Pronouns */}
					<div
						className="grid grid-cols-1 md:grid-cols-2"
						style={{
							gap: 'var(--ui-gap)',
						}}
					>
						<div
							className="flex flex-col"
							style={{
								gap: 'calc(var(--ui-gap) * 0.4)',
							}}
						>
							<label className="block text-sm font-medium text-(--text)">{t('account.profile.gender.label')}</label>
							<Selector
								value={formData.gender}
								onChange={(val: string) => handleChange('gender', val)}
								options={[
									{
										label: t('account.profile.gender.male'),
										value: 'male',
									},
									{
										label: t('account.profile.gender.female'),
										value: 'female',
									},
									{
										label: t('account.profile.gender.other'),
										value: 'other',
									},
								]}
							/>
						</div>
						<div
							className="flex flex-col"
							style={{
								gap: 'calc(var(--ui-gap) * 0.4)',
							}}
						>
							<label className="block text-sm font-medium text-(--text)">{t('account.profile.pronouns.label')}</label>
							<Input type="text" value={formData.pronouns} onChange={(e) => handleChange('pronouns', e.target.value)} placeholder={t('account.profile.pronouns.placeholder')} />
						</div>
					</div>
				</div>

				{/* Profile Showcase Slots & Vanity Badges */}
				{userId && <ProfileShowcases user={user} userId={userId} mutate={mutate} />}
			</div>
		</div>
	);
}
