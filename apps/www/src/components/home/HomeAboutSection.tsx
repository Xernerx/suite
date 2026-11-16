/** @format */
'use client';

import { motion } from 'framer-motion';
import { useDictionary } from '@xernerx/providers';

export function HomeAboutSection() {
	const { t } = useDictionary();

	return (
		<section id="about" className="max-w-(--page-width) mx-auto w-full px-6 relative" style={{ padding: 'calc(var(--ui-gap) * 6) 0' }}>
			<div className="relative grid md:grid-cols-12 gap-8 items-center">
				{/* Massive Watermark */}
				<div
					className="hidden lg:block absolute -left-20 top-1/2 -translate-y-1/2 text-[12rem] font-black text-(--foreground)/20 whitespace-nowrap pointer-events-none select-none -z-10"
					style={{ fontFamily: 'var(--font-fredoka)' }}
				>
					{t('www.about.watermark')}
				</div>

				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: '-100px' }}
					transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
					className="md:col-span-5 lg:col-span-4"
				>
					<h2 className="text-5xl font-extrabold mb-6 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
						{t('www.about.title')}
					</h2>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, x: 24 }}
					whileInView={{ opacity: 1, x: 0 }}
					viewport={{ once: true, margin: '-100px' }}
					transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
					className="md:col-span-7 lg:col-span-8 relative"
				>
					<div className="bg-(--foreground)/35 backdrop-blur-xl border border-(--border)/10 p-10 lg:p-14 rounded-[3rem] shadow-xl relative overflow-hidden group hover:border-(--accent)/40 transition-all flex flex-col gap-6">
						<div
							className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500 pointer-events-none"
							style={{
								backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent) 1.5px, transparent 1.5px)',
								backgroundSize: '22px 22px',
							}}
						/>
						<div className="absolute top-0 right-0 w-40 h-40 bg-(--accent)/15 rounded-full blur-3xl group-hover:bg-(--accent)/25 transition-colors" />
						<p className="text-lg lg:text-xl text-(--text-muted) leading-relaxed relative z-10 font-medium">{t('www.about.description')}</p>
						<p className="text-base lg:text-lg text-(--text-muted) leading-relaxed relative z-10">{t('www.about.description2')}</p>
					</div>
				</motion.div>
			</div>

			{/* ECOSYSTEM PILLARS */}
			<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
				{(
					[
						{
							title: t('www.about.pillars.communities.title'),
							desc: t('www.about.pillars.communities.description'),
						},
						{
							title: t('www.about.pillars.frameworks.title'),
							desc: t('www.about.pillars.frameworks.description'),
						},
						{
							title: t('www.about.pillars.infrastructure.title'),
							desc: t('www.about.pillars.infrastructure.description'),
						},
						{
							title: t('www.about.pillars.identity.title'),
							desc: t('www.about.pillars.identity.description'),
						},
					] as const
				).map((pillar, idx) => (
					<motion.div
						key={pillar.title}
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						whileHover={{ y: -6, scale: 1.015 }}
						viewport={{ once: true, margin: '-50px' }}
						transition={{ duration: 0.55, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
						className="relative overflow-hidden group bg-(--foreground)/35 backdrop-blur-xl border border-(--border)/10 hover:border-(--accent)/40 rounded-3xl p-8 shadow-xl hover:shadow-[0_14px_40px_-12px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition-colors flex flex-col gap-3"
					>
						<div
							className="absolute inset-0 opacity-[0.05] group-hover:opacity-[0.12] transition-opacity duration-500 pointer-events-none"
							style={{
								backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent) 1.5px, transparent 1.5px)',
								backgroundSize: '18px 18px',
							}}
						/>
						<div className="relative z-10 text-lg font-bold text-(--text) group-hover:text-(--accent) transition-colors" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{pillar.title}
						</div>
						<p className="relative z-10 text-sm text-(--text-muted) leading-relaxed">{pillar.desc}</p>
					</motion.div>
				))}
			</div>
		</section>
	);
}
