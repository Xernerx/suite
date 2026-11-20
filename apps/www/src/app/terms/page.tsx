/** @format */
'use client';

import { ReadingProgressBar } from '@xernerx/components';
import Link from 'next/link';
import { useDictionary, useSidebar } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import { PageFaqSection } from '@/components/PageFaqSection';
import { PolicySubsection, PolicyTocSidebar } from '@/components/PolicySubsection';
type Section = {
	id: string;
	title: string;
	content: React.ReactNode;
};
export default function Page() {
	const { t } = useDictionary();
	const { hide } = useSidebar();
	useEffect(() => {
		hide();
	}, [hide]);
	const rawSections: Section[] = [
		{
			id: 'introduction',
			title: t('www.terms.sections.introduction.title'),
			content: <p>{t('www.terms.sections.introduction.content')}</p>,
		},
		{
			id: 'eligibility',
			title: t('www.terms.sections.eligibility.title'),
			content: <p>{t('www.terms.sections.eligibility.content')}</p>,
		},
		{
			id: 'acceptable-use',
			title: t('www.terms.sections.acceptableUse.title'),
			content: (
				<div className="space-y-3">
					<PolicySubsection code="3.1" id="acceptable-use-3-1">
						{t('www.terms.sections.acceptableUse.items.0')}
					</PolicySubsection>
					<PolicySubsection code="3.2" id="acceptable-use-3-2">
						{t('www.terms.sections.acceptableUse.items.1')}
					</PolicySubsection>
					<PolicySubsection code="3.3" id="acceptable-use-3-3">
						{t('www.terms.sections.acceptableUse.items.2')}
					</PolicySubsection>
					<PolicySubsection code="3.4" id="acceptable-use-3-4">
						{t('www.terms.sections.acceptableUse.items.3')}
					</PolicySubsection>
				</div>
			),
		},
		{
			id: 'api-usage',
			title: t('www.terms.sections.apiUsage.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.terms.sections.apiUsage.content')}</p>
					<div className="space-y-3">
						<PolicySubsection code="4.1" id="api-usage-4-1">
							{t('www.terms.sections.apiUsage.items.0')}
						</PolicySubsection>
						<PolicySubsection code="4.2" id="api-usage-4-2">
							{t('www.terms.sections.apiUsage.items.1')}
						</PolicySubsection>
						<PolicySubsection code="4.3" id="api-usage-4-3">
							{t('www.terms.sections.apiUsage.items.2')}
						</PolicySubsection>
						<PolicySubsection code="4.4" id="api-usage-4-4">
							{t('www.terms.sections.apiUsage.items.3')}
						</PolicySubsection>
					</div>
				</div>
			),
		},
		{
			id: 'bot-usage',
			title: t('www.terms.sections.botUsage.title'),
			content: <p>{t('www.terms.sections.botUsage.content')}</p>,
		},
		{
			id: 'accounts',
			title: t('www.terms.sections.accounts.title'),
			content: <p>{t('www.terms.sections.accounts.content')}</p>,
		},
		{
			id: 'store-and-billing',
			title: t('www.terms.sections.storeAndBilling.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.terms.sections.storeAndBilling.content')}</p>
					<div className="space-y-3">
						<PolicySubsection code="7.1" id="store-and-billing-7-1">
							{t('www.terms.sections.storeAndBilling.items.0')}
						</PolicySubsection>
						<PolicySubsection code="7.2" id="store-and-billing-7-2">
							{t('www.terms.sections.storeAndBilling.items.1')}
						</PolicySubsection>
						<PolicySubsection code="7.3" id="store-and-billing-7-3">
							{t('www.terms.sections.storeAndBilling.items.2')}
						</PolicySubsection>
						<PolicySubsection code="7.4" id="store-and-billing-7-4">
							{t('www.terms.sections.storeAndBilling.items.3')}
						</PolicySubsection>
						<PolicySubsection code="7.5" id="store-and-billing-7-5">
							{t('www.terms.sections.storeAndBilling.items.4')}
						</PolicySubsection>
					</div>
				</div>
			),
		},
		{
			id: 'desktop-client',
			title: t('www.terms.sections.desktopClient.title'),
			content: <p>{t('www.terms.sections.desktopClient.content')}</p>,
		},
		{
			id: 'data',
			title: t('www.terms.sections.data.title'),
			content: (
				<p>
					{t('www.terms.sections.data.contentPrefix')}
					<Link href="/privacy" className="text-(--accent) hover:underline font-medium">
						{t('www.terms.sections.data.contentLink')}
					</Link>
					{t('www.terms.sections.data.contentMiddle')}
					<Link href="/cookies" className="text-(--accent) hover:underline font-medium">
						{t('www.terms.sections.data.cookiesLink')}
					</Link>
					{t('www.terms.sections.data.contentSuffix')}
				</p>
			),
		},
		{
			id: 'availability',
			title: t('www.terms.sections.availability.title'),
			content: (
				<div className="space-y-3">
					<PolicySubsection code="10.1" id="availability-10-1">
						{t('www.terms.sections.availability.items.0')}
					</PolicySubsection>
					<PolicySubsection code="10.2" id="availability-10-2">
						{t('www.terms.sections.availability.items.1')}
					</PolicySubsection>
				</div>
			),
		},
		{
			id: 'third-party',
			title: t('www.terms.sections.thirdParty.title'),
			content: (
				<div className="space-y-3">
					<PolicySubsection code="11.1" id="third-party-11-1">
						{t('www.terms.sections.thirdParty.items.0')}
					</PolicySubsection>
					<PolicySubsection code="11.2" id="third-party-11-2">
						{t('www.terms.sections.thirdParty.items.1')}
					</PolicySubsection>
				</div>
			),
		},
		{
			id: 'intellectual-property',
			title: t('www.terms.sections.intellectualProperty.title'),
			content: (
				<div className="space-y-3">
					<PolicySubsection code="12.1" id="intellectual-property-12-1">
						{t('www.terms.sections.intellectualProperty.items.0')}
					</PolicySubsection>
					<PolicySubsection code="12.2" id="intellectual-property-12-2">
						{t('www.terms.sections.intellectualProperty.items.1')}
					</PolicySubsection>
				</div>
			),
		},
		{
			id: 'warranty',
			title: t('www.terms.sections.warranty.title'),
			content: <p>{t('www.terms.sections.warranty.content')}</p>,
		},
		{
			id: 'liability',
			title: t('www.terms.sections.liability.title'),
			content: (
				<div className="space-y-3">
					<PolicySubsection code="14.1" id="liability-14-1">
						{t('www.terms.sections.liability.items.0')}
					</PolicySubsection>
					<PolicySubsection code="14.2" id="liability-14-2">
						{t('www.terms.sections.liability.items.1')}
					</PolicySubsection>
				</div>
			),
		},
		{
			id: 'indemnification',
			title: t('www.terms.sections.indemnification.title'),
			content: <p>{t('www.terms.sections.indemnification.content')}</p>,
		},
		{
			id: 'governing-law',
			title: t('www.terms.sections.governingLaw.title'),
			content: <p>{t('www.terms.sections.governingLaw.content')}</p>,
		},
		{
			id: 'changes',
			title: t('www.terms.sections.changes.title'),
			content: <p>{t('www.terms.sections.changes.content')}</p>,
		},
		{
			id: 'contact',
			title: t('www.terms.sections.contact.title'),
			content: (
				<p>
					{t('www.terms.sections.contact.prefix')} <span className="text-(--accent) font-medium">{t('www.terms.description')}</span>.
				</p>
			),
		},
	];
	const sections: Section[] = rawSections.map((section, idx) => ({
		...section,
		title: `${idx + 1}. ${String(section.title).replace(/^\d+\.\s*/, '')}`,
	}));
	const [active, setActive] = useState<string | null>(null);
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setActive(entry.target.id);
					}
				});
			},
			{
				root: document.getElementById('main-scroll-container'),
				rootMargin: '-40% 0px -50% 0px',
			}
		);
		sections.forEach((s) => {
			const el = document.getElementById(s.id);
			if (el) observer.observe(el);
		});
		return () => observer.disconnect();
	}, [sections]);
	return (
		<div className="relative">
			<ReadingProgressBar />

			<div className="min-h-screen px-6 py-32">
				<div className="max-w-(--page-width) mx-auto w-full grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-16">
					<PolicyTocSidebar tocTitle={t('www.terms.toc')} sections={sections} activeSectionId={active} onSelectSection={setActive} />

					<div className="space-y-16">
						<header className="text-center mb-16 bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl p-10 shadow-sm">
							<h1
								className="text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm"
								style={{
									fontFamily: 'var(--font-fredoka)',
								}}
							>
								{t('www.terms.header.title')}
							</h1>
							<div className="text-sm font-medium tracking-wide uppercase text-(--text-muted)">{t('www.terms.header.effectiveDate')} 20 November 2026</div>
						</header>

						<div className="bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl p-10 shadow-sm space-y-16">
							{sections.map((section) => (
								<section key={section.id} id={section.id} className="scroll-mt-32 pl-6 border-l-2 border-(--accent)">
									<h2
										className="text-2xl font-bold mb-4 text-(--text)"
										style={{
											fontFamily: 'var(--font-fredoka)',
										}}
									>
										{section.title}
									</h2>
									<div className="text-(--text-muted) leading-relaxed">{section.content}</div>
								</section>
							))}
						</div>

						<PageFaqSection
							subtitle={t('www.terms.faq.subtitle')}
							items={[
								{ question: t('www.terms.faq.q1'), answer: t('www.terms.faq.a1') },
								{ question: t('www.terms.faq.q2'), answer: t('www.terms.faq.a2') },
								{ question: t('www.terms.faq.q3'), answer: t('www.terms.faq.a3') },
							]}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
