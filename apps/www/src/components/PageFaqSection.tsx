/** @format */

'use client';

export interface PageFaqItem {
	question: string;
	answer: string;
}

interface PageFaqSectionProps {
	items: PageFaqItem[];
	subtitle?: string;
}

export function PageFaqSection({ items }: PageFaqSectionProps) {
	if (!items || items.length === 0) return null;

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

	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />;
}
