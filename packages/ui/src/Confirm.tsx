/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { Input } from './Input';

interface ConfirmProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void | Promise<void>;
	loading?: boolean;
	variant?: 'danger' | 'warning' | 'primary';
	confirmKeyword?: string;
}

const variantStyles = {
	danger: {
		icon: AlertTriangle,
		iconWrapper: 'bg-(--accent-red)/10 text-(--accent-red)',
		button: 'bg-(--accent-red) text-white hover:bg-(--accent-red)/85',
	},
	warning: {
		icon: AlertTriangle,
		iconWrapper: 'bg-(--accent-orange)/10 text-(--accent-orange)',
		button: 'bg-(--accent-orange) text-white hover:bg-(--accent-orange)/80',
	},
	primary: {
		icon: Info,
		iconWrapper: 'bg-(--accent)/10 text-(--accent)',
		button: 'bg-(--accent) text-white hover:bg-(--hover-accent)',
	},
};

export function Confirm({ open, onOpenChange, title, description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, loading = false, variant = 'danger', confirmKeyword }: ConfirmProps) {
	const { t } = useDictionary();
	const [mounted, setMounted] = useState(false);
	const [typedValue, setTypedValue] = useState('');

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!open) {
			setTypedValue('');
		}
	}, [open]);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape' && open && !loading) {
				onOpenChange(false);
			}
		}
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [open, loading, onOpenChange]);

	if (!open || !mounted) return null;

	const { icon: Icon, iconWrapper, button } = variantStyles[variant];
	const isKeywordMatched = !confirmKeyword || typedValue === confirmKeyword;

	const confirmContent = (
		<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans antialiased text-(--text)">
			<div
				className="flex flex-col w-full max-w-md rounded-3xl border border-(--border)/10 bg-(--background)/95 backdrop-blur-md shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_10%,transparent)] animate-in zoom-in-95 duration-200"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex items-start" style={{ gap: 'var(--ui-gap)' }}>
					<div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconWrapper}`}>
						<Icon size={24} />
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h2 className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{title}
						</h2>
						<p className="text-xs text-(--text-muted) leading-relaxed">{description}</p>
					</div>
				</div>

				{confirmKeyword && (
					<div className="flex flex-col gap-2 pt-1">
						<label className="text-xs text-(--text-muted) flex items-center gap-1.5 flex-wrap">
							<span>{t('common.confirm.typeToConfirmBefore')}</span>
							<code className="px-2 py-0.5 rounded-xl bg-(--foreground) border border-(--border)/15 font-mono font-bold text-(--text) select-all">{confirmKeyword}</code>
							<span>{t('common.confirm.typeToConfirmAfter')}</span>
						</label>
						<Input
							type="text"
							value={typedValue}
							onChange={(e) => setTypedValue(e.target.value)}
							placeholder={confirmKeyword}
							autoFocus
							onKeyDown={(e) => {
								if (e.key === 'Enter' && isKeywordMatched && !loading) {
									e.preventDefault();
									onConfirm();
								}
							}}
						/>
					</div>
				)}

				<div className="flex items-center justify-end" style={{ gap: 'calc(var(--ui-gap) * 0.5)', paddingTop: 'calc(var(--ui-gap) * 0.5)' }}>
					<button
						type="button"
						disabled={loading}
						onClick={() => onOpenChange(false)}
						className="rounded-2xl text-sm font-medium text-(--text) hover:bg-(--border)/10 transition-colors disabled:opacity-50"
						style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
					>
						{cancelText}
					</button>
					<button
						type="button"
						disabled={loading || !isKeywordMatched}
						onClick={onConfirm}
						className={`flex items-center justify-center rounded-2xl text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-sm ${button}`}
						style={{ padding: 'calc(var(--ui-gap) * 0.5) calc(var(--ui-gap) * 1.25)', gap: 'calc(var(--ui-gap) * 0.5)' }}
					>
						{loading && <Loader2 size={16} className="animate-spin" />}
						<span>{confirmText}</span>
					</button>
				</div>
			</div>
		</div>
	);

	if (typeof document !== 'undefined') {
		const { createPortal } = require('react-dom');
		return createPortal(confirmContent, document.body);
	}
	return null;
}
