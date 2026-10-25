/** @format */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { database } from '@xernerx/lib/server';

const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const isStripeConfigured = Boolean(stripeKey && stripeKey !== 'sk_test_placeholder');
const stripe = isStripeConfigured
	? new Stripe(stripeKey, {
			apiVersion: '2026-09-30.endive',
		})
	: null;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const couponId = (await params).id;
		const body = await req.json();

		const { models } = await database('xernerx');
		const Coupon = (models.store as any).Coupon;

		const coupon = await Coupon.findOne({ $or: [{ id: couponId }, { code: couponId.toUpperCase() }] });
		if (!coupon) {
			return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
		}

		if (body.name !== undefined) coupon.name = String(body.name).trim();
		if (body.description !== undefined) coupon.description = String(body.description).trim();
		if (typeof body.enabled === 'boolean') coupon.enabled = body.enabled;
		if (body.maxRedemptions !== undefined) {
			coupon.maxRedemptions = body.maxRedemptions && Number(body.maxRedemptions) > 0 ? Math.floor(Number(body.maxRedemptions)) : null;
		}
		if (body.expiresAt !== undefined) {
			coupon.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
		}
		if (Array.isArray(body.appliesToProducts)) {
			coupon.appliesToProducts = body.appliesToProducts;
		}

		if (stripe) {
			if (coupon.stripeCouponId && body.name !== undefined) {
				await stripe.coupons.update(coupon.stripeCouponId, { name: coupon.name }).catch(() => null);
			}
			if (coupon.stripePromotionCodeId && typeof body.enabled === 'boolean') {
				await stripe.promotionCodes.update(coupon.stripePromotionCodeId, { active: body.enabled }).catch(() => null);
			}
		}

		await coupon.save();
		return NextResponse.json(coupon);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const couponId = (await params).id;
		const { models } = await database('xernerx');
		const Coupon = (models.store as any).Coupon;

		const coupon = await Coupon.findOneAndDelete({ $or: [{ id: couponId }, { code: couponId.toUpperCase() }] });
		if (!coupon) {
			return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
		}

		if (stripe) {
			if (coupon.stripePromotionCodeId) {
				await stripe.promotionCodes.update(coupon.stripePromotionCodeId, { active: false }).catch(() => null);
			}
			if (coupon.stripeCouponId) {
				await stripe.coupons.del(coupon.stripeCouponId).catch(() => null);
			}
		}

		return NextResponse.json({ success: true, id: coupon.id });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
