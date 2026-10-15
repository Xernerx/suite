/** @format */
'use client';

import { ShieldAlert } from 'lucide-react';
import { Button } from '@xernerx/ui';
import { useDictionary } from '@xernerx/providers';

export function UnauthorizedView({ signedIn, accountUrl, currentUrl }: { signedIn: boolean; accountUrl: string; currentUrl: string }) {
	const { t } = useDictionary();

	return (
		<div className="fixed inset-0 z-[9999] bg-(--background) flex flex-col items-center justify-center p-4">
			<div className="flex flex-col items-center gap-4 text-center max-w-sm">
				<div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
					<ShieldAlert size={40} />
				</div>
				<h1 className="text-2xl font-bold text-(--text)">{signedIn ? t('cdn.view.unauthorized.forbidden') : t('cdn.view.unauthorized.unauthorized')}</h1>
				<p className="text-sm text-(--text-muted)">{t('cdn.view.unauthorized.description')}</p>
				{signedIn ? (
					<a href={accountUrl} className="mt-4">
						<Button variant="primary">{t('cdn.view.unauthorized.returnToLibrary')}</Button>
					</a>
				) : (
					<a href={`${accountUrl}/login?callbackUrl=${encodeURIComponent(currentUrl)}`} className="mt-4">
						<Button variant="primary">{t('cdn.view.unauthorized.signIn')}</Button>
					</a>
				)}
			</div>
		</div>
	);
}
