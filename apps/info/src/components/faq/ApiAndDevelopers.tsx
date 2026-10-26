/** @format */
'use client';

import { CollapsibleCard } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { FaqQuickLinks } from './FaqQuickLinks';

export default function ApiAndDevelopers({ searchQuery = '' }: { searchQuery?: string }) {
	const { t } = useDictionary();
	const q = searchQuery.trim().toLowerCase();

	const cards = [
		{
			id: 'card1',
			title: t('faq.developers.card1.title'),
			searchableText: `${t('faq.developers.card1.title')} ${t('faq.developers.card1.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.developers.card1.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.v1ApiDocs'), href: 'https://docs.xernerx.com/api/v1', vanity: 'docs.xernerx.com/api/v1' },
							{ label: t('faq.quickLinks.coreApiDocs'), href: 'https://docs.xernerx.com/api/core', vanity: 'docs.xernerx.com/api/core' },
							{ label: t('faq.quickLinks.apiTokens'), href: 'https://account.xernerx.com/?tab=tokens', vanity: 'account.xernerx.com/tokens' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card7',
			title: t('faq.developers.card7.title'),
			searchableText: `${t('faq.developers.card7.title')} ${t('faq.developers.card7.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.developers.card7.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.apiTokens'), href: 'https://account.xernerx.com/?tab=tokens', vanity: 'account.xernerx.com/tokens' },
							{ label: t('faq.quickLinks.v1ApiDocs'), href: 'https://docs.xernerx.com/api/v1', vanity: 'docs.xernerx.com/api/v1' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card3',
			title: t('faq.developers.card3.title'),
			searchableText: `${t('faq.developers.card3.title')} ${t('faq.developers.card3.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.developers.card3.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.coreApiDocs'), href: 'https://docs.xernerx.com/api/core', vanity: 'docs.xernerx.com/api/core' },
							{ label: t('faq.quickLinks.v1ApiDocs'), href: 'https://docs.xernerx.com/api/v1', vanity: 'docs.xernerx.com/api/v1' },
							{ label: t('faq.quickLinks.statusBadge'), href: 'https://api.xernerx.com/v1/status/badge.svg', vanity: 'api.xernerx.com/v1/status/badge.svg', external: true },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card8',
			title: t('faq.developers.card8.title'),
			searchableText: `${t('faq.developers.card8.title')} ${t('faq.developers.card8.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.developers.card8.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.npmPackagesDocs'), href: 'https://docs.xernerx.com/packages', vanity: 'docs.xernerx.com/packages' },
							{ label: t('faq.quickLinks.npmPackage'), href: '/npm', vanity: '/npm', external: true },
							{ label: t('faq.quickLinks.githubOrg'), href: '/github', vanity: '/github', external: true },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card4',
			title: t('faq.developers.card4.title'),
			searchableText: `${t('faq.developers.card4.title')} ${t('faq.developers.card4.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.developers.card4.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.websocketDocs'), href: 'https://docs.xernerx.com/websocket', vanity: 'docs.xernerx.com/websocket' },
							{ label: t('faq.quickLinks.npmPackagesDocs'), href: 'https://docs.xernerx.com/packages', vanity: 'docs.xernerx.com/packages' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card2',
			title: t('faq.developers.card2.title'),
			searchableText: `${t('faq.developers.card2.title')} ${t('faq.developers.card2.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.developers.card2.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.v1ApiDocs'), href: 'https://docs.xernerx.com/api/v1', vanity: 'docs.xernerx.com/api/v1' },
							{ label: t('faq.quickLinks.apiGateway'), href: 'https://api.xernerx.com', vanity: 'api.xernerx.com' },
							{ label: t('faq.quickLinks.storeDevelopers'), href: 'https://store.xernerx.com/?category=developers', vanity: 'store.xernerx.com/?category=developers' },
						]}
					/>
				</div>
			),
		},
	].filter((c) => !q || c.searchableText.toLowerCase().includes(q) || t('faq.developers.title').toLowerCase().includes(q));

	if (cards.length === 0) return null;
	const HeadingTag = q ? 'h2' : 'h1';

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<HeadingTag className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{t('faq.developers.title')}
			</HeadingTag>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				{cards.map((card) => (
					<CollapsibleCard key={card.id} message={card.title} description={card.description} />
				))}
			</div>
		</div>
	);
}
