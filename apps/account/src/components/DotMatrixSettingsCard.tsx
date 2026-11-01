/** @format */
'use client';

import { useState } from 'react';
import {
	Activity,
	Atom,
	Box,
	Clock,
	Crosshair,
	Dna,
	ExternalLink,
	EyeOff,
	Flower2,
	Grid,
	Hexagon,
	Infinity as InfinityIcon,
	Lock,
	Orbit,
	Pause,
	Play,
	Shield,
	Sparkles,
	Star,
	Sun,
	Type,
	Waves,
} from 'lucide-react';
import { Button, Selector } from '@xernerx/ui';
import { XernerxDotLogo } from '@xernerx/feedback';
import { useDictionary, useEnvironment, usePermissions, useToast, useUser, type DotMatrixAnimation, type DotMatrixRenderStyle, type DotMatrixType } from '@xernerx/providers';
import { FORMATION_UNLOCK_MAP, isCosmeticUnlocked, RENDER_STYLE_UNLOCK_MAP } from './cosmeticUnlocks';

interface DotMatrixSettingsCardProps {
	dotMatrixType: DotMatrixType;
	dotMatrixRenderStyle: DotMatrixRenderStyle;
	dotMatrixAnimation: DotMatrixAnimation;
	onChangeType: (nextType: DotMatrixType) => void;
	onChangeRenderStyle: (nextStyle: DotMatrixRenderStyle) => void;
	onChangeAnimation: (nextAnim: DotMatrixAnimation) => void;
	isUiHidden?: boolean;
	onToggleHideUi?: () => void;
}

export function DotMatrixSettingsCard({ dotMatrixType, dotMatrixRenderStyle, dotMatrixAnimation, onChangeType, onChangeRenderStyle, onChangeAnimation, onToggleHideUi }: DotMatrixSettingsCardProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { user } = useUser();
	const { hasPermission } = usePermissions();
	const { toast } = useToast();
	const hasAdminAccess = hasPermission('access');

	const [isSimulatingLoad, setIsSimulatingLoad] = useState(false);
	const [previewOverrideType, setPreviewOverrideType] = useState<DotMatrixType | null>(null);
	const [previewOverrideStyle, setPreviewOverrideStyle] = useState<DotMatrixRenderStyle | null>(null);

	const triggerLoadMorphPreview = () => {
		setIsSimulatingLoad(true);
		setTimeout(() => {
			setIsSimulatingLoad(false);
		}, 850);
	};

	const renderOption = (Icon: any, text: string, locked = false) => (
		<div className="flex items-center justify-between gap-2 w-full whitespace-nowrap">
			<div className="flex items-center gap-2.5 whitespace-nowrap">
				<Icon size={16} className="shrink-0" />
				<span className="font-medium whitespace-nowrap">{text}</span>
			</div>
			{locked && <Lock size={12} className="text-(--accent) shrink-0 opacity-80" />}
		</div>
	);

	const typeCatalog: Array<{ value: DotMatrixType; icon: any }> = [
		{ value: 'default', icon: Sparkles },
		{ value: 'full', icon: Type },
		{ value: 'icon', icon: Shield },
		{ value: 'orbit', icon: Orbit },
		{ value: 'vortex', icon: Atom },
		{ value: 'helix', icon: Dna },
		{ value: 'prism', icon: Hexagon },
		{ value: 'infinity', icon: InfinityIcon },
		{ value: 'wavegrid', icon: Grid },
		{ value: 'chronos', icon: Clock },
		{ value: 'supernova', icon: Star },
		{ value: 'tesseract', icon: Box },
		{ value: 'synthwave', icon: Sun },
		{ value: 'lotus', icon: Flower2 },
		{ value: 'blank', icon: EyeOff },
	];

	const renderStyleCatalog: Array<{ value: DotMatrixRenderStyle; icon: any }> = [
		{ value: 'dots', icon: Grid },
		{ value: 'constellation', icon: Star },
		{ value: 'hexgrid', icon: Hexagon },
		{ value: 'aurora', icon: Waves },
		{ value: 'glyphs', icon: Crosshair },
	];

	const typeOptions = typeCatalog.map((item) => {
		const unlocked = isCosmeticUnlocked(user, hasAdminAccess, FORMATION_UNLOCK_MAP[item.value]);
		return {
			value: item.value,
			label: renderOption(item.icon, t(`account.appearance.dotMatrix.types.${item.value}`), !unlocked),
		};
	});

	const renderStyleOptions = renderStyleCatalog.map((item) => {
		const unlocked = isCosmeticUnlocked(user, hasAdminAccess, RENDER_STYLE_UNLOCK_MAP[item.value]);
		return {
			value: item.value,
			label: renderOption(item.icon, t(`account.appearance.dotMatrix.renderStyles.${item.value}`), !unlocked),
		};
	});

	const animOptions = [
		{ value: 'animate', label: renderOption(Activity, t('account.appearance.dotMatrix.animations.animate')) },
		{ value: 'static', label: renderOption(Pause, t('account.appearance.dotMatrix.animations.static')) },
		{ value: 'always', label: renderOption(Waves, t('account.appearance.dotMatrix.animations.always')) },
	];

	const handleSelectType = (nextType: DotMatrixType) => {
		const reqUnlock = FORMATION_UNLOCK_MAP[nextType];
		if (!isCosmeticUnlocked(user, hasAdminAccess, reqUnlock)) {
			setPreviewOverrideType(nextType);
			triggerLoadMorphPreview();
			toast({
				type: 'info',
				title: t('account.appearance.dotMatrix.lockedToastTitle'),
				description: t('account.appearance.dotMatrix.lockedToastDesc'),
				action: {
					label: t('account.appearance.dotMatrix.openCreditStore'),
					onClick: () => {
						window.location.href = getEnvUrl('https://store.xernerx.com/?category=credits');
					},
				},
			});
			return;
		}
		setPreviewOverrideType(null);
		onChangeType(nextType);
	};

	const handleSelectRenderStyle = (nextStyle: DotMatrixRenderStyle) => {
		const reqUnlock = RENDER_STYLE_UNLOCK_MAP[nextStyle];
		if (!isCosmeticUnlocked(user, hasAdminAccess, reqUnlock)) {
			setPreviewOverrideStyle(nextStyle);
			triggerLoadMorphPreview();
			toast({
				type: 'info',
				title: t('account.appearance.dotMatrix.lockedToastTitle'),
				description: t('account.appearance.dotMatrix.lockedToastDesc'),
				action: {
					label: t('account.appearance.dotMatrix.openCreditStore'),
					onClick: () => {
						window.location.href = getEnvUrl('https://store.xernerx.com/?category=credits');
					},
				},
			});
			return;
		}
		setPreviewOverrideStyle(null);
		onChangeRenderStyle(nextStyle);
	};

	const activePreviewType = previewOverrideType || dotMatrixType;
	const activePreviewStyle = previewOverrideStyle || dotMatrixRenderStyle;
	const resolvedPreviewVariant = isSimulatingLoad
		? 'full'
		: activePreviewType === 'default' || activePreviewType === 'blank'
			? activePreviewStyle !== 'dots'
				? 'orbit'
				: 'full'
			: activePreviewType;
	const resolvedPreviewStyle = activePreviewStyle;
	const resolvedPreviewRipple = isSimulatingLoad ? true : dotMatrixAnimation === 'always' ? true : dotMatrixAnimation === 'static' ? false : true;

	return (
		<div className="relative z-45 flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col xl:flex-row xl:items-center justify-between" style={{ gap: 'var(--ui-gap)' }}>
				<div className="flex flex-col max-w-xl" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h2 className="text-base font-semibold text-(--text)">{t('account.appearance.dotMatrix.title')}</h2>
					<p className="text-xs text-(--text-muted)">{t('account.appearance.dotMatrix.description')}</p>
				</div>

				<div className="flex flex-wrap items-end gap-3 w-full xl:w-auto">
					<div className="w-full sm:w-auto">
						<label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-1">{t('account.appearance.dotMatrix.typeLabel')}</label>
						<Selector value={activePreviewType} options={typeOptions} onChange={(val) => handleSelectType(val as DotMatrixType)} items />
					</div>

					<div className="w-full sm:w-auto">
						<label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-1">{t('account.appearance.dotMatrix.renderStyleLabel')}</label>
						<Selector value={activePreviewStyle} options={renderStyleOptions} onChange={(val) => handleSelectRenderStyle(val as DotMatrixRenderStyle)} items />
					</div>

					<div className="w-full sm:w-auto">
						<label className="block text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-1">{t('account.appearance.dotMatrix.animationLabel')}</label>
						<Selector value={dotMatrixAnimation} options={animOptions} onChange={(val) => onChangeAnimation(val as DotMatrixAnimation)} items />
					</div>
				</div>
			</div>

			{/* Interactive Morph & Profile Preview Stage */}
			<div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-(--border)/10 bg-(--background)/50 px-5 py-4 overflow-hidden">
				<div className="relative w-full sm:w-72 h-28 flex items-center justify-center rounded-xl bg-(--background)/60 border border-(--border)/10 overflow-hidden shrink-0">
					<XernerxDotLogo
						variant={resolvedPreviewVariant}
						renderStyle={resolvedPreviewStyle}
						width={280}
						height={110}
						cols={54}
						ripple={resolvedPreviewRipple}
						blank={!isSimulatingLoad && activePreviewType === 'blank'}
					/>
				</div>

				<div className="flex flex-col sm:items-end justify-between gap-2.5 flex-1 text-left sm:text-right">
					<div>
						<div className="text-xs font-bold text-(--text)">{t('account.appearance.dotMatrix.previewTitle')}</div>
						<p className="text-[11px] text-(--text-muted) max-w-md mt-0.5">{t('account.appearance.dotMatrix.previewDesc')}</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{(previewOverrideType || previewOverrideStyle) && (
							<Button
								size="sm"
								variant="primary"
								onClick={() => (window.location.href = getEnvUrl('https://store.xernerx.com/?category=credits'))}
								className="inline-flex items-center gap-1.5"
							>
								<ExternalLink size={13} />
								{t('account.appearance.dotMatrix.openCreditStore')}
							</Button>
						)}
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
	);
}
