/** @format */

'use client';

import { useParams, useRouter } from 'next/navigation';

import { useState } from 'react';

export default function CancelSubscriptionPage() {
	const router = useRouter();
	const params = useParams();
	const subscriptionId = params.id as string;

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleCancel = async () => {
		setLoading(true);
		setError(null);

		try {
			const res = await fetch(`/api/store/${subscriptionId}/cancel`, {
				method: 'POST',
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Failed to cancel subscription');
			}

			setSuccess(true);
			setTimeout(() => {
				router.push('/store');
			}, 3000);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="max-w-md mx-auto mt-20 p-6 border rounded-lg shadow-sm">
			<h1 className="text-xl font-bold mb-4">Cancel Subscription</h1>
			{success ? (
				<div className="text-green-600 bg-green-50 p-4 rounded">Subscription successfully scheduled for cancellation at the end of your billing period. Redirecting...</div>
			) : (
				<>
					<p className="text-gray-600 mb-6">
						Are you sure you want to cancel your subscription? You will retain full access to your premium features until the end of your current billing cycle.
					</p>
					{error && <div className="text-red-600 bg-red-50 p-3 mb-4 rounded text-sm">{error}</div>}
					<div className="flex gap-4">
						<button onClick={handleCancel} disabled={loading} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 transition-colors">
							{loading ? 'Canceling...' : 'Confirm Cancellation'}
						</button>
						<button onClick={() => router.back()} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition-colors">
							Keep Subscription
						</button>
					</div>
				</>
			)}
		</main>
	);
}
