/** @format */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || 'sk_test_placeholder', {
	apiVersion: '2026-09-30.endive',
});

export async function POST(req: Request) {
	try {
		// 1. Fetch the server session using monorepo auth config
		const authSession = await getServerSession(auth);
		const userId = (authSession?.user as any)?.id;

		// 2. Block unauthenticated users immediately
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized: You must be logged in to subscribe.' }, { status: 401 });
		}

		const body = await req.json();
		const { priceId, successUrl, cancelUrl, discountPercent } = body;

		if (!priceId) {
			return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
		}

		const origin = req.headers.get('origin') || 'https://store.xernerx.com';

		// 3. Create the Stripe Checkout Session
		const sessionParams: Stripe.Checkout.SessionCreateParams = {
			mode: 'subscription',
			line_items: [
				{
					price: priceId,
					quantity: 1,
				},
			],
			client_reference_id: userId,
			metadata: {
				userId: userId,
			},
			success_url: successUrl || `${origin}/?success=true`,
			cancel_url: cancelUrl || `${origin}/?canceled=true`,
			allow_promotion_codes: true,
		};

		if (discountPercent && Number(discountPercent) > 0) {
			delete sessionParams.allow_promotion_codes;
			try {
				const coupon = await stripe.coupons.create({
					percent_off: Math.min(100, Math.max(1, Number(discountPercent))),
					duration: 'once',
					name: `${discountPercent}% Store Discount`,
				});
				sessionParams.discounts = [{ coupon: coupon.id }];
			} catch (couponErr) {
				console.warn('Could not apply dynamic discount coupon:', couponErr);
			}
		}

		const session = await stripe.checkout.sessions.create(sessionParams);

		return NextResponse.json({ url: session.url });
	} catch (error: any) {
		console.error('Stripe Checkout Error:', error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
