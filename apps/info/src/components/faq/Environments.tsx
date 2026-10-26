/** @format */
'use client';

import { CollapsibleCard } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { FaqInlineLink, FaqQuickLinks } from './FaqQuickLinks';

export default function Environments({ searchQuery = '' }: { searchQuery?: string }) {
	const { t } = useDictionary();
	const q = searchQuery.trim().toLowerCase();

	const cards = [
		{
			id: 'card1',
			title: t('faq.environments.card.title'),
			searchableText: [
				t('faq.environments.card.title'),
				t('faq.environments.card.description'),
				t('faq.environments.table.release.label'),
				t('faq.environments.table.release.description'),
				t('faq.environments.table.canary.label'),
				t('faq.environments.table.canary.description'),
				t('faq.environments.table.dev.label'),
				t('faq.environments.table.dev.description'),
			].join(' '),
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.environments.card.description')}</p>
					<div className="overflow-x-auto rounded-2xl border border-(--border)/10">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="border-b border-(--border)/10 bg-(--background)/50">
									<th className="p-3 text-xs font-bold uppercase tracking-wider text-(--text)">{t('faq.environments.table.header.environment')}</th>
									<th className="p-3 text-xs font-bold uppercase tracking-wider text-(--text)">{t('faq.environments.table.header.domain')}</th>
									<th className="p-3 text-xs font-bold uppercase tracking-wider text-(--text)">{t('faq.environments.table.header.description')}</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-(--border)/10">
								<tr>
									<td className="p-3 font-semibold text-(--text)">{t('faq.environments.table.release.label')}</td>
									<td className="p-3">
										<FaqInlineLink href="https://www.xernerx.com" external>
											*.xernerx.com
										</FaqInlineLink>
									</td>
									<td className="p-3 text-(--text-muted)">{t('faq.environments.table.release.description')}</td>
								</tr>
								<tr>
									<td className="p-3 font-semibold text-(--text)">{t('faq.environments.table.canary.label')}</td>
									<td className="p-3">
										<FaqInlineLink href="https://canary.xernerx.com" external>
											*.canary.xernerx.com
										</FaqInlineLink>
									</td>
									<td className="p-3 text-(--text-muted)">{t('faq.environments.table.canary.description')}</td>
								</tr>
								<tr>
									<td className="p-3 font-semibold text-(--text)">{t('faq.environments.table.dev.label')}</td>
									<td className="p-3">
										<span className="font-mono text-xs text-(--text-muted) bg-(--background)/50 px-2 py-0.5 rounded-lg border border-(--border)/10">*.dev.xernerx.com</span>
									</td>
									<td className="p-3 text-(--text-muted)">{t('faq.environments.table.dev.description')}</td>
								</tr>
							</tbody>
						</table>
					</div>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.productionEnv'), href: 'https://www.xernerx.com', vanity: 'xernerx.com', external: true },
							{ label: t('faq.quickLinks.canaryEnv'), href: 'https://canary.xernerx.com', vanity: 'canary.xernerx.com', external: true },
							{ label: t('faq.quickLinks.desktopDownload'), href: 'https://www.xernerx.com/download', vanity: 'xernerx.com/desktop' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card2',
			title: t('faq.environments.card2.title'),
			searchableText: `${t('faq.environments.card2.title')} ${t('faq.environments.card2.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.environments.card2.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.systemStatus'), href: 'https://info.xernerx.com/status', vanity: 'info.xernerx.com/status' },
							{ label: t('faq.quickLinks.statusBadge'), href: 'https://api.xernerx.com/v1/status/badge.svg', vanity: 'api.xernerx.com/v1/status/badge.svg', external: true },
							{ label: t('faq.quickLinks.issueTracker'), href: 'https://info.xernerx.com/issues', vanity: 'info.xernerx.com/bugs' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card3',
			title: t('faq.environments.card3.title'),
			searchableText: `${t('faq.environments.card3.title')} ${t('faq.environments.card3.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.environments.card3.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.changelog'), href: 'https://info.xernerx.com/changelog', vanity: 'info.xernerx.com/changelog' },
							{ label: t('faq.quickLinks.changelogRss'), href: 'https://api.xernerx.com/v1/changelog/rss', vanity: 'api.xernerx.com/v1/changelog/rss', external: true },
							{ label: t('faq.quickLinks.roadmap'), href: 'https://info.xernerx.com/roadmap', vanity: 'info.xernerx.com/roadmap' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card4',
			title: t('faq.environments.card4.title'),
			searchableText: `${t('faq.environments.card4.title')} ${t('faq.environments.card4.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.environments.card4.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.issueTracker'), href: 'https://info.xernerx.com/issues', vanity: 'info.xernerx.com/bugs' },
							{ label: t('faq.quickLinks.activityLog'), href: 'https://account.xernerx.com/?tab=activity', vanity: 'account.xernerx.com/activity' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card6',
			title: t('faq.environments.card6.title'),
			searchableText: `${t('faq.environments.card6.title')} ${t('faq.environments.card6.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.environments.card6.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.suggestions'), href: 'https://info.xernerx.com/suggestions', vanity: 'info.xernerx.com/suggestions' },
							{ label: t('faq.quickLinks.roadmap'), href: 'https://info.xernerx.com/roadmap', vanity: 'info.xernerx.com/roadmap' },
							{ label: t('faq.quickLinks.notificationPrefs'), href: 'https://account.xernerx.com/?tab=notifications', vanity: 'account.xernerx.com/notifications' },
						]}
					/>
				</div>
			),
		},
	].filter((c) => !q || c.searchableText.toLowerCase().includes(q) || t('faq.environments.title').toLowerCase().includes(q));

	if (cards.length === 0) return null;
	const HeadingTag = q ? 'h2' : 'h1';

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<HeadingTag className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{t('faq.environments.title')}
			</HeadingTag>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				{cards.map((card) => (
					<CollapsibleCard key={card.id} message={card.title} description={card.description} />
				))}
			</div>
		</div>
	);
}
