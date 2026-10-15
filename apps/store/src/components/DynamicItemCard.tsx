/** @format */

'use client';

import { Check, Sparkles } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { CatalogItem, UserSubscription } from './types';

interface DynamicItemCardProps {
	item: CatalogItem;
	billingInterval: 'month' | 'year';
	actionLoading: string | null;
	getActiveSubscription: (priceId: string | null) => UserSubscription | null | undefined;
	handleSubscribe: (priceId: string | null, discountPercent: number) => void;
	handleCancelClick: (subscriptionId: string) => void;
}

export function DynamicItemCard({ item, billingInterval, actionLoading, getActiveSubscription, handleSubscribe, handleCancelClick }: DynamicItemCardProps) {
	const { t } = useDictionary();

	const activePrice = item.prices.find((p) => p.interval === billingInterval) || item.prices[0];
	const currentSub = getActiveSubscription(activePrice?.id || null);

	const originalAmount = activePrice ? activePrice.unitAmount / 100 : null;
	const discountedAmount = activePrice?.discountedAmount ? activePrice.discountedAmount / 100 : originalAmount;
	const hasDiscount = item.discountPercent > 0 && originalAmount !== null && discountedAmount !== null && discountedAmount < originalAmount;

	return (
		<div className="p-6 rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md flex flex-col justify-between shadow-sm hover:border-(--accent)/50 hover:bg-(--foreground)/50 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)] transition-all">
			<div>
				{/* Top Badges */}
				<div className="flex items-center justify-between gap-2 mb-2">
					{item.badge ? (
						<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-(--accent)/15 text-(--accent) flex items-center gap-1">
							<Sparkles size={11} /> {item.badge}
						</span>
					) : (
						<div />
					)}

					{hasDiscount && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-500 border border-green-500/20">-{item.discountPercent}%</span>}
				</div>

				<h4 className="text-xl font-bold mb-1 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{item.name || item.stripeName || t('account.store.buttons.loading')}
				</h4>

				<p className="text-xs text-(--text-muted) mb-4 min-h-7.5">{item.description || item.stripeDescription || t('account.store.cards.botFallback')}</p>

				{/* Pricing */}
				<div className="flex items-baseline gap-2 mb-6">
					{activePrice ? (
						<>
							{hasDiscount && <span className="text-lg line-through text-(--text-muted) opacity-60">€{originalAmount?.toFixed(0)}</span>}
							<span className={`text-3xl font-bold ${hasDiscount ? 'text-green-500' : 'text-(--text)'}`}>€{discountedAmount?.toFixed(0)}</span>
							<span className="text-xs text-(--text-muted) font-normal">
								/{billingInterval === 'month' ? t('account.store.pricing.monthShort') : t('account.store.pricing.yearShort')}
							</span>
						</>
					) : (
						<span className="text-2xl font-bold text-(--text-muted)">—</span>
					)}
				</div>

				{/* Feature Points */}
				{item.features && item.features.length > 0 && (
					<ul className="space-y-2 mb-6 text-xs text-(--text-muted)">
						{item.features.map((feat, idx) => (
							<li key={idx} className="flex items-start gap-2">
								<Check size={14} className="shrink-0 text-(--accent) mt-0.5" />
								<span>{feat}</span>
							</li>
						))}
					</ul>
				)}
			</div>

			{/* Action Button */}
			<div>
				{currentSub ? (
					<button
						onClick={() => handleCancelClick(currentSub.stripeSubscriptionId)}
						className="w-full py-2.5 px-3 rounded-xl text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer"
					>
						{t('account.store.buttons.cancelPass')}
					</button>
				) : (
					<button
						onClick={() => handleSubscribe(activePrice?.id || null, item.discountPercent)}
						disabled={!activePrice || actionLoading === activePrice?.id}
						className="w-full py-2.5 px-3 rounded-xl text-xs font-medium bg-(--background) hover:bg-(--accent) text-(--text) hover:text-white border border-(--border)/10 transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-xs"
					>
						{actionLoading === activePrice?.id ? t('account.store.buttons.redirecting') : t('account.store.buttons.getPass')}
					</button>
				)}
			</div>
		</div>
	);
}
