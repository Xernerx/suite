/** @format */
'use client';

import React, { useMemo } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { timezones } from '@xernerx/lib';
import { Input, Markdown, MultiSelector, Selector, Toggle } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import type { Role, UserPersona } from './types';

interface UserIdentityTabProps {
	name: string;
	setName: (val: string) => void;
	icon: string;
	setIcon: (val: string) => void;
	email: string;
	setEmail: (val: string) => void;
	stripeCustomerId: string;
	setStripeCustomerId: (val: string) => void;
	selectedRoleIds: string[];
	setSelectedRoleIds: (val: string[]) => void;
	roles: Role[];
	privacy: string;
	setPrivacy: (val: string) => void;
	persona: UserPersona;
	setPersona: (val: UserPersona) => void;
	tourCompleted: boolean;
	setTourCompleted: (val: boolean) => void;
	verified: boolean;
	setVerified: (val: boolean) => void;
	vanityUnlocked: boolean;
	setVanityUnlocked: (val: boolean) => void;
	vanitySlug: string;
	setVanitySlug: (val: string) => void;
	widgets: boolean;
	setWidgets: (val: boolean) => void;
	blacklisted: boolean;
	setBlacklisted: (val: boolean) => void;
	shadowban: boolean;
	setShadowban: (val: boolean) => void;
	services: boolean;
	setServices: (val: boolean) => void;
	staffSubscription: boolean;
	subLoading: boolean;
	onStaffSubscriptionToggle: (checked: boolean) => void;
	pronouns: string;
	setPronouns: (val: string) => void;
	gender: string;
	setGender: (val: string) => void;
	birthday: string;
	setBirthday: (val: string) => void;
	timezone: string;
	setTimezone: (val: string) => void;
	description: string;
	setDescription: (val: string) => void;
	info: string;
	setInfo: (val: string) => void;
}

export function UserIdentityTab({
	name,
	setName,
	icon,
	setIcon,
	email,
	setEmail,
	stripeCustomerId,
	setStripeCustomerId,
	selectedRoleIds,
	setSelectedRoleIds,
	roles,
	privacy,
	setPrivacy,
	persona,
	setPersona,
	tourCompleted,
	setTourCompleted,
	verified,
	setVerified,
	vanityUnlocked,
	setVanityUnlocked,
	vanitySlug,
	setVanitySlug,
	widgets,
	setWidgets,
	blacklisted,
	setBlacklisted,
	shadowban,
	setShadowban,
	services,
	setServices,
	staffSubscription,
	subLoading,
	onStaffSubscriptionToggle,
	pronouns,
	setPronouns,
	gender,
	setGender,
	birthday,
	setBirthday,
	timezone,
	setTimezone,
	description,
	setDescription,
	info,
	setInfo,
}: UserIdentityTabProps) {
	const { t } = useDictionary();

	const existingRoleIdSet = useMemo(() => new Set(roles.map((r) => r.id)), [roles]);
	const missingRoleIds = useMemo(() => selectedRoleIds.filter((rid) => Boolean(rid) && !existingRoleIdSet.has(rid)), [selectedRoleIds, existingRoleIdSet]);
	const roleOptions = useMemo(() => {
		const validOpts = roles.map((r) => ({
			value: r.id,
			label: r.name || t('admin.roles.unnamedRole'),
			color: r.permissions?.color || undefined,
		}));
		const missingOpts = missingRoleIds.map((rid) => ({
			value: rid,
			label: t('admin.users.missingRoles.optionLabel', { id: rid }),
			color: 'var(--accent-red)',
		}));
		return [...missingOpts, ...validOpts];
	}, [roles, missingRoleIds, t]);

	const timezoneOptions = [
		{ label: t('admin.users.fields.genderUnspecified'), value: '' },
		...timezones.map((tz) => ({
			value: tz.value,
			label: (
				<div className="flex items-center justify-between w-full gap-2">
					<span>{tz.label}</span>
					<span className="text-xs text-(--text-muted) font-mono">{tz.offset}</span>
				</div>
			),
		})),
	];

	return (
		<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 1.25)' }}>
			<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.displayNameLabel')}</label>
					<Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
				</div>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.emailLabel')}</label>
					<Input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('admin.users.fields.emailPlaceholder')} />
				</div>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.iconLabel')}</label>
					<Input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder={t('admin.users.fields.iconPlaceholder')} />
				</div>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.stripeCustomerIdLabel')}</label>
					<Input type="text" value={stripeCustomerId} onChange={(e) => setStripeCustomerId(e.target.value)} placeholder={t('admin.users.stripeCustomerPlaceholder')} />
				</div>
			</div>

			<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
				<label className="block text-xs font-medium text-(--text)">{t('admin.users.rolesLabel')}</label>
				<MultiSelector value={selectedRoleIds} onChange={setSelectedRoleIds} options={roleOptions} placeholder={t('admin.users.addRolePlaceholder')} />
				{missingRoleIds.length > 0 && (
					<div className="mt-1.5 flex flex-col gap-2 rounded-2xl border border-(--accent-red)/30 bg-(--accent-red)/10 px-4 py-3">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<div className="flex items-center gap-2 text-xs font-bold text-(--accent-red)">
								<AlertTriangle size={14} className="shrink-0" />
								<span>{t('admin.users.missingRoles.calloutTitle', { count: missingRoleIds.length })}</span>
							</div>
							<button
								type="button"
								onClick={() => setSelectedRoleIds(selectedRoleIds.filter((id) => existingRoleIdSet.has(id)))}
								className="inline-flex items-center gap-1 rounded-full bg-(--accent-red)/15 hover:bg-(--accent-red)/25 border border-(--accent-red)/30 px-2.5 py-1 text-[11px] font-bold text-(--accent-red) transition-colors cursor-pointer"
							>
								<X size={11} />
								<span>{t('admin.users.missingRoles.removeAll')}</span>
							</button>
						</div>
						<p className="text-[11px] text-(--text-muted)">{t('admin.users.missingRoles.calloutDesc')}</p>
						<div className="flex flex-wrap items-center gap-1.5">
							{missingRoleIds.map((rid) => (
								<span
									key={rid}
									className="inline-flex items-center gap-1.5 rounded-full bg-(--background)/70 border border-(--accent-red)/30 pl-2.5 pr-1 py-1 text-xs font-mono text-(--accent-red)"
								>
									<span>{rid}</span>
									<button
										type="button"
										aria-label={t('admin.users.missingRoles.removeOne', { id: rid })}
										onClick={() => setSelectedRoleIds(selectedRoleIds.filter((id) => id !== rid))}
										className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-(--accent-red)/20 transition-colors cursor-pointer"
									>
										<X size={11} />
									</button>
								</span>
							))}
						</div>
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.privacyLevelLabel')}</label>
					<Selector
						value={privacy}
						onChange={(val: string) => setPrivacy(val)}
						options={[
							{ label: t('account.profile.privacy.public'), value: 'public' },
							{ label: t('account.profile.privacy.limited'), value: 'limited' },
							{ label: t('account.profile.privacy.private'), value: 'private' },
						]}
					/>
				</div>

				<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.onboarding.personaFieldLabel')}</label>
					<Selector
						value={persona}
						onChange={(val: string) => setPersona(val as UserPersona)}
						options={[
							{ label: t('admin.users.onboarding.personaUser'), value: 'user' },
							{ label: t('admin.users.onboarding.personaDeveloper'), value: 'developer' },
							{ label: t('admin.users.onboarding.personaBoth'), value: 'both' },
						]}
					/>
				</div>

				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.vanitySlugLabel')}</label>
					<Input
						type="text"
						value={vanitySlug}
						onChange={(e) => setVanitySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
						placeholder={t('admin.users.fields.vanitySlugPlaceholder')}
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex items-center justify-between rounded-2xl border border-(--border)/10 bg-(--background)/50 px-4 py-2.5">
					<div className="flex flex-col">
						<span className="text-xs font-bold text-(--text)">{t('admin.users.fields.verifiedToggle')}</span>
						<span className="text-[10px] text-(--text-muted)">{t('admin.users.fields.verifiedDesc')}</span>
					</div>
					<Toggle
						checked={verified}
						onChange={(e) => {
							setVerified(e.target.checked);
						}}
					/>
				</div>

				<div className="flex items-center justify-between rounded-2xl border border-(--border)/10 bg-(--background)/50 px-4 py-2.5">
					<div className="flex flex-col">
						<span className="text-xs font-bold text-(--text)">{t('admin.users.onboarding.tourToggle')}</span>
						<span className="text-[10px] text-(--text-muted)">{t('admin.users.onboarding.tourToggleDesc')}</span>
					</div>
					<Toggle checked={tourCompleted} onChange={(e) => setTourCompleted(e.target.checked)} />
				</div>

				<div className="flex items-center justify-between rounded-2xl border border-(--border)/10 bg-(--background)/50 px-4 py-2.5">
					<span className="text-xs font-bold text-(--text)">{t('admin.users.fields.vanityUnlockedToggle')}</span>
					<Toggle checked={vanityUnlocked} onChange={(e) => setVanityUnlocked(e.target.checked)} />
				</div>

				<div className="flex items-center justify-between rounded-2xl border border-(--border)/10 bg-(--background)/50 px-4 py-2.5">
					<span className="text-xs font-bold text-(--text)">{t('admin.users.fields.widgetsToggle')}</span>
					<Toggle checked={widgets} onChange={(e) => setWidgets(e.target.checked)} />
				</div>

				<div className={`flex flex-col justify-center rounded-2xl border border-(--accent)/20 bg-(--accent)/5 px-4 py-2.5 ${subLoading ? 'opacity-50 pointer-events-none' : ''}`}>
					<div className="flex items-center justify-between">
						<div className="flex flex-col">
							<span className="text-xs font-bold text-(--accent)">{t('admin.users.staffSubTitle')}</span>
							<span className="text-[10px] text-(--text-muted)">{t('admin.users.staffSubDesc')}</span>
						</div>
						<div className="flex items-center gap-2">
							{subLoading && <Loader2 size={14} className="animate-spin text-(--accent)" />}
							<Toggle checked={staffSubscription} onChange={(e) => onStaffSubscriptionToggle(e.target.checked)} />
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between rounded-2xl border border-(--border)/10 bg-(--background)/50 px-4 py-2.5">
					<div className="flex flex-col pr-2">
						<span className="text-xs font-bold text-(--text)">{t('admin.users.fields.servicesToggle')}</span>
						<span className="text-[10px] text-(--text-muted)">{t('admin.users.fields.servicesDesc')}</span>
					</div>
					<Toggle checked={services} onChange={(e) => setServices(e.target.checked)} />
				</div>

				<div
					className={`flex items-center justify-between rounded-2xl border px-4 py-2.5 transition-colors ${
						shadowban ? 'border-(--accent-orange)/30 bg-(--accent-orange)/10' : 'border-(--border)/10 bg-(--background)/50'
					}`}
				>
					<div className="flex flex-col pr-2">
						<span className={`text-xs font-bold ${shadowban ? 'text-(--accent-orange)' : 'text-(--text)'}`}>{t('admin.users.fields.shadowbanToggle')}</span>
						<span className="text-[10px] text-(--text-muted)">{t('admin.users.fields.shadowbanDesc')}</span>
					</div>
					<Toggle checked={shadowban} onChange={(e) => setShadowban(e.target.checked)} />
				</div>

				<div
					className={`flex items-center justify-between rounded-2xl border px-4 py-2.5 transition-colors ${
						blacklisted ? 'border-(--accent-red)/30 bg-(--accent-red)/10' : 'border-(--border)/10 bg-(--background)/50'
					}`}
				>
					<div className="flex flex-col pr-2">
						<span className={`text-xs font-bold ${blacklisted ? 'text-(--accent-red)' : 'text-(--text)'}`}>{t('admin.users.fields.blacklistedToggle')}</span>
						<span className="text-[10px] text-(--text-muted)">{t('admin.users.fields.blacklistedDesc')}</span>
					</div>
					<Toggle checked={blacklisted} onChange={(e) => setBlacklisted(e.target.checked)} />
				</div>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 overflow-visible" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.pronounsLabel')}</label>
					<Input type="text" value={pronouns} onChange={(e) => setPronouns(e.target.value)} placeholder={t('admin.users.fields.pronounsPlaceholder')} />
				</div>
				<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.genderLabel')}</label>
					<Selector
						value={gender}
						onChange={(val: string) => setGender(val)}
						options={[
							{ label: t('admin.users.fields.genderUnspecified'), value: '' },
							{ label: t('admin.users.fields.genderMale'), value: 'male' },
							{ label: t('admin.users.fields.genderFemale'), value: 'female' },
							{ label: t('admin.users.fields.genderOther'), value: 'other' },
						]}
					/>
				</div>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.birthdayLabel')}</label>
					<Input variant="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
				</div>
				<div className="flex flex-col overflow-visible" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
					<label className="block text-xs font-medium text-(--text)">{t('admin.users.fields.timezoneLabel')}</label>
					<Selector value={timezone} onChange={(val: string) => setTimezone(val)} options={timezoneOptions} placeholder={t('admin.users.fields.timezonePlaceholder')} />
				</div>
			</div>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
				<label className="block text-xs font-medium text-(--text)">{t('admin.users.descriptionLabel')}</label>
				<Input variant="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none" />
			</div>

			<Markdown editable allowAdminMediaPaste label={t('admin.users.fields.infoLabel')} value={info} onChange={setInfo} rows={4} />
		</div>
	);
}
