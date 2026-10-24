/** @format */
'use client';

import { Command, Compass, Globe, HelpCircle } from 'lucide-react';
import { CollapsibleCard } from '@xernerx/ui';
import { useDictionary, useShortcuts } from '@xernerx/providers';
import { FaqInlineLink, FaqQuickLinks } from './FaqQuickLinks';

export default function EcosystemAndNavigation({ searchQuery = '' }: { searchQuery?: string }) {
	const { t } = useDictionary();
	const { setSearchOpen, setNavOpen, setUrlPlacerOpen, setHelpOpen } = useShortcuts();
	const q = searchQuery.trim().toLowerCase();

	const subdomains = [
		{ key: 'www', href: 'https://www.xernerx.com', domain: 'xernerx.com' },
		{ key: 'app', href: 'https://app.xernerx.com', domain: 'app.xernerx.com' },
		{ key: 'account', href: 'https://account.xernerx.com', domain: 'account.xernerx.com' },
		{ key: 'store', href: 'https://store.xernerx.com', domain: 'store.xernerx.com' },
		{ key: 'cdn', href: 'https://cdn.xernerx.com', domain: 'cdn.xernerx.com' },
		{ key: 'docs', href: 'https://docs.xernerx.com', domain: 'docs.xernerx.com' },
		{ key: 'info', href: 'https://info.xernerx.com', domain: 'info.xernerx.com' },
		{ key: 'api', href: 'https://api.xernerx.com', domain: 'api.xernerx.com' },
		{ key: 'admin', href: 'https://admin.xernerx.com', domain: 'admin.xernerx.com' },
	] as const;

	const cards = [
		{
			id: 'card1',
			title: t('faq.overview.card1.title'),
			searchableText: `${t('faq.overview.card1.title')} ${t('faq.overview.card1.description')} ${subdomains.map((s) => `${s.domain} ${t(`faq.overview.subdomains.${s.key}`)}`).join(' ')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.overview.card1.description')}</p>
					<div className="overflow-x-auto rounded-2xl border border-(--border)/10">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="border-b border-(--border)/10 bg-(--background)/50">
									<th className="p-3 text-xs font-bold uppercase tracking-wider text-(--text)">{t('faq.overview.table.subdomain')}</th>
									<th className="p-3 text-xs font-bold uppercase tracking-wider text-(--text)">{t('faq.overview.table.purpose')}</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-(--border)/10">
								{subdomains.map((sub) => (
									<tr key={sub.key}>
										<td className="p-3 whitespace-nowrap">
											<FaqInlineLink href={sub.href}>{sub.domain}</FaqInlineLink>
										</td>
										<td className="p-3 text-xs sm:text-sm text-(--text-muted)">{t(`faq.overview.subdomains.${sub.key}`)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.exploreBots'), href: 'https://app.xernerx.com', vanity: 'app.xernerx.com' },
							{ label: t('faq.quickLinks.accountSettings'), href: 'https://account.xernerx.com', vanity: 'account.xernerx.com' },
							{ label: t('faq.quickLinks.storeHub'), href: 'https://store.xernerx.com', vanity: 'store.xernerx.com' },
							{ label: t('faq.quickLinks.v1ApiDocs'), href: 'https://docs.xernerx.com', vanity: 'docs.xernerx.com' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card2',
			title: t('faq.overview.card2.title'),
			searchableText: `${t('faq.overview.card2.title')} ${t('faq.overview.card2.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.6)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.overview.card2.description')}</p>
					<div className="flex flex-wrap items-center gap-2 pt-1">
						<button
							type="button"
							onClick={() => setSearchOpen(true)}
							className="inline-flex items-center gap-1.5 rounded-2xl bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-white border border-(--accent)/30 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
						>
							<Command size={13} />
							<span>{t('faq.quickLinks.tryCommandPalette')}</span>
						</button>
						<button
							type="button"
							onClick={() => setNavOpen(true)}
							className="inline-flex items-center gap-1.5 rounded-2xl bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-white border border-(--accent)/30 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
						>
							<Compass size={13} />
							<span>{t('faq.quickLinks.tryAppDrawer')}</span>
						</button>
						<button
							type="button"
							onClick={() => setUrlPlacerOpen(true)}
							className="inline-flex items-center gap-1.5 rounded-2xl bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-white border border-(--accent)/30 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
						>
							<Globe size={13} />
							<span>{t('faq.quickLinks.tryOmnibar')}</span>
						</button>
						<button
							type="button"
							onClick={() => setHelpOpen(true)}
							className="inline-flex items-center gap-1.5 rounded-2xl bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-white border border-(--accent)/30 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
						>
							<HelpCircle size={13} />
							<span>{t('faq.quickLinks.tryShortcutsModal')}</span>
						</button>
					</div>
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
			id: 'card3',
			title: t('faq.overview.card3.title'),
			searchableText: `${t('faq.overview.card3.title')} ${t('faq.overview.card3.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.overview.card3.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.preferencesTab'), href: 'https://account.xernerx.com/?tab=preferences', vanity: 'account.xernerx.com/preferences' },
							{ label: t('faq.quickLinks.accountSettings'), href: 'https://account.xernerx.com', vanity: 'account.xernerx.com' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card4',
			title: t('faq.overview.card4.title'),
			searchableText: `${t('faq.overview.card4.title')} ${t('faq.overview.card4.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.overview.card4.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.discordSupport'), href: '/support', vanity: '/support • /discord', external: true },
							{ label: t('faq.quickLinks.botInvites'), href: 'https://www.xernerx.com/invites', vanity: 'xernerx.com/invite' },
							{ label: t('faq.quickLinks.desktopDownload'), href: 'https://www.xernerx.com/download', vanity: 'xernerx.com/desktop' },
							{ label: t('faq.quickLinks.openApplications'), href: 'https://www.xernerx.com/applications', vanity: 'xernerx.com/careers • /jobs' },
							{ label: t('faq.quickLinks.issueTracker'), href: 'https://info.xernerx.com/issues', vanity: 'info.xernerx.com/bugs' },
							{ label: t('faq.quickLinks.devPortal'), href: 'https://app.xernerx.com/portal', vanity: 'app.xernerx.com/orgs' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card5',
			title: t('faq.overview.card5.title'),
			searchableText: `${t('faq.overview.card5.title')} ${t('faq.overview.card5.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.overview.card5.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.discordSupport'), href: '/support', vanity: '/support', external: true },
							{ label: t('faq.quickLinks.contactPage'), href: 'https://www.xernerx.com/contact', vanity: 'xernerx.com/contact' },
							{ label: t('faq.quickLinks.issueTracker'), href: 'https://info.xernerx.com/issues', vanity: 'info.xernerx.com/bugs' },
						]}
					/>
				</div>
			),
		},
		{
			id: 'card6',
			title: t('faq.overview.card6.title'),
			searchableText: `${t('faq.overview.card6.title')} ${t('faq.overview.card6.description')}`,
			description: (
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
					<p className="text-(--text) leading-relaxed">{t('faq.overview.card6.description')}</p>
					<FaqQuickLinks
						links={[
							{ label: t('faq.quickLinks.exploreBots'), href: 'https://app.xernerx.com/bots', vanity: 'app.xernerx.com/bots/[slug]' },
							{ label: t('faq.quickLinks.exploreServers'), href: 'https://app.xernerx.com/servers', vanity: 'app.xernerx.com/servers/[slug]' },
							{ label: t('faq.quickLinks.profileSettings'), href: 'https://account.xernerx.com/?tab=profile', vanity: 'app.xernerx.com/users/[slug]' },
							{ label: t('faq.quickLinks.creditStore'), href: 'https://store.xernerx.com/?category=credits', vanity: 'store.xernerx.com/?category=credits' },
						]}
					/>
				</div>
			),
		},
	].filter((c) => !q || c.searchableText.toLowerCase().includes(q) || t('faq.overview.title').toLowerCase().includes(q));

	if (cards.length === 0) return null;
	const HeadingTag = q ? 'h2' : 'h1';

	return (
		<div className="flex flex-col max-w-7xl mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<HeadingTag className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{t('faq.overview.title')}
			</HeadingTag>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				{cards.map((card) => (
					<CollapsibleCard key={card.id} message={card.title} description={card.description} />
				))}
			</div>
		</div>
	);
}
