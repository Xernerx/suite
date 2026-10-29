/** @format */
'use client';

import { useDictionary, useEnvironment, useLoading, useSidebar } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { Sparkles } from 'lucide-react';

export default function Home() {
	const { hide } = useSidebar();
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const { setBackgroundMode, setDotVariant } = useLoading();
	const [fact, setFact] = useState<string>();

	const rawFacts = t('api.facts') as any;
	const uselessFacts = Array.isArray(rawFacts) ? rawFacts : (rawFacts || '').split(',');

	useEffect(() => {
		hide();
		setBackgroundMode('sticky-ripple');
		setDotVariant('icon');

		const randomIndex = Math.floor(Math.random() * uselessFacts.length);
		setFact(uselessFacts[randomIndex]?.trim());

		return () => {
			setBackgroundMode(null);
			setDotVariant(null);
		};
	}, [hide, setBackgroundMode, setDotVariant]);

	return (
		<div className="flex flex-col selection:bg-(--accent) selection:text-white">
			<section className="min-h-[90dvh] flex items-center justify-center px-6 py-16 relative">
				<div className="w-full max-w-(--page-width) mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center relative z-10">
					{/* LEFT: TEXT */}
					<motion.div initial={{ opacity: 1, x: 0 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col text-left">
						<h1
							className="text-6xl lg:text-7xl xl:text-[5.5rem] font-extrabold tracking-tight mb-8 leading-[1.05] text-transparent bg-clip-text bg-gradient-to-br from-(--text) via-(--text) to-(--text-muted)"
							style={{ fontFamily: 'var(--font-fredoka)' }}
						>
							{t('api.title')}
						</h1>

						<p className="max-w-xl text-lg text-(--text-muted) leading-relaxed mb-10 border-l-2 border-(--border)/20 pl-6">
							{t('api.description')}
							<br />
							<br />
							{t('api.section.description')}
						</p>

						<div className="flex flex-wrap items-center gap-4 mb-8">
							<a
								suppressHydrationWarning
								href={getEnvUrl('https://account.xernerx.com')}
								className="px-8 py-4 rounded-2xl bg-(--accent) text-white font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_40px_-10px_var(--accent)] hover:shadow-[0_0_60px_-15px_var(--accent)] hover:-translate-y-1"
							>
								{t('api.button.account')}
							</a>
							<a
								suppressHydrationWarning
								href={getEnvUrl('https://docs.xernerx.com/api/v1')}
								className="px-8 py-4 rounded-2xl bg-(--foreground)/30 text-(--text) font-bold text-sm hover:bg-(--foreground)/60 transition-all border border-(--border)/10 backdrop-blur-md hover:-translate-y-1"
							>
								{t('api.button.docs')}
							</a>
						</div>

						{fact && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.5 }}
								className="max-w-md bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 p-5 rounded-2xl"
							>
								<p className="text-sm text-(--text-muted) leading-relaxed">
									<span className="font-bold text-(--text) flex items-center mb-2">
										<Sparkles className="w-4 h-4 mr-2 text-(--accent)" />
										{t('api.fact')}
									</span>
									{fact}
								</p>
							</motion.div>
						)}
					</motion.div>

					{/* RIGHT: OPEN STAGE FOR APPLAYOUT STICKY REACTIVE DOT-MATRIX LOGO */}
					<div className="hidden lg:block min-h-[320px] w-full pointer-events-none" />
				</div>
			</section>
		</div>
	);
}
