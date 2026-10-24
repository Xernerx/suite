/** @format */
'use client';

import { useDictionary } from '@xernerx/providers';
import { Markdown } from '@xernerx/ui';

export default function Profile({ bot }: { bot: any }) {
	const { t } = useDictionary();

	return (
		<div className="bg-(--foreground)/30 backdrop-blur-md p-8 rounded-3xl border border-(--border)/10">
			<Markdown emptyText={<div className="text-center text-(--text-muted) py-12 not-italic">{t('app.bots.id.text7')}</div>}>{bot.info}</Markdown>
		</div>
	);
}
