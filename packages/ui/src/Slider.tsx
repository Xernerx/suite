/** @format */
'use client';

import React from 'react';

export interface SliderProps {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	unit?: string;
	label?: string;
	formatValue?: (val: number) => string;
	showBounds?: boolean;
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1, unit = '', label, formatValue, showBounds = true }: SliderProps) {
	const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;
	const displayMin = formatValue ? formatValue(min) : `${min}${unit}`;
	const displayMax = formatValue ? formatValue(max) : `${max}${unit}`;

	return (
		<div className='flex flex-col w-full' style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
			<div className='flex justify-between items-center text-xs'>
				<span className='font-medium text-(--text)'>{label || ''}</span>
				<span className='font-mono font-semibold text-(--accent)'>{displayValue}</span>
			</div>
			<input type='range' min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className='solar-slider w-full' />
			{showBounds && (
				<div className='flex justify-between items-center text-[10px] text-(--text-muted) px-1 font-mono'>
					<span>{displayMin}</span>
					<span>{displayMax}</span>
				</div>
			)}
		</div>
	);
}
