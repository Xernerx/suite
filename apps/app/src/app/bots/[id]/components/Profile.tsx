'use client';

import { useDictionary } from '@xernerx/providers';
import ReactMarkdown from 'react-markdown';

export default function Profile({ bot }: { bot: any }) {
	const { t } = useDictionary();

	return (
		<div className="prose prose-invert max-w-none prose-headings:font-fredoka prose-a:text-(--accent) bg-(--foreground)/30 p-8 rounded-3xl border border-(--border)/10">
			{bot.info ? <ReactMarkdown>{bot.info}</ReactMarkdown> : <div className="text-center text-(--text-muted) py-12">{t('app.bots.id.text7')}</div>}
		</div>
	);
}
