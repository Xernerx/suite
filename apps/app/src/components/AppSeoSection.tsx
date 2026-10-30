/** @format */

'use client';

import { useDictionary } from '@xernerx/providers';

export type AppSeoPageKey = 'home' | 'leaderboard' | 'dashboard' | 'bots' | 'servers';

interface AppSeoSectionProps {
	page: AppSeoPageKey;
}

export function AppSeoSection({ page }: AppSeoSectionProps) {
	const { t } = useDictionary();

	const faqItems = [
		{ question: t(`app.seo.${page}.faq.q1`), answer: t(`app.seo.${page}.faq.a1`) },
		{ question: t(`app.seo.${page}.faq.q2`), answer: t(`app.seo.${page}.faq.a2`) },
		{ question: t(`app.seo.${page}.faq.q3`), answer: t(`app.seo.${page}.faq.a3`) },
		{ question: t(`app.seo.${page}.faq.q4`), answer: t(`app.seo.${page}.faq.a4`) },
	];

	const structuredData = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'SoftwareApplication',
				name: 'Xernerx App — Discord Bot List, Server Explorer & Dashboard',
				applicationCategory: 'WebApplication',
				operatingSystem: 'Web, Windows, macOS, Linux',
				url: `https://app.xernerx.com${page === 'home' ? '' : `/${page}`}`,
				description: t(`app.seo.${page}.guideIntro`),
				offers: {
					'@type': 'Offer',
					price: '0',
					priceCurrency: 'EUR',
				},
				author: {
					'@type': 'Organization',
					name: 'Xernerx Studios',
					url: 'https://www.xernerx.com',
					email: 'support@xernerx.com',
				},
			},
			{
				'@type': 'FAQPage',
				mainEntity: faqItems.map((item) => ({
					'@type': 'Question',
					name: item.question,
					acceptedAnswer: {
						'@type': 'Answer',
						text: item.answer,
					},
				})),
			},
		],
	};

	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />;
}
