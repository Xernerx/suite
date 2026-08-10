/** @format */

'use client';

import { useParams, useRouter } from 'next/navigation';

import { Button } from '@xernerx/ui';
import { ShieldAlert } from 'lucide-react';
import { useDictionary } from '@xernerx/providers';
import { useState } from 'react';

export default function CancelSubscriptionPage() {
	const router = useRouter();
	const params = useParams();
	const subscriptionId = params.id as string;
	const { t } = useDictionary();

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
				throw new Error(data.error || t('auth.store.cancel.errorDefault'));
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
		<div className="flex flex-col items-center justify-center min-h-screen w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div
				className="flex flex-col items-center text-center max-w-md rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_10%,transparent)]"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)', fontSize: 'var(--text-scale, 14px)' }}
			>
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
					<ShieldAlert size={32} />
				</div>

				<div className="flex flex-col items-center text-center" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('auth.store.cancel.title')}
					</h1>
					{success ? (
						<p className="text-sm text-emerald-500 font-medium">{t('auth.store.cancel.successMessage')}</p>
					) : (
						<p className="text-sm text-(--text-muted)">{t('auth.store.cancel.description')}</p>
					)}
				</div>

				{error && <div className="w-full p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center">{error}</div>}

				{!success && (
					<div className="flex items-center justify-center gap-3 w-full pt-1">
						<Button variant="primary" onClick={() => router.back()} className="flex-1 justify-center">
							{t('auth.store.cancel.keepButton')}
						</Button>
						<Button variant="danger" onClick={handleCancel} disabled={loading} className="flex-1 justify-center">
							{loading ? t('auth.store.cancel.canceling') : t('auth.store.cancel.confirmButton')}
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
