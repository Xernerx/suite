/** @format */

'use client';

import React from 'react';
import { Check, Coins, Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';
import { CatalogItem, FALLBACK_EUR_PRICES, formatStorePrice } from './types';

interface CreditTopUpPacksSectionProps {
	creditPacks: CatalogItem[];
	actionLoading: string | null;
	onBuyCreditPack: (priceId: string, pack: CatalogItem) => void;
}

export function CreditTopUpPacksSection({ creditPacks, actionLoading, onBuyCreditPack }: CreditTopUpPacksSectionProps) {
	const { t } = useDictionary();

	if (creditPacks.length === 0) return null;

	return (
		<div className="flex flex-col pt-2" style={{ gap: 'var(--ui-gap)' }}>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
				<div>
					<h2 className="text-2xl font-bold text-(--text) flex items-center gap-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
						<Coins size={20} className="text-(--accent)" />
						{t('account.store.credits.packsHeading')}
					</h2>
					<p className="text-xs text-(--text-muted) mt-0.5">{t('account.store.credits.packsSubheading')}</p>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--ui-gap)' }}>
				{creditPacks.map((pack) => {
					const activePrice = pack.prices?.[0] || null;
					const rawAmount = activePrice ? (activePrice.discountedAmount ?? activePrice.unitAmount) : null;
					const formattedPrice = typeof rawAmount === 'number' ? formatStorePrice(rawAmount / 100, activePrice?.currency) : FALLBACK_EUR_PRICES[pack.id] || '—';

					const isBusy = Boolean(activePrice && actionLoading === activePrice.id);

					return (
						<div
							key={pack.id}
							id={`store-item-${pack.id}`}
							className={`flex flex-col justify-between rounded-3xl border backdrop-blur-md transition-all ${
								pack.isFeatured
									? 'bg-(--foreground)/40 border-(--accent)/40 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_18%,transparent)]'
									: 'bg-(--foreground)/30 border-(--border)/10 hover:border-(--accent)/30 shadow-sm'
							}`}
							style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
						>
							<div className="flex flex-col gap-3">
								<div className="flex items-center justify-between gap-2">
									<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent)/15 text-(--accent) border border-(--accent)/25">
										<Coins size={20} />
									</div>
									{pack.badge && <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-(--accent)/15 text-(--accent) border border-(--accent)/25">{pack.badge}</span>}
								</div>

								<div>
									<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
										{pack.name}
									</h3>
									<p className="text-xs text-(--text-muted) mt-1">{pack.description}</p>
								</div>

								<div className="flex items-baseline gap-1.5 pt-1">
									<span className="text-3xl font-extrabold text-(--text)">{formattedPrice}</span>
									<span className="text-xs text-(--text-muted)">{t('account.store.credits.oneTimePurchase')}</span>
								</div>

								{pack.features && pack.features.length > 0 && (
									<ul className="flex flex-col gap-1.5 pt-2 border-t border-(--border)/10">
										{pack.features.map((feat, idx) => (
											<li key={idx} className="flex items-start gap-2 text-xs text-(--text-muted)">
												<Check size={13} className="text-(--accent) shrink-0 mt-0.5" />
												<span>{feat}</span>
											</li>
										))}
									</ul>
								)}
							</div>

							<Button
								variant={pack.isFeatured ? 'primary' : 'secondary'}
								disabled={!activePrice || isBusy}
								onClick={() => {
									if (activePrice) onBuyCreditPack(activePrice.id, pack);
								}}
								className="w-full flex items-center justify-center gap-2"
							>
								{isBusy ? <Loader2 size={15} className="animate-spin" /> : <ShoppingBag size={15} />}
								{activePrice ? t('account.store.credits.buyPackButton') : t('account.store.credits.skuPending')}
							</Button>
						</div>
					);
				})}
			</div>
		</div>
	);
}
