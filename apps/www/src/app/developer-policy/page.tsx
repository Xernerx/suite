/** @format */
'use client';

import { ReadingProgressBar } from '@xernerx/components';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { PageFaqSection } from '@/components/PageFaqSection';
import { PolicySubsection, PolicyTocSidebar } from '@/components/PolicySubsection';

type Section = {
	id: string;
	title: string;
	content: React.ReactNode;
};

export default function DeveloperPolicyPage() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { hide } = useSidebar();

	useEffect(() => {
		hide();
	}, [hide]);

	const rawSections: Section[] = [
		{
			id: 'scope',
			title: t('www.developerPolicy.sections.scope.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.developerPolicy.sections.scope.content')}</p>
					<PolicySubsection code="1.1" id="scope-1-1" title={t('www.developerPolicy.sections.scope.noEmploymentTitle')}>
						{t('www.developerPolicy.sections.scope.noEmploymentDesc')}
					</PolicySubsection>
					<p className="text-sm">
						{t('www.developerPolicy.sections.scope.externalPrefix')}{' '}
						<Link href="/terms#api-usage" className="text-(--accent) hover:underline font-medium">
							{t('www.developerPolicy.sections.scope.termsLink')}
						</Link>{' '}
						{t('www.developerPolicy.sections.scope.andText')}{' '}
						<Link href="/license" className="text-(--accent) hover:underline font-medium">
							{t('www.developerPolicy.sections.scope.licenseLink')}
						</Link>
						.
					</p>
				</div>
			),
		},
		{
			id: 'confidentiality',
			title: t('www.developerPolicy.sections.confidentiality.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.developerPolicy.sections.confidentiality.intro')}</p>
					<div className="space-y-4">
						<PolicySubsection code="2.1" id="confidentiality-2-1" title={t('www.developerPolicy.sections.confidentiality.items.proprietaryAssets.title')}>
							{t('www.developerPolicy.sections.confidentiality.items.proprietaryAssets.desc')}
						</PolicySubsection>
						<PolicySubsection code="2.2" id="confidentiality-2-2" title={t('www.developerPolicy.sections.confidentiality.items.authorizedUse.title')}>
							{t('www.developerPolicy.sections.confidentiality.items.authorizedUse.desc')}
						</PolicySubsection>
						<PolicySubsection code="2.3" id="confidentiality-2-3" title={t('www.developerPolicy.sections.confidentiality.items.nonDisclosure.title')}>
							{t('www.developerPolicy.sections.confidentiality.items.nonDisclosure.desc')}
						</PolicySubsection>
					</div>
				</div>
			),
		},
		{
			id: 'credentials-and-security',
			title: t('www.developerPolicy.sections.credentials.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.developerPolicy.sections.credentials.intro')}</p>
					<div className="space-y-4">
						<PolicySubsection code="3.1" id="credentials-3-1" title={t('www.developerPolicy.sections.credentials.items.accountSecurity.title')}>
							{t('www.developerPolicy.sections.credentials.items.accountSecurity.desc')}
						</PolicySubsection>
						<PolicySubsection code="3.2" id="credentials-3-2" title={t('www.developerPolicy.sections.credentials.items.secretHandling.title')}>
							{t('www.developerPolicy.sections.credentials.items.secretHandling.desc')}
						</PolicySubsection>
						<PolicySubsection code="3.3" id="credentials-3-3" title={t('www.developerPolicy.sections.credentials.items.incidentReporting.title')}>
							{t('www.developerPolicy.sections.credentials.items.incidentReporting.desc')}
						</PolicySubsection>
					</div>
				</div>
			),
		},
		{
			id: 'production-data-ethics',
			title: t('www.developerPolicy.sections.dataEthics.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.developerPolicy.sections.dataEthics.intro')}</p>
					<div className="space-y-4">
						<PolicySubsection code="4.1" id="data-ethics-4-1" title={t('www.developerPolicy.sections.dataEthics.items.needToKnow.title')}>
							{t('www.developerPolicy.sections.dataEthics.items.needToKnow.desc')}
						</PolicySubsection>
						<PolicySubsection code="4.2" id="data-ethics-4-2" title={t('www.developerPolicy.sections.dataEthics.items.privacyCommitments.title')}>
							{t('www.developerPolicy.sections.dataEthics.items.privacyCommitments.desc')}
						</PolicySubsection>
						<PolicySubsection code="4.3" id="data-ethics-4-3" title={t('www.developerPolicy.sections.dataEthics.items.noManipulation.title')}>
							{t('www.developerPolicy.sections.dataEthics.items.noManipulation.desc')}
						</PolicySubsection>
						<PolicySubsection code="4.4" id="data-ethics-4-4" title={t('www.developerPolicy.sections.dataEthics.items.auditTrail.title')}>
							{t('www.developerPolicy.sections.dataEthics.items.auditTrail.desc')}
						</PolicySubsection>
					</div>
				</div>
			),
		},
		{
			id: 'change-management',
			title: t('www.developerPolicy.sections.releases.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.developerPolicy.sections.releases.intro')}</p>
					<div className="space-y-4">
						<PolicySubsection code="5.1" id="releases-5-1" title={t('www.developerPolicy.sections.releases.items.devTesting.title')}>
							{t('www.developerPolicy.sections.releases.items.devTesting.desc')}
						</PolicySubsection>
						<PolicySubsection code="5.2" id="releases-5-2" title={t('www.developerPolicy.sections.releases.items.productionProtection.title')}>
							{t('www.developerPolicy.sections.releases.items.productionProtection.desc')}
						</PolicySubsection>
						<PolicySubsection code="5.3" id="releases-5-3" title={t('www.developerPolicy.sections.releases.items.stabilityAndCompatibility.title')}>
							{t('www.developerPolicy.sections.releases.items.stabilityAndCompatibility.desc')}
						</PolicySubsection>
					</div>
				</div>
			),
		},
		{
			id: 'official-bots',
			title: t('www.developerPolicy.sections.bots.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.developerPolicy.sections.bots.intro')}</p>
					<div className="space-y-4">
						<PolicySubsection code="6.1" id="bots-6-1" title={t('www.developerPolicy.sections.bots.items.infoCommand.title')}>
							{t('www.developerPolicy.sections.bots.items.infoCommand.desc')}
						</PolicySubsection>
						<PolicySubsection code="6.2" id="bots-6-2" title={t('www.developerPolicy.sections.bots.items.ecosystemStack.title')}>
							{t('www.developerPolicy.sections.bots.items.ecosystemStack.desc')}
						</PolicySubsection>
						<PolicySubsection code="6.3" id="bots-6-3" title={t('www.developerPolicy.sections.bots.items.leastPrivilege.title')}>
							{t('www.developerPolicy.sections.bots.items.leastPrivilege.desc')}
						</PolicySubsection>
						<PolicySubsection code="6.4" id="bots-6-4" title={t('www.developerPolicy.sections.bots.items.selfServiceWipe.title')}>
							{t('www.developerPolicy.sections.bots.items.selfServiceWipe.desc')}
						</PolicySubsection>
					</div>
				</div>
			),
		},
		{
			id: 'sdk-development',
			title: t('www.developerPolicy.sections.sdk.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.developerPolicy.sections.sdk.intro')}</p>
					<div className="space-y-4">
						<PolicySubsection code="7.1" id="sdk-7-1" title={t('www.developerPolicy.sections.sdk.items.openSourceBoundary.title')}>
							{t('www.developerPolicy.sections.sdk.items.openSourceBoundary.desc')}
						</PolicySubsection>
						<PolicySubsection code="7.2" id="sdk-7-2" title={t('www.developerPolicy.sections.sdk.items.semverAndCompatibility.title')}>
							{t('www.developerPolicy.sections.sdk.items.semverAndCompatibility.desc')}
						</PolicySubsection>
						<PolicySubsection code="7.3" id="sdk-7-3" title={t('www.developerPolicy.sections.sdk.items.docsAndExamples.title')}>
							{t('www.developerPolicy.sections.sdk.items.docsAndExamples.desc')}
						</PolicySubsection>
						<PolicySubsection code="7.4" id="sdk-7-4" title={t('www.developerPolicy.sections.sdk.items.supplyChainSecurity.title')}>
							{t('www.developerPolicy.sections.sdk.items.supplyChainSecurity.desc')}
						</PolicySubsection>
					</div>
				</div>
			),
		},
		{
			id: 'intellectual-property',
			title: t('www.developerPolicy.sections.ip.title'),
			content: (
				<div className="space-y-4">
					<PolicySubsection code="8.1" id="ip-8-1" title={t('www.developerPolicy.sections.ip.items.ipOwnership.title')}>
						{t('www.developerPolicy.sections.ip.items.ipOwnership.desc')}
					</PolicySubsection>
					<PolicySubsection code="8.2" id="ip-8-2" title={t('www.developerPolicy.sections.ip.items.brandProtection.title')}>
						{t('www.developerPolicy.sections.ip.items.brandProtection.desc')}
					</PolicySubsection>
				</div>
			),
		},
		{
			id: 'offboarding-and-enforcement',
			title: t('www.developerPolicy.sections.offboarding.title'),
			content: (
				<div className="space-y-4">
					<div className="space-y-4">
						<PolicySubsection code="9.1" id="offboarding-9-1" title={t('www.developerPolicy.sections.offboarding.items.accessRevocation.title')}>
							{t('www.developerPolicy.sections.offboarding.items.accessRevocation.desc')}
						</PolicySubsection>
						<PolicySubsection code="9.2" id="offboarding-9-2" title={t('www.developerPolicy.sections.offboarding.items.dataDestruction.title')}>
							{t('www.developerPolicy.sections.offboarding.items.dataDestruction.desc')}
						</PolicySubsection>
						<PolicySubsection code="9.3" id="offboarding-9-3" title={t('www.developerPolicy.sections.offboarding.items.enforcement.title')}>
							{t('www.developerPolicy.sections.offboarding.items.enforcement.desc')}
						</PolicySubsection>
					</div>
					<p className="text-sm pt-2">
						{t('www.developerPolicy.sections.offboarding.relatedPrefix')}{' '}
						<Link href="/security" className="text-(--accent) hover:underline font-medium">
							{t('www.developerPolicy.sections.offboarding.securityLink')}
						</Link>
						{', '}
						<Link href="/license" className="text-(--accent) hover:underline font-medium">
							{t('www.developerPolicy.sections.offboarding.licenseLink')}
						</Link>
						{', '}
						<Link href="/terms" className="text-(--accent) hover:underline font-medium">
							{t('www.developerPolicy.sections.offboarding.termsLink')}
						</Link>
						{', '}
						<Link href="/privacy" className="text-(--accent) hover:underline font-medium">
							{t('www.developerPolicy.sections.offboarding.privacyLink')}
						</Link>
						{', '}
						{t('www.developerPolicy.sections.scope.andText')}{' '}
						<a href={getEnvUrl('https://docs.xernerx.com')} className="text-(--accent) hover:underline font-medium">
							{t('www.developerPolicy.sections.offboarding.docsLink')}
						</a>
						.
					</p>
				</div>
			),
		},
		{
			id: 'contact',
			title: t('www.developerPolicy.sections.contact.title'),
			content: (
				<p>
					{t('www.developerPolicy.sections.contact.prefix')}{' '}
					<a href={`mailto:${t('www.developerPolicy.description')}`} className="text-(--accent) hover:underline font-medium">
						{t('www.developerPolicy.description')}
					</a>
					.
				</p>
			),
		},
	];

	const sections: Section[] = rawSections.map((section, idx) => ({
		...section,
		title: `${idx + 1}. ${String(section.title).replace(/^\d+\.\s*/, '')}`,
	}));

	const [active, setActive] = useState<string | null>(null);
	const sectionIdsKey = sections.map((s) => s.id).join(',');

	useEffect(() => {
		if (typeof IntersectionObserver === 'undefined') return;
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
		sectionIdsKey.split(',').forEach((id) => {
			const el = document.getElementById(id);
			if (el) observer.observe(el);
		});
		return () => observer.disconnect();
	}, [sectionIdsKey]);

	return (
		<div className="relative">
			<ReadingProgressBar />

			<div className="min-h-screen px-6 py-32">
				<div className="max-w-(--page-width) mx-auto w-full grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-16">
					<PolicyTocSidebar tocTitle={t('www.developerPolicy.toc')} sections={sections} activeSectionId={active} onSelectSection={setActive} />

					<div className="space-y-16">
						<header className="text-center mb-16 bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl p-10 shadow-sm">
							<h1
								className="text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm"
								style={{
									fontFamily: 'var(--font-fredoka)',
								}}
							>
								{t('www.developerPolicy.header.title')}
							</h1>
							<p className="text-sm text-(--text-muted) max-w-2xl mx-auto mb-4">{t('www.developerPolicy.header.subtitle')}</p>
							<div className="text-sm font-medium tracking-wide uppercase text-(--text-muted)">{t('www.developerPolicy.header.effectiveDate')} 20 November 2026</div>
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
							subtitle={t('www.developerPolicy.faq.subtitle')}
							items={[
								{ question: t('www.developerPolicy.faq.q1'), answer: t('www.developerPolicy.faq.a1') },
								{ question: t('www.developerPolicy.faq.q2'), answer: t('www.developerPolicy.faq.a2') },
								{ question: t('www.developerPolicy.faq.q3'), answer: t('www.developerPolicy.faq.a3') },
							]}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
