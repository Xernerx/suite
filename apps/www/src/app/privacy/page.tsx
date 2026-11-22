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
			title: t('www.privacy.sections.introduction.title'),
			content: <p>{t('www.privacy.sections.introduction.content')}</p>,
		},
		{
			id: 'data-collected',
			title: t('www.privacy.sections.dataCollected.title'),
			content: (
				<div className="space-y-3">
					<PolicySubsection code="2.1" id="data-collected-2-1" title={t('www.privacy.sections.dataCollected.account.title')}>
						{t('www.privacy.sections.dataCollected.account.desc')}
					</PolicySubsection>
					<PolicySubsection code="2.2" id="data-collected-2-2" title={t('www.privacy.sections.dataCollected.connections.title')}>
						{t('www.privacy.sections.dataCollected.connections.desc')}
					</PolicySubsection>
					<PolicySubsection code="2.3" id="data-collected-2-3" title={t('www.privacy.sections.dataCollected.developers.title')}>
						{t('www.privacy.sections.dataCollected.developers.desc')}
					</PolicySubsection>
					<PolicySubsection code="2.4" id="data-collected-2-4" title={t('www.privacy.sections.dataCollected.botUsers.title')}>
						{t('www.privacy.sections.dataCollected.botUsers.desc')}
					</PolicySubsection>
					<PolicySubsection code="2.5" id="data-collected-2-5" title={t('www.privacy.sections.dataCollected.cdnAndContent.title')}>
						{t('www.privacy.sections.dataCollected.cdnAndContent.desc')}
					</PolicySubsection>
					<PolicySubsection code="2.6" id="data-collected-2-6" title={t('www.privacy.sections.dataCollected.desktop.title')}>
						{t('www.privacy.sections.dataCollected.desktop.desc')}
					</PolicySubsection>
					<PolicySubsection code="2.7" id="data-collected-2-7" title={t('www.privacy.sections.dataCollected.usage.title')}>
						{t('www.privacy.sections.dataCollected.usage.desc')}
					</PolicySubsection>
					<PolicySubsection code="2.8" id="data-collected-2-8" title={t('www.privacy.sections.dataCollected.integration.title')}>
						{t('www.privacy.sections.dataCollected.integration.desc')}
					</PolicySubsection>
				</div>
			),
		},
		{
			id: 'api-data',
			title: t('www.privacy.sections.apiData.title'),
			content: <p>{t('www.privacy.sections.apiData.content')}</p>,
		},
		{
			id: 'legal-basis',
			title: t('www.privacy.sections.legalBasis.title'),
			content: <p>{t('www.privacy.sections.legalBasis.content')}</p>,
		},
		{
			id: 'usage',
			title: t('www.privacy.sections.usage.title'),
			content: (
				<div className="space-y-3">
					<PolicySubsection code="5.1" id="usage-5-1">
						{t('www.privacy.sections.usage.items.0')}
					</PolicySubsection>
					<PolicySubsection code="5.2" id="usage-5-2">
						{t('www.privacy.sections.usage.items.1')}
					</PolicySubsection>
					<PolicySubsection code="5.3" id="usage-5-3">
						{t('www.privacy.sections.usage.items.2')}
					</PolicySubsection>
					<PolicySubsection code="5.4" id="usage-5-4">
						{t('www.privacy.sections.usage.items.3')}
					</PolicySubsection>
				</div>
			),
		},
		{
			id: 'sharing',
			title: t('www.privacy.sections.sharing.title'),
			content: (
				<div className="space-y-3">
					<PolicySubsection code="6.1" id="sharing-6-1">
						{t('www.privacy.sections.sharing.items.0')}
					</PolicySubsection>
					<PolicySubsection code="6.2" id="sharing-6-2">
						{t('www.privacy.sections.sharing.items.1')}
					</PolicySubsection>
					<PolicySubsection code="6.3" id="sharing-6-3">
						{t('www.privacy.sections.sharing.items.2')}
					</PolicySubsection>
					<PolicySubsection code="6.4" id="sharing-6-4">
						{t('www.privacy.sections.sharing.items.3')}
					</PolicySubsection>
				</div>
			),
		},
		{
			id: 'retention',
			title: t('www.privacy.sections.retention.title'),
			content: <p>{t('www.privacy.sections.retention.content')}</p>,
		},
		{
			id: 'security',
			title: t('www.privacy.sections.security.title'),
			content: <p>{t('www.privacy.sections.security.content')}</p>,
		},
		{
			id: 'rights',
			title: t('www.privacy.sections.rights.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.privacy.sections.rights.content')}</p>
					<div className="space-y-3">
						<PolicySubsection code="9.1" id="rights-9-1">
							{t('www.privacy.sections.rights.items.0')}
						</PolicySubsection>
						<PolicySubsection code="9.2" id="rights-9-2">
							{t('www.privacy.sections.rights.items.1')}
						</PolicySubsection>
						<PolicySubsection code="9.3" id="rights-9-3">
							{t('www.privacy.sections.rights.items.2')}
						</PolicySubsection>
						<PolicySubsection code="9.4" id="rights-9-4">
							{t('www.privacy.sections.rights.items.3')}
						</PolicySubsection>
					</div>
				</div>
			),
		},
		{
			id: 'cookies',
			title: t('www.privacy.sections.cookies.title'),
			content: (
				<p>
					{t('www.privacy.sections.cookies.content')}
					<Link href="/cookies" className="text-(--accent) hover:underline font-medium">
						{t('www.privacy.sections.cookies.linkText')}
					</Link>
					{t('www.privacy.sections.cookies.contentSuffix')}
				</p>
			),
		},
		{
			id: 'international',
			title: t('www.privacy.sections.international.title'),
			content: <p>{t('www.privacy.sections.international.content')}</p>,
		},
		{
			id: 'childrens-privacy',
			title: t('www.privacy.sections.childrensPrivacy.title'),
			content: <p>{t('www.privacy.sections.childrensPrivacy.content')}</p>,
		},
		{
			id: 'changes',
			title: t('www.privacy.sections.changes.title'),
			content: <p>{t('www.privacy.sections.changes.content')}</p>,
		},
		{
			id: 'contact',
			title: t('www.privacy.sections.contact.title'),
			content: (
				<p>
					{t('www.privacy.sections.contact.prefix')} <span className="text-(--accent) font-medium">{t('www.privacy.description')}</span>.
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
					{/* TOC */}
					<PolicyTocSidebar tocTitle={t('www.privacy.toc')} sections={sections} activeSectionId={active} onSelectSection={setActive} />

					{/* MAIN */}
					<div className="space-y-16">
						<header className="text-center mb-16 bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl p-10 shadow-sm">
							<h1
								className="text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm"
								style={{
									fontFamily: 'var(--font-fredoka)',
								}}
							>
								{t('www.privacy.header.title')}
							</h1>
							<div className="text-sm font-medium tracking-wide uppercase text-(--text-muted)">{t('www.privacy.header.effectiveDate')} 20 November 2026</div>
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
							subtitle={t('www.privacy.faq.subtitle')}
							items={[
								{ question: t('www.privacy.faq.q1'), answer: t('www.privacy.faq.a1') },
								{ question: t('www.privacy.faq.q2'), answer: t('www.privacy.faq.a2') },
								{ question: t('www.privacy.faq.q3'), answer: t('www.privacy.faq.a3') },
							]}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
