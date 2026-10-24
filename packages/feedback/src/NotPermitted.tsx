/** @format */
'use client';

import { useEffect } from 'react';
import { useDictionary, useLoading } from '@xernerx/providers';
import { Button } from '@xernerx/ui';
import { useRouter } from 'next/navigation';
import { XernerxDotLogo } from './XernerxDotLogo';

export function NotPermitted({ view }: { view?: string }) {
	const router = useRouter();
	const { t } = useDictionary();
	const { setBackgroundMode, setDotVariant } = useLoading();

	useEffect(() => {
		setBackgroundMode('sticky-ripple');
		setDotVariant('lock');
		return () => {
			setBackgroundMode(null);
			setDotVariant(null);
		};
	}, [setBackgroundMode, setDotVariant]);

	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] w-full" style={{ padding: 'var(--ui-gap)', gap: 'var(--ui-gap)' }}>
			<div
				className="flex flex-col items-center text-center max-w-md rounded-3xl border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-sm"
				style={{ padding: 'calc(var(--ui-gap) * 2)', gap: 'calc(var(--ui-gap) * 1.5)' }}
			>
				<div className="flex w-24 items-center justify-center rounded-2xl bg-(--accent-red)/10 p-3 border border-(--accent-red)/20">
					<XernerxDotLogo variant="lock" width={88} height={72} cols={28} showAmbientField={false} ripple={true} className="w-full" />
				</div>
				<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
					<h1 className="text-xl font-bold text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('feedback.notPermitted.title')}
					</h1>
					<p className="text-sm text-(--text-muted)">{view ? t('feedback.notPermitted.descriptionView', { view }) : t('feedback.notPermitted.descriptionDefault')}</p>
				</div>
				<Button variant="secondary" onClick={() => router.back()}>
					{t('feedback.notPermitted.backButton')}
				</Button>
			</div>
		</div>
	);
}
