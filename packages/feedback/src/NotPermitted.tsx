/** @format */
'use client';

import { useDictionary, useEnvironment } from '@xernerx/providers';
import { Button } from '@xernerx/ui';
import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NotPermitted({ view }: { view?: string }) {
	const router = useRouter();
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div
				className="flex flex-col items-center text-center max-w-md rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'calc(var(--ui-gap) * 2)', gap: 'calc(var(--ui-gap) * 1.5)' }}
			>
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
					<ShieldX size={32} />
				</div>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-xl font-bold text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
						Access Denied
					</h1>
					<p className="text-sm text-(--text-muted)">
						{view ? `You do not have the required permissions to access the ${view} view.` : 'You do not have the required permissions to view this content.'}
					</p>
				</div>
				<Button variant="secondary" onClick={() => router.back()}>
					Go Back
				</Button>
			</div>
		</div>
	);
}
