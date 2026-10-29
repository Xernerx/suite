/** @format */
'use client';

import React from 'react';
import { Columns3 } from 'lucide-react';
import { Selector, Slider } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

interface AppearanceScalingCardsProps {
	uiZoom: number;
	onUiZoomChange: (val: number) => void;
	uiGap: string;
	onUiGapChange: (val: string) => void;
	pageWidth: number;
	onPageWidthChange: (val: number) => void;
	textScale: number;
	onTextScaleChange: (val: number) => void;
}

export function AppearanceScalingCards({ uiZoom, onUiZoomChange, uiGap, onUiGapChange, pageWidth, onPageWidthChange, textScale, onTextScaleChange }: AppearanceScalingCardsProps) {
	const { t } = useDictionary();

	const renderOption = (Icon: any, text: string) => (
		<div className="flex items-center gap-2.5">
			<Icon size={16} />
			<span className="font-medium">{text}</span>
		</div>
	);

	const densityOptions = [
		{ value: '10', label: renderOption(Columns3, t('account.appearance.density.compact')) },
		{ value: '16', label: renderOption(Columns3, t('account.appearance.density.default')) },
		{ value: '24', label: renderOption(Columns3, t('account.appearance.density.spacious')) },
	];

	return (
		<>
			{/* UI Zoom Level */}
			<div
				className="flex flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.zoom.title')}</h2>
					<p className="text-xs text-(--text-muted)">{t('account.appearance.zoom.description')}</p>
				</div>
				<div className="w-full pt-2">
					<Slider value={uiZoom} onChange={onUiZoomChange} min={80} max={125} step={5} unit="%" />
				</div>
			</div>

			{/* Layout Density Selector */}
			<div
				className="relative z-40 flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.density.title')}</h2>
					<p className="text-xs text-(--text-muted)">{t('account.appearance.density.description')}</p>
				</div>
				<div className="w-full sm:w-56">
					<Selector value={uiGap} options={densityOptions} onChange={onUiGapChange} />
				</div>
			</div>

			{/* Page Content Width Slider */}
			<div
				className="flex flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.pageWidth.title')}</h2>
					<p className="text-xs text-(--text-muted)">{t('account.appearance.pageWidth.description')}</p>
				</div>
				<div className="w-full pt-2">
					<Slider value={pageWidth} onChange={onPageWidthChange} min={60} max={100} step={5} unit="%" />
				</div>
			</div>

			{/* Text Scale Slider */}
			<div
				className="flex flex-col justify-between rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.textScale.title')}</h2>
					<p className="text-xs text-(--text-muted)">{t('account.appearance.textScale.description')}</p>
				</div>
				<div className="w-full pt-2">
					<Slider value={textScale} onChange={onTextScaleChange} min={10} max={20} step={1} unit="px" />
				</div>
			</div>
		</>
	);
}
