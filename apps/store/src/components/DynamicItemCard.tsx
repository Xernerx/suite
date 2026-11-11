/** @format */

'use client';

import { Check, Coins, ExternalLink, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useDictionary } from '@xernerx/providers';
import { CatalogItem, UserSubscription } from './types';

interface DynamicItemCardProps {
	item: CatalogItem;
	billingInterval: 'month' | 'year';
	actionLoading: string | null;
	isHighlighted?: boolean;
	isWideShowcase?: boolean;
	appliedCoupon?: {
		code: string;
		name: string;
		discountType: 'percent' | 'amount';
		percentOff: number;
		amountOff: number;
	} | null;
	getActiveSubscription: (priceId: string | null, item?: CatalogItem) => UserSubscription | null | undefined;
	handleSubscribe: (priceId: string | null, discountPercent: number) => void;
	handleCancelClick: (subscriptionId: string) => void;
}

function formatPriceAmount(amount: number | null | undefined, currency?: string): string {
	if (amount === null || amount === undefined) return '—';
	const cur = String(currency || 'eur').toLowerCase();
	const symbol = cur === 'usd' ? '$' : cur === 'gbp' ? '£' : '€';
	const hasCents = Math.round(amount * 100) % 100 !== 0;
	return `${symbol}${hasCents ? amount.toFixed(2) : amount.toFixed(0)}`;
}

export function DynamicItemCard({
	item,
	billingInterval,
	actionLoading,
	isHighlighted = false,
	isWideShowcase = false,
	appliedCoupon,
	getActiveSubscription,
	handleSubscribe,
	handleCancelClick,
}: DynamicItemCardProps) {
	const { t } = useDictionary();

	const activePrice = item.prices.find((p) => p.interval === billingInterval) || item.prices[0];
	const currentSub = getActiveSubscription(activePrice?.id || null, item);
	const hasDiscordEntitlement = Boolean(item.discordSku?.hasEntitlement);
	const isDiscordSku = Boolean(item.discordSku?.storeUrl);
	const isStripeManagedSub = Boolean(currentSub?.stripeSubscriptionId && String(currentSub.stripeSubscriptionId).startsWith('sub_'));

	const originalAmount = activePrice ? activePrice.unitAmount / 100 : null;
	const baseDiscounted = activePrice?.discountedAmount ? activePrice.discountedAmount / 100 : originalAmount;
	const effectiveDiscountPercent = isDiscordSku ? 0 : appliedCoupon?.discountType === 'percent' ? Math.max(item.discountPercent || 0, appliedCoupon.percentOff || 0) : item.discountPercent || 0;
	const discountedAmount =
		originalAmount === null
			? null
			: isDiscordSku
				? originalAmount
				: appliedCoupon?.discountType === 'amount'
					? Math.max(0, (baseDiscounted ?? originalAmount) - (appliedCoupon.amountOff || 0))
					: effectiveDiscountPercent > 0
						? originalAmount * (1 - effectiveDiscountPercent / 100)
						: baseDiscounted;
	const hasDiscount = !isDiscordSku && originalAmount !== null && discountedAmount !== null && discountedAmount < originalAmount;

	const discordBenefits = item.discordSku?.benefits || [];
	const thumbnailUrl = item.discordSku?.thumbnailUrl || null;
	const bannerUrl = item.discordSku?.bannerUrl || null;
	const appIconUrl = item.discordSku?.appIconUrl || null;

	// Rich Discord App Subscription Showcase Layout (e.g. Virtue Pass $1.99/mo with artwork & benefits)
	if (isDiscordSku && (thumbnailUrl || discordBenefits.length > 0)) {
		return (
			<div
				id={`store-item-${item.id}`}
				className={`relative overflow-hidden rounded-3xl border ${
					isHighlighted ? 'border-2 border-(--accent) shadow-[0_0_32px_color-mix(in_srgb,var(--accent)_35%,transparent)]' : 'border-(--border)/10 hover:border-(--accent)/50'
				} bg-(--foreground)/30 backdrop-blur-md flex flex-col ${isWideShowcase ? 'lg:flex-row' : ''} justify-between shadow-sm transition-all`}
			>
				{/* Left / Top Visual Hero & Pricing Column */}
				<div className={`flex flex-col justify-between ${isWideShowcase ? 'lg:w-5/12 border-b lg:border-b-0 lg:border-r border-(--border)/10' : 'border-b border-(--border)/10'}`}>
					{/* Banner + Pass Crest Artwork Header */}
					<div className="relative h-44 sm:h-52 w-full overflow-hidden bg-(--background)/70 flex items-center justify-center">
						{bannerUrl && <Image src={bannerUrl} alt={item.name} fill unoptimized className="object-cover opacity-35 scale-105 blur-[1px]" />}
						<div className="absolute inset-0 bg-linear-to-t from-(--background) via-(--background)/40 to-transparent" />

						{/* Top Badge Overlay */}
						<div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
							<span className="text-[11px] font-bold px-3 py-1 rounded-full bg-(--background)/85 backdrop-blur-md border border-(--accent)/40 text-(--accent) flex items-center gap-1.5 shadow-sm">
								<Sparkles size={12} />
								{item.badge || item.discordSku?.summary || t('account.store.cards.discordPassBadge')}
							</span>
							{appIconUrl && <Image src={appIconUrl} alt={item.name} width={32} height={32} unoptimized className="w-8 h-8 rounded-xl border border-(--border)/20 shadow-md" />}
						</div>

						{/* Official 1024x1024 Pass Artwork Thumbnail */}
						{thumbnailUrl && (
							<div className="relative z-10 mt-4 w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-2 border-(--accent)/60 shadow-[0_0_36px_color-mix(in_srgb,var(--accent)_45%,transparent)] bg-(--background)/80">
								<Image src={thumbnailUrl} alt={item.name} width={256} height={256} unoptimized className="w-full h-full object-cover" />
							</div>
						)}
					</div>

					{/* Title, Description, $1.99 Price & CTA */}
					<div className="p-6 flex flex-col justify-between flex-1" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
						<div>
							<h3 className="text-2xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{item.name || item.stripeName}
							</h3>
							<p className="text-xs sm:text-sm text-(--text-muted) mt-1.5 leading-relaxed">{item.description || item.stripeDescription}</p>
						</div>

						<div className="flex items-end justify-between gap-4 pt-2">
							<div className="flex items-baseline gap-1.5">
								<span className="text-4xl font-extrabold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{formatPriceAmount(discountedAmount, activePrice?.currency)}
								</span>
								<span className="text-xs text-(--text-muted) font-medium">/{t('account.store.pricing.monthShort')}</span>
							</div>

							<span className="inline-flex items-center gap-1 rounded-full bg-(--accent)/15 border border-(--accent)/30 px-2.5 py-1 text-[11px] font-bold text-(--accent)">
								<Coins size={12} />
								<span>{t('account.store.cards.creditBoostBadge')}</span>
							</span>
						</div>

						<div className="pt-1">
							{hasDiscordEntitlement || currentSub ? (
								<a
									href={item.discordSku?.storeUrl || 'https://discord.com/settings/subscriptions'}
									target="_blank"
									rel="noopener noreferrer"
									className="w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/30 hover:bg-(--accent-green)/25 transition-colors flex items-center justify-center gap-2"
								>
									<Check size={15} />
									<span>{currentSub?.stripeSubscriptionId === 'included_in_ultra' ? t('account.store.buttons.includedInPlan') : t('account.store.buttons.currentPlan')}</span>
								</a>
							) : (
								<a
									href={item.discordSku?.storeUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold bg-(--accent) hover:bg-(--hover-accent) text-white transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
								>
									<span>{t('account.store.buttons.getPass')}</span>
									<ExternalLink size={14} />
								</a>
							)}
						</div>
					</div>
				</div>

				{/* Right / Bottom Benefits Grid */}
				<div className={`p-6 flex flex-col justify-center ${isWideShowcase ? 'lg:w-7/12' : ''}`} style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
					<div className="text-xs font-extrabold uppercase tracking-wider text-(--text-muted)">{t('account.store.cards.includedBenefitsTitle')}</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{discordBenefits.map((benefit) => (
							<div key={benefit.id} className="flex items-start gap-3 rounded-2xl bg-(--background)/55 border border-(--border)/10 p-3.5 hover:border-(--accent)/35 transition-colors">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--accent)/15 border border-(--accent)/30 text-base">{benefit.emoji || '✨'}</div>
								<div className="min-w-0">
									<div className="text-xs sm:text-sm font-extrabold text-(--text)">{benefit.name}</div>
									<p className="text-[11px] sm:text-xs text-(--text-muted) mt-0.5 leading-snug">{benefit.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			id={`store-item-${item.id}`}
			className={`p-6 rounded-3xl border ${
				isHighlighted ? 'border-2 border-(--accent)' : 'border-(--border)/10'
			} bg-(--foreground)/30 backdrop-blur-md flex flex-col justify-between shadow-sm hover:border-(--accent)/50 hover:bg-(--foreground)/50 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)] transition-all`}
		>
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

					{hasDiscount && (
						<span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/20">-{item.discountPercent}%</span>
					)}
				</div>

				<h3 className="text-xl font-bold mb-1 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{item.name || item.stripeName || t('account.store.buttons.loading')}
				</h3>

				<p className="text-xs text-(--text-muted) mb-4 min-h-7.5">{item.description || item.stripeDescription || t('account.store.cards.botFallback')}</p>

				{/* Pricing */}
				<div className="flex items-baseline gap-2 mb-6">
					{activePrice ? (
						<>
							{hasDiscount && <span className="text-lg line-through text-(--text-muted) opacity-60">{formatPriceAmount(originalAmount, activePrice.currency)}</span>}
							<span className={`text-3xl font-bold ${hasDiscount ? 'text-(--accent-green)' : 'text-(--text)'}`}>{formatPriceAmount(discountedAmount, activePrice.currency)}</span>
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
				{hasDiscordEntitlement ? (
					<a
						href={item.discordSku?.storeUrl || 'https://discord.com/settings/subscriptions'}
						target="_blank"
						rel="noopener noreferrer"
						className="w-full py-2.5 px-3 rounded-xl text-xs font-medium bg-(--accent-green)/10 text-(--accent-green) border border-(--accent-green)/20 hover:bg-(--accent-green)/20 transition-colors flex items-center justify-center gap-1.5"
					>
						<Check size={14} />
						{t('account.store.buttons.currentPlan')}
					</a>
				) : currentSub ? (
					isStripeManagedSub ? (
						<button
							onClick={() => handleCancelClick(currentSub.stripeSubscriptionId)}
							className="w-full py-2.5 px-3 rounded-xl text-xs font-medium bg-(--accent-red)/10 text-(--accent-red) border border-(--accent-red)/20 hover:bg-(--accent-red)/20 transition-colors cursor-pointer"
						>
							{t('account.store.buttons.cancelPass')}
						</button>
					) : (
						<div className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/25 flex items-center justify-center gap-1.5">
							<Check size={14} />
							<span>{t('account.store.buttons.currentPlan')}</span>
						</div>
					)
				) : isDiscordSku && item.discordSku?.storeUrl ? (
					<a
						href={item.discordSku.storeUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="w-full py-2.5 px-3 rounded-xl text-xs font-medium bg-(--background) hover:bg-(--accent) text-(--text) hover:text-white border border-(--border)/10 transition-all duration-200 cursor-pointer flex items-center justify-center shadow-xs"
					>
						{t('account.store.buttons.getPass')}
					</a>
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
