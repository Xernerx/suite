/** @format */
'use client';

import { CollapsibleCard } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { FaqQuickLinks } from './FaqQuickLinks';

export default function Bots({ searchQuery = '' }: { searchQuery?: string }) {
	const { t } = useDictionary();
	const q = searchQuery.trim().toLowerCase();

	const cards = [
		{
			id: 'card8',
			title: t('faq.bots.card8.title'),
			searchableText: `${t('faq.bots.card8.title')} ${t('faq.bots.card8.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.bots.card8.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.exploreBots'), href: 'https://app.xernerx.com/bots', vanity: 'app.xernerx.com/bots' },
							{ label: t('faq.quickLinks.exploreServers'), href: 'https://app.xernerx.com/servers', vanity: 'app.xernerx.com/servers' },
							{ label: t('faq.quickLinks.leaderboards'), href: 'https://app.xernerx.com/leaderboard', vanity: 'app.xernerx.com/leaderboard' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card2',
			title: t('faq.bots.card2.title'),
			searchableText: `${t('faq.bots.card2.title')} ${t('faq.bots.card2.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.bots.card2.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.apiTokens'), href: 'https://account.xernerx.com/?tab=tokens', vanity: 'account.xernerx.com/tokens' },
							{ label: t('faq.quickLinks.devPortal'), href: 'https://portal.xernerx.com', vanity: 'portal.xernerx.com' },
							{ label: t('faq.quickLinks.v1ApiDocs'), href: 'https://docs.xernerx.com/api/v1', vanity: 'docs.xernerx.com/api/v1' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card9',
			title: t('faq.bots.card9.title'),
			searchableText: `${t('faq.bots.card9.title')} ${t('faq.bots.card9.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.bots.card9.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.devPortal'), href: 'https://portal.xernerx.com', vanity: 'portal.xernerx.com' },
							{ label: t('faq.quickLinks.v1ApiDocs'), href: 'https://docs.xernerx.com/api/v1', vanity: 'docs.xernerx.com/api/v1' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card11',
			title: t('faq.bots.card11.title'),
			searchableText: `${t('faq.bots.card11.title')} ${t('faq.bots.card11.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.bots.card11.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.exploreBots'), href: 'https://app.xernerx.com/bots', vanity: 'app.xernerx.com/bots' },
							{ label: t('faq.quickLinks.v1ApiDocs'), href: 'https://docs.xernerx.com/api/v1', vanity: 'docs.xernerx.com/api/v1' },
							{ label: t('faq.quickLinks.systemStatus'), href: 'https://info.xernerx.com/status', vanity: 'info.xernerx.com/status' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card10',
			title: t('faq.bots.card10.title'),
			searchableText: `${t('faq.bots.card10.title')} ${t('faq.bots.card10.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.bots.card10.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.exploreBots'), href: 'https://app.xernerx.com/bots', vanity: 'app.xernerx.com/bots' },
							{ label: t('faq.quickLinks.devPortal'), href: 'https://portal.xernerx.com', vanity: 'portal.xernerx.com' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card1',
			title: t('faq.bots.card.title'),
			searchableText: [
				t('faq.bots.card.title'),
				t('faq.bots.card.description1'),
				t('faq.bots.card.disclaimer'),
				t('faq.bots.card.description2'),
				t('faq.bots.card.baseline'),
				t('faq.bots.card.multiplier'),
			].join(' '),
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<p className="text-(--text) leading-relaxed" dangerouslySetInnerHTML={{ __html: t('faq.bots.card.description1') }}></p>
					<p className="text-(--text) leading-relaxed text-(--accent-red) font-medium">{t('faq.bots.card.disclaimer')}</p>
					<p className="text-(--text) leading-relaxed">{t('faq.bots.card.description2')}</p>
					<ul className="list-disc pl-5 text-(--text-muted) flex flex-col gap-2">
						<li dangerouslySetInnerHTML={{ __html: t('faq.bots.card.baseline') }}></li>
						<li dangerouslySetInnerHTML={{ __html: t('faq.bots.card.multiplier') }}></li>
					</ul>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.exploreBots'), href: 'https://app.xernerx.com/bots', vanity: 'app.xernerx.com/bots' },
							{ label: t('faq.quickLinks.leaderboards'), href: 'https://app.xernerx.com/leaderboard', vanity: 'app.xernerx.com/leaderboard' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card4',
			title: t('faq.bots.card4.title'),
			searchableText: `${t('faq.bots.card4.title')} ${t('faq.bots.card4.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.bots.card4.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.devPortal'), href: 'https://portal.xernerx.com', vanity: 'portal.xernerx.com' },
							{ label: t('faq.quickLinks.v1ApiDocs'), href: 'https://docs.xernerx.com/api/v1', vanity: 'docs.xernerx.com/api/v1' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card5',
			title: t('faq.bots.card5.title'),
			searchableText: `${t('faq.bots.card5.title')} ${t('faq.bots.card5.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.bots.card5.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.exploreBots'), href: 'https://app.xernerx.com/bots', vanity: 'app.xernerx.com/bots' },
							{ label: t('faq.quickLinks.exploreServers'), href: 'https://app.xernerx.com/servers', vanity: 'app.xernerx.com/servers' },
							{ label: t('faq.quickLinks.leaderboards'), href: 'https://app.xernerx.com/leaderboard', vanity: 'app.xernerx.com/leaderboard' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card3',
			title: t('faq.bots.card3.title'),
			searchableText: `${t('faq.bots.card3.title')} ${t('faq.bots.card3.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.bots.card3.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.botInvites'), href: 'https://www.xernerx.com/invites', vanity: 'xernerx.com/invite' },
							{ label: t('faq.quickLinks.coreApiDocs'), href: 'https://docs.xernerx.com/api/core', vanity: 'docs.xernerx.com/api/core' },
						]}
					/>
				</div>
			),
		},
	].filter((c) => !q || c.searchableText.toLowerCase().includes(q) || t('faq.bots.title').toLowerCase().includes(q));

	if (cards.length === 0) return null;
	const HeadingTag = q ? 'h2' : 'h1';

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<HeadingTag className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{t('faq.bots.title')}
			</HeadingTag>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				{cards.map((card) => (
					<CollapsibleCard key={card.id} message={card.title} description={card.description} />
				))}
			</div>
		</div>
	);
}
