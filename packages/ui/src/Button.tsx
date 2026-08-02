/** @format */

import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
	size?: 'sm' | 'md' | 'lg' | 'icon';
	isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className = '', variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
	const baseStyles =
		'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) active:scale-95 disabled:pointer-events-none disabled:opacity-50';

	const variants = {
		primary: 'bg-(--accent) text-white hover:bg-(--accent-hover)',
		secondary: 'bg-(--foreground) text-(--text) hover:bg-(--border)',
		outline: 'border border-(--border) bg-transparent text-(--text) hover:bg-(--foreground)',
		ghost: 'bg-transparent text-(--text) hover:bg-(--foreground) hover:text-(--text)',
		danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
	};

	const sizes = {
		sm: 'h-8 px-3 text-xs gap-1.5',
		md: 'h-10 px-4 text-sm gap-2',
		lg: 'h-12 px-6 text-base gap-2.5',
		icon: 'h-10 w-10 shrink-0',
	};

	return (
		<button ref={ref} disabled={disabled || isLoading} className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
			{isLoading && <span className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0' />}
			{children}
		</button>
	);
});

Button.displayName = 'Button';
