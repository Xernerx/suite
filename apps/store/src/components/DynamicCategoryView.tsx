/** @format */

'use client';

import { Bot, Check, PackageSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDictionary } from '@xernerx/providers';
import { CatalogCategory, CatalogItem, UserSubscription } from './types';
import { DynamicFeaturedCard } from './DynamicFeaturedCard';
import { DynamicItemCard } from './DynamicItemCard';

interface DynamicCategoryViewProps {
	category: CatalogCategory;
	items: CatalogItem[];
	billingInterval: 'month' | 'year';
	userLoading: boolean;
	actionLoading: string | null;
	getActiveSubscription: (priceId: string | null) => UserSubscription | null | undefined;
	handleSubscribe: (priceId: string | null, discountPercent: number) => void;
	handleCancelClick: (subscriptionId: string) => void;
}

export function DynamicCategoryView({ category, items, billingInterval, userLoading, actionLoading, getActiveSubscription, handleSubscribe, handleCancelClick }: DynamicCategoryViewProps) {
	const { t } = useDictionary();

	const featuredItems = items.filter((i) => i.isFeatured);
	const standardItems = items.filter((i) => !i.isFeatured);

	// Determine if we should show the free tier card (e.g. for consumers)
	const showFreeCard = category.id === 'consumers';

	return (
		<div className="w-full max-w-(--page-width) flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 2)' }}>
			{/* Featured section */}
			{(featuredItems.length > 0 || showFreeCard) && (
				<div className="grid grid-cols-1 md:grid-cols-2 w-full max-w-4xl mx-auto" style={{ gap: 'var(--ui-gap)' }}>
					{/* Free Tier Card */}
					{showFreeCard && (
						<motion.div
							initial={{ opacity: 1, y: 0 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
							className="relative flex flex-col rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md"
							style={{ padding: 'var(--ui-gap)' }}
						>
							<div className="flex items-center gap-2 mb-4 text-(--text-muted)">
								<Bot size={22} />
								<span className="text-xs font-semibold uppercase tracking-wider">{t('account.store.free.badge')}</span>
							</div>

							<div className="mb-6">
								<h2 className="text-3xl font-extrabold mb-2 text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{t('account.store.free.title')}
								</h2>
								<p className="text-sm text-(--text-muted)">{t('account.store.free.desc')}</p>
							</div>

							<div className="mb-6 flex items-baseline gap-1">
								<span className="text-5xl font-bold">€0</span>
								<span className="text-(--text-muted) font-medium">
									{billingInterval === 'month' ? t('account.store.pricing.monthlySuffix') : t('account.store.pricing.yearlySuffix')}
								</span>
							</div>

							<ul className="flex-1 space-y-4 mb-8">
								{[t('account.store.free.features.consumerBots'), t('account.store.free.features.mediaUploads')].map((feature) => (
									<li key={feature} className="flex items-start gap-3 text-sm text-(--text-muted)">
										<Check className="w-5 h-5 shrink-0 text-(--text-muted)" />
										<span>{feature}</span>
									</li>
								))}
							</ul>

							<button
								disabled
								className="w-full py-3 px-4 rounded-xl font-medium bg-(--background) text-(--text) border border-(--border)/10 flex items-center justify-center gap-2 cursor-default shadow-xs"
							>
								<Check size={16} className="text-(--accent-green)" /> {t('account.store.buttons.currentPlan')}
							</button>
						</motion.div>
					)}

					{/* Featured Hero Items */}
					{featuredItems.map((item) => (
						<DynamicFeaturedCard
							key={item.id}
							item={item}
							billingInterval={billingInterval}
							userLoading={userLoading}
							actionLoading={actionLoading}
							getActiveSubscription={getActiveSubscription}
							handleSubscribe={handleSubscribe}
							handleCancelClick={handleCancelClick}
						/>
					))}
				</div>
			)}

			{/* Standard Items Grid */}
			{standardItems.length > 0 && (
				<div>
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{category.name}
						</h2>
						{category.description && <p className="text-xs text-(--text-muted) hidden md:block">{category.description}</p>}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4" style={{ gap: 'var(--ui-gap)' }}>
						{standardItems.map((item) => (
							<DynamicItemCard
								key={item.id}
								item={item}
								billingInterval={billingInterval}
								actionLoading={actionLoading}
								getActiveSubscription={getActiveSubscription}
								handleSubscribe={handleSubscribe}
								handleCancelClick={handleCancelClick}
							/>
						))}
					</div>
				</div>
			)}

			{/* Empty State */}
			{featuredItems.length === 0 && standardItems.length === 0 && !showFreeCard && (
				<div className="flex flex-col items-center justify-center p-12 text-center border border-(--border)/10 rounded-3xl bg-(--foreground)/20">
					<PackageSearch className="w-12 h-12 text-(--text-muted) mb-3 opacity-50" />
					<p className="text-(--text-muted) text-sm">{t('account.store.noItems')}</p>
				</div>
			)}
		</div>
	);
}
