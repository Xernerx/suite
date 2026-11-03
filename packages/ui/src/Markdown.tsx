/** @format */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { Bold, Code, Columns2, Eye, Film, Heading3, ImagePlus, Italic, Link as LinkIcon, List, Loader2, Pencil, Quote } from 'lucide-react';
import { useDictionary, useEnvironment, usePermissions, useToast, useUser } from '@xernerx/providers';
import { CodeBlock } from './CodeBlock';
import { Input } from './Input';

export type MarkdownMode = 'write' | 'split' | 'preview';

interface ActiveMediaUpload {
	id: string;
	name: string;
	sizeBytes: number;
	isVideo: boolean;
	progress: number;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface MarkdownProps {
	/** Markdown string content (can also be passed via `value` or `children`) */
	content?: string | null;
	/** Alias for `content` in controlled editors */
	value?: string | null;
	/** Markdown string child */
	children?: string | null;
	/** Enable markdown editor mode with Write / Split / Preview switcher and formatting toolbar */
	editable?: boolean;
	/** Strictly opt-in Admin-only clipboard image/video paste -> CDN upload (only active on admin/ for staff with access + uploadMedia/manageMedia) */
	allowAdminMediaPaste?: boolean;
	/** Controlled editor mode (`'write' | 'split' | 'preview'`) when `editable` is true */
	mode?: MarkdownMode;
	/** Initial editor mode when uncontrolled in `editable` mode (defaults to `'write'`) */
	defaultMode?: MarkdownMode;
	/** Callback when editor mode changes in `editable` mode */
	onModeChange?: (mode: MarkdownMode) => void;
	/** Legacy controlled preview boolean (when `editable` is true, maps `true` -> `'preview'`, `false` -> `'write'`) */
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
	/** Whether the textarea is required in `editable` mode */
	required?: boolean;
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
	ul: ({ node: _node, className = '', ...props }) => <ul {...props} className={`text-(--text) list-disc pl-5 space-y-1.5 ${className}`.trim()} style={{ color: 'var(--text)' }} />,
	ol: ({ node: _node, className = '', ...props }) => <ol {...props} className={`text-(--text) list-decimal pl-5 space-y-1.5 ${className}`.trim()} style={{ color: 'var(--text)' }} />,
	li: ({ node: _node, className = '', ...props }) => <li {...props} className={`text-(--text) leading-relaxed ${className}`.trim()} style={{ color: 'var(--text)' }} />,
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
	img: ({ node: _node, className = '', src, alt, ...props }) => {
		const srcStr = typeof src === 'string' ? src : '';
		const altStr = typeof alt === 'string' ? alt : '';
		if (!srcStr) return null;
		const isVideo = srcStr.includes('#video') || altStr.toLowerCase().startsWith('video:') || /\.(mp4|webm|mov|ogg)(\?|$|#)/i.test(srcStr);
		if (isVideo) {
			const cleanAlt = altStr.replace(/^video:/i, '').trim();
			return (
				<video
					src={srcStr}
					controls
					playsInline
					preload="metadata"
					title={cleanAlt || undefined}
					className={`not-prose rounded-2xl border border-(--border)/15 max-h-[480px] max-w-full my-3 bg-(--background)/60 shadow-sm ${className}`.trim()}
				/>
			);
		}
		return (
			<img
				{...props}
				src={srcStr}
				alt={altStr}
				loading="lazy"
				className={`not-prose rounded-2xl border border-(--border)/15 max-h-[480px] max-w-full my-3 object-contain shadow-sm ${className}`.trim()}
			/>
		);
	},
	hr: ({ node: _node, className = '', ...props }) => <hr {...props} className={`border-(--border)/15 my-6 ${className}`.trim()} />,
	pre: ({ children }) => <>{children}</>,
	code: ({ node: _node, className = '', children, ...props }) => {
		const rawCode = String(children ?? '').replace(/\n$/, '');
		const langMatch = /language-(\w+)/.exec(className || '');
		const isBlock = Boolean(langMatch || rawCode.includes('\n'));
		if (isBlock) {
			const lang = langMatch?.[1] || 'ts';
			return (
				<div className="not-prose my-3">
					<CodeBlock tabs={[{ label: lang.toUpperCase(), language: lang, code: rawCode }]} />
				</div>
			);
		}
		return (
			<code
				{...props}
				className={`not-prose inline-block px-1.5 py-0.5 rounded-lg bg-(--background)/70 border border-(--border)/15 font-mono text-[0.88em] font-semibold text-(--accent) ${className}`.trim()}
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
	allowAdminMediaPaste = false,
	mode: controlledMode,
	defaultMode,
	onModeChange,
	preview: controlledPreview,
	defaultPreview = false,
	onPreviewChange,
	onChange,
	label,
	placeholder,
	emptyText,
	rows = 5,
	maxLength,
	required = false,
	className = '',
	proseClassName = '',
	components,
}: MarkdownProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { hasPermission } = usePermissions();
	const { user } = useUser();
	const { toast } = useToast();

	const initialMode: MarkdownMode = editable ? (defaultMode ?? (defaultPreview ? 'preview' : 'write')) : 'preview';
	const [internalMode, setInternalMode] = useState<MarkdownMode>(initialMode);
	const [activeUploads, setActiveUploads] = useState<ActiveMediaUpload[]>([]);
	const [isAdminHost, setIsAdminHost] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const host = window.location.hostname;
		const port = window.location.port;
		setIsAdminHost(port === '4006' || host.startsWith('admin.'));
	}, []);

	const canPasteAdminMedia =
		editable && Boolean(allowAdminMediaPaste) && isAdminHost && Boolean(user?.id) && hasPermission('access') && (hasPermission('uploadMedia') || hasPermission('manageMedia'));

	const activeMode: MarkdownMode = !editable
		? 'preview'
		: controlledMode !== undefined
			? controlledMode
			: internalMode === 'split'
				? 'split'
				: controlledPreview !== undefined
					? controlledPreview
						? 'preview'
						: 'write'
					: internalMode;

	const rawText = String(value ?? content ?? children ?? '');
	const latestTextRef = useRef(rawText);
	latestTextRef.current = rawText;

	const handleSelectMode = (next: MarkdownMode) => {
		if (controlledMode === undefined) {
			setInternalMode(next);
		}
		onModeChange?.(next);
		if (next === 'preview') {
			onPreviewChange?.(true);
		} else if (next === 'write') {
			onPreviewChange?.(false);
		}
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

	const uploadSingleMediaWithProgress = (file: File, isVideo: boolean, uploadId: string): Promise<string> => {
		return new Promise((resolve, reject) => {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('privacy', 'limited');
			formData.append('folder', 'Admin Markdown');
			formData.append('source', 'admin-markdown');
			formData.append('tags', JSON.stringify(['admin', 'markdown', isVideo ? 'video' : 'image']));

			const xhr = new XMLHttpRequest();
			xhr.open('POST', getEnvUrl(`https://cdn.xernerx.com/upload/${user?.id}`), true);
			xhr.withCredentials = true;

			xhr.upload.onprogress = (evt) => {
				if (evt.lengthComputable && evt.total > 0) {
					const pct = Math.min(95, Math.max(8, Math.round((evt.loaded / evt.total) * 95)));
					setActiveUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: pct } : u)));
				}
			};

			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					try {
						const data = JSON.parse(xhr.responseText);
						const cdnUrl = data?.url ? getEnvUrl(data.url) : '';
						if (cdnUrl) {
							setActiveUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: 100 } : u)));
							resolve(cdnUrl);
							return;
						}
					} catch {}
				}
				reject(new Error('Upload failed'));
			};

			xhr.onerror = () => reject(new Error('Network error'));
			xhr.send(formData);
		});
	};

	const handlePasteMedia = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
		if (!canPasteAdminMedia || !onChange || !user?.id) return;

		const clipboardItems = Array.from(e.clipboardData?.items || []);
		const mediaFiles: File[] = [];

		for (const item of clipboardItems) {
			if (item.kind === 'file' && (item.type.startsWith('image/') || item.type.startsWith('video/'))) {
				const f = item.getAsFile();
				if (f) mediaFiles.push(f);
			}
		}

		if (mediaFiles.length === 0 && e.clipboardData?.files?.length) {
			for (const f of Array.from(e.clipboardData.files)) {
				if (f.type.startsWith('image/') || f.type.startsWith('video/')) {
					mediaFiles.push(f);
				}
			}
		}

		if (mediaFiles.length === 0) return;

		e.preventDefault();

		const el = textareaRef.current;
		let insertOffset = el?.selectionStart ?? latestTextRef.current.length;

		const uploadTasks = mediaFiles.map((file, idx) => {
			const isVideo = file.type.startsWith('video/');
			const ext = (file.name.split('.').pop() || (isVideo ? 'mp4' : 'png')).toLowerCase();
			const baseName = file.name && !/^image\./i.test(file.name) ? file.name : `pasted-${isVideo ? 'video' : 'image'}-${Date.now()}-${idx + 1}.${ext}`;
			const normalizedFile = file.name === baseName ? file : new File([file], baseName, { type: file.type });
			const id = `upload-${Date.now()}-${idx}`;
			return { id, file: normalizedFile, baseName, isVideo, sizeBytes: normalizedFile.size };
		});

		setActiveUploads((prev) => [
			...prev,
			...uploadTasks.map((u) => ({
				id: u.id,
				name: u.baseName,
				sizeBytes: u.sizeBytes,
				isVideo: u.isVideo,
				progress: 12,
			})),
		]);

		for (const task of uploadTasks) {
			try {
				const cdnUrl = await uploadSingleMediaWithProgress(task.file, task.isVideo, task.id);
				const markdownLink = task.isVideo ? `![video:${task.baseName}](${cdnUrl}#video)` : `![${task.baseName}](${cdnUrl})`;

				const currentText = latestTextRef.current;
				const safeOffset = Math.min(insertOffset, currentText.length);
				const before = currentText.slice(0, safeOffset);
				const after = currentText.slice(safeOffset);
				const needsLeadingNewline = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
				const needsTrailingNewline = after.length > 0 && !after.startsWith('\n') ? '\n' : '';
				const insertedChunk = `${needsLeadingNewline}${markdownLink}${needsTrailingNewline}`;
				const nextText = `${before}${insertedChunk}${after}`;

				insertOffset = safeOffset + insertedChunk.length;
				latestTextRef.current = nextText;
				onChange(nextText);

				toast({
					type: 'success',
					title: t('app.portal.info.mediaUploadedTitle'),
					description: task.baseName,
				});
			} catch {
				toast({
					type: 'error',
					title: t('app.portal.info.mediaUploadFailedTitle'),
					description: task.baseName,
				});
			} finally {
				setActiveUploads((prev) => prev.filter((u) => u.id !== task.id));
			}
		}
	};

	const mergedComponents: Components = components ? { ...DEFAULT_COMPONENTS, ...components } : DEFAULT_COMPONENTS;

	const renderedMarkdown = rawText.trim() ? (
		<div
			className={`prose max-w-none space-y-3 text-(--text) prose-headings:font-fredoka prose-headings:text-(--text) prose-p:text-(--text) prose-li:text-(--text) prose-strong:text-(--text) prose-code:text-(--text) prose-pre:text-(--text) prose-a:text-(--accent) ${proseClassName}`.trim()}
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

	const showEditor = activeMode === 'write' || activeMode === 'split';
	const showPreview = activeMode === 'preview' || activeMode === 'split';

	return (
		<div className={`flex flex-col gap-2.5 ${className}`.trim()}>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					{label ? <label className="text-sm font-bold text-(--text)">{label}</label> : null}
					{canPasteAdminMedia && (
						<span className="inline-flex items-center gap-1.5 rounded-full bg-(--accent)/10 border border-(--accent)/25 px-2.5 py-0.5 text-[11px] font-semibold text-(--accent)">
							{activeUploads.length > 0 ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
							{activeUploads.length > 0 ? t('app.portal.info.uploadingMedia') : t('app.portal.info.pasteMediaHint')}
						</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					{showEditor && (
						<div className="hidden sm:flex items-center gap-0.5 bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-1">
							{(
								[
									{ icon: Bold, prefix: '**', suffix: '**', snippet: 'bold', title: 'Bold' },
									{ icon: Italic, prefix: '*', suffix: '*', snippet: 'italic', title: 'Italic' },
									{ icon: Code, prefix: '`', suffix: '`', snippet: 'code', title: 'Inline Code' },
									{ icon: Heading3, prefix: '### ', suffix: '', snippet: 'Heading', title: 'Heading' },
									{ icon: Quote, prefix: '> ', suffix: '', snippet: 'Quote', title: 'Quote' },
									{ icon: List, prefix: '- ', suffix: '', snippet: 'List item', title: 'List' },
									{ icon: LinkIcon, prefix: '[', suffix: '](https://)', snippet: 'link', title: 'Link' },
								] as const
							).map(({ icon: Icon, prefix, suffix, snippet, title }) => (
								<button
									key={title}
									type="button"
									onClick={() => insertFormatting(prefix, suffix, snippet)}
									title={title}
									className="p-1.5 rounded-xl text-(--text-muted) hover:text-(--text) hover:bg-(--background)/50 transition-colors cursor-pointer"
								>
									<Icon className="w-3.5 h-3.5" />
								</button>
							))}
						</div>
					)}

					<div className="flex items-center bg-(--foreground)/30 border border-(--border)/10 rounded-2xl p-1 text-xs">
						{(
							[
								{ id: 'write', icon: Pencil, label: t('app.portal.info.write') },
								{ id: 'split', icon: Columns2, label: t('app.portal.info.split') },
								{ id: 'preview', icon: Eye, label: t('app.portal.info.preview') },
							] as const
						).map(({ id, icon: Icon, label: modeLabel }) => (
							<button
								key={id}
								type="button"
								onClick={() => handleSelectMode(id)}
								className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-semibold transition-colors cursor-pointer ${
									activeMode === id ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text)'
								}`}
							>
								<Icon className="w-3 h-3" />
								{modeLabel}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Clean CDN Upload Progress Cards */}
			{activeUploads.length > 0 && (
				<div className="flex flex-col gap-2">
					{activeUploads.map((upload) => (
						<div key={upload.id} className="flex flex-col gap-2 rounded-2xl bg-(--foreground)/40 backdrop-blur-md border border-(--accent)/30 px-3.5 py-2.5 shadow-sm">
							<div className="flex items-center justify-between gap-3 text-xs">
								<div className="flex items-center gap-2 min-w-0">
									<div className="flex h-6 w-6 items-center justify-center rounded-xl bg-(--accent)/15 border border-(--accent)/30 text-(--accent) shrink-0">
										{upload.isVideo ? <Film className="w-3.5 h-3.5" /> : <ImagePlus className="w-3.5 h-3.5" />}
									</div>
									<span className="font-bold text-(--text) truncate">{upload.name}</span>
									<span className="text-[11px] text-(--text-muted) shrink-0">({formatFileSize(upload.sizeBytes)})</span>
								</div>
								<div className="flex items-center gap-1.5 text-(--accent) font-bold shrink-0">
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									<span>{upload.progress}%</span>
								</div>
							</div>
							<div className="h-1.5 w-full rounded-full bg-(--background)/60 overflow-hidden">
								<div className="h-full rounded-full bg-(--accent) transition-all duration-150" style={{ width: `${upload.progress}%` }} />
							</div>
						</div>
					))}
				</div>
			)}

			<div className={`grid gap-4 ${activeMode === 'split' ? 'grid-cols-1 lg:grid-cols-2 items-stretch' : 'grid-cols-1'}`}>
				{showEditor && (
					<Input
						ref={textareaRef as any}
						variant="textarea"
						rows={rows}
						maxLength={maxLength}
						required={required}
						value={rawText}
						onChange={(e) => onChange?.(e.target.value)}
						onPaste={canPasteAdminMedia ? handlePasteMedia : undefined}
						placeholder={placeholder}
						className="min-h-[120px] h-full"
					/>
				)}

				{showPreview && <div className="w-full min-h-[120px] rounded-2xl border border-(--border)/10 bg-(--background)/50 p-6 text-sm overflow-auto">{renderedMarkdown}</div>}
			</div>
		</div>
	);
}

export default Markdown;
