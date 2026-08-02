/** @format */
'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void | Promise<void>;
	loading?: boolean;
}

export function Confirm({ open, onOpenChange, title, description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, loading = false }: ConfirmProps) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
			<div
				className="flex flex-col w-full max-w-md rounded-3xl border border-(--border)/10 bg-(--foreground) shadow-xl animate-in zoom-in-95 duration-200"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex items-start" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
						<AlertTriangle size={24} />
					</div>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h2 className="text-lg font-bold text-(--text)">{title}</h2>
						<p className="text-xs text-(--text-muted) leading-relaxed">{description}</p>
					</div>
				</div>

				<div className="flex items-center justify-end" style={{ gap: 'calc(var(--ui-gap) * 0.5)', paddingTop: 'calc(var(--ui-gap) * 0.5)' }}>
					<button
						type="button"
						disabled={loading}
						onClick={() => onOpenChange(false)}
						className="rounded-xl text-sm font-medium text-(--text) hover:bg-(--border)/10 transition-colors disabled:opacity-50"
						style={{ padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)' }}
					>
						{cancelText}
					</button>
					<button
						type="button"
						disabled={loading}
						onClick={onConfirm}
						className="flex items-center justify-center rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 shadow-sm"
						style={{ padding: 'calc(var(--ui-gap) * 0.5) calc(var(--ui-gap) * 1.25)', gap: 'calc(var(--ui-gap) * 0.5)' }}
					>
						{loading && <Loader2 size={16} className="animate-spin" />}
						<span>{confirmText}</span>
					</button>
				</div>
			</div>
		</div>
	);
}
