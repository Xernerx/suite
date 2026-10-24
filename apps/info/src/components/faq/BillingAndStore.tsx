/** @format */
'use client';

import { CollapsibleCard } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { FaqQuickLinks } from './FaqQuickLinks';

export default function BillingAndStore({ searchQuery = '' }: { searchQuery?: string }) {
	const { t } = useDictionary();
	const q = searchQuery.trim().toLowerCase();

	const cards = [
		{
			id: 'card1',
			title: t('faq.billing.card1.title'),
			searchableText: `${t('faq.billing.card1.title')} ${t('faq.billing.card1.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.billing.card1.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.storeHub'), href: 'https://store.xernerx.com', vanity: 'store.xernerx.com' },
							{ label: t('faq.quickLinks.storeConsumers'), href: 'https://store.xernerx.com/?category=consumers', vanity: 'store.xernerx.com/?category=consumers' },
							{ label: t('faq.quickLinks.storeDevelopers'), href: 'https://store.xernerx.com/?category=developers', vanity: 'store.xernerx.com/?category=developers' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card3',
			title: t('faq.billing.card3.title'),
			searchableText: `${t('faq.billing.card3.title')} ${t('faq.billing.card3.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.billing.card3.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.billingTab'), href: 'https://account.xernerx.com/?tab=billing', vanity: 'account.xernerx.com/billing' },
							{ label: t('faq.quickLinks.creditStore'), href: 'https://store.xernerx.com/?category=credits', vanity: 'store.xernerx.com/?category=credits' },
							{ label: t('faq.quickLinks.leaderboards'), href: 'https://app.xernerx.com/leaderboard', vanity: 'app.xernerx.com/leaderboard' },
							{ label: t('faq.quickLinks.supporters'), href: 'https://app.xernerx.com/supporters', vanity: 'app.xernerx.com/supporters' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card6',
			title: t('faq.billing.card6.title'),
			searchableText: `${t('faq.billing.card6.title')} ${t('faq.billing.card6.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.billing.card6.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.creditStore'), href: 'https://store.xernerx.com/?category=credits', vanity: 'store.xernerx.com/?category=credits' },
							{ label: t('faq.quickLinks.billingTab'), href: 'https://account.xernerx.com/?tab=billing', vanity: 'account.xernerx.com/billing' },
							{ label: t('faq.quickLinks.profileSettings'), href: 'https://account.xernerx.com/?tab=profile', vanity: 'account.xernerx.com/profile' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card2',
			title: t('faq.billing.card2.title'),
			searchableText: `${t('faq.billing.card2.title')} ${t('faq.billing.card2.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.billing.card2.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.billingTab'), href: 'https://account.xernerx.com/?tab=billing', vanity: 'account.xernerx.com/billing' },
							{ label: t('faq.quickLinks.storeHub'), href: 'https://store.xernerx.com', vanity: 'store.xernerx.com' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card4',
			title: t('faq.billing.card4.title'),
			searchableText: `${t('faq.billing.card4.title')} ${t('faq.billing.card4.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.billing.card4.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.cdnPortal'), href: 'https://cdn.xernerx.com', vanity: 'cdn.xernerx.com' },
							{ label: t('faq.quickLinks.mediaLibrary'), href: 'https://account.xernerx.com/?tab=media', vanity: 'account.xernerx.com/media' },
							{ label: t('faq.quickLinks.cdnDocs'), href: 'https://docs.xernerx.com/cdn', vanity: 'docs.xernerx.com/cdn' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card5',
			title: t('faq.billing.card5.title'),
			searchableText: `${t('faq.billing.card5.title')} ${t('faq.billing.card5.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.billing.card5.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.openApplications'), href: 'https://www.xernerx.com/applications', vanity: 'xernerx.com/careers • /jobs' },
							{ label: t('faq.quickLinks.notificationPrefs'), href: 'https://account.xernerx.com/?tab=notifications', vanity: 'account.xernerx.com/notifications' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card7',
			title: t('faq.billing.card7.title'),
			searchableText: `${t('faq.billing.card7.title')} ${t('faq.billing.card7.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.billing.card7.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.creditStore'), href: 'https://store.xernerx.com/?category=credits', vanity: 'store.xernerx.com/?category=credits' },
							{ label: t('faq.quickLinks.billingTab'), href: 'https://account.xernerx.com/?tab=billing', vanity: 'account.xernerx.com/billing' },
							{ label: t('faq.quickLinks.exploreBots'), href: 'https://app.xernerx.com/bots', vanity: 'app.xernerx.com/bots' },
							{ label: t('faq.quickLinks.supporters'), href: 'https://app.xernerx.com/supporters', vanity: 'app.xernerx.com/supporters' },
						]}
					/>
				</div>
			),
		},
	].filter((c) => !q || c.searchableText.toLowerCase().includes(q) || t('faq.billing.title').toLowerCase().includes(q));

	if (cards.length === 0) return null;
	const HeadingTag = q ? 'h2' : 'h1';

	return (
		<div className="flex flex-col max-w-7xl mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<HeadingTag className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{t('faq.billing.title')}
			</HeadingTag>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				{cards.map((card) => (
					<CollapsibleCard key={card.id} message={card.title} description={card.description} />
				))}
			</div>
		</div>
	);
}
