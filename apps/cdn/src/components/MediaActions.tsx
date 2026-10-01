'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink, Download } from 'lucide-react';
import { Button } from '@xernerx/ui';

export function MediaActions({ rawUrl }: { rawUrl: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(rawUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	};

	return (
		<div className="absolute top-4 right-4 flex gap-2 z-[10000] opacity-0 hover:opacity-100 transition-opacity duration-200 group-hover:opacity-100 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
			<Button variant="secondary" size="sm" onClick={handleCopy} title="Copy Direct Link">
				{copied ? <Check size={16} /> : <Copy size={16} />}
			</Button>
			<a href={rawUrl} target="_blank" rel="noopener noreferrer">
				<Button variant="secondary" size="sm" title="Open Original">
					<ExternalLink size={16} />
				</Button>
			</a>
			<a href={rawUrl} download>
				<Button variant="secondary" size="sm" title="Download">
					<Download size={16} />
				</Button>
			</a>
		</div>
	);
}
