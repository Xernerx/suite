/** @format */

'use client';

import { useDictionary } from '@xernerx/providers';

export interface PageFaqItem {
	question: string;
	answer: string;
}

interface PageFaqSectionProps {
	items: PageFaqItem[];
	subtitle?: string;
}

export function PageFaqSection({ items, subtitle }: PageFaqSectionProps) {
	const { t } = useDictionary();

	if (!items || items.length === 0) return null;

	const faqHeading = t('www.faq.heading');
	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: items.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer,
			},
		})),
	};

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
			<section className="sr-only" aria-label={faqHeading}>
				<h2>{faqHeading}</h2>
				{subtitle && <p>{subtitle}</p>}
				{items.map((item) => (
					<div key={item.question}>
						<h3>{item.question}</h3>
						<p>{item.answer}</p>
					</div>
				))}
			</section>
		</>
	);
}
