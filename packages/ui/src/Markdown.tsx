/** @format */
'use client';

import React, { useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { Bold, Code, Eye, Heading3, Italic, Link as LinkIcon, List, Pencil, Quote } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Input } from './Input';

export interface MarkdownProps {
	/** Markdown string content (can also be passed via `value` or `children`) */
	content?: string | null;
	/** Alias for `content` in controlled editors */
	value?: string | null;
	/** Markdown string child */
	children?: string | null;
	/** Enable markdown editor mode with Write / Preview switcher and formatting toolbar */
	editable?: boolean;
	/** Controlled preview state (when `editable` is true, toggles between editor and preview; when `editable` is false, defaults to true) */
	preview?: boolean;
	/** Initial preview state when uncontrolled in `editable` mode (defaults to false) */
	defaultPreview?: boolean;
	/** Callback when preview state changes in `editable` mode */
	onPreviewChange?: (preview: boolean) => void;
	/** Callback when markdown text changes in `editable` mode */
	onChange?: (value: string) => void;
	/** Optional field label shown above the editor/preview header */
	label?: React.ReactNode;
	/** Placeholder text for the textarea when `editable` is true */
	placeholder?: string;
	/** Empty state text or element when there is no markdown content to preview */
	emptyText?: React.ReactNode;
	/** Number of textarea rows in `editable` mode */
	rows?: number;
	/** Maximum character length in `editable` mode */
	maxLength?: number;
	/** Outer wrapper className */
	className?: string;
	/** Prose container className */
	proseClassName?: string;
	/** Custom ReactMarkdown component overrides (merged with default theme-aware components) */
	components?: Components;
}

const DEFAULT_COMPONENTS: Components = {
	p: ({ node: _node, className = '', ...props }) => <p {...props} className={`text-(--text) leading-relaxed ${className}`.trim()} style={{ color: 'var(--text)' }} />,
	strong: ({ node: _node, className = '', ...props }) => <strong {...props} className={`font-bold text-(--text) ${className}`.trim()} style={{ color: 'var(--text)' }} />,
	em: ({ node: _node, className = '', ...props }) => <em {...props} className={`italic text-(--text) ${className}`.trim()} style={{ color: 'var(--text)' }} />,
	h1: ({ node: _node, className = '', ...props }) => <h1 {...props} className={`text-(--text) font-bold ${className}`.trim()} style={{ color: 'var(--text)', fontFamily: 'var(--font-fredoka)' }} />,
	h2: ({ node: _node, className = '', ...props }) => <h2 {...props} className={`text-(--text) font-bold ${className}`.trim()} style={{ color: 'var(--text)', fontFamily: 'var(--font-fredoka)' }} />,
	h3: ({ node: _node, className = '', ...props }) => <h3 {...props} className={`text-(--text) font-bold ${className}`.trim()} style={{ color: 'var(--text)', fontFamily: 'var(--font-fredoka)' }} />,
	h4: ({ node: _node, className = '', ...props }) => <h4 {...props} className={`text-(--text) font-bold ${className}`.trim()} style={{ color: 'var(--text)', fontFamily: 'var(--font-fredoka)' }} />,
	ul: ({ node: _node, className = '', ...props }) => <ul {...props} className={`text-(--text) list-disc pl-5 space-y-1 ${className}`.trim()} style={{ color: 'var(--text)' }} />,
	ol: ({ node: _node, className = '', ...props }) => <ol {...props} className={`text-(--text) list-decimal pl-5 space-y-1 ${className}`.trim()} style={{ color: 'var(--text)' }} />,
	li: ({ node: _node, className = '', ...props }) => <li {...props} className={`text-(--text) ${className}`.trim()} style={{ color: 'var(--text)' }} />,
	blockquote: ({ node: _node, className = '', ...props }) => (
		<blockquote
			{...props}
			className={`border-l-4 border-(--accent)/50 bg-(--background)/40 pl-4 py-2 my-4 rounded-r-2xl text-(--text) italic ${className}`.trim()}
			style={{ color: 'var(--text)' }}
		/>
	),
	a: ({ node: _node, className = '', ...props }) => (
		<a
			{...props}
			target={props.href?.startsWith('http') ? '_blank' : undefined}
			rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
			className={`text-(--accent) font-semibold underline decoration-(--accent)/40 underline-offset-4 hover:decoration-(--accent) transition-colors ${className}`.trim()}
		/>
	),
	hr: ({ node: _node, className = '', ...props }) => <hr {...props} className={`border-(--border)/15 my-6 ${className}`.trim()} />,
	pre: ({ node: _node, className = '', ...props }) => (
		<pre
			{...props}
			className={`not-prose p-4 rounded-2xl bg-(--background)/70 border border-(--border)/15 overflow-x-auto text-(--text) font-mono text-xs sm:text-sm my-4 ${className}`.trim()}
			style={{ color: 'var(--text)' }}
		/>
	),
	code: ({ node: _node, className = '', children, ...props }) => {
		const contentStr = String(children ?? '');
		const isBlock = Boolean(className?.includes('language-') || contentStr.includes('\n'));
		if (isBlock) {
			return (
				<code {...props} className={`text-(--text) font-mono text-xs sm:text-sm ${className}`.trim()} style={{ color: 'var(--text)' }}>
					{children}
				</code>
			);
		}
		return (
			<code
				{...props}
				className={`not-prose inline-block px-1.5 py-0.5 rounded-lg bg-(--background)/70 border border-(--border)/15 font-mono text-[0.88em] font-semibold text-(--text) ${className}`.trim()}
				style={{ color: 'var(--text)' }}
			>
				{children}
			</code>
		);
	},
};

export function Markdown({
	content,
	value,
	children,
	editable = false,
	preview: controlledPreview,
	defaultPreview = false,
	onPreviewChange,
	onChange,
	label,
	placeholder,
	emptyText,
	rows = 5,
	maxLength,
	className = '',
	proseClassName = '',
	components,
}: MarkdownProps) {
	const { t } = useDictionary();
	const [internalPreview, setInternalPreview] = useState<boolean>(editable ? defaultPreview : true);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	const isPreview = controlledPreview !== undefined ? controlledPreview : editable ? internalPreview : true;
	const rawText = String(value ?? content ?? children ?? '');

	const setPreviewMode = (next: boolean) => {
		if (controlledPreview === undefined) {
			setInternalPreview(next);
		}
		onPreviewChange?.(next);
	};

	const insertFormatting = (prefix: string, suffix = prefix, defaultSnippet = '') => {
		if (!onChange) return;
		const el = textareaRef.current;
		if (!el) {
			onChange(`${rawText}${prefix}${defaultSnippet}${suffix}`);
			return;
		}
		const start = el.selectionStart ?? rawText.length;
		const end = el.selectionEnd ?? rawText.length;
		const selected = rawText.slice(start, end) || defaultSnippet;
		const nextValue = `${rawText.slice(0, start)}${prefix}${selected}${suffix}${rawText.slice(end)}`;
		onChange(nextValue);
		requestAnimationFrame(() => {
			el.focus();
			const cursorStart = start + prefix.length;
			const cursorEnd = cursorStart + selected.length;
			el.setSelectionRange(cursorStart, cursorEnd);
		});
	};

	const mergedComponents: Components = components ? { ...DEFAULT_COMPONENTS, ...components } : DEFAULT_COMPONENTS;

	const renderedMarkdown = rawText.trim() ? (
		<div
			className={`prose max-w-none text-(--text) prose-headings:font-fredoka prose-headings:text-(--text) prose-p:text-(--text) prose-li:text-(--text) prose-strong:text-(--text) prose-code:text-(--text) prose-pre:text-(--text) prose-a:text-(--accent) ${proseClassName}`.trim()}
			style={{ color: 'var(--text)' }}
		>
			<ReactMarkdown components={mergedComponents}>{rawText}</ReactMarkdown>
		</div>
	) : (
		<div className="text-(--text-muted) italic text-sm">{emptyText !== undefined ? emptyText : t('app.portal.info.nothingToPreview')}</div>
	);

	if (!editable) {
		return <div className={className}>{renderedMarkdown}</div>;
	}

	return (
		<div className={`flex flex-col gap-2 ${className}`.trim()}>
			<div className="flex flex-wrap items-center justify-between gap-2">
				{label ? <label className="text-sm font-bold text-(--text)">{label}</label> : <div />}

				<div className="flex items-center gap-2">
					{!isPreview && (
						<div className="hidden sm:flex items-center gap-0.5 bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-1">
							<button
								type="button"
								onClick={() => insertFormatting('**', '**', 'bold')}
								title="Bold"
								className="p-1.5 rounded-xl text-(--text-muted) hover:text-(--text) hover:bg-(--background)/50 transition-colors cursor-pointer"
							>
								<Bold className="w-3.5 h-3.5" />
							</button>
							<button
								type="button"
								onClick={() => insertFormatting('*', '*', 'italic')}
								title="Italic"
								className="p-1.5 rounded-xl text-(--text-muted) hover:text-(--text) hover:bg-(--background)/50 transition-colors cursor-pointer"
							>
								<Italic className="w-3.5 h-3.5" />
							</button>
							<button
								type="button"
								onClick={() => insertFormatting('`', '`', 'code')}
								title="Inline Code"
								className="p-1.5 rounded-xl text-(--text-muted) hover:text-(--text) hover:bg-(--background)/50 transition-colors cursor-pointer"
							>
								<Code className="w-3.5 h-3.5" />
							</button>
							<button
								type="button"
								onClick={() => insertFormatting('### ', '', 'Heading')}
								title="Heading"
								className="p-1.5 rounded-xl text-(--text-muted) hover:text-(--text) hover:bg-(--background)/50 transition-colors cursor-pointer"
							>
								<Heading3 className="w-3.5 h-3.5" />
							</button>
							<button
								type="button"
								onClick={() => insertFormatting('> ', '', 'Quote')}
								title="Quote"
								className="p-1.5 rounded-xl text-(--text-muted) hover:text-(--text) hover:bg-(--background)/50 transition-colors cursor-pointer"
							>
								<Quote className="w-3.5 h-3.5" />
							</button>
							<button
								type="button"
								onClick={() => insertFormatting('- ', '', 'List item')}
								title="List"
								className="p-1.5 rounded-xl text-(--text-muted) hover:text-(--text) hover:bg-(--background)/50 transition-colors cursor-pointer"
							>
								<List className="w-3.5 h-3.5" />
							</button>
							<button
								type="button"
								onClick={() => insertFormatting('[', '](https://)', 'link')}
								title="Link"
								className="p-1.5 rounded-xl text-(--text-muted) hover:text-(--text) hover:bg-(--background)/50 transition-colors cursor-pointer"
							>
								<LinkIcon className="w-3.5 h-3.5" />
							</button>
						</div>
					)}

					<div className="flex items-center bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-1 text-xs">
						<button
							type="button"
							onClick={() => setPreviewMode(false)}
							className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-semibold transition-colors cursor-pointer ${
								!isPreview ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
							}`}
						>
							<Pencil className="w-3 h-3" />
							{t('app.portal.info.write')}
						</button>
						<button
							type="button"
							onClick={() => setPreviewMode(true)}
							className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-semibold transition-colors cursor-pointer ${
								isPreview ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
							}`}
						>
							<Eye className="w-3 h-3" />
							{t('app.portal.info.preview')}
						</button>
					</div>
				</div>
			</div>

			{isPreview ? (
				<div className="w-full min-h-[120px] rounded-2xl border border-(--border)/10 bg-(--background)/50 p-6 text-sm overflow-auto">{renderedMarkdown}</div>
			) : (
				<Input
					ref={textareaRef as any}
					variant="textarea"
					rows={rows}
					maxLength={maxLength}
					value={rawText}
					onChange={(e) => onChange?.(e.target.value)}
					placeholder={placeholder}
					className="min-h-[120px]"
				/>
			)}
		</div>
	);
}

export default Markdown;
