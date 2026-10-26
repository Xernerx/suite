/** @format */
'use client';

import { CollapsibleCard } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { FaqQuickLinks } from './FaqQuickLinks';

export default function DesktopAndOverlay({ searchQuery = '' }: { searchQuery?: string }) {
	const { t } = useDictionary();
	const q = searchQuery.trim().toLowerCase();

	const cards = [
		{
			id: 'card1',
			title: t('faq.desktop.card1.title'),
			searchableText: `${t('faq.desktop.card1.title')} ${t('faq.desktop.card1.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.desktop.card1.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.desktopDownload'), href: 'https://www.xernerx.com/download', vanity: 'xernerx.com/desktop' },
							{ label: t('faq.quickLinks.canaryEnv'), href: 'https://canary.xernerx.com/download', vanity: 'canary.xernerx.com/desktop', external: true },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card2',
			title: t('faq.desktop.card2.title'),
			searchableText: `${t('faq.desktop.card2.title')} ${t('faq.desktop.card2.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.desktop.card2.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.desktopDownload'), href: 'https://www.xernerx.com/download', vanity: 'xernerx.com/desktop' },
							{ label: t('faq.quickLinks.devicesTab'), href: 'https://account.xernerx.com/?tab=devices', vanity: 'account.xernerx.com/devices' },
							{ label: t('faq.quickLinks.cookiePolicy'), href: 'https://www.xernerx.com/cookies', vanity: 'xernerx.com/cookies' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card3',
			title: t('faq.desktop.card3.title'),
			searchableText: `${t('faq.desktop.card3.title')} ${t('faq.desktop.card3.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.desktop.card3.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.liveOverlay'), href: 'https://app.xernerx.com/overlay', vanity: 'app.xernerx.com/overlay' },
							{ label: t('faq.quickLinks.desktopDownload'), href: 'https://www.xernerx.com/download', vanity: 'xernerx.com/desktop' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card4',
			title: t('faq.desktop.card4.title'),
			searchableText: `${t('faq.desktop.card4.title')} ${t('faq.desktop.card4.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.desktop.card4.description')}</p>
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
			id: 'card5',
			title: t('faq.desktop.card5.title'),
			searchableText: `${t('faq.desktop.card5.title')} ${t('faq.desktop.card5.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.desktop.card5.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.preferencesTab'), href: 'https://account.xernerx.com/?tab=preferences', vanity: 'account.xernerx.com/preferences' },
							{ label: t('faq.quickLinks.issueTracker'), href: 'https://info.xernerx.com/issues', vanity: 'info.xernerx.com/bugs' },
						]}
					/>
				</div>
			),
		},
	].filter((c) => !q || c.searchableText.toLowerCase().includes(q) || t('faq.desktop.title').toLowerCase().includes(q));

	if (cards.length === 0) return null;
	const HeadingTag = q ? 'h2' : 'h1';

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<HeadingTag className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{t('faq.desktop.title')}
			</HeadingTag>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				{cards.map((card) => (
					<CollapsibleCard key={card.id} message={card.title} description={card.description} />
				))}
			</div>
		</div>
	);
}
