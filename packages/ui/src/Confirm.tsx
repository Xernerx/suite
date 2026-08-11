/** @format */
'use client';

import { AlertTriangle, Info, Loader2 } from 'lucide-react';

interface ConfirmProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void | Promise<void>;
	loading?: boolean;
	variant?: 'danger' | 'primary';
}

const variantStyles = {
	danger: {
		icon: AlertTriangle,
		iconWrapper: 'bg-(--accent-red)/10 text-(--accent-red)',
		button: 'bg-(--accent-red) text-white hover:bg-red-600',
	},
	primary: {
		icon: Info,
		iconWrapper: 'bg-(--accent)/10 text-(--accent)',
		button: 'bg-(--accent) text-white hover:bg-blue-600',
	},
};

export function Confirm({ open, onOpenChange, title, description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, loading = false, variant = 'danger' }: ConfirmProps) {
	if (!open) return null;

	const { icon: Icon, iconWrapper, button } = variantStyles[variant];

	return (
		<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
			<div
				className="flex flex-col w-full max-w-md rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_10%,transparent)] animate-in zoom-in-95 duration-200"
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
						className={`flex items-center justify-center rounded-xl text-sm font-medium transition-colors disabled:opacity-50 shadow-sm ${button}`}
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
