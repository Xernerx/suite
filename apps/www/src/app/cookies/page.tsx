/** @format */
'use client';

import { ReadingProgressBar } from '@xernerx/components';
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
			title: t('www.cookies.sections.introduction.title'),
			content: <p>{t('www.cookies.sections.introduction.content')}</p>,
		},
		{
			id: 'what-are-cookies',
			title: t('www.cookies.sections.whatAreCookies.title'),
			content: <p>{t('www.cookies.sections.whatAreCookies.content')}</p>,
		},
		{
			id: 'categories',
			title: t('www.cookies.sections.categories.title'),
			content: (
				<div className="space-y-3">
					<PolicySubsection code="3.1" id="categories-3-1" title={t('www.cookies.sections.categories.essential.title')}>
						{t('www.cookies.sections.categories.essential.desc')}
					</PolicySubsection>
					<PolicySubsection code="3.2" id="categories-3-2" title={t('www.cookies.sections.categories.functional.title')}>
						{t('www.cookies.sections.categories.functional.desc')}
					</PolicySubsection>
					<PolicySubsection code="3.3" id="categories-3-3" title={t('www.cookies.sections.categories.analytics.title')}>
						{t('www.cookies.sections.categories.analytics.desc')}
					</PolicySubsection>
					<PolicySubsection code="3.4" id="categories-3-4" title={t('www.cookies.sections.categories.marketing.title')}>
						{t('www.cookies.sections.categories.marketing.desc')}
					</PolicySubsection>
				</div>
			),
		},
		{
			id: 'cookies-used',
			title: t('www.cookies.sections.cookiesUsed.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.cookies.sections.cookiesUsed.content')}</p>
					<div className="space-y-3">
						<PolicySubsection code="4.1" id="cookies-used-4-1" title={t('www.cookies.sections.cookiesUsed.auth.title')}>
							{t('www.cookies.sections.cookiesUsed.auth.desc')}
						</PolicySubsection>
						<PolicySubsection code="4.2" id="cookies-used-4-2" title={t('www.cookies.sections.cookiesUsed.consent.title')}>
							{t('www.cookies.sections.cookiesUsed.consent.desc')}
						</PolicySubsection>
						<PolicySubsection code="4.3" id="cookies-used-4-3" title={t('www.cookies.sections.cookiesUsed.locale.title')}>
							{t('www.cookies.sections.cookiesUsed.locale.desc')}
						</PolicySubsection>
						<PolicySubsection code="4.4" id="cookies-used-4-4" title={t('www.cookies.sections.cookiesUsed.appearance.title')}>
							{t('www.cookies.sections.cookiesUsed.appearance.desc')}
						</PolicySubsection>
					</div>
				</div>
			),
		},
		{
			id: 'local-storage',
			title: t('www.cookies.sections.localStorage.title'),
			content: <p>{t('www.cookies.sections.localStorage.content')}</p>,
		},
		{
			id: 'third-party',
			title: t('www.cookies.sections.thirdParty.title'),
			content: <p>{t('www.cookies.sections.thirdParty.content')}</p>,
		},
		{
			id: 'managing',
			title: t('www.cookies.sections.managing.title'),
			content: <p>{t('www.cookies.sections.managing.content')}</p>,
		},
		{
			id: 'changes',
			title: t('www.cookies.sections.changes.title'),
			content: <p>{t('www.cookies.sections.changes.content')}</p>,
		},
		{
			id: 'contact',
			title: t('www.cookies.sections.contact.title'),
			content: (
				<p>
					{t('www.cookies.sections.contact.prefix')} <span className="text-(--accent) font-medium">{t('www.cookies.description')}</span>.
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
					<PolicyTocSidebar tocTitle={t('www.cookies.toc')} sections={sections} activeSectionId={active} onSelectSection={setActive} />

					{/* MAIN */}
					<div className="space-y-16">
						<header className="text-center mb-16 bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl p-10 shadow-sm">
							<h1
								className="text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm"
								style={{
									fontFamily: 'var(--font-fredoka)',
								}}
							>
								{t('www.cookies.header.title')}
							</h1>
							<div className="text-sm font-medium tracking-wide uppercase text-(--text-muted)">{t('www.cookies.header.effectiveDate')} 20 November 2026</div>
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
							subtitle={t('www.cookies.faq.subtitle')}
							items={[
								{ question: t('www.cookies.faq.q1'), answer: t('www.cookies.faq.a1') },
								{ question: t('www.cookies.faq.q2'), answer: t('www.cookies.faq.a2') },
								{ question: t('www.cookies.faq.q3'), answer: t('www.cookies.faq.a3') },
							]}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
