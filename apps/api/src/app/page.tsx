/** @format */
'use client';

import { useDictionary, useEnvironment } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { Divider } from '@xernerx/ui';
import { Sparkles } from 'lucide-react';

export default function Home() {
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const [fact, setFact] = useState<string>();

	const uselessFacts = t('api.facts').split(',');

	useEffect(() => {
		(() => {
			const randomIndex = Math.floor(Math.random() * uselessFacts.length);
			setFact(uselessFacts[randomIndex].trim());
		})();
	}, []);

	return (
		<div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
			<div className="max-w-2xl w-full bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-[2rem] p-10 md:p-14 shadow-2xl space-y-8 relative overflow-hidden">
				{/* Decorative subtle glow */}
				<div className="absolute -top-32 -left-32 w-64 h-64 bg-(--accent) opacity-10 rounded-full blur-3xl pointer-events-none" />
				<div className="absolute -bottom-32 -right-32 w-64 h-64 bg-(--accent) opacity-10 rounded-full blur-3xl pointer-events-none" />

				<div className="relative z-10 space-y-2">
					<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-(--text)">{t('api.title')}</h1>
					<p className="text-lg text-(--text-muted) max-w-lg mx-auto">{t('api.description')}</p>
				</div>

				<Divider />

				<div className="p-8 rounded-2xl bg-(--background)/40 border border-(--border)/5 transition-all space-y-6 shadow-inner relative z-10">
					<div>
						<h3 className="text-xl font-bold text-(--text)">{t('api.section.title')}</h3>
						<p className="text-sm text-(--text-muted) mt-1">{t('api.section.description')}</p>
					</div>

					<div className="flex flex-wrap items-center justify-center gap-4 pt-2">
						<a
							suppressHydrationWarning
							href={getEnvUrl('https://account.xernerx.com')}
							className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold rounded-xl text-(--background) bg-(--text) transition-transform hover:scale-105 shadow-md hover:shadow-lg"
						>
							{t('api.button.account')}
						</a>

						<a
							suppressHydrationWarning
							href={getEnvUrl('https://docs.xernerx.com')}
							className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold rounded-xl text-(--text) bg-(--foreground)/50 border border-(--border)/10 transition-transform hover:scale-105 hover:bg-(--foreground)/70 shadow-sm"
						>
							{t('api.button.docs')}
						</a>
					</div>
				</div>

				<div className="text-sm pt-4 relative z-10">
					{fact && (
						<p className="text-(--text-muted) italic bg-(--foreground)/20 py-4 px-6 rounded-xl block border border-(--border)/5 break-words">
							<span className="font-bold text-(--text) flex items-center not-italic mb-1">
								<Sparkles className="w-4 h-4 mr-2" />
								{t('api.fact')}
							</span>
							{fact}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
