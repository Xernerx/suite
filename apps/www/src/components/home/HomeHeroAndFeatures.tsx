/** @format */
'use client';

import { motion } from 'framer-motion';
import { Layers, ShieldCheck, Sparkles } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import Link from 'next/link';
import { WwwDeepSearch } from '@/components/WwwDeepSearch';
import type { ShowcasePackage } from '@/components/HomeClient';

interface HomeHeroAndFeaturesProps {
	pageReady: boolean;
	reducedMotion?: boolean;
	publicPackages: ShowcasePackage[];
}

export function HomeHeroAndFeatures({ pageReady, reducedMotion = false, publicPackages }: HomeHeroAndFeaturesProps) {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	return (
		<>
			{/* HERO SECTION — Sits cleanly beneath the constructed XERNERX dot-matrix stage */}
			<section className="min-h-dvh flex flex-col items-center justify-start px-6 pt-[52dvh] sm:pt-[54dvh] pb-12 relative z-30">
				<div className="w-full max-w-(--page-width) mx-auto flex flex-col items-center text-center relative z-10">
					<motion.div
						initial={false}
						animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
						transition={{ duration: reducedMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
						className="w-full flex flex-col items-center text-center bg-(--foreground)/30 backdrop-blur-xl border border-(--border)/10 rounded-[2.75rem] px-8 py-8 sm:px-12 sm:py-10 lg:px-16 lg:py-11 shadow-[0_20px_60px_-15px_color-mix(in_srgb,var(--accent)_18%,transparent)] relative"
					>
						<div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.75rem]">
							<div
								className="absolute inset-0 opacity-[0.06]"
								style={{
									backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent) 1.5px, transparent 1.5px)',
									backgroundSize: '20px 20px',
								}}
							/>
							<div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[32rem] h-36 rounded-full bg-(--accent)/15 blur-3xl" />
						</div>

						<h1
							className="relative z-10 text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-extrabold tracking-tight mb-4 leading-[1.06] text-transparent bg-clip-text bg-gradient-to-br from-(--text) via-(--text) to-(--text-muted)"
							style={{ fontFamily: 'var(--font-fredoka)' }}
						>
							{t('www.hero.title')}
						</h1>

						<p className="relative z-10 max-w-3xl mx-auto text-base sm:text-lg text-(--text-muted) leading-relaxed mb-7">{t('www.hero.description')}</p>

						<div className="relative z-10 flex flex-wrap items-center justify-center gap-4">
							<a
								href="#services"
								className="px-8 py-4 rounded-2xl bg-(--accent) text-white font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_40px_-10px_var(--accent)] hover:shadow-[0_0_60px_-15px_var(--accent)] hover:-translate-y-1"
							>
								{t('www.hero.buttons.explore')}
							</a>
							<a
								href="#software"
								className="px-8 py-4 rounded-2xl bg-(--background)/60 text-(--text) font-bold text-sm hover:bg-(--accent)/15 hover:text-(--accent) hover:border-(--accent)/30 transition-all border border-(--border)/10 backdrop-blur-md"
							>
								{t('www.hero.buttons.software')}
							</a>
						</div>

						<div className="relative z-30 w-full flex justify-center">
							<WwwDeepSearch packages={publicPackages} />
						</div>

						<nav aria-label="Quick navigation" className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-2">
							<a
								href="#about"
								className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-(--background)/55 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 hover:border-(--accent)/30 backdrop-blur-md transition-colors"
							>
								{t('www.hero.links.about')}
							</a>
							<a
								href="#highlights"
								className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-(--background)/55 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 hover:border-(--accent)/30 backdrop-blur-md transition-colors"
							>
								{t('www.hero.links.highlights')}
							</a>
							<a
								href="#timeline"
								className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-(--background)/55 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 hover:border-(--accent)/30 backdrop-blur-md transition-colors"
							>
								{t('www.hero.links.timeline')}
							</a>
							<Link
								href={getEnvUrl('https://www.xernerx.com/invites')}
								className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-(--background)/55 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 hover:border-(--accent)/30 backdrop-blur-md transition-colors"
							>
								{t('www.hero.links.invites')}
							</Link>
							<Link
								href={getEnvUrl('https://www.xernerx.com/applications')}
								className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-(--background)/55 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 hover:border-(--accent)/30 backdrop-blur-md transition-colors"
							>
								{t('www.hero.links.careers')}
							</Link>
							<Link
								href={getEnvUrl('https://www.xernerx.com/contact')}
								className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-(--background)/55 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 hover:border-(--accent)/30 backdrop-blur-md transition-colors"
							>
								{t('www.hero.links.contact')}
							</Link>
						</nav>
					</motion.div>
				</div>
			</section>

			{/* SELLING POINTS (Fluid Dot-Matrix Glass Bento Cards) */}
			<section className="px-6 relative z-20 pb-8">
				<div className="max-w-(--page-width) mx-auto w-full grid md:grid-cols-3 gap-6">
					{[
						{
							title: t('www.features.scale.title'),
							desc: t('www.features.scale.description'),
							icon: <Layers className="w-6 h-6" />,
						},
						{
							title: t('www.features.opensource.title'),
							desc: t('www.features.opensource.description'),
							icon: <ShieldCheck className="w-6 h-6" />,
						},
						{
							title: t('www.features.design.title'),
							desc: t('www.features.design.description'),
							icon: <Sparkles className="w-6 h-6" />,
						},
					].map((point, i) => (
						<motion.div
							key={point.title}
							initial={false}
							animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
							whileHover={{ y: -8, scale: 1.015 }}
							transition={{ duration: reducedMotion ? 0 : 0.65, delay: reducedMotion ? 0 : 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
							className="bg-(--foreground)/35 backdrop-blur-xl border border-(--border)/10 hover:border-(--accent)/45 rounded-3xl p-8 lg:p-10 shadow-xl hover:shadow-[0_16px_44px_-12px_color-mix(in_srgb,var(--accent)_32%,transparent)] relative overflow-hidden group transition-colors"
						>
							<div
								className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.14] transition-opacity duration-500 pointer-events-none"
								style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent) 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }}
							/>
							<div className="absolute -top-12 -right-12 w-36 h-36 bg-(--accent)/15 rounded-full blur-3xl group-hover:bg-(--accent)/30 transition-colors pointer-events-none" />

							<div className="relative z-10 flex flex-col items-start gap-4">
								<div className="w-14 h-14 rounded-2xl bg-(--accent)/15 text-(--accent) flex items-center justify-center backdrop-blur-md border border-(--accent)/30 shadow-[0_0_24px_-6px_var(--accent)] group-hover:scale-110 transition-transform">
									{point.icon}
								</div>
								<div className="text-xl font-bold mt-1 text-(--text) group-hover:text-(--accent) transition-colors" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{point.title}
								</div>
								<p className="text-(--text-muted) text-sm leading-relaxed">{point.desc}</p>
							</div>
						</motion.div>
					))}
				</div>
			</section>
		</>
	);
}
