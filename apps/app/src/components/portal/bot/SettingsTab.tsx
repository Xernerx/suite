/** @format */
'use client';

import { Shield, Building2, AlertTriangle, Trash2 } from 'lucide-react';
import { Selector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import WidgetSettingsCard from '@/components/WidgetSettingsCard';

interface SettingsTabProps {
	botConfig: any;
	setBotConfig: (config: any) => void;
	organizations: any[];
	onDeleteClick: () => void;
}

export default function SettingsTab({ botConfig, setBotConfig, organizations, onDeleteClick }: SettingsTabProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			{/* Privacy Setting Card */}
			<div
				className="relative z-40 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Shield size={18} />
						<h3>{t('app.portal.bot.settings.privacyHeader')}</h3>
					</div>
					<div className="flex items-center gap-1 text-xs text-(--text-muted)">{t('app.portal.bot.settings.privacyDesc')}</div>
				</div>
				<div className="w-full sm:w-48 shrink-0">
					<Selector
						value={botConfig.privacy || 'private'}
						onChange={(val) => setBotConfig({ ...botConfig, privacy: val })}
						options={[
							{ label: t('app.portal.bot.settings.public'), value: 'public' },
							{ label: t('app.portal.bot.settings.private'), value: 'private' },
							{ label: t('app.portal.bot.settings.limited'), value: 'limited' },
						]}
					/>
				</div>
			</div>

			{/* Public Embed Widget Card */}
			<WidgetSettingsCard
				entityType="bots"
				entityId={botConfig.id}
				entityName={botConfig.name}
				enabled={Boolean(botConfig.widgets)}
				onChange={(val) => setBotConfig({ ...botConfig, widgets: val })}
			/>

			{/* Transfer Organization Card */}
			<div
				className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--accent-orange) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Building2 size={18} />
						<h3>{t('app.portal.bot.settings.transferHeader')}</h3>
					</div>
					<p className="text-xs text-(--accent-orange)/80">{t('app.portal.bot.settings.transferDesc')}</p>
				</div>
				<div className="w-full sm:w-64 shrink-0">
					<Selector
						value={botConfig.organization || ''}
						onChange={(val) => setBotConfig({ ...botConfig, organization: val })}
						options={[
							{ label: t('app.portal.bot.settings.noOrg'), value: '' },
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
				className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--accent-orange) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<AlertTriangle size={18} />
						<h3>{t('app.portal.bot.settings.resetHeader')}</h3>
					</div>
					<p className="text-xs text-(--accent-orange)/80">{t('app.portal.bot.settings.resetDesc')}</p>
				</div>
				<button
					onClick={() => setBotConfig({ ...botConfig, description: '', info: '', links: {}, widgets: false })}
					className="flex items-center justify-center rounded-xl bg-(--accent-orange) text-sm font-medium text-white transition-colors hover:bg-(--accent-orange)/80 shrink-0 shadow-sm"
					style={{
						padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<Trash2 size={16} />
					<span>{t('app.portal.bot.settings.resetBtn')}</span>
				</button>
			</div>

			{/* Delete Application Card */}
			<div
				className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-red)/20 bg-(--accent-red)/5 shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--accent-red) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<AlertTriangle size={18} />
						<h3>{t('app.portal.bot.settings.deleteHeader')}</h3>
					</div>
					<p className="text-xs text-(--accent-red)/80">{t('app.portal.bot.settings.deleteDesc')}</p>
				</div>
				<button
					onClick={onDeleteClick}
					className="flex items-center justify-center rounded-xl bg-(--accent-red) text-sm font-medium text-white transition-colors hover:bg-(--accent-red)/80 shrink-0 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
					style={{
						padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<Trash2 size={16} />
					<span>{t('app.portal.bot.settings.deleteBtn')}</span>
				</button>
			</div>
		</div>
	);
}
