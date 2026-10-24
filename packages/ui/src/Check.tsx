/** @format */
'use client';

import React, { forwardRef } from 'react';
import { Check as CheckIcon, Minus } from 'lucide-react';

export interface CheckProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	checked: boolean;
	indeterminate?: boolean;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'square' | 'circle';
	label?: React.ReactNode;
	onCheckedChange?: (checked: boolean) => void;
}

export const Check = forwardRef<HTMLInputElement, CheckProps>(
	({ className = '', checked, indeterminate = false, disabled = false, size = 'md', variant = 'square', label, onChange, onCheckedChange, ...props }, ref) => {
		const dimensions = {
			sm: {
				box: 'h-5 w-5',
				radius: variant === 'circle' ? 'rounded-full' : 'rounded-lg',
				icon: 12,
				text: 'text-xs',
			},
			md: {
				box: 'h-6 w-6',
				radius: variant === 'circle' ? 'rounded-full' : 'rounded-xl',
				icon: 14,
				text: 'text-sm',
			},
			lg: {
				box: 'h-7 w-7',
				radius: variant === 'circle' ? 'rounded-full' : 'rounded-xl',
				icon: 16,
				text: 'text-base',
			},
		};

		const activeSize = dimensions[size];
		const isActive = checked || indeterminate;

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange?.(e);
			onCheckedChange?.(e.target.checked);
		};

		return (
			<label
				className={`
					inline-flex shrink-0 cursor-pointer items-center gap-2.5 select-none group/check
					${disabled ? 'cursor-not-allowed opacity-60' : ''}
					${className}
				`}
			>
				<input type="checkbox" ref={ref} className="sr-only" checked={checked} disabled={disabled} onChange={handleChange} {...props} />
				<span
					className={`
						relative inline-flex items-center justify-center transition-all duration-200 ease-out backdrop-blur-md
						focus-within:ring-2 focus-within:ring-(--accent) focus-within:ring-offset-2 focus-within:ring-offset-(--background)
						${activeSize.box}
						${activeSize.radius}
						${
							isActive
								? 'bg-(--accent) border border-(--accent) text-white shadow-[0_0_14px_color-mix(in_srgb,var(--accent)_35%,transparent)] scale-100'
								: 'bg-(--background)/70 border border-(--border)/25 text-transparent group-hover/check:border-(--accent)/50 group-hover/check:bg-(--background)/90'
						}
					`}
				>
					{indeterminate ? (
						<Minus size={activeSize.icon} strokeWidth={3} className="transition-transform duration-150 scale-100" />
					) : (
						<CheckIcon size={activeSize.icon} strokeWidth={3} className={`transition-transform duration-150 ${checked ? 'scale-100' : 'scale-0'}`} />
					)}
				</span>
				{label !== undefined && <span className={`${activeSize.text} font-medium text-(--text)`}>{label}</span>}
			</label>
		);
	}
);

Check.displayName = 'Check';
