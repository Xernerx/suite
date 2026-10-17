/** @format */
'use client';

import { Download } from 'lucide-react';
import { Button } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export function MediaFileDownload({ rawUrl, mimeType }: { rawUrl: string; mimeType?: string }) {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col items-center gap-4 text-(--text-muted)">
			<div className="font-mono text-xl">{mimeType || t('cdn.view.unknownFileType')}</div>
			<a href={rawUrl} download>
				<Button variant="primary">
					<Download size={16} /> {t('cdn.view.downloadFile')}
				</Button>
			</a>
		</div>
	);
}
