/** @format */
'use client';

import { Button, Divider, Input, Selector } from '@xernerx/ui';
import { Info, User as UserIcon } from 'lucide-react';
import { useDictionary, useEnvironment, useSession, useToast, useUser } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { timezones } from '@xernerx/lib';
export default function Profile() {
	const { t } = useDictionary();
	const { data: session } = useSession();
	const { user, mutate } = useUser();
	const { getEnvUrl } = useEnvironment();
	const { toast, remind } = useToast();
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
	});
	const [initialData, setInitialData] = useState({
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
					if (!res.ok) throw new Error('Failed to update profile');
					if (mutate) mutate();
					setInitialData(formData);
					toast({
						title: t('account.profile.toast.success'),
						type: 'success',
					});
					remind(false);
				} catch (error) {
					toast({
						title: t('account.profile.toast.error'),
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
					className="flex items-center rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{
						padding: 'var(--ui-gap)',
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
							<span className="text-xs text-(--text-muted)/60 font-mono">
								{t('account.common.description', {
									userId,
								})}
							</span>
						)}
					</div>
				</div>

				{/* Form Inputs Card */}
				<div
					className="flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{
						padding: 'var(--ui-gap)',
						gap: 'var(--ui-gap)',
					}}
				>
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
					<div
						className="flex flex-col"
						style={{
							gap: 'calc(var(--ui-gap) * 0.4)',
						}}
					>
						<label className="block text-sm font-medium text-(--text)">{t('account.profile.infoField.label')}</label>
						<Input variant="textarea" rows={4} value={formData.info} onChange={(e) => handleChange('info', e.target.value)} placeholder={t('account.profile.infoField.placeholder')} />
					</div>

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
			</div>
		</div>
	);
}
