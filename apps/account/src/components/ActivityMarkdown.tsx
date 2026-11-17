/** @format */
'use client';

import React from 'react';
import { Markdown, type MarkdownProps } from '@xernerx/ui';

interface ActivityMarkdownProps {
	text: string;
	inline?: boolean;
	insideLink?: boolean;
	className?: string;
}

type MarkdownComponents = NonNullable<MarkdownProps['components']>;

const INLINE_BASE_COMPONENTS: MarkdownComponents = {
	p: ({ children }: { children?: React.ReactNode }) => <span className="mr-1.5">{children}</span>,
	h1: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-(--text) mr-1">{children}</strong>,
	h2: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-(--text) mr-1">{children}</strong>,
	h3: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-(--text) mr-1">{children}</strong>,
	ul: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
	ol: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
	li: ({ children }: { children?: React.ReactNode }) => <span className="mr-1.5">• {children}</span>,
	blockquote: ({ children }: { children?: React.ReactNode }) => <span className="italic opacity-90 mr-1.5">{children}</span>,
};

const INLINE_LINK_SAFE_COMPONENTS: MarkdownComponents = {
	...INLINE_BASE_COMPONENTS,
	a: ({ children }: { children?: React.ReactNode }) => <span className="text-(--accent) underline underline-offset-2">{children}</span>,
};

export function ActivityMarkdown({ text, inline = false, insideLink = false, className = '' }: ActivityMarkdownProps) {
	if (!text) return null;

	if (inline) {
		return (
			<Markdown
				content={text}
				className={className}
				proseClassName="text-xs !text-(--text-muted) !space-y-0 leading-relaxed line-clamp-2"
				components={insideLink ? INLINE_LINK_SAFE_COMPONENTS : INLINE_BASE_COMPONENTS}
			/>
		);
	}

	return <Markdown content={text} className={className} proseClassName="text-xs !space-y-1.5 leading-relaxed" />;
}
