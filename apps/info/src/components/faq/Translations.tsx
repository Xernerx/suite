/** @format */
'use client';

import { CollapsibleCard } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export default function Translations({ searchQuery = '' }: { searchQuery?: string }) {
	const { t } = useDictionary();
	const q = searchQuery.trim().toLowerCase();

	const cards = [
		{
			id: 'card1',
			title: t('faq.translations.card1.title'),
			searchableText: `${t('faq.translations.card1.title')} ${t('faq.translations.card1.p1')} ${t('faq.translations.card1.p2')}`,
			description: (
				<div className="flex flex-col gap-2">
					<p>{t('faq.translations.card1.p1')}</p>
					<p className="text-xs opacity-80">{t('faq.translations.card1.p2')}</p>
				</div>
			),
		},
		{
			id: 'card2',
			title: t('faq.translations.card2.title'),
			searchableText: `${t('faq.translations.card2.title')} ${t('faq.translations.card2.description')}`,
			description: t('faq.translations.card2.description'),
		},
		{
			id: 'card3',
			title: t('faq.translations.card3.title'),
			searchableText: `${t('faq.translations.card3.title')} ${t('faq.translations.card3.description')}`,
			description: t('faq.translations.card3.description'),
		},
		{
			id: 'card4',
			title: t('faq.translations.card4.title'),
			searchableText: `${t('faq.translations.card4.title')} ${t('faq.translations.card4.description')}`,
			description: t('faq.translations.card4.description'),
		},
	].filter((c) => !q || c.searchableText.toLowerCase().includes(q) || t('faq.translations.title').toLowerCase().includes(q));

	if (cards.length === 0) return null;

	return (
		<div className="flex flex-col max-w-3xl mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{t('faq.translations.title')}
			</h1>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				{cards.map((card) => (
					<CollapsibleCard key={card.id} message={card.title} description={card.description} />
				))}
			</div>
		</div>
	);
}
