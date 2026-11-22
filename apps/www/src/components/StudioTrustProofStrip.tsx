/** @format */

'use client';

import { ArrowUpRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';

export function StudioTrustProofStrip({ showComparisonHeading = false }: { showComparisonHeading?: boolean }) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	const proofMetrics = [t('www.trustProof.proofMetrics.servers'), t('www.trustProof.proofMetrics.users'), t('www.trustProof.proofMetrics.uptime'), t('www.trustProof.proofMetrics.reviews')];

	const tiers = [
		{
			id: 'free',
			title: t('www.trustProof.tierFreeTitle'),
			desc: t('www.trustProof.tierFreeDesc'),
			highlighted: false,
		},
		{
			id: 'passes',
			title: t('www.trustProof.tierPassesTitle'),
			desc: t('www.trustProof.tierPassesDesc'),
			highlighted: false,
		},
		{
			id: 'ultra',
			title: t('www.trustProof.tierUltraTitle'),
			desc: t('www.trustProof.tierUltraDesc'),
			highlighted: true,
		},
	];

	return (
		<section className="w-full rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
				<div className="flex flex-col gap-2 max-w-3xl">
					<div className="inline-flex items-center gap-2 self-start rounded-full bg-(--accent)/10 border border-(--accent)/30 px-3 py-1 text-xs font-bold text-(--accent)">
						<ShieldCheck size={13} className="shrink-0" />
						<span>{t('www.trustProof.proofBadge')}</span>
					</div>
					<h2 className="text-2xl sm:text-3xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('www.trustProof.entityHeading')}
					</h2>
					<p className="text-sm text-(--text-muted) leading-relaxed">{t('www.trustProof.entityDesc')}</p>
				</div>

				<a
					href={getEnvUrl('https://store.xernerx.com')}
					className="self-start lg:self-center inline-flex items-center gap-2 rounded-2xl bg-(--accent) hover:bg-(--hover-accent) text-(--accent-contrast) px-5 py-3 text-xs font-extrabold transition-colors whitespace-nowrap shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_30%,transparent)] shrink-0"
				>
					<Sparkles size={14} className="shrink-0" />
					<span>{t('www.trustProof.storeCta')}</span>
					<ArrowUpRight size={14} className="shrink-0" />
				</a>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				{proofMetrics.map((metric) => (
					<span key={metric} className="inline-flex items-center gap-1.5 rounded-full bg-(--background)/50 border border-(--border)/10 px-3 py-1 text-xs font-semibold text-(--text-muted)">
						<CheckCircle2 size={12} className="text-(--accent) shrink-0" />
						<span>{metric}</span>
					</span>
				))}
			</div>

			<div className="flex flex-col gap-3">
				{showComparisonHeading && (
					<h2 className="text-xl sm:text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('www.trustProof.pricingHeading')}
					</h2>
				)}

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{tiers.map((tier) => (
						<div
							key={tier.id}
							className={`flex flex-col gap-1.5 rounded-2xl p-5 border ${tier.highlighted ? 'bg-(--accent)/10 border-(--accent)/35' : 'bg-(--background)/50 border-(--border)/10'}`}
						>
							<div className="flex items-center gap-2">
								<CheckCircle2 size={15} className="text-(--accent) shrink-0" />
								<h3 className="text-base font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{tier.title}
								</h3>
							</div>
							<p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">{tier.desc}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
