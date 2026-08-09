/** @format */
'use client';

import { CollapsibleCard } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export default function Translations() {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col max-w-3xl mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<h1 className="text-3xl font-black tracking-tight text-(--text)">{t('faq.translations.title')}</h1>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				<CollapsibleCard
					message={t('faq.translations.card1.title')}
					description={
						<div className="flex flex-col gap-2">
							<p>{t('faq.translations.card1.p1')}</p>
							<p className="text-xs opacity-80">{t('faq.translations.card1.p2')}</p>
						</div>
					}
				/>

				<CollapsibleCard message={t('faq.translations.card2.title')} description={t('faq.translations.card2.description')} />

				<CollapsibleCard message={t('faq.translations.card3.title')} description={t('faq.translations.card3.description')} />

				<CollapsibleCard message={t('faq.translations.card4.title')} description={t('faq.translations.card4.description')} />
			</div>
		</div>
	);
}
