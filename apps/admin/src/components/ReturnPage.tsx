/** @format */
'use client';

import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';

import { Button } from '@xernerx/ui';
import Link from 'next/link';
import { Session } from 'next-auth';
import { ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReturnPage({ session }: { session: Session | null }) {
	const router = useRouter();
	const { hide } = useSidebar();
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	useEffect(() => {
		hide();
	}, [hide]);

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
