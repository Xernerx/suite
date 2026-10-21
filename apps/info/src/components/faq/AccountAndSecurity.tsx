/** @format */
'use client';

import { CollapsibleCard } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { FaqQuickLinks } from './FaqQuickLinks';

export default function AccountAndSecurity({ searchQuery = '' }: { searchQuery?: string }) {
	const { t } = useDictionary();
	const q = searchQuery.trim().toLowerCase();

	const cards = [
		{
			id: 'card1',
			title: t('faq.account.card1.title'),
			searchableText: `${t('faq.account.card1.title')} ${t('faq.account.card1.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.account.card1.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.signInPage'), href: 'https://account.xernerx.com/login', vanity: 'account.xernerx.com/login' },
							{ label: t('faq.quickLinks.devicesTab'), href: 'https://account.xernerx.com/?tab=devices', vanity: 'account.xernerx.com/devices' },
							{ label: t('faq.quickLinks.desktopDownload'), href: 'https://www.xernerx.com/download', vanity: 'xernerx.com/desktop' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card5',
			title: t('faq.account.card5.title'),
			searchableText: `${t('faq.account.card5.title')} ${t('faq.account.card5.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.account.card5.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.devicesTab'), href: 'https://account.xernerx.com/?tab=devices', vanity: 'account.xernerx.com/devices' },
							{ label: t('faq.quickLinks.accountSettings'), href: 'https://account.xernerx.com/?tab=account', vanity: 'account.xernerx.com' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card6',
			title: t('faq.account.card6.title'),
			searchableText: `${t('faq.account.card6.title')} ${t('faq.account.card6.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.account.card6.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.connectionsTab'), href: 'https://account.xernerx.com/?tab=connections', vanity: 'account.xernerx.com/connections' },
							{ label: t('faq.quickLinks.profileSettings'), href: 'https://account.xernerx.com/?tab=profile', vanity: 'account.xernerx.com/profile' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card7',
			title: t('faq.account.card7.title'),
			searchableText: `${t('faq.account.card7.title')} ${t('faq.account.card7.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.account.card7.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.appearanceTab'), href: 'https://account.xernerx.com/?tab=appearance', vanity: 'account.xernerx.com/appearance' },
							{ label: t('faq.quickLinks.preferencesTab'), href: 'https://account.xernerx.com/?tab=preferences', vanity: 'account.xernerx.com/preferences' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card9',
			title: t('faq.account.card9.title'),
			searchableText: `${t('faq.account.card9.title')} ${t('faq.account.card9.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.account.card9.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.preferencesTab'), href: 'https://account.xernerx.com/?tab=preferences', vanity: 'account.xernerx.com/preferences' },
							{ label: t('faq.quickLinks.appearanceTab'), href: 'https://account.xernerx.com/?tab=appearance', vanity: 'account.xernerx.com/appearance' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card8',
			title: t('faq.account.card8.title'),
			searchableText: `${t('faq.account.card8.title')} ${t('faq.account.card8.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.account.card8.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.notificationPrefs'), href: 'https://account.xernerx.com/?tab=notifications', vanity: 'account.xernerx.com/notifications' },
							{ label: t('faq.quickLinks.storeHub'), href: 'https://store.xernerx.com', vanity: 'store.xernerx.com' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card10',
			title: t('faq.account.card10.title'),
			searchableText: `${t('faq.account.card10.title')} ${t('faq.account.card10.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.account.card10.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.activityLog'), href: 'https://account.xernerx.com/?tab=activity', vanity: 'account.xernerx.com/activity' },
							{ label: t('faq.quickLinks.accountSettings'), href: 'https://account.xernerx.com/?tab=account', vanity: 'account.xernerx.com' },
							{ label: t('faq.quickLinks.privacyPolicy'), href: 'https://www.xernerx.com/privacy', vanity: 'xernerx.com/privacy' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card3',
			title: t('faq.account.card3.title'),
			searchableText: `${t('faq.account.card3.title')} ${t('faq.account.card3.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.account.card3.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.profileSettings'), href: 'https://account.xernerx.com/?tab=profile', vanity: 'account.xernerx.com/profile' },
							{ label: t('faq.quickLinks.accountSettings'), href: 'https://account.xernerx.com/?tab=account', vanity: 'account.xernerx.com' },
							{ label: t('faq.quickLinks.termsPolicy'), href: 'https://www.xernerx.com/terms', vanity: 'xernerx.com/terms' },
						]}
					/>
				</div>
			),
		},
	].filter((c) => !q || c.searchableText.toLowerCase().includes(q) || t('faq.account.title').toLowerCase().includes(q));

	if (cards.length === 0) return null;
	const HeadingTag = q ? 'h2' : 'h1';

	return (
		<div className="flex flex-col max-w-3xl mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<HeadingTag className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{t('faq.account.title')}
			</HeadingTag>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				{cards.map((card) => (
					<CollapsibleCard key={card.id} message={card.title} description={card.description} />
				))}
			</div>
		</div>
	);
}
