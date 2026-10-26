/** @format */
'use client';

import { useState } from 'react';
import { Activity, Atom, Dna, EyeOff, Grid, Hexagon, Infinity as InfinityIcon, Orbit, Play, Shield, Sparkles, Type, Waves, Pause } from 'lucide-react';
import { Button, Selector } from '@xernerx/ui';
import { XernerxDotLogo } from '@xernerx/feedback';
import { useDictionary, type DotMatrixAnimation, type DotMatrixType } from '@xernerx/providers';

interface DotMatrixSettingsCardProps {
	dotMatrixType: DotMatrixType;
	dotMatrixAnimation: DotMatrixAnimation;
	onChangeType: (nextType: DotMatrixType) => void;
	onChangeAnimation: (nextAnim: DotMatrixAnimation) => void;
	isUiHidden?: boolean;
	onToggleHideUi?: () => void;
}

export function DotMatrixSettingsCard({ dotMatrixType, dotMatrixAnimation, onChangeType, onChangeAnimation, onToggleHideUi }: DotMatrixSettingsCardProps) {
	const { t } = useDictionary();
	const [isSimulatingLoad, setIsSimulatingLoad] = useState(false);

	const triggerLoadMorphPreview = () => {
		setIsSimulatingLoad(true);
		setTimeout(() => {
			setIsSimulatingLoad(false);
		}, 850);
	};

	const renderOption = (Icon: any, text: string) => (
		<div className="flex items-center gap-2.5">
			<Icon size={16} />
			<span className="font-medium">{text}</span>
		</div>
	);

	const typeOptions = [
		{ value: 'default', label: renderOption(Sparkles, t('account.appearance.dotMatrix.types.default')) },
		{ value: 'full', label: renderOption(Type, t('account.appearance.dotMatrix.types.full')) },
		{ value: 'icon', label: renderOption(Shield, t('account.appearance.dotMatrix.types.icon')) },
		{ value: 'orbit', label: renderOption(Orbit, t('account.appearance.dotMatrix.types.orbit')) },
		{ value: 'vortex', label: renderOption(Atom, t('account.appearance.dotMatrix.types.vortex')) },
		{ value: 'helix', label: renderOption(Dna, t('account.appearance.dotMatrix.types.helix')) },
		{ value: 'prism', label: renderOption(Hexagon, t('account.appearance.dotMatrix.types.prism')) },
		{ value: 'infinity', label: renderOption(InfinityIcon, t('account.appearance.dotMatrix.types.infinity')) },
		{ value: 'wavegrid', label: renderOption(Grid, t('account.appearance.dotMatrix.types.wavegrid')) },
		{ value: 'blank', label: renderOption(EyeOff, t('account.appearance.dotMatrix.types.blank')) },
	];

	const animOptions = [
		{ value: 'animate', label: renderOption(Activity, t('account.appearance.dotMatrix.animations.animate')) },
		{ value: 'static', label: renderOption(Pause, t('account.appearance.dotMatrix.animations.static')) },
		{ value: 'always', label: renderOption(Waves, t('account.appearance.dotMatrix.animations.always')) },
	];

	const resolvedPreviewVariant = isSimulatingLoad ? 'full' : dotMatrixType === 'default' || dotMatrixType === 'blank' ? 'full' : dotMatrixType;

	const resolvedPreviewRipple = isSimulatingLoad ? true : dotMatrixAnimation === 'always' ? true : dotMatrixAnimation === 'static' ? false : true;

	return (
		<>
			<div
				className="relative z-45 flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex flex-col lg:flex-row lg:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.dotMatrix.title')}</h2>
						<p className="text-xs text-(--text-muted)">{t('account.appearance.dotMatrix.description')}</p>
					</div>

					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
						<div className="w-full sm:w-60">
							<label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-1">{t('account.appearance.dotMatrix.typeLabel')}</label>
							<Selector value={dotMatrixType} options={typeOptions} onChange={(val) => onChangeType(val as DotMatrixType)} items />
						</div>

						<div className="w-full sm:w-60">
							<label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-1">{t('account.appearance.dotMatrix.animationLabel')}</label>
							<Selector value={dotMatrixAnimation} options={animOptions} onChange={(val) => onChangeAnimation(val as DotMatrixAnimation)} items />
						</div>
					</div>
				</div>

				{/* Interactive Morph & Profile Preview Stage */}
				<div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-(--border)/10 bg-(--background)/50 px-5 py-4 overflow-hidden">
					<div className="relative w-full sm:w-72 h-28 flex items-center justify-center rounded-xl bg-(--background)/60 border border-(--border)/10 overflow-hidden shrink-0">
						<XernerxDotLogo variant={resolvedPreviewVariant} width={280} height={110} cols={54} ripple={resolvedPreviewRipple} blank={!isSimulatingLoad && dotMatrixType === 'blank'} />
					</div>

					<div className="flex flex-col sm:items-end justify-between gap-2.5 flex-1 text-left sm:text-right">
						<div>
							<div className="text-xs font-bold text-(--text)">{t('account.appearance.dotMatrix.previewTitle')}</div>
							<p className="text-[11px] text-(--text-muted) max-w-md mt-0.5">{t('account.appearance.dotMatrix.previewDesc')}</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button size="sm" variant="secondary" onClick={triggerLoadMorphPreview} className="inline-flex items-center gap-1.5">
								<Play size={13} className="text-(--accent)" />
								{t('account.appearance.dotMatrix.testMorphBtn')}
							</Button>
							{onToggleHideUi && (
								<Button size="sm" variant="secondary" onClick={onToggleHideUi} className="inline-flex items-center gap-1.5">
									<EyeOff size={13} className="text-(--accent)" />
									{t('account.appearance.hideUi')}
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
