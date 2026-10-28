/** @format */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Stripe from 'stripe';
import { database } from '@xernerx/lib/server';

const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const isStripeConfigured = Boolean(stripeKey && stripeKey !== 'sk_test_placeholder');
const stripe = isStripeConfigured
	? new Stripe(stripeKey, {
			apiVersion: '2026-09-30.endive',
		})
	: null;

export async function GET(req: Request) {
	try {
		const { models } = await database('xernerx');
		const Coupon = (models.store as any).Coupon;

		const url = new URL(req.url);
		const codeQuery = url.searchParams.get('code')?.trim().toUpperCase();
		if (codeQuery) {
			const found = await Coupon.findOne({ code: codeQuery }).lean();
			if (!found || !found.enabled) {
				return NextResponse.json({ valid: false, error: 'Invalid or inactive promotion code' }, { status: 404 });
			}
			if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) {
				return NextResponse.json({ valid: false, error: 'This promotion code has expired' }, { status: 400 });
			}
			if (found.maxRedemptions && (found.timesRedeemed || 0) >= found.maxRedemptions) {
				return NextResponse.json({ valid: false, error: 'This promotion code has reached its redemption limit' }, { status: 400 });
			}
			return NextResponse.json({
				valid: true,
				coupon: {
					id: found.id,
					code: found.code,
					name: found.name,
					discountType: found.discountType || 'percent',
					percentOff: found.percentOff || 0,
					amountOff: found.amountOff || 0,
					currency: found.currency || 'usd',
					duration: found.duration || 'once',
					durationInMonths: found.durationInMonths || null,
				},
			});
		}

		if (stripe) {
			try {
				const promoList = await stripe.promotionCodes.list({ limit: 50 });
				for (const promo of promoList.data) {
					const rawCoupon: any = (promo as any).coupon || (promo as any).promotion?.coupon;
					const couponObj = typeof rawCoupon === 'object' && rawCoupon ? rawCoupon : null;
					const code = String(promo.code || '').toUpperCase();
					if (!code) continue;

					const existing = await Coupon.findOne({ $or: [{ stripePromotionCodeId: promo.id }, { code }] });
					if (existing) {
						existing.timesRedeemed = typeof promo.times_redeemed === 'number' ? promo.times_redeemed : existing.timesRedeemed;
						existing.enabled = Boolean(promo.active);
						if (!existing.stripePromotionCodeId) existing.stripePromotionCodeId = promo.id;
						if (couponObj?.id && !existing.stripeCouponId) existing.stripeCouponId = couponObj.id;
						await existing.save().catch(() => null);
					} else if (couponObj) {
						const isAmount = typeof couponObj.amount_off === 'number' && couponObj.amount_off > 0;
						await Coupon.create({
							id: code.toLowerCase().replace(/[^a-z0-9]+/g, '-') || crypto.randomUUID(),
							code,
							name: couponObj.name || code,
							description: '',
							discountType: isAmount ? 'amount' : 'percent',
							percentOff: couponObj.percent_off || 0,
							amountOff: isAmount ? Number((couponObj.amount_off / 100).toFixed(2)) : 0,
							currency: couponObj.currency || 'usd',
							duration: couponObj.duration || 'once',
							durationInMonths: couponObj.duration_in_months || null,
							maxRedemptions: promo.max_redemptions || couponObj.max_redemptions || null,
							timesRedeemed: promo.times_redeemed || couponObj.times_redeemed || 0,
							expiresAt: promo.expires_at ? new Date(promo.expires_at * 1000) : couponObj.redeem_by ? new Date(couponObj.redeem_by * 1000) : null,
							stripeCouponId: couponObj.id,
							stripePromotionCodeId: promo.id,
							enabled: Boolean(promo.active),
						}).catch(() => null);
					}
				}
			} catch (stripeErr) {
				console.warn('Stripe coupon sync warning:', stripeErr);
			}
		}

		const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
		return NextResponse.json(coupons);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { models } = await database('xernerx');
		const Coupon = (models.store as any).Coupon;

		const rawCode = String(body.code || '')
			.trim()
			.toUpperCase()
			.replace(/[^A-Z0-9_-]/g, '');
		const name = String(body.name || rawCode).trim();

		if (!rawCode) {
			return NextResponse.json({ error: 'Promotion code is required' }, { status: 400 });
		}

		const discountType: 'percent' | 'amount' = body.discountType === 'amount' ? 'amount' : 'percent';
		const percentOff = discountType === 'percent' ? Math.min(100, Math.max(1, Number(body.percentOff) || 10)) : 0;
		const amountOff = discountType === 'amount' ? Math.max(0.5, Number(body.amountOff) || 5) : 0;
		const currency = String(body.currency || 'usd')
			.trim()
			.toLowerCase();
		const duration: 'once' | 'repeating' | 'forever' = ['once', 'repeating', 'forever'].includes(body.duration) ? body.duration : 'once';
		const durationInMonths = duration === 'repeating' ? Math.max(1, Number(body.durationInMonths) || 1) : null;
		const maxRedemptions = body.maxRedemptions && Number(body.maxRedemptions) > 0 ? Math.floor(Number(body.maxRedemptions)) : null;
		const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
		const enabled = typeof body.enabled === 'boolean' ? body.enabled : true;

		const id =
			body.id?.trim() ||
			rawCode
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, '') ||
			crypto.randomUUID();

		const existing = await Coupon.findOne({ $or: [{ id }, { code: rawCode }] });
		if (existing) {
			return NextResponse.json({ error: 'A coupon with this code or ID already exists' }, { status: 409 });
		}

		let stripeCouponId: string | null = null;
		let stripePromotionCodeId: string | null = null;

		if (stripe) {
			try {
				const couponParams: Stripe.CouponCreateParams = {
					name,
					duration,
					...(discountType === 'percent' ? { percent_off: percentOff } : { amount_off: Math.round(amountOff * 100), currency }),
					...(duration === 'repeating' && durationInMonths ? { duration_in_months: durationInMonths } : {}),
					...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
					...(expiresAt && !Number.isNaN(expiresAt.getTime()) ? { redeem_by: Math.floor(expiresAt.getTime() / 1000) } : {}),
				};

				const createdStripeCoupon = await stripe.coupons.create(couponParams);
				stripeCouponId = createdStripeCoupon.id;

				const promoParams: any = {
					coupon: createdStripeCoupon.id,
					code: rawCode,
					active: enabled,
					...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
					...(expiresAt && !Number.isNaN(expiresAt.getTime()) ? { expires_at: Math.floor(expiresAt.getTime() / 1000) } : {}),
				};

				try {
					const createdPromo = await stripe.promotionCodes.create(promoParams);
					stripePromotionCodeId = createdPromo.id;
				} catch {
					const fallbackPromo = await (stripe.promotionCodes as any).create({
						promotion: { type: 'coupon', coupon: createdStripeCoupon.id },
						code: rawCode,
						active: enabled,
						...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
						...(expiresAt && !Number.isNaN(expiresAt.getTime()) ? { expires_at: Math.floor(expiresAt.getTime() / 1000) } : {}),
					});
					stripePromotionCodeId = fallbackPromo.id;
				}
			} catch (stripeErr: any) {
				console.warn('Could not create coupon on Stripe (falling back to database coupon):', stripeErr?.message || stripeErr);
			}
		}

		const coupon = await Coupon.create({
			id,
			code: rawCode,
			name,
			description: body.description?.trim() || '',
			discountType,
			percentOff,
			amountOff,
			currency,
			duration,
			durationInMonths,
			maxRedemptions,
			timesRedeemed: 0,
			expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
			appliesToProducts: Array.isArray(body.appliesToProducts) ? body.appliesToProducts : [],
			stripeCouponId,
			stripePromotionCodeId,
			enabled,
		});

		return NextResponse.json(coupon, { status: 201 });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
