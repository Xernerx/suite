/** @format */
'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink, Download, Code2, Globe, Link2, Lock } from 'lucide-react';
import { Button } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';

function formatBytes(bytes?: number) {
	if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return null;
	if (bytes < 1024) return `${bytes} B`;
	const kb = bytes / 1024;
	if (kb < 1024) return `${kb.toFixed(1)} KB`;
	return `${(kb / 1024).toFixed(2)} MB`;
}

export function MediaActions({ rawUrl, filename, mimeType, size, privacy }: { rawUrl: string; filename?: string; mimeType?: string; size?: number; privacy?: string }) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [copied, setCopied] = useState(false);
	const [copiedMd, setCopiedMd] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(rawUrl);
			setCopied(true);
			toast({ type: 'success', title: t('cdn.view.actions.linkCopied') });
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	};

	const handleCopyMarkdown = async () => {
		try {
			const label = filename || 'media';
			const md = mimeType?.startsWith('image/') ? `![${label}](${rawUrl})` : `[${label}](${rawUrl})`;
			await navigator.clipboard.writeText(md);
			setCopiedMd(true);
			toast({ type: 'success', title: t('cdn.view.actions.markdownCopied') });
			setTimeout(() => setCopiedMd(false), 2000);
		} catch (err) {
			console.error('Failed to copy markdown: ', err);
		}
	};

	const formattedSize = formatBytes(size);

	return (
		<div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 z-[10000] pointer-events-none">
			{filename && (
				<div className="pointer-events-auto flex items-center flex-wrap gap-2 bg-(--foreground)/75 border border-(--border)/15 px-3.5 py-2 rounded-2xl backdrop-blur-md shadow-lg max-w-full">
					<span className="text-xs font-bold text-(--text) truncate max-w-[240px] sm:max-w-[360px]">{filename}</span>
					{mimeType && <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/30">{mimeType}</span>}
					{formattedSize && <span className="text-[11px] font-mono text-(--text-muted)">{formattedSize}</span>}
					{privacy && (
						<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-(--background)/60 text-(--text-muted) border border-(--border)/10">
							{privacy === 'private' ? <Lock size={10} /> : privacy === 'limited' ? <Link2 size={10} /> : <Globe size={10} />}
							{privacy}
						</span>
					)}
				</div>
			)}

			<div className="pointer-events-auto ml-auto flex items-center gap-2 bg-(--foreground)/75 border border-(--border)/15 p-2 rounded-2xl backdrop-blur-md shadow-lg">
				<Button variant="secondary" size="sm" onClick={handleCopy} title={t('cdn.view.actions.copyDirectLink')}>
					{copied ? <Check size={16} className="text-(--accent-green)" /> : <Copy size={16} />}
				</Button>
				<Button variant="secondary" size="sm" onClick={handleCopyMarkdown} title={t('cdn.view.actions.copyMarkdown')}>
					{copiedMd ? <Check size={16} className="text-(--accent-green)" /> : <Code2 size={16} />}
				</Button>
				<a href={rawUrl} target="_blank" rel="noopener noreferrer">
					<Button variant="secondary" size="sm" title={t('cdn.view.actions.openOriginal')}>
						<ExternalLink size={16} />
					</Button>
				</a>
				<a href={rawUrl} download>
					<Button variant="secondary" size="sm" title={t('cdn.view.actions.download')}>
						<Download size={16} />
					</Button>
				</a>
			</div>
		</div>
	);
}
