/** @format */

import React, { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	isLoading?: boolean;
	loading?: boolean; // alias for isLoading
	asChild?: boolean;
}

const BASE_BUTTON_STYLES =
	'inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) active:scale-95 disabled:pointer-events-none disabled:opacity-50';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
	primary:
		'bg-(--accent) text-(--accent-contrast) border border-(--border)/15 shadow-sm hover:bg-(--hover-accent) hover:shadow-[0_0_15px_color-mix(in_srgb,var(--accent-readable,var(--accent))_40%,transparent)]',
	secondary: 'border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md text-(--text) shadow-sm hover:bg-(--foreground)/50 hover:border-(--accent)/50',
	outline: 'border border-(--border)/10 bg-transparent text-(--text) hover:bg-(--foreground)/30 hover:backdrop-blur-md',
	ghost: 'bg-transparent text-(--text) hover:bg-(--foreground)/30 hover:backdrop-blur-md hover:text-(--text)',
	danger: 'bg-(--accent-red)/10 text-(--accent-red) border border-(--accent-red)/20 hover:bg-(--accent-red)/20 shadow-sm',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
	sm: 'h-8 px-3 text-xs gap-1.5',
	md: 'h-10 px-4 text-sm gap-2',
	lg: 'h-12 px-6 text-base gap-2.5',
	icon: 'h-10 w-10 shrink-0',
};

export function getButtonClasses({ variant = 'primary', size = 'md', className = '' }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
	return `${BASE_BUTTON_STYLES} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`.trim();
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className = '', variant = 'primary', size = 'md', isLoading = false, loading = false, asChild = false, disabled, children, ...props }, ref) => {
		const activeLoading = isLoading || loading;
		const resolvedClasses = getButtonClasses({ variant, size, className });

		if (asChild && React.isValidElement(children)) {
			const child = children as React.ReactElement<{ className?: string }>;
			return React.cloneElement(child, {
				...(props as Record<string, unknown>),
				className: `${resolvedClasses} ${child.props.className || ''}`.trim(),
			});
		}

		return (
			<button ref={ref} disabled={disabled || activeLoading} className={resolvedClasses} {...props}>
				{activeLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" />}
				{children}
			</button>
		);
	}
);

Button.displayName = 'Button';
