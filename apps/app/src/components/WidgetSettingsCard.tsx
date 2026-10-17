/** @format */
'use client';

import { useState } from 'react';
import { Code2, AlertCircle } from 'lucide-react';
import { Toggle, Modal, CodeBlock } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';

interface WidgetSettingsCardProps {
	entityType: 'bots' | 'organizations' | 'guilds';
	entityId: string;
	entityName: string;
	enabled: boolean;
	onChange: (enabled: boolean) => void;
}

export default function WidgetSettingsCard({ entityType, entityId, entityName, enabled, onChange }: WidgetSettingsCardProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [isModalOpen, setIsModalOpen] = useState(false);

	const apiBase = getEnvUrl('https://api.xernerx.com');
	const appBase = getEnvUrl('https://app.xernerx.com');

	const profileRouteMap: Record<WidgetSettingsCardProps['entityType'], string> = {
		bots: `/bots/${entityId}`,
		organizations: `/organization/${entityId}`,
		guilds: `/servers/${entityId}`,
	};

	const baseEndpoint = `${apiBase}/core/${entityType}/${entityId}`;
	const pngUrl = `${baseEndpoint}?type=png`;
	const svgUrl = `${baseEndpoint}?type=svg`;
	const iframeUrl = `${baseEndpoint}?type=iframe`;
	const profileUrl = `${appBase}${profileRouteMap[entityType]}`;
	const safeName = (entityName || 'Xernerx Profile').replace(/"/g, '&quot;');

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
			code: `[![${entityName || 'Xernerx Profile'}](${svgUrl})](${profileUrl})`,
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
		<>
			<div
				className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<div className="flex items-center text-(--text) font-semibold text-base" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<Code2 size={18} />
						<h3>{t('app.widgets.title')}</h3>
					</div>
					<div className="flex items-center gap-1 text-xs text-(--text-muted)">{t('app.widgets.description')}</div>
				</div>

				<div className="flex items-center shrink-0" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<button
						type="button"
						onClick={() => setIsModalOpen(true)}
						className="flex items-center justify-center rounded-xl border border-(--border)/15 bg-(--background)/60 text-xs font-semibold text-(--text) transition-colors hover:border-(--accent)/40 hover:text-(--accent)"
						style={{
							padding: 'calc(var(--ui-gap) * 0.5) calc(var(--ui-gap) * 0.75)',
							gap: 'calc(var(--ui-gap) * 0.35)',
						}}
					>
						<Code2 size={15} />
						<span>{t('app.widgets.embedButton')}</span>
					</button>
					<Toggle checked={Boolean(enabled)} onChange={(e) => onChange(e.target.checked)} />
				</div>
			</div>

			<Modal open={isModalOpen} onOpenChange={setIsModalOpen} title={t('app.widgets.modalTitle')} description={t('app.widgets.modalDescription')} maxWidth="max-w-4xl">
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

					<CodeBlock tabs={tabs} />
				</div>
			</Modal>
		</>
	);
}
