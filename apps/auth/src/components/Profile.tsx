/** @format */
'use client';

import { Button, Divider, Selector } from '@xernerx/ui';
import { Info, User as UserIcon } from 'lucide-react';
import { useDictionary, useEnvironment, useSession, useToast, useUser } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import Image from 'next/image';
import { timezones } from '@xernerx/lib';

export default function Profile() {
	const { data: session } = useSession();
	const { user, mutate } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();

	const activeUser = user || session?.user;
	const userId = activeUser?.id;
	const avatarUrl = activeUser?.image || (userId && activeUser?.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${activeUser.avatar}.png` : null);

	const [formData, setFormData] = useState({
		description: '',
		info: '',
		birthday: '',
		gender: 'other',
		pronouns: '',
		timezone: '',
		privacy: 'private',
	});

	const [initialData, setInitialData] = useState({
		description: '',
		info: '',
		birthday: '',
		gender: 'other',
		pronouns: '',
		timezone: '',
		privacy: 'private',
	});

	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		(() => {
			if (user) {
				const loadedData = {
					description: user.description || '',
					info: user.info || '',
					birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
					gender: user.gender || 'other',
					pronouns: user.pronouns || '',
					timezone: user.timezone || '',
					privacy: user.privacy || 'private',
				};
				setFormData(loadedData);
				setInitialData(loadedData);
			}
		})();
	}, [user]);

	const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

	const handleChange = (field: string, value: unknown) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSave = async () => {
		if (!userId || !isDirty) return;
		setIsSaving(true);

		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(formData),
			});

			if (!res.ok) throw new Error('Failed to update profile');

			if (mutate) mutate();
			setInitialData(formData);
			toast({
				title: t('auth.profile.toast.success'),
				type: 'success',
			});
		} catch (error) {
			toast({
				title: t('auth.profile.toast.error'),
				type: 'error',
			});
		} finally {
			setIsSaving(false);
		}
	};

	const tzList = Array.isArray(timezones)
		? timezones
		: [
				{ value: 'UTC', label: 'UTC', offset: '+00:00', region: 'UTC' },
				{ value: 'Europe/Brussels', label: 'Brussels', offset: '+02:00', region: 'Europe' },
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
			className="flex flex-col max-w-4xl mx-auto w-full"
			style={{
				padding: 'var(--ui-gap)',
				gap: 'var(--ui-gap)',
				fontSize: 'var(--text-scale, 14px)',
			}}
		>
			{/* Header */}
			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				<h1 className="text-3xl font-black tracking-tight text-(--text)">{t('auth.profile.title')}</h1>
				<p className="text-sm text-(--text-muted)">{t('auth.profile.description')}</p>
			</div>

			<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
				{/* Profile Summary Card */}
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

				{/* Form Inputs Card */}
				<div className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
					{/* Description */}
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
						<label className="block text-sm font-medium text-(--text)">{t('auth.profile.descriptionField.label')}</label>
						<input
							type="text"
							value={formData.description}
							onChange={(e) => handleChange('description', e.target.value)}
							placeholder={t('auth.profile.descriptionField.placeholder')}
							className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
							style={{ padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)' }}
						/>
					</div>

					{/* Info (Long Description) */}
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
						<label className="block text-sm font-medium text-(--text)">{t('auth.profile.infoField.label')}</label>
						<textarea
							rows={4}
							value={formData.info}
							onChange={(e) => handleChange('info', e.target.value)}
							placeholder={t('auth.profile.infoField.placeholder')}
							className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
							style={{ padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)' }}
						/>
					</div>

					{/* Group 1: Birthday & Timezone */}
					<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
						<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
							<label className="block text-sm font-medium text-(--text)">{t('auth.profile.birthday.label')}</label>
							<input
								type="date"
								value={formData.birthday}
								onChange={(e) => handleChange('birthday', e.target.value)}
								className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
								style={{ padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)' }}
							/>
						</div>
						<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
							<label className="block text-sm font-medium text-(--text)">{t('auth.profile.timezone.label')}</label>
							<Selector
								value={formData.timezone}
								options={timezoneOptions}
								onChange={(val: string) => handleChange('timezone', val)}
								placeholder={t('auth.profile.timezone.placeholder')}
							/>
						</div>
					</div>

					{/* Group 2: Gender & Pronouns */}
					<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
						<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
							<label className="block text-sm font-medium text-(--text)">{t('auth.profile.gender.label')}</label>
							<Selector
								value={formData.gender}
								onChange={(val: string) => handleChange('gender', val)}
								options={[
									{
										label: t('auth.profile.gender.male'),
										value: 'male',
									},
									{
										label: t('auth.profile.gender.female'),
										value: 'female',
									},
									{
										label: t('auth.profile.gender.other'),
										value: 'other',
									},
								]}
							/>
						</div>
						<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
							<label className="block text-sm font-medium text-(--text)">{t('auth.profile.pronouns.label')}</label>
							<input
								type="text"
								value={formData.pronouns}
								onChange={(e) => handleChange('pronouns', e.target.value)}
								placeholder={t('auth.profile.pronouns.placeholder')}
								className="w-full rounded-2xl border border-(--border)/10 bg-(--background) text-sm text-(--text) focus:outline-none focus:ring-2 focus:ring-(--accent)"
								style={{ padding: 'calc(var(--ui-gap) * 0.6) var(--ui-gap)' }}
							/>
						</div>
					</div>

					{/* Privacy Level with Info Tooltip */}
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
						<div className="flex items-center" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
							<label className="block text-sm font-medium text-(--text)">{t('auth.profile.privacy.label')}</label>
							<div className="group relative flex items-center">
								<Info size={16} className="text-(--text-muted) cursor-pointer hover:text-(--text)" />
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
						<Selector
							value={formData.privacy}
							onChange={(val: string) => handleChange('privacy', val)}
							options={[
								{
									label: t('auth.profile.privacy.public'),
									value: 'public',
								},
								{
									label: t('auth.profile.privacy.limited'),
									value: 'limited',
								},
								{
									label: t('auth.profile.privacy.private'),
									value: 'private',
								},
							]}
						/>
					</div>

					<Divider />

					{/* Save Action */}
					<div className="flex justify-end">
						<Button onClick={handleSave} disabled={!isDirty || isSaving}>
							{isSaving ? t('auth.profile.saving') : t('auth.profile.save')}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
