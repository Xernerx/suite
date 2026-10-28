/** @format */

'use client';

import { AlertCircle, Check, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Loading } from '@xernerx/feedback';
import { useDictionary } from '@xernerx/providers';
import { CatalogItem, UserSubscription } from './types';

interface DynamicFeaturedCardProps {
	item: CatalogItem;
	billingInterval: 'month' | 'year';
	userLoading: boolean;
	actionLoading: string | null;
	appliedCoupon?: {
		code: string;
		name: string;
		discountType: 'percent' | 'amount';
		percentOff: number;
		amountOff: number;
	} | null;
	getActiveSubscription: (priceId: string | null) => UserSubscription | null | undefined;
	handleSubscribe: (priceId: string | null, discountPercent: number) => void;
	handleCancelClick: (subscriptionId: string) => void;
}

export function DynamicFeaturedCard({ item, billingInterval, userLoading, actionLoading, appliedCoupon, getActiveSubscription, handleSubscribe, handleCancelClick }: DynamicFeaturedCardProps) {
	const { t } = useDictionary();

	const activePrice = item.prices.find((p) => p.interval === billingInterval) || item.prices[0];
	const currentSub = getActiveSubscription(activePrice?.id || null);

	const originalAmount = activePrice ? activePrice.unitAmount / 100 : null;
	const baseDiscounted = activePrice?.discountedAmount ? activePrice.discountedAmount / 100 : originalAmount;
	const effectiveDiscountPercent = appliedCoupon?.discountType === 'percent' ? Math.max(item.discountPercent || 0, appliedCoupon.percentOff || 0) : item.discountPercent || 0;
	const discountedAmount =
		originalAmount === null
			? null
			: appliedCoupon?.discountType === 'amount'
				? Math.max(0, (baseDiscounted ?? originalAmount) - (appliedCoupon.amountOff || 0))
				: effectiveDiscountPercent > 0
					? originalAmount * (1 - effectiveDiscountPercent / 100)
					: baseDiscounted;
	const hasDiscount = originalAmount !== null && discountedAmount !== null && discountedAmount < originalAmount;

	return (
		<motion.div
			initial={{ opacity: 1, y: 0 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className="relative flex flex-col p-8 rounded-3xl border-2 border-(--accent) bg-(--foreground)/30 backdrop-blur-md shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_25%,transparent)]"
		>
			<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-(--accent) text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap">
				<Sparkles size={12} />
				{item.badge || t('account.store.ultra.badge')}
			</div>

			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2" style={{ color: 'var(--accent)' }}>
					<Zap size={22} />
					<span className="text-xs font-semibold uppercase tracking-wider">{t('account.store.ultra.subtitle')}</span>
				</div>

				{hasDiscount && (
					<span className="px-2 py-0.5 rounded-full text-xs font-bold bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/20">
						{t('account.store.discountBadge', { percent: item.discountPercent })}
					</span>
				)}
			</div>

			<div className="mb-6">
				<h2 className="text-3xl font-extrabold mb-2 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{item.name || item.stripeName || t('account.store.ultra.fallbackName')}
				</h2>
				<p className="text-sm text-(--text-muted)">{item.description || item.stripeDescription || t('account.store.ultra.fallbackDesc')}</p>
			</div>

			<div className="mb-6 flex items-baseline gap-2">
				{activePrice ? (
					<>
						{hasDiscount && <span className="text-2xl line-through text-(--text-muted) opacity-60">€{originalAmount?.toFixed(0)}</span>}
						<span className={`text-5xl font-bold ${hasDiscount ? 'text-(--accent-green)' : 'text-(--text)'}`}>€{discountedAmount?.toFixed(0)}</span>
						<span className="text-(--text-muted) font-medium">{billingInterval === 'month' ? t('account.store.pricing.monthlySuffix') : t('account.store.pricing.yearlySuffix')}</span>
					</>
				) : (
					<span className="text-4xl font-bold text-(--text-muted)">—</span>
				)}
			</div>

			{item.features && item.features.length > 0 && (
				<ul className="flex-1 space-y-4 mb-8">
					{item.features.map((feature, idx) => (
						<li key={idx} className="flex items-start gap-3 text-sm text-(--text-muted)">
							<Check className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
							<span>{feature}</span>
						</li>
					))}
				</ul>
			)}

			{userLoading ? (
				<div className="w-full py-2 flex items-center justify-center">
					<Loading variant="small" />
				</div>
			) : currentSub ? (
				<div className="space-y-2">
					<button
						onClick={() => handleCancelClick(currentSub.stripeSubscriptionId)}
						className="w-full py-3 px-4 rounded-xl font-medium bg-(--accent-red)/10 hover:bg-(--accent-red)/20 text-(--accent-red) border border-(--accent-red)/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
					>
						<AlertCircle size={16} />
						{t('account.store.buttons.cancelUltra')}
					</button>
					<p className="text-xs text-center text-(--text-muted)">
						{t('account.store.buttons.activeUntil', {
							date: new Date(currentSub.currentPeriodEnd).toLocaleDateString(),
						})}
					</p>
				</div>
			) : (
				<button
					onClick={() => handleSubscribe(activePrice?.id || null, item.discountPercent)}
					disabled={!activePrice || actionLoading === activePrice?.id}
					className="w-full py-3 px-4 rounded-xl font-medium bg-(--accent) hover:bg-(--hover-accent) text-white transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
				>
					<Zap size={16} />
					{actionLoading === activePrice?.id ? t('account.store.buttons.redirecting') : t('account.store.buttons.getUltra')}
				</button>
			)}
		</motion.div>
	);
}
