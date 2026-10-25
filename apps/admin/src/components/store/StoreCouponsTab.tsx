/** @format */

'use client';

import { useMemo, useState } from 'react';
import { Button, Confirm, Input, Selector } from '@xernerx/ui';
import { useDictionary, useToast } from '@xernerx/providers';
import { Check, Clock, Copy, Edit2, Power, Repeat, TicketPercent, Trash2, Users } from 'lucide-react';
import { StoreCoupon } from './types';

interface StoreCouponsTabProps {
	coupons: StoreCoupon[];
	onEdit: (coupon: StoreCoupon) => void;
	onToggleEnabled: (id: string, enabled: boolean) => Promise<void>;
	onDelete: (coupon: StoreCoupon) => Promise<void>;
}

export function StoreCouponsTab({ coupons, onEdit, onToggleEnabled, onDelete }: StoreCouponsTabProps) {
	const { t } = useDictionary();
	const { toast } = useToast();

	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled' | 'expired'>('all');
	const [durationFilter, setDurationFilter] = useState<'all' | 'once' | 'repeating' | 'forever'>('all');
	const [copiedCode, setCopiedCode] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [confirmDeleteCoupon, setConfirmDeleteCoupon] = useState<StoreCoupon | null>(null);

	const handleCopyCode = (code: string) => {
		navigator.clipboard.writeText(code);
		setCopiedCode(code);
		toast({ type: 'success', title: t('admin.store.alerts.couponCodeCopied') });
		setTimeout(() => setCopiedCode(null), 2000);
	};

	const confirmDelete = async () => {
		if (!confirmDeleteCoupon) return;
		const coupon = confirmDeleteCoupon;
		setConfirmDeleteCoupon(null);
		setDeletingId(coupon.id);
		try {
			await onDelete(coupon);
		} catch (err: any) {
			toast({ type: 'error', title: t('admin.store.alerts.deleteFailed'), description: err.message });
		} finally {
			setDeletingId(null);
		}
	};

	const filteredCoupons = useMemo(() => {
		const q = search.trim().toLowerCase();
		const now = Date.now();
		return coupons.filter((coupon) => {
			const isExpired = Boolean(coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now);
			if (statusFilter === 'enabled' && (!coupon.enabled || isExpired)) return false;
			if (statusFilter === 'disabled' && coupon.enabled) return false;
			if (statusFilter === 'expired' && !isExpired) return false;
			if (durationFilter !== 'all' && coupon.duration !== durationFilter) return false;

			if (!q) return true;
			return (
				String(coupon.code || '')
					.toLowerCase()
					.includes(q) ||
				String(coupon.name || '')
					.toLowerCase()
					.includes(q) ||
				String(coupon.description || '')
					.toLowerCase()
					.includes(q)
			);
		});
	}, [coupons, search, statusFilter, durationFilter]);

	return (
		<div className="flex flex-col gap-6">
			{/* Filters */}
			<div className="flex flex-col md:flex-row items-center gap-3 justify-between">
				<div className="w-full md:max-w-md">
					<Input variant="search" shortcut={true} value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder={t('admin.store.coupons.searchPlaceholder')} />
				</div>

				<div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
					<div className="w-full sm:w-44">
						<Selector
							value={statusFilter}
							onChange={(val) => setStatusFilter(val as any)}
							options={[
								{ value: 'all', label: t('admin.store.table.filterAll') },
								{ value: 'enabled', label: t('admin.store.table.filterEnabled') },
								{ value: 'disabled', label: t('admin.store.table.filterDisabled') },
								{ value: 'expired', label: t('admin.store.coupons.filterExpired') },
							]}
						/>
					</div>
					<div className="w-full sm:w-48">
						<Selector
							value={durationFilter}
							onChange={(val) => setDurationFilter(val as any)}
							options={[
								{ value: 'all', label: t('admin.store.coupons.allDurations') },
								{ value: 'once', label: t('admin.store.coupons.durationOnce') },
								{ value: 'repeating', label: t('admin.store.coupons.durationRepeating') },
								{ value: 'forever', label: t('admin.store.coupons.durationForever') },
							]}
						/>
					</div>
				</div>
			</div>

			{filteredCoupons.length === 0 ? (
				<div className="flex flex-col items-center justify-center p-12 text-center border border-(--border)/10 rounded-3xl bg-(--foreground)/30 backdrop-blur-md shadow-xs">
					<TicketPercent className="w-12 h-12 text-(--text-muted) mb-3 opacity-50" />
					<p className="text-(--text-muted) text-sm">{t('admin.store.coupons.noCoupons')}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredCoupons.map((coupon) => {
						const isExpired = Boolean(coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now());
						const isMaxedOut = Boolean(coupon.maxRedemptions && coupon.timesRedeemed >= coupon.maxRedemptions);
						const discountLabel =
							coupon.discountType === 'amount'
								? `-$${Number(coupon.amountOff || 0).toFixed(2)} ${String(coupon.currency || 'usd').toUpperCase()}`
								: t('admin.store.table.percentOff', { percent: coupon.percentOff });

						const durationLabel =
							coupon.duration === 'repeating'
								? t('admin.store.coupons.repeatingMonths', { months: coupon.durationInMonths || 1 })
								: coupon.duration === 'forever'
									? t('admin.store.coupons.durationForever')
									: t('admin.store.coupons.durationOnce');

						return (
							<div
								key={coupon.id}
								className={`relative flex flex-col justify-between p-5 rounded-3xl border backdrop-blur-md transition-all duration-200 ${
									coupon.enabled && !isExpired && !isMaxedOut ? 'border-(--border)/10 bg-(--foreground)/30 shadow-xs' : 'border-(--border)/10 bg-(--foreground)/20 opacity-60'
								}`}
							>
								<div>
									{/* Header & Badges */}
									<div className="flex items-start justify-between gap-3 mb-3">
										<div className="flex flex-wrap items-center gap-1.5">
											<span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/20">
												{discountLabel}
											</span>
											<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-(--background)/60 text-(--text-muted) border border-(--border)/10 flex items-center gap-1">
												<Repeat size={11} /> {durationLabel}
											</span>
											{coupon.stripePromotionCodeId && (
												<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-(--accent)/15 text-(--accent)">{t('admin.store.coupons.stripeSynced')}</span>
											)}
										</div>

										<button
											onClick={() => onToggleEnabled(coupon.id, !coupon.enabled)}
											className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
												coupon.enabled
													? 'bg-(--accent-green)/10 text-(--accent-green) border-(--accent-green)/20 hover:bg-(--accent-green)/20'
													: 'bg-(--accent-red)/10 text-(--accent-red) border-(--accent-red)/20 hover:bg-(--accent-red)/20'
											}`}
											title={coupon.enabled ? t('admin.store.tooltips.clickToDisable') : t('admin.store.tooltips.clickToEnable')}
										>
											<Power size={14} />
										</button>
									</div>

									{/* Name & Description */}
									<h3 className="font-bold text-(--text) text-lg mb-1" style={{ fontFamily: 'var(--font-fredoka)' }}>
										{coupon.name}
									</h3>
									{coupon.description && <p className="text-xs text-(--text-muted) mb-3 line-clamp-2">{coupon.description}</p>}

									{/* Promo Code Box */}
									<div className="flex items-center justify-between p-2.5 rounded-2xl bg-(--background)/90 border border-(--border)/10 mb-3">
										<div className="flex items-center gap-2 font-mono text-xs font-bold text-(--accent) tracking-wider truncate">
											<TicketPercent size={14} className="shrink-0 text-(--accent)" />
											<span className="truncate">{coupon.code}</span>
										</div>
										<button
											onClick={() => handleCopyCode(coupon.code)}
											className="p-1 text-(--text-muted) hover:text-(--text) transition-colors cursor-pointer shrink-0"
											title={t('admin.store.coupons.copyCode')}
										>
											{copiedCode === coupon.code ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} />}
										</button>
									</div>

									{/* Redemptions & Expiration */}
									<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-(--text-muted) mb-3">
										<span className="flex items-center gap-1.5">
											<Users size={12} className="text-(--accent)" />
											{t('admin.store.coupons.redemptionsLabel')}:{' '}
											<strong className="text-(--text)">
												{coupon.timesRedeemed || 0} / {coupon.maxRedemptions ? coupon.maxRedemptions : '∞'}
											</strong>
										</span>
										{coupon.expiresAt && (
											<span className={`flex items-center gap-1 ${isExpired ? 'text-(--accent-red) font-semibold' : ''}`}>
												<Clock size={12} />
												{isExpired ? t('admin.store.coupons.expiredBadge') : t('admin.store.coupons.expiresOn', { date: new Date(coupon.expiresAt).toLocaleDateString() })}
											</span>
										)}
									</div>
								</div>

								{/* Actions */}
								<div className="flex items-center justify-between pt-3 border-t border-(--border)/10 text-xs text-(--text-muted)">
									<span className="font-mono text-[11px] truncate max-w-[160px]">{coupon.stripeCouponId || coupon.id}</span>

									<div className="flex items-center gap-1.5">
										<Button variant="secondary" onClick={() => onEdit(coupon)} className="!p-2 !h-8">
											<Edit2 size={14} />
										</Button>
										<Button variant="danger" onClick={() => setConfirmDeleteCoupon(coupon)} disabled={deletingId === coupon.id} className="!p-2 !h-8">
											<Trash2 size={14} />
										</Button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			<Confirm
				open={!!confirmDeleteCoupon}
				onOpenChange={(open) => !open && setConfirmDeleteCoupon(null)}
				title={confirmDeleteCoupon?.code || ''}
				description={t('admin.store.alerts.deleteCouponConfirm', { code: confirmDeleteCoupon?.code || '' })}
				confirmKeyword={confirmDeleteCoupon?.code || confirmDeleteCoupon?.id}
				variant="danger"
				onConfirm={confirmDelete}
			/>
		</div>
	);
}
