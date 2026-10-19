/** @format */
'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, Building2, AlertTriangle, Trash2 } from 'lucide-react';
import { Confirm, Selector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import WidgetSettingsCard from '@/components/WidgetSettingsCard';

interface SettingsProps {
	guildConfig: any;
	setGuildConfig: (config: any) => void;
	organizations: any[];
	handleDeleteGuild: () => void;
}

export default function Settings({ guildConfig, setGuildConfig, organizations, handleDeleteGuild }: SettingsProps) {
	const { t } = useDictionary();
	const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

	return (
		<>
			{/* Privacy Setting Card */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<SettingsIcon size={18} />
						<h3>{t('app.dashboard.text13')}</h3>
					</div>
					<div className="flex items-center gap-1 text-xs text-(--text-muted)">{t('app.dashboard.text14')}</div>
				</div>
				<div className="w-full sm:w-48 shrink-0">
					<Selector
						value={guildConfig.privacy || 'private'}
						onChange={(val: string) => setGuildConfig({ ...guildConfig, privacy: val })}
						options={[
							{ label: t('app.dashboard.settings.public'), value: 'public' },
							{ label: t('app.dashboard.settings.limited'), value: 'limited' },
							{ label: t('app.dashboard.settings.private'), value: 'private' },
						]}
					/>
				</div>
			</div>

			{/* Public Embed Widget Card */}
			<WidgetSettingsCard
				entityType="guilds"
				entityId={guildConfig.id}
				entityName={guildConfig.name}
				enabled={Boolean(guildConfig.widgets)}
				onChange={(val) => setGuildConfig({ ...guildConfig, widgets: val })}
			/>

			{/* Transfer Organization Card */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--accent-orange) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Building2 size={18} />
						<h3>{t('app.dashboard.settings.transferTitle')}</h3>
					</div>
					<p className="text-xs text-(--accent-orange)/80">{t('app.dashboard.settings.transferDescription')}</p>
				</div>
				<div className="w-full sm:w-64 shrink-0">
					<Selector
						value={guildConfig.organization || ''}
						onChange={(val: string) => setGuildConfig({ ...guildConfig, organization: val })}
						options={[
							{ label: t('app.dashboard.settings.personalOrg'), value: '' },
							...organizations.map((org) => ({
								label: org.name,
								value: org._id,
							})),
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
						<h3>{t('app.dashboard.text15')}</h3>
					</div>
					<p className="text-xs text-(--accent-orange)/80">{t('app.dashboard.text16')}</p>
				</div>
				<button
					type="button"
					onClick={() => setIsResetConfirmOpen(true)}
					className="flex items-center justify-center rounded-xl bg-(--accent-orange) text-sm font-medium text-white transition-colors hover:bg-(--accent-orange)/80 shrink-0 shadow-sm"
					style={{
						padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<Trash2 size={16} />
					<span>{t('app.dashboard.text17')}</span>
				</button>
			</div>

			{/* Delete Server Data Card */}
			<div
				className="flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-red)/20 bg-(--accent-red)/5 shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--accent-red) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<AlertTriangle size={18} />
						<h3>{t('app.dashboard.text18')}</h3>
					</div>
					<p className="text-xs text-(--accent-red)/80">{t('app.dashboard.text19')}</p>
				</div>
				<button
					type="button"
					onClick={handleDeleteGuild}
					className="flex items-center justify-center rounded-xl bg-(--accent-red) text-sm font-medium text-white transition-colors hover:bg-(--accent-red)/80 shrink-0 shadow-sm"
					style={{
						padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<Trash2 size={16} />
					<span>{t('app.dashboard.text20')}</span>
				</button>
			</div>

			<Confirm
				open={isResetConfirmOpen}
				onOpenChange={setIsResetConfirmOpen}
				title={t('app.dashboard.settings.resetConfirmTitle')}
				description={t('app.dashboard.settings.resetConfirmDesc')}
				confirmText={t('app.dashboard.text17')}
				cancelText={t('common.buttons.cancel')}
				variant="warning"
				confirmKeyword="RESET"
				onConfirm={() => {
					setGuildConfig({ ...guildConfig, description: '', info: '', locale: '', links: {}, widgets: false });
					setIsResetConfirmOpen(false);
				}}
			/>
		</>
	);
}
