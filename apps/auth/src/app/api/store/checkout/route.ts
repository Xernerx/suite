import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@xernerx/lib';
import { getServerSession } from 'next-auth';

// Initialize Stripe with your Secret Key
const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || 'sk_test_placeholder', {
	apiVersion: '2026-07-29.dahlia', // Use the latest API version
});

export async function POST(req: Request) {
	try {
		// 1. Fetch the server session using your monorepo auth config
		const authSession = await getServerSession(auth);
		const userId = (authSession?.user as any)?.id;

		// 2. Block unauthenticated users immediately
		if (!userId) {
			return new NextResponse('Unauthorized: You must be logged in to subscribe.', { status: 401 });
		}

		const body = await req.json();
		const { priceId } = body;

		if (!priceId) {
			return new NextResponse('Price ID is required', { status: 400 });
		}

		// 3. Create the Stripe Checkout Session
		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			line_items: [
				{
					price: priceId,
					quantity: 1,
				},
			],
			// 4. The Magic Link: Securely attach your internal User ID
			client_reference_id: userId,
			metadata: {
				userId: userId, // Added to metadata as a reliable fallback
			},

			// Route back to the client-side store page
			success_url: `${req.headers.get('origin')}/store?success=true`,
			cancel_url: `${req.headers.get('origin')}/store?canceled=true`,
		});

		return NextResponse.json({ url: session.url });
	} catch (error: any) {
		console.error('Stripe Checkout Error:', error);
		return new NextResponse(error.message, { status: 500 });
	}
}
