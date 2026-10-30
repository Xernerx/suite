/** @format */
'use client';

import { useDictionary } from '@xernerx/providers';

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'] as const;

export default function PortalSeoSection() {
	const { t } = useDictionary();

	const faqs = FAQ_KEYS.map((qKey, idx) => {
		const aKey = `a${idx + 1}`;
		return {
			question: t(`app.portal.seo.faq.${qKey}`),
			answer: t(`app.portal.seo.faq.${aKey}`),
		};
	}).filter((item) => item.question && !item.question.startsWith('app.portal.seo.'));

	const jsonLd = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'SoftwareApplication',
				name: 'Xernerx Portal',
				applicationCategory: 'DeveloperApplication',
				operatingSystem: 'Web, Windows, macOS, Linux',
				url: 'https://portal.xernerx.com',
				description: t('app.portal.seo.guideIntro'),
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
				mainEntity: faqs.map((item) => ({
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

	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
