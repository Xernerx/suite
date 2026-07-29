/** @format */

import React, { forwardRef } from 'react';

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	checked: boolean;
	size?: 'sm' | 'md';
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(({ className = '', checked, disabled = false, size = 'md', ...props }, ref) => {
	const dimensions = {
		sm: {
			track: 'h-4 w-7',
			thumb: 'h-2.5 w-2.5',
			translate: checked ? 'translate-x-3.5' : 'translate-x-0.5',
		},
		md: {
			track: 'h-5 w-9',
			thumb: 'h-3.5 w-3.5',
			translate: checked ? 'translate-x-4' : 'translate-x-1',
		},
	};

	const activeSize = dimensions[size];

	return (
		<label
			className={`
                relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-within:ring-2 focus-within:ring-(--accent) focus-within:ring-offset-2 focus-within:ring-offset-(--background)
                ${activeSize.track}
                ${checked ? 'bg-(--accent)' : 'bg-(--text-muted)'}
                ${disabled ? 'cursor-not-allowed opacity-60' : ''}
                ${className}
            `}>
			<input type='checkbox' ref={ref} className='sr-only' checked={checked} disabled={disabled} {...props} />
			<span
				className={`
                    inline-block transform rounded-full bg-white transition duration-200 ease-in-out
                    ${activeSize.thumb}
                    ${activeSize.translate}
                `}
			/>
		</label>
	);
});

Toggle.displayName = 'Toggle';
