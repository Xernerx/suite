/** @format */
'use client';

import { Command, Compass, Globe, HelpCircle } from 'lucide-react';
import { FAQ_BLUEPRINTS, FAQ_SUBDOMAINS_CATALOG, type FaqInteractiveAction, type RawCardBlueprint, type RawCategoryBlueprint } from '@xernerx/lib';
import { useDictionary, useShortcuts } from '@xernerx/providers';
import { CollapsibleCard } from '@xernerx/ui';
import { FaqInlineLink, FaqQuickLinks } from './FaqQuickLinks';

const HTML_TAG_REGEX = /<[a-z][\s\S]*>/i;

function renderFormattedText(text: string, className = 'text-(--text) leading-relaxed') {
	if (HTML_TAG_REGEX.test(text)) {
		return <p className={className} dangerouslySetInnerHTML={{ __html: text }} />;
	}
	return <p className={className}>{text}</p>;
}

export function buildCardSearchableText(card: RawCardBlueprint, categoryTitle: string, t: (key: string) => string): string {
	const parts: string[] = [
		categoryTitle,
		card.slug,
		t(card.titleKey),
		...card.paragraphKeys.map((k) => t(k)),
		...(card.disclaimerKey ? [t(card.disclaimerKey)] : []),
		...(card.bulletKeys ? card.bulletKeys.map((k) => t(k)) : []),
		...card.links.map((l) => `${t(l.labelKey)} ${l.vanity || ''}`),
	];

	if (card.tableType === 'subdomains') {
		for (const sub of FAQ_SUBDOMAINS_CATALOG) {
			parts.push(sub.domain, t(`faq.overview.subdomains.${sub.key}`));
		}
	} else if (card.tableType === 'environments') {
		parts.push(
			t('faq.environments.table.release.label'),
			t('faq.environments.table.release.description'),
			t('faq.environments.table.canary.label'),
			t('faq.environments.table.canary.description'),
			t('faq.environments.table.dev.label'),
			t('faq.environments.table.dev.description')
		);
	}

	return parts.join(' ').toLowerCase();
}

export function countMatchingFaqCards(searchQuery: string, t: (key: string) => string): number {
	const q = searchQuery.trim().toLowerCase();
	if (!q) return FAQ_BLUEPRINTS.reduce((sum, cat) => sum + cat.cards.length, 0);

	let count = 0;
	for (const cat of FAQ_BLUEPRINTS) {
		const catTitle = t(cat.titleKey);
		for (const card of cat.cards) {
			if (buildCardSearchableText(card, catTitle, t).includes(q)) {
				count += 1;
			}
		}
	}
	return count;
}

export default function FaqCategorySection({ categoryId, searchQuery = '' }: { categoryId: string; searchQuery?: string }) {
	const { t } = useDictionary();
	const { setSearchOpen, setNavOpen, setUrlPlacerOpen, setHelpOpen } = useShortcuts();
	const q = searchQuery.trim().toLowerCase();

	const category: RawCategoryBlueprint | undefined = FAQ_BLUEPRINTS.find((cat) => cat.id === categoryId);
	if (!category) return null;

	const categoryTitle = t(category.titleKey);

	const renderInteractiveButton = (action: FaqInteractiveAction) => {
		const config = {
			commandPalette: { icon: Command, labelKey: 'faq.quickLinks.tryCommandPalette', onClick: () => setSearchOpen(true) },
			appDrawer: { icon: Compass, labelKey: 'faq.quickLinks.tryAppDrawer', onClick: () => setNavOpen(true) },
			omnibar: { icon: Globe, labelKey: 'faq.quickLinks.tryOmnibar', onClick: () => setUrlPlacerOpen(true) },
			shortcutsModal: { icon: HelpCircle, labelKey: 'faq.quickLinks.tryShortcutsModal', onClick: () => setHelpOpen(true) },
		}[action];

		const Icon = config.icon;

		return (
			<div className="flex flex-wrap items-center gap-2 pt-1">
				<button
					type="button"
					onClick={config.onClick}
					className="inline-flex items-center gap-1.5 rounded-2xl bg-(--accent)/15 hover:bg-(--accent) text-(--accent) hover:text-white border border-(--accent)/30 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
				>
					<Icon size={13} />
					<span>{t(config.labelKey)}</span>
				</button>
			</div>
		);
	};

	const renderTable = (tableType: 'subdomains' | 'environments') => {
		if (tableType === 'subdomains') {
			return (
				<div className="overflow-x-auto rounded-2xl border border-(--border)/10">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="border-b border-(--border)/10 bg-(--background)/50">
								<th className="p-3 text-xs font-bold uppercase tracking-wider text-(--text)">{t('faq.overview.table.subdomain')}</th>
								<th className="p-3 text-xs font-bold uppercase tracking-wider text-(--text)">{t('faq.overview.table.purpose')}</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-(--border)/10">
							{FAQ_SUBDOMAINS_CATALOG.map((sub) => (
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
			);
		}

		return (
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
		);
	};

	const visibleCards = category.cards.filter((card) => !q || buildCardSearchableText(card, categoryTitle, t).includes(q));
	if (visibleCards.length === 0) return null;

	const HeadingTag = q ? 'h2' : 'h1';

	return (
		<div className="flex flex-col max-w-(--page-width) mx-auto w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<HeadingTag className="text-4xl font-extrabold tracking-tight text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
				{categoryTitle}
			</HeadingTag>

			<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
				{visibleCards.map((card) => {
					const firstParagraph = card.paragraphKeys[0] ? t(card.paragraphKeys[0]) : undefined;
					const restParagraphs = card.paragraphKeys.slice(1).map((k) => t(k));

					const description = (
						<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.65)' }}>
							{firstParagraph && renderFormattedText(firstParagraph)}
							{card.disclaimerKey && <p className="leading-relaxed text-(--accent-red) font-medium">{t(card.disclaimerKey)}</p>}
							{restParagraphs.map((para, idx) => (
								<div key={idx}>{renderFormattedText(para)}</div>
							))}
							{card.bulletKeys && card.bulletKeys.length > 0 && (
								<ul className="list-disc pl-5 text-(--text-muted) flex flex-col gap-2">
									{card.bulletKeys.map((bKey) => {
										const bulletText = t(bKey);
										return HTML_TAG_REGEX.test(bulletText) ? <li key={bKey} dangerouslySetInnerHTML={{ __html: bulletText }} /> : <li key={bKey}>{bulletText}</li>;
									})}
								</ul>
							)}
							{card.tableType && renderTable(card.tableType)}
							{card.interactiveAction && renderInteractiveButton(card.interactiveAction)}
							<FaqQuickLinks
								links={card.links.map((l) => ({
									label: t(l.labelKey),
									href: l.href,
									vanity: l.vanity,
									external: l.external,
								}))}
							/>
						</div>
					);

					return <CollapsibleCard key={card.id} id={`${category.id}.${card.id}`} slug={card.slug} message={t(card.titleKey)} description={description} />;
				})}
			</div>
		</div>
	);
}
