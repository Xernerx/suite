/** @format */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AlertCircle, Award, Code2 } from 'lucide-react';
import { CodeBlock, Modal, Tabs, Toggle } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';

export interface WidgetSettingsCardProps {
	entityType: 'users' | 'bots' | 'organizations' | 'guilds';
	entityId: string;
	entityName: string;
	enabled: boolean;
	onChange: (enabled: boolean) => void;
}

const BADGE_TYPES_BY_ENTITY: Record<WidgetSettingsCardProps['entityType'], string[]> = {
	users: ['streak', 'bots', 'orgs', 'status'],
	bots: ['votes', 'servers', 'users', 'status'],
	organizations: ['members', 'bots', 'servers', 'status'],
	guilds: ['votes', 'members', 'messages', 'status'],
};

const PROFILE_ROUTE_MAP: Record<WidgetSettingsCardProps['entityType'], (id: string) => string> = {
	users: (id) => `/users/${id}`,
	bots: (id) => `/bots/${id}`,
	organizations: (id) => `/organization/${id}`,
	guilds: (id) => `/servers/${id}`,
};

export function WidgetSettingsCard({ entityType, entityId, entityName, enabled, onChange }: WidgetSettingsCardProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
	const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);

	const badgeTypes = BADGE_TYPES_BY_ENTITY[entityType];
	const [activeBadgeType, setActiveBadgeType] = useState<string>(badgeTypes[0]);
	const [widgetTheme, setWidgetTheme] = useState<'dark' | 'light'>('dark');
	const [badgeTheme, setBadgeTheme] = useState<'dark' | 'light'>('dark');
	const [badgeStyle, setBadgeStyle] = useState<'rounded' | 'pill' | 'flat'>('rounded');

	const apiBase = getEnvUrl('https://api.xernerx.com').replace(/\/$/, '');
	const appBase = getEnvUrl('https://app.xernerx.com').replace(/\/$/, '');

	const baseEndpoint = `${apiBase}/core/${entityType}/${entityId}`;
	const themeQuery = widgetTheme === 'light' ? '&theme=light' : '';
	const pngUrl = `${baseEndpoint}?type=png${themeQuery}`;
	const svgUrl = `${baseEndpoint}?type=svg${themeQuery}`;
	const iframeUrl = `${baseEndpoint}?type=iframe${themeQuery}`;
	const profileUrl = `${appBase}${PROFILE_ROUTE_MAP[entityType](entityId)}`;
	const safeName = (entityName || t('app.widgets.title')).replace(/"/g, '&quot;');

	const tabs = [
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
			code: `[![${entityName || t('app.widgets.title')}](${svgUrl})](${profileUrl})`,
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

	const badgeParams = new URLSearchParams({ type: activeBadgeType });
	if (badgeTheme === 'light') badgeParams.set('theme', 'light');
	if (badgeStyle !== 'rounded') badgeParams.set('style', badgeStyle);
	const activeBadgeUrl = `${apiBase}/v1/${entityType}/${entityId}/badge.svg?${badgeParams.toString()}`;

	const badgeTabs = [
		{
			id: 'markdown',
			label: t('app.widgets.formatMarkdown'),
			language: 'markdown',
			code: `[![Xernerx ${activeBadgeType}](${activeBadgeUrl})](${profileUrl})`,
		},
		{
			id: 'html',
			label: t('app.widgets.formatHtmlImg'),
			language: 'html',
			code: `<a href="${profileUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${activeBadgeUrl}" alt="Xernerx ${activeBadgeType}" />\n</a>`,
		},
		{
			id: 'svg',
			label: t('app.widgets.formatDirectSvg'),
			language: 'url',
			code: activeBadgeUrl,
		},
	];

	const themeTabs = [
		{ id: 'dark', label: t('app.widgets.customizer.themeDark') },
		{ id: 'light', label: t('app.widgets.customizer.themeLight') },
	];

	const styleTabs = [
		{ id: 'rounded', label: t('app.widgets.customizer.styleRounded') },
		{ id: 'pill', label: t('app.widgets.customizer.stylePill') },
		{ id: 'flat', label: t('app.widgets.customizer.styleFlat') },
	];

	return (
		<>
			{/* Public Embed Widget Card */}
			<div
				className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Code2 size={18} className="text-(--accent)" />
						<h3>{t('app.widgets.title')}</h3>
					</div>
					<div className="flex items-center gap-1 text-xs text-(--text-muted)">{t('app.widgets.description')}</div>
				</div>

				<div className="flex items-center shrink-0" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<button
						type="button"
						onClick={() => setIsWidgetModalOpen(true)}
						className="flex items-center justify-center rounded-2xl border border-(--border)/15 bg-(--background)/60 text-xs font-semibold text-(--text) transition-all hover:border-(--accent)/40 hover:bg-(--accent)/10 hover:text-(--accent) cursor-pointer"
						style={{
							padding: 'calc(var(--ui-gap) * 0.5) calc(var(--ui-gap) * 0.85)',
							gap: 'calc(var(--ui-gap) * 0.35)',
						}}
					>
						<Code2 size={15} />
						<span>{t('app.widgets.embedButton')}</span>
					</button>
					<Toggle checked={Boolean(enabled)} onChange={(e) => onChange(e.target.checked)} />
				</div>
			</div>

			{/* Live SVG Badges Card */}
			<div
				className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Award size={18} className="text-(--accent)" />
						<h3>{t('app.widgets.badgesTitle')}</h3>
					</div>
					<div className="flex items-center gap-1 text-xs text-(--text-muted)">{t('app.widgets.badgesDescription')}</div>
				</div>

				<div className="flex items-center shrink-0" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<button
						type="button"
						onClick={() => setIsBadgesModalOpen(true)}
						className="flex items-center justify-center rounded-2xl border border-(--border)/15 bg-(--background)/60 text-xs font-semibold text-(--text) transition-all hover:border-(--accent)/40 hover:bg-(--accent)/10 hover:text-(--accent) cursor-pointer"
						style={{
							padding: 'calc(var(--ui-gap) * 0.5) calc(var(--ui-gap) * 0.85)',
							gap: 'calc(var(--ui-gap) * 0.35)',
						}}
					>
						<Award size={15} />
						<span>{t('app.widgets.badgesButton')}</span>
					</button>
				</div>
			</div>

			{/* Widgets Modal (Customizer + Preview above CodeBlock) */}
			<Modal open={isWidgetModalOpen} onOpenChange={setIsWidgetModalOpen} title={t('app.widgets.modalTitle')} description={t('app.widgets.modalDescription')} maxWidth="max-w-4xl">
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					{!enabled && (
						<div
							className="flex items-start rounded-2xl border border-(--accent-orange)/30 bg-(--accent-orange)/10 text-xs text-(--accent-orange)"
							style={{ padding: 'calc(var(--ui-gap) * 0.65)', gap: 'calc(var(--ui-gap) * 0.5)' }}
						>
							<AlertCircle size={16} className="shrink-0 mt-0.5" />
							<span>{t('app.widgets.disabledWarning')}</span>
						</div>
					)}

					<div className="flex flex-wrap items-center justify-between gap-3">
						<span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">{t('app.widgets.customizer.themeLabel')}</span>
						<Tabs size="sm" fullWidth={false} tabs={themeTabs} activeTab={widgetTheme} onChange={(id) => setWidgetTheme(id as 'dark' | 'light')} />
					</div>

					<CodeBlock
						preview={<Image src={svgUrl} alt={entityName || t('app.widgets.previewTitle')} width={400} height={140} unoptimized className="max-w-full h-auto rounded-2xl shadow-sm" />}
						tabs={tabs}
					/>
				</div>
			</Modal>

			{/* Badges Modal (Customizer + Preview above CodeBlock) */}
			<Modal open={isBadgesModalOpen} onOpenChange={setIsBadgesModalOpen} title={t('app.widgets.badgesModalTitle')} description={t('app.widgets.badgesModalDescription')} maxWidth="max-w-3xl">
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<Tabs
							size="sm"
							fullWidth={false}
							tabs={badgeTypes.map((bt) => ({ id: bt, label: t(`app.widgets.badgeTypes.${bt}`) }))}
							activeTab={activeBadgeType}
							onChange={setActiveBadgeType}
						/>
						<div className="flex flex-wrap items-center gap-2">
							<Tabs size="sm" fullWidth={false} tabs={themeTabs} activeTab={badgeTheme} onChange={(id) => setBadgeTheme(id as 'dark' | 'light')} />
							<Tabs size="sm" fullWidth={false} tabs={styleTabs} onChange={(id) => setBadgeStyle(id as 'rounded' | 'pill' | 'flat')} activeTab={badgeStyle} />
						</div>
					</div>

					<CodeBlock preview={<Image src={activeBadgeUrl} alt={`Xernerx ${activeBadgeType}`} width={140} height={28} unoptimized className="h-7 w-auto" />} tabs={badgeTabs} />
				</div>
			</Modal>
		</>
	);
}
