/** @format */
'use client';

import { useDictionary, useEnvironment } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { Sparkles } from 'lucide-react';
import Banner from '@/../public/banner.svg';

export default function Home() {
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const [fact, setFact] = useState<string>();

	const rawFacts = t('api.facts') as any;
	const uselessFacts = Array.isArray(rawFacts) ? rawFacts : (rawFacts || '').split(',');

	useEffect(() => {
		(() => {
			const randomIndex = Math.floor(Math.random() * uselessFacts.length);
			setFact(uselessFacts[randomIndex].trim());
		})();
	}, []);

	return (
		<div className="flex flex-col selection:bg-(--accent) selection:text-white">
			<section className="min-h-[90vh] flex items-center justify-center px-6 py-16 relative">
				<div className="w-full max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center relative z-10">
					{/* LEFT: TEXT */}
					<motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col text-left">
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
								href={getEnvUrl('https://docs.xernerx.com/api')}
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

					{/* RIGHT: BANNER VISUAL */}
					<motion.div
						initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
						animate={{ opacity: 1, scale: 1, rotate: 0 }}
						transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
						className="relative flex justify-center items-center w-full"
					>
						<motion.div
							animate={{ y: [-15, 15, -15] }}
							transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
							className="w-full relative z-10 scale-[1.25] lg:scale-[1.4] origin-center pl-8 lg:pl-16"
						>
							<Banner className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-2xl text-(--text)" />
						</motion.div>
					</motion.div>
				</div>
			</section>
		</div>
	);
}
