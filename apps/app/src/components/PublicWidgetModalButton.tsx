/** @format */
'use client';

import { useState } from 'react';
import { Code2 } from 'lucide-react';
import { Button, Modal, CodeBlock } from '@xernerx/ui';
import { useDictionary, useEnvironment } from '@xernerx/providers';

interface PublicWidgetModalButtonProps {
	entityType: 'bots' | 'organizations' | 'guilds' | 'users';
	entityId: string;
	entityName: string;
}

export default function PublicWidgetModalButton({ entityType, entityId, entityName }: PublicWidgetModalButtonProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const [isOpen, setIsOpen] = useState(false);

	const apiBase = getEnvUrl('https://api.xernerx.com');
	const appBase = getEnvUrl('https://app.xernerx.com');

	const profileRouteMap: Record<PublicWidgetModalButtonProps['entityType'], string> = {
		bots: `/bots/${entityId}`,
		organizations: `/organization/${entityId}`,
		guilds: `/servers/${entityId}`,
		users: `/users/${entityId}`,
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
			<Button variant="secondary" onClick={() => setIsOpen(true)} title={t('app.widgets.embedButton')} className="px-3.5 justify-center border border-(--border)/10 hover:border-(--accent)/50">
				<Code2 className="w-4 h-4" />
			</Button>

			<Modal open={isOpen} onOpenChange={setIsOpen} title={t('app.widgets.modalTitle')} description={t('app.widgets.modalDescription')} maxWidth="max-w-4xl">
				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-(--border)/10 bg-(--background)/50 overflow-x-auto">
						<img src={svgUrl} alt={entityName || 'Widget Preview'} className="max-w-full h-auto rounded-2xl" />
					</div>
					<CodeBlock tabs={tabs} />
				</div>
			</Modal>
		</>
	);
}
