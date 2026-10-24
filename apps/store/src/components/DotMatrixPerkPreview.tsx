/** @format */
'use client';

import React, { useState } from 'react';
import { Cpu, Sparkles } from 'lucide-react';
import { XernerxDotLogo, type DotLogoVariant } from '@xernerx/feedback';
import { useDictionary } from '@xernerx/providers';

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

export function DotMatrixPerkPreview({ initialVariant = 'orbit' }: { initialVariant?: DotLogoVariant }) {
	const { t } = useDictionary();
	const [variant, setVariant] = useState<DotLogoVariant>(initialVariant);

	return (
		<div className="flex flex-col gap-2">
			<div className="relative h-32 w-full rounded-2xl overflow-hidden border border-(--accent)/35 bg-(--background)/75 shadow-[inset_0_0_24px_color-mix(in_srgb,var(--accent)_14%,transparent)]">
				<div className="absolute inset-0">
					<XernerxDotLogo variant={variant} backgroundMode ripple={true} vivid={true} />
				</div>
				<div className="relative z-10 flex items-center justify-between px-2.5 py-2 pointer-events-none">
					<span className="inline-flex items-center gap-1 rounded-full bg-(--background)/80 backdrop-blur-md border border-(--accent)/30 px-2 py-0.5 text-[10px] font-bold text-(--accent)">
						<Cpu size={11} />
						{t('account.store.credits.dotMatrixPreview.liveBadge')}
					</span>
					<span className="inline-flex items-center gap-1 rounded-full bg-(--background)/75 backdrop-blur-md border border-(--border)/15 px-2 py-0.5 text-[10px] font-semibold text-(--text-muted)">
						<Sparkles size={10} className="text-(--accent)" />
						{t('account.store.credits.dotMatrixPreview.clickHint')}
					</span>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-1">
				{FORMATIONS.map((f) => {
					const active = variant === f.id;
					return (
						<button
							key={f.id}
							type="button"
							onClick={() => setVariant(f.id)}
							className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
								active
									? 'bg-(--accent) text-(--text) border-(--accent) shadow-xs'
									: 'bg-(--background)/55 text-(--text-muted) border-(--border)/10 hover:border-(--accent)/35 hover:text-(--text)'
							}`}
						>
							{t(f.labelKey)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
