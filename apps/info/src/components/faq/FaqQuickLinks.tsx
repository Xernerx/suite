/** @format */
'use client';

import { ArrowUpRight, Check, Copy, Link2 } from 'lucide-react';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useState } from 'react';

export interface FaqQuickLinkItem {
	label: string;
	href: string;
	vanity?: string;
	external?: boolean;
}

export function FaqInlineLink({ href, children, external = false }: { href: string; children: React.ReactNode; external?: boolean }) {
	const { getEnvUrl } = useEnvironment();
	const resolvedHref = href.startsWith('http') ? getEnvUrl(href) : href;

	return (
		<a
			suppressHydrationWarning
			href={resolvedHref}
			target={external ? '_blank' : undefined}
			rel={external ? 'noopener noreferrer' : undefined}
			className="inline-flex items-center gap-1 rounded-lg bg-(--accent)/10 hover:bg-(--accent)/20 border border-(--accent)/25 px-1.5 py-0.5 text-xs font-mono font-semibold text-(--accent) transition-colors cursor-pointer mx-0.5"
		>
			<span>{children}</span>
			<ArrowUpRight size={11} className="shrink-0 opacity-80" />
		</a>
	);
}

export function FaqQuickLinks({ links }: { links: FaqQuickLinkItem[] }) {
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const { toast } = useToast();
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

	if (!links || links.length === 0) return null;

	const handleCopy = (e: React.MouseEvent, resolvedHref: string, index: number) => {
		e.preventDefault();
		e.stopPropagation();
		const fullUrl = resolvedHref.startsWith('/') && typeof window !== 'undefined' ? `${window.location.origin}${resolvedHref}` : resolvedHref;
		navigator.clipboard.writeText(fullUrl);
		setCopiedIndex(index);
		toast({ type: 'success', title: t('faq.quickLinks.copied'), description: fullUrl });
		setTimeout(() => setCopiedIndex((prev) => (prev === index ? null : prev)), 2000);
	};

	return (
		<div className="flex flex-col pt-3 mt-1 border-t border-(--border)/10" style={{ gap: 'calc(var(--ui-gap) * 0.4)' }}>
			<div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">
				<Link2 size={12} className="text-(--accent)" />
				<span>{t('faq.quickLinks.label')}</span>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				{links.map((item, idx) => {
					const resolvedHref = item.href.startsWith('http') ? getEnvUrl(item.href) : item.href;
					const isCopied = copiedIndex === idx;

					return (
						<div
							key={`${item.href}-${idx}`}
							className="group inline-flex items-center rounded-full bg-(--background)/60 hover:bg-(--accent)/15 border border-(--border)/15 hover:border-(--accent)/40 transition-all overflow-hidden"
						>
							<a
								suppressHydrationWarning
								href={resolvedHref}
								target={item.external ? '_blank' : undefined}
								rel={item.external ? 'noopener noreferrer' : undefined}
								className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 text-xs font-semibold text-(--text) group-hover:text-(--accent) transition-colors cursor-pointer"
							>
								<span>{item.label}</span>
								{item.vanity && (
									<span className="rounded-full bg-(--foreground)/50 border border-(--border)/10 px-1.5 py-0.2 text-[10px] font-mono text-(--text-muted) group-hover:text-(--accent)">
										{item.vanity}
									</span>
								)}
								<ArrowUpRight size={12} className="text-(--text-muted) group-hover:text-(--accent) transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
							</a>
							<button
								type="button"
								onClick={(e) => handleCopy(e, resolvedHref, idx)}
								title={t('faq.quickLinks.copyTooltip')}
								className="pr-2.5 pl-1.5 py-1 border-l border-(--border)/10 text-(--text-muted) hover:text-(--accent) transition-colors cursor-pointer"
							>
								{isCopied ? <Check size={11} className="text-(--accent-green)" /> : <Copy size={11} />}
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}
