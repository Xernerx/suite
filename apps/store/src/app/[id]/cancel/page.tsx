/** @format */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@xernerx/ui';
import { ShieldAlert } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { useState } from 'react';

export default function CancelSubscriptionPage() {
	const router = useRouter();
	const params = useParams();
	const subscriptionId = params.id as string;
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleCancel = async () => {
		setLoading(true);
		setError(null);

		try {
			const res = await fetch(getEnvUrl(`https://api.xernerx.com/secure/store/${subscriptionId}/cancel`), {
				method: 'POST',
				credentials: 'include',
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || t('account.store.cancel.errorDefault'));
			}

			setSuccess(true);
			setTimeout(() => {
				router.push('/');
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
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-(--accent-red)/10 text-(--accent-red)">
					<ShieldAlert size={32} />
				</div>

				<div className="flex flex-col items-center text-center" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-2xl font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('account.store.cancel.title')}
					</h1>
					{success ? (
						<p className="text-sm text-(--accent-green) font-medium">{t('account.store.cancel.successMessage')}</p>
					) : (
						<p className="text-sm text-(--text-muted)">{t('account.store.cancel.description')}</p>
					)}
				</div>

				{error && <div className="w-full p-3 rounded-2xl bg-(--accent-red)/10 border border-(--accent-red)/20 text-(--accent-red) text-xs font-medium text-center">{error}</div>}

				{!success && (
					<div className="flex items-center justify-center gap-3 w-full pt-1">
						<Button variant="primary" onClick={() => router.back()} className="flex-1 justify-center">
							{t('account.store.cancel.keepButton')}
						</Button>
						<Button variant="danger" onClick={handleCancel} disabled={loading} className="flex-1 justify-center">
							{loading ? t('account.store.cancel.canceling') : t('account.store.cancel.confirmButton')}
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
