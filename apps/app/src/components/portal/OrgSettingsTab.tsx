/** @format */
'use client';

import { Shield, AlertTriangle, Trash2 } from 'lucide-react';
import { Selector } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import WidgetSettingsCard from '@/components/WidgetSettingsCard';

interface OrgSettingsTabProps {
	orgConfig: any;
	setOrgConfig: (config: any) => void;
	setIsConfirmDeleteOpen: (val: boolean) => void;
}

export default function OrgSettingsTab({ orgConfig, setOrgConfig, setIsConfirmDeleteOpen }: OrgSettingsTabProps) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col" style={{ gap: 'var(--ui-gap)' }}>
			<div
				className="relative z-40 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Shield size={18} />
						<h3>{t('app.portal.settings.privacySetting')}</h3>
					</div>
					<div className="flex items-center gap-1 text-xs text-(--text-muted)">{t('app.portal.settings.privacyDesc')}</div>
				</div>
				<div className="w-full sm:w-48 shrink-0">
					<Selector
						value={orgConfig.privacy || 'private'}
						onChange={(val) => setOrgConfig({ ...orgConfig, privacy: val })}
						options={[
							{ label: t('app.portal.settings.public'), value: 'public' },
							{ label: t('app.portal.settings.limited'), value: 'limited' },
							{ label: t('app.portal.settings.private'), value: 'private' },
						]}
					/>
				</div>
			</div>

			{/* Public Embed Widget Card */}
			<WidgetSettingsCard
				entityType="organizations"
				entityId={orgConfig._id}
				entityName={orgConfig.name}
				enabled={Boolean(orgConfig.widgets)}
				onChange={(val) => setOrgConfig({ ...orgConfig, widgets: val })}
			/>

			{/* Reset Data Card */}
			<div
				className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-orange)/20 bg-(--accent-orange)/5 shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--accent-orange) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<AlertTriangle size={18} />
						<h3>{t('app.portal.settings.resetData')}</h3>
					</div>
					<p className="text-xs text-(--accent-orange)/80">{t('app.portal.settings.resetDesc')}</p>
				</div>
				<button
					onClick={() => setOrgConfig({ ...orgConfig, description: '', info: '', locale: '', links: {}, widgets: false })}
					className="flex items-center justify-center rounded-xl bg-(--accent-orange) text-sm font-medium text-white transition-colors hover:bg-(--accent-orange)/80 shrink-0 shadow-sm"
					style={{
						padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<Trash2 size={16} />
					<span>{t('app.portal.settings.resetData')}</span>
				</button>
			</div>

			{/* Delete Organization Card */}
			<div
				className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--accent-red)/20 bg-(--accent-red)/5 shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--accent-red) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<AlertTriangle size={18} />
						<h3>{t('app.portal.settings.deleteOrg')}</h3>
					</div>
					<p className="text-xs text-(--accent-red)/80">{t('app.portal.settings.deleteDesc')}</p>
				</div>
				<button
					onClick={() => setIsConfirmDeleteOpen(true)}
					className="flex items-center justify-center rounded-xl bg-(--accent-red) text-sm font-medium text-white transition-colors hover:bg-(--accent-red)/80 shrink-0 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
					style={{
						padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
						gap: 'calc(var(--ui-gap) * 0.5)',
					}}
				>
					<Trash2 size={16} />
					<span>{t('app.portal.settings.deleteOrg')}</span>
				</button>
			</div>
		</div>
	);
}
