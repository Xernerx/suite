/** @format */
'use client';

import React, { useMemo } from 'react';
import { Markdown } from '@xernerx/ui';
import { parseMarkdownSections } from './types';

export function BlogMarkdownRenderer({ content }: { content: string }) {
	const { intro, sections } = useMemo(() => parseMarkdownSections(content), [content]);

	return (
		<div className="space-y-14">
			{intro && <Markdown>{intro}</Markdown>}

			{sections.map((section) => (
				<section key={section.id} id={section.id} className="scroll-mt-32 pl-6 border-l-2 border-(--accent)">
					<h2 className="text-2xl font-bold mb-4 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{section.title}
					</h2>
					<Markdown>{section.body}</Markdown>
				</section>
			))}
		</div>
	);
}
