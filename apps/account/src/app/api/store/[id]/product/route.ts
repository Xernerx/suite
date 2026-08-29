/** @format */

import { NextRequest, NextResponse } from 'next/server';

import Stripe from 'stripe';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || 'sk_test_placeholder', {
	apiVersion: '2026-07-29.dahlia',
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
	try {
		const resolvedParams = await params;
		const productId = resolvedParams.id;

		if (!productId) {
			return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
		}

		// 1. Fetch the product details to get its real name from Stripe
		const product = await stripe.products.retrieve(productId);

		// 2. Fetch all active prices for this product
		const pricesList = await stripe.prices.list({
			product: productId,
			active: true,
		});

		const prices = pricesList.data.map((price) => ({
			id: price.id,
			unitAmount: price.unit_amount,
			currency: price.currency,
			interval: price.recurring?.interval,
			intervalCount: price.recurring?.interval_count,
		}));

		return NextResponse.json(
			{
				name: product.name,
				description: product.description,
				prices,
			},
			{ status: 200 }
		);
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
