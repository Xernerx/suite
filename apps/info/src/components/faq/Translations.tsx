/** @format */
'use client';

import { CollapsibleCard } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { FaqQuickLinks } from './FaqQuickLinks';

export default function Translations({ searchQuery = '' }: { searchQuery?: string }) {
	const { t } = useDictionary();
	const q = searchQuery.trim().toLowerCase();

	const cards = [
		{
			id: 'card1',
			title: t('faq.translations.card1.title'),
			searchableText: `${t('faq.translations.card1.title')} ${t('faq.translations.card1.p1')} ${t('faq.translations.card1.p2')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.translations.card1.p1')}</p>
					<p className="text-xs text-(--text-muted)">{t('faq.translations.card1.p2')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.languagePrefs'), href: 'https://account.xernerx.com/?tab=language', vanity: 'account.xernerx.com/language' },
							{ label: t('faq.quickLinks.openApplications'), href: 'https://www.xernerx.com/applications', vanity: 'xernerx.com/careers' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card2',
			title: t('faq.translations.card2.title'),
			searchableText: `${t('faq.translations.card2.title')} ${t('faq.translations.card2.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.translations.card2.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.translationStudio'), href: 'https://admin.xernerx.com/?tab=translations', vanity: 'admin.xernerx.com/?tab=translations' },
							{ label: t('faq.quickLinks.notificationPrefs'), href: 'https://account.xernerx.com/?tab=notifications', vanity: 'account.xernerx.com/notifications' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card3',
			title: t('faq.translations.card3.title'),
			searchableText: `${t('faq.translations.card3.title')} ${t('faq.translations.card3.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.translations.card3.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.canaryEnv'), href: 'https://canary.xernerx.com', vanity: 'canary.xernerx.com', external: true },
							{ label: t('faq.quickLinks.changelog'), href: 'https://info.xernerx.com/changelog', vanity: 'info.xernerx.com/changelog' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card4',
			title: t('faq.translations.card4.title'),
			searchableText: `${t('faq.translations.card4.title')} ${t('faq.translations.card4.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.translations.card4.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.discordSupport'), href: '/support', vanity: '/support', external: true },
							{ label: t('faq.quickLinks.suggestions'), href: 'https://info.xernerx.com/suggestions', vanity: 'info.xernerx.com/suggestions' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card5',
			title: t('faq.translations.card5.title'),
			searchableText: `${t('faq.translations.card5.title')} ${t('faq.translations.card5.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.translations.card5.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.languagePrefs'), href: 'https://account.xernerx.com/?tab=language', vanity: 'account.xernerx.com/language' },
							{ label: t('faq.quickLinks.cookiePolicy'), href: 'https://www.xernerx.com/cookies', vanity: 'xernerx.com/cookies' },
						]}
					/>
				</div>
			),
		},
	].filter((c) => !q || c.searchableText.toLowerCase().includes(q) || t('faq.translations.title').toLowerCase().includes(q));

	if (cards.length === 0) return null;
	const HeadingTag = q ? 'h2' : 'h1';

	return (
		<div className="flex flex-col max-w-7xl mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<HeadingTag className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{t('faq.translations.title')}
			</HeadingTag>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				{cards.map((card) => (
					<CollapsibleCard key={card.id} message={card.title} description={card.description} />
				))}
			</div>
		</div>
	);
}
