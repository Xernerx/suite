/** @format */
'use client';

import React, { useEffect, useState } from 'react';
import { Check, Cpu, ExternalLink, Sparkles } from 'lucide-react';
import { XernerxDotLogo, type DotLogoVariant } from '@xernerx/feedback';
import { Badge, Button } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';

const FORMATIONS: { id: DotLogoVariant; labelKey: string }[] = [
	{ id: 'orbit', labelKey: 'account.appearance.dotMatrix.types.orbit' },
	{ id: 'vortex', labelKey: 'account.appearance.dotMatrix.types.vortex' },
	{ id: 'helix', labelKey: 'account.appearance.dotMatrix.types.helix' },
	{ id: 'prism', labelKey: 'account.appearance.dotMatrix.types.prism' },
	{ id: 'infinity', labelKey: 'account.appearance.dotMatrix.types.infinity' },
	{ id: 'wavegrid', labelKey: 'account.appearance.dotMatrix.types.wavegrid' },
	{ id: 'full', labelKey: 'account.appearance.dotMatrix.types.full' },
	{ id: 'icon', labelKey: 'account.appearance.dotMatrix.types.icon' },
];

interface DotMatrixBannerStudioProps {
	userId: string;
	isUnlocked: boolean;
	isActive: boolean;
	savedVariant?: DotLogoVariant;
	mutate?: () => Promise<any>;
}

export function DotMatrixBannerStudio({ userId, isUnlocked, isActive, savedVariant = 'orbit', mutate }: DotMatrixBannerStudioProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const [selected, setSelected] = useState<DotLogoVariant>(savedVariant || 'orbit');
	const [savingVariant, setSavingVariant] = useState<DotLogoVariant | null>(null);

	useEffect(() => {
		if (savedVariant) {
			setSelected(savedVariant);
		}
	}, [savedVariant]);

	const handleSelectFormation = async (nextVariant: DotLogoVariant) => {
		setSelected(nextVariant);
		if (!isUnlocked || !userId) return;
		setSavingVariant(nextVariant);
		try {
			const res = await fetch(`${getEnvUrl('https://api.xernerx.com/')}secure/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ credits: { dotMatrixVariant: nextVariant } }),
			});
			if (!res.ok) throw new Error('Failed to update formation');
			if (mutate) await mutate();
			toast({ type: 'success', title: t('account.profile.showcases.dotMatrixStudio.savedToast') });
		} catch {
			toast({ type: 'error', title: t('account.profile.toast.error') });
		} finally {
			setSavingVariant(null);
		}
	};

	return (
		<div className="flex flex-col rounded-2xl border border-(--accent)/30 bg-(--background)/60 p-4 gap-3 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_10%,transparent)]">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
				<div className="flex flex-col gap-0.5">
					<div className="flex flex-wrap items-center gap-2">
						<Cpu size={16} className="text-(--accent)" />
						<span className="text-sm font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('account.profile.showcases.dotMatrixStudio.title')}
						</span>
						<Badge variant="accent" size="sm">
							{isUnlocked
								? isActive
									? t('account.profile.showcases.dotMatrixStudio.activeBadge')
									: t('account.profile.showcases.dotMatrixStudio.hiddenBadge')
								: t('account.profile.showcases.dotMatrixStudio.previewBadge')}
						</Badge>
					</div>
					<p className="text-xs text-(--text-muted)">{t('account.profile.showcases.dotMatrixStudio.subtitle')}</p>
				</div>

				{!isUnlocked && (
					<Button
						variant="primary"
						size="sm"
						onClick={() => (window.location.href = getEnvUrl('https://store.xernerx.com/?category=credits'))}
						className="flex items-center gap-1.5 shrink-0"
					>
						<ExternalLink size={13} />
						{t('account.profile.showcases.dotMatrixStudio.unlockCta')}
					</Button>
				)}
			</div>

			<div className="relative h-32 w-full rounded-2xl overflow-hidden border border-(--accent)/35 bg-(--background)/80 shadow-[inset_0_0_24px_color-mix(in_srgb,var(--accent)_14%,transparent)]">
				<div className="absolute inset-0">
					<XernerxDotLogo variant={selected} backgroundMode ripple={true} vivid={true} />
				</div>
				<div className="relative z-10 flex items-center justify-between px-3 py-2 pointer-events-none">
					<span className="inline-flex items-center gap-1 rounded-full bg-(--background)/80 backdrop-blur-md border border-(--accent)/30 px-2.5 py-0.5 text-[10px] font-bold text-(--accent)">
						<Sparkles size={10} />
						{t(`account.appearance.dotMatrix.types.${selected}`)}
					</span>
					<span className="inline-flex items-center gap-1 rounded-full bg-(--background)/75 backdrop-blur-md border border-(--border)/15 px-2.5 py-0.5 text-[10px] font-semibold text-(--text-muted)">
						{t('account.store.credits.dotMatrixPreview.clickHint')}
					</span>
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{t('account.profile.showcases.dotMatrixStudio.formationLabel')}</span>
				<div className="flex flex-wrap items-center gap-1.5">
					{FORMATIONS.map((f) => {
						const active = selected === f.id;
						return (
							<button
								key={f.id}
								type="button"
								disabled={savingVariant === f.id}
								onClick={() => handleSelectFormation(f.id)}
								className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
									active
										? 'bg-(--accent) text-(--text) border-(--accent) shadow-xs'
										: 'bg-(--foreground)/40 text-(--text-muted) border-(--border)/10 hover:border-(--accent)/35 hover:text-(--text)'
								}`}
							>
								{active && <Check size={12} />}
								<span>{t(f.labelKey)}</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
