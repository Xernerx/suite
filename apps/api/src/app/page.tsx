/** @format */
'use client';

import { useDictionary, useEnvironment } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { Divider } from '@xernerx/ui';
import Link from 'next/link';

export default function Home() {
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const [fact, setFact] = useState<string>();

	const uselessFacts = t('api.facts');

	useEffect(() => {
		(() => {
			const randomIndex = Math.floor(Math.random() * uselessFacts.length);
			setFact(uselessFacts[randomIndex]);
		})();
	}, []);

	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
			<div className="max-w-2xl space-y-6">
				<h1 className="text-4xl font-extrabold tracking-tight text-(--text)">{t('api.title')}</h1>
				<p className="text-base text-(--text-muted)">{t('api.description')}</p>

				<Divider />

				<div className="p-6 rounded-xl transition-all space-y-4">
					<h3 className="text-lg font-semibold text-(--text)">{t('api.section.title')}</h3>
					<p className="text-sm text-(--text-muted)">{t('api.section.description')}</p>

					<div className="flex flex-wrap items-center justify-center gap-3 pt-2">
						<Link
							href={getEnvUrl('https://auth.xernerx.com')}
							className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg text-white transition-opacity hover:opacity-90 shadow-sm bg-(--accent)"
						>
							{t('api.button.account')}
						</Link>

						<Link
							href={getEnvUrl('https://docs.xernerx.com')}
							className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg text-white transition-opacity hover:opacity-90 shadow-sm bg-(--accent)"
						>
							{t('api.button.docs')}
						</Link>
					</div>
				</div>

				<Divider />

				<div className="text-xs space-y-2 pt-2">
					{fact && (
						<p className="text-(--text-muted)">
							<span className="font-semibold text-(--text)">{t('api.fact')}</span>
							{fact}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
