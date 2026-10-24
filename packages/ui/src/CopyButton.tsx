/** @format */
'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useDictionary, useToast } from '@xernerx/providers';

export interface CopyButtonProps {
	value: string;
	label?: string;
	copiedLabel?: string;
	toastTitle?: string;
	toastDescription?: string;
	variant?: 'pill' | 'ghost' | 'surface';
	size?: 'sm' | 'md';
	mono?: boolean;
	className?: string;
}

export function CopyButton({ value, label, copiedLabel, toastTitle, toastDescription, variant = 'pill', size = 'sm', mono = true, className = '' }: CopyButtonProps) {
	const { t } = useDictionary();
	const { toast } = useToast();
	const [copied, setCopied] = useState(false);

	const handleCopy = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!value) return;
		navigator.clipboard.writeText(value);
		setCopied(true);
		if (toastTitle) {
			toast({
				type: 'success',
				title: toastTitle,
				description: toastDescription,
			});
		}
		setTimeout(() => setCopied(false), 2000);
	};

	const variantClasses: Record<NonNullable<CopyButtonProps['variant']>, string> = {
		pill: 'bg-(--background)/60 hover:bg-(--background) backdrop-blur-md border border-(--border)/10 text-(--text-muted) hover:text-(--text)',
		ghost: 'bg-transparent hover:bg-(--foreground)/40 text-(--text-muted) hover:text-(--text)',
		surface: 'bg-(--foreground)/30 hover:bg-(--accent)/10 backdrop-blur-md border border-(--border)/10 hover:border-(--accent)/30 text-(--text) hover:text-(--accent)',
	};

	const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs rounded-xl gap-1.5' : 'px-3.5 py-1.5 text-sm rounded-2xl gap-2';

	return (
		<button
			type="button"
			onClick={handleCopy}
			aria-label={label || t('app.widgets.copy')}
			title={label || t('app.widgets.copy')}
			className={`inline-flex items-center transition-all cursor-pointer shrink-0 ${mono ? 'font-mono' : 'font-semibold'} ${variantClasses[variant]} ${sizeClasses} ${className}`}
		>
			{label && <span className="truncate">{copied && copiedLabel ? copiedLabel : label}</span>}
			{copied ? <Check size={size === 'sm' ? 13 : 15} className="text-(--accent-green) shrink-0" /> : <Copy size={size === 'sm' ? 13 : 15} className="shrink-0" />}
		</button>
	);
}
