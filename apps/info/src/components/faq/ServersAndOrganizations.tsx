/** @format */
'use client';

import { CollapsibleCard } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { FaqQuickLinks } from './FaqQuickLinks';

export default function ServersAndOrganizations({ searchQuery = '' }: { searchQuery?: string }) {
	const { t } = useDictionary();
	const q = searchQuery.trim().toLowerCase();

	const cards = [
		{
			id: 'card1',
			title: t('faq.servers.card1.title'),
			searchableText: `${t('faq.servers.card1.title')} ${t('faq.servers.card1.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.servers.card1.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.serverDashboard'), href: 'https://app.xernerx.com/dashboard', vanity: 'app.xernerx.com/dashboard' },
							{ label: t('faq.quickLinks.botInvites'), href: 'https://www.xernerx.com/invites', vanity: 'xernerx.com/invite' },
							{ label: t('faq.quickLinks.exploreServers'), href: 'https://app.xernerx.com/servers', vanity: 'app.xernerx.com/servers' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card2',
			title: t('faq.servers.card2.title'),
			searchableText: `${t('faq.servers.card2.title')} ${t('faq.servers.card2.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.servers.card2.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.serverStats'), href: 'https://app.xernerx.com/dashboard?tab=stats', vanity: 'app.xernerx.com/dashboard?tab=stats' },
							{ label: t('faq.quickLinks.leaderboards'), href: 'https://app.xernerx.com/leaderboard', vanity: 'app.xernerx.com/leaderboard' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card3',
			title: t('faq.servers.card3.title'),
			searchableText: `${t('faq.servers.card3.title')} ${t('faq.servers.card3.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.servers.card3.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.virtueSettings'), href: 'https://app.xernerx.com/dashboard?tab=virtue', vanity: 'app.xernerx.com/dashboard?tab=virtue' },
							{ label: t('faq.quickLinks.botInvites'), href: 'https://www.xernerx.com/invites', vanity: 'xernerx.com/invite' },
							{ label: t('faq.quickLinks.storeConsumers'), href: 'https://store.xernerx.com/?category=consumers', vanity: 'store.xernerx.com/?category=consumers' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card4',
			title: t('faq.servers.card4.title'),
			searchableText: `${t('faq.servers.card4.title')} ${t('faq.servers.card4.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.servers.card4.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.devPortal'), href: 'https://portal.xernerx.com', vanity: 'portal.xernerx.com' },
							{ label: t('faq.quickLinks.serverDashboard'), href: 'https://app.xernerx.com/dashboard', vanity: 'app.xernerx.com/dashboard' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card5',
			title: t('faq.servers.card5.title'),
			searchableText: `${t('faq.servers.card5.title')} ${t('faq.servers.card5.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.servers.card5.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.devPortal'), href: 'https://portal.xernerx.com', vanity: 'portal.xernerx.com' },
							{ label: t('faq.quickLinks.serverSettings'), href: 'https://app.xernerx.com/dashboard?tab=settings', vanity: 'app.xernerx.com/dashboard?tab=settings' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card6',
			title: t('faq.servers.card6.title'),
			searchableText: `${t('faq.servers.card6.title')} ${t('faq.servers.card6.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.servers.card6.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.profileSettings'), href: 'https://account.xernerx.com/?tab=profile', vanity: 'account.xernerx.com/profile' },
							{ label: t('faq.quickLinks.preferencesTab'), href: 'https://account.xernerx.com/?tab=preferences', vanity: 'account.xernerx.com/preferences' },
							{ label: t('faq.quickLinks.supporters'), href: 'https://app.xernerx.com/supporters', vanity: 'app.xernerx.com/supporters' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card7',
			title: t('faq.servers.card7.title'),
			searchableText: `${t('faq.servers.card7.title')} ${t('faq.servers.card7.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.servers.card7.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.virtueSettings'), href: 'https://app.xernerx.com/dashboard?tab=virtue', vanity: 'app.xernerx.com/dashboard?tab=virtue' },
							{ label: t('faq.quickLinks.exploreServers'), href: 'https://app.xernerx.com/servers', vanity: 'app.xernerx.com/servers' },
							{ label: t('faq.quickLinks.leaderboards'), href: 'https://app.xernerx.com/leaderboard', vanity: 'app.xernerx.com/leaderboard' },
						]}
					/>
				</div>
			),
		},
	].filter((c) => !q || c.searchableText.toLowerCase().includes(q) || t('faq.servers.title').toLowerCase().includes(q));

	if (cards.length === 0) return null;
	const HeadingTag = q ? 'h2' : 'h1';

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<HeadingTag className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{t('faq.servers.title')}
			</HeadingTag>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				{cards.map((card) => (
					<CollapsibleCard key={card.id} message={card.title} description={card.description} />
				))}
			</div>
		</div>
	);
}
