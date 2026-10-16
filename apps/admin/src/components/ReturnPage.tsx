/** @format */
'use client';

import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';

import { Button } from '@xernerx/ui';
import Link from 'next/link';
import { Session } from 'next-auth';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReturnPage({ session, dbError }: { session: Session | null; dbError?: string | null }) {
	const router = useRouter();
	const { hide } = useSidebar();
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	useEffect(() => {
		hide();
	}, [hide]);

	if (dbError) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[70vh] w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
				<div
					className="flex flex-col items-center text-center max-w-lg w-full rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
					style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
				>
					<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
						<AlertTriangle size={32} />
					</div>
					<div className="flex flex-col w-full" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
						<h1 className="text-xl font-bold text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							Database Error
						</h1>
						<p className="text-sm text-(--text-muted)">{t('feedback.error.description')}</p>
						<div className="mt-4 p-4 bg-(--background) rounded-xl border border-(--border)/10 text-left w-full overflow-auto">
							<p className="text-xs font-mono text-red-400 font-bold mb-1">{t('feedback.error.details')}</p>
							<p className="text-xs font-mono text-(--text-muted) break-words">{dbError}</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Button onClick={() => window.location.reload()}>{t('feedback.error.retry')}</Button>
						<Button variant="secondary" onClick={() => router.back()}>
							{t('account.unauthorized.button')}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div
				className="flex flex-col items-center text-center max-w-md rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}
			>
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
					<ShieldAlert size={32} />
				</div>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-xl font-bold text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('account.unauthorized.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{t('account.unauthorized.description')}</p>
				</div>
				{session ? (
					<Button onClick={() => router.back()}>{t('account.unauthorized.button')}</Button>
				) : (
					<Button>
						<Link href={getEnvUrl('https://account.xernerx.com')}>{t('common.sidebar.login')}</Link>
					</Button>
				)}
			</div>
		</div>
	);
}
