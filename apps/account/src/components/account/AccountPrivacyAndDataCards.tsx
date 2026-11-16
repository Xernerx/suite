/** @format */
'use client';

import { Bot, Download, Info, Settings } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Button, Selector, Toggle } from '@xernerx/ui';
import { WidgetSettingsCard } from '@xernerx/components';

interface AccountPrivacyAndDataCardsProps {
	userId?: string;
	displayName: string;
	isBlacklisted: boolean;
	privacy: string;
	handlePrivacyChange: (val: string) => void;
	servicesEnabled: boolean;
	handleServicesChange: (enabled: boolean) => void;
	widgets: boolean;
	handleWidgetsChange: (enabled: boolean) => void;
	isExportingData: boolean;
	handleExportData: () => void;
}

export function AccountPrivacyAndDataCards({
	userId,
	displayName,
	isBlacklisted,
	privacy,
	handlePrivacyChange,
	servicesEnabled,
	handleServicesChange,
	widgets,
	handleWidgetsChange,
	isExportingData,
	handleExportData,
}: AccountPrivacyAndDataCardsProps) {
	const { t } = useDictionary();

	return (
		<>
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

			{/* Automatic Service Profiles Card */}
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
						<Bot size={18} className="text-(--accent)" />
						<h3>{t('account.account.services.title')}</h3>
					</div>
					<p className="text-xs text-(--text-muted)">{t('account.account.services.description')}</p>
				</div>
				<div className="flex items-center shrink-0">
					<Toggle checked={servicesEnabled} onChange={(e) => handleServicesChange(e.target.checked)} />
				</div>
			</div>

			{userId && !isBlacklisted && <WidgetSettingsCard entityType="users" entityId={userId} entityName={displayName} enabled={Boolean(widgets)} onChange={handleWidgetsChange} />}

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
		</>
	);
}
