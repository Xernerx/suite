/** @format */
'use client';

import React, { forwardRef } from 'react';

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	checked: boolean;
	size?: 'sm' | 'md';
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(({ className = '', checked, disabled = false, size = 'md', ...props }, ref) => {
	const dimensions = {
		sm: {
			track: 'h-5 w-9',
			thumb: 'h-4 w-4 top-[2px] left-[2px]',
			translate: checked ? 'translate-x-4' : 'translate-x-0',
		},
		md: {
			track: 'h-6 w-11',
			thumb: 'h-5 w-5 top-[2px] left-[2px]',
			translate: checked ? 'translate-x-5' : 'translate-x-0',
		},
	};

	const activeSize = dimensions[size];

	return (
		<label
			className={`
                relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-within:ring-2 focus-within:ring-(--accent) focus-within:ring-offset-2 focus-within:ring-offset-(--background)
                ${activeSize.track}
                ${checked ? 'bg-(--accent)' : 'bg-(--text-muted)/30'}
                ${disabled ? 'cursor-not-allowed opacity-60' : ''}
                ${className}
            `}
		>
			<input type="checkbox" ref={ref} className="sr-only" checked={checked} disabled={disabled} {...props} />
			<span
				className={`
                    absolute transform rounded-full bg-white transition duration-200 ease-in-out
                    ${activeSize.thumb}
                    ${activeSize.translate}
                `}
			/>
		</label>
	);
});

Toggle.displayName = 'Toggle';
