/** @format */
'use client';

import { CollapsibleCard } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export default function Bots() {
	const { t } = useDictionary();

	return (
		<div className="flex flex-col max-w-3xl mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<h1 className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{t('faq.bots.title')}
			</h1>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				<CollapsibleCard
					message={t('faq.bots.card.title')}
					description={
						<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
							<p className="text-(--text) leading-relaxed" dangerouslySetInnerHTML={{ __html: t('faq.bots.card.description1') }}></p>
							<p className="text-(--text) leading-relaxed text-red-400 font-medium">{t('faq.bots.card.disclaimer')}</p>
							<p className="text-(--text) leading-relaxed">{t('faq.bots.card.description2')}</p>
							<ul className="list-disc pl-5 text-(--text-muted) flex flex-col gap-2">
								<li dangerouslySetInnerHTML={{ __html: t('faq.bots.card.baseline') }}></li>
								<li dangerouslySetInnerHTML={{ __html: t('faq.bots.card.multiplier') }}></li>
							</ul>
						</div>
					}
				/>
			</div>
		</div>
	);
}
