/** @format */

'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Compass, Lock, Palette } from 'lucide-react';
import Link from 'next/link';
import { useDictionary, useEnvironment, usePlatform } from '@xernerx/providers';

export function PlatformHighlights() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();

	const cards = [
		{
			icon: <Palette size={24} />,
			title: t('www.highlights.personalization.title'),
			desc: t('www.highlights.personalization.description'),
			link: getEnvUrl('https://account.xernerx.com'),
		},
		{
			icon: <Compass size={24} />,
			title: t('www.highlights.roadmap.title'),
			desc: t('www.highlights.roadmap.description'),
			link: getEnvUrl('https://info.xernerx.com/roadmap'),
		},
		{
			icon: <Lock size={24} />,
			title: t('www.highlights.privacy.title'),
			desc: t('www.highlights.privacy.description'),
			link: getEnvUrl('https://account.xernerx.com'),
		},
	];

	return (
		<section id="highlights" className="max-w-(--page-width) mx-auto px-6 relative" style={{ paddingBottom: 'calc(var(--ui-gap) * 6)' }}>
			<div className="mb-12 max-w-2xl">
				<h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('www.highlights.title')}
				</h2>
				<p className="text-base text-(--text-muted) leading-relaxed">{t('www.highlights.description')}</p>
			</div>

			<div className="grid md:grid-cols-3 gap-8">
				{cards.map((card, i) => (
					<motion.div
						key={card.title}
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						whileHover={{ y: -8, scale: 1.015 }}
						viewport={{ once: true, margin: '-50px' }}
						transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
						className="group relative flex flex-col rounded-3xl p-8 lg:p-10 transition-colors overflow-hidden bg-(--foreground)/35 backdrop-blur-xl border border-(--border)/10 hover:border-(--accent)/50 shadow-xl hover:shadow-[0_16px_50px_-12px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
					>
						<div
							className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.14] transition-opacity duration-500 pointer-events-none"
							style={{
								backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent) 1.5px, transparent 1.5px)',
								backgroundSize: '18px 18px',
							}}
						/>
						<div className="relative z-10 w-14 h-14 rounded-2xl bg-(--accent)/15 border border-(--accent)/25 flex items-center justify-center text-(--accent) mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
							{card.icon}
						</div>

						<div
							className="relative z-10 text-xl font-bold text-(--text) group-hover:text-(--accent) transition-colors mb-3 flex items-center justify-between gap-2"
							style={{ fontFamily: 'var(--font-fredoka)' }}
						>
							<a href={card.link} className="after:absolute after:inset-0 flex items-center justify-between w-full">
								<span>{card.title}</span>
								<ArrowUpRight size={20} className="text-(--text-muted) shrink-0 group-hover:text-(--accent) group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
							</a>
						</div>

						<p className="relative z-10 text-sm text-(--text-muted) leading-relaxed">{card.desc}</p>
					</motion.div>
				))}
			</div>
		</section>
	);
}

export function LandingCta() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { type } = usePlatform();

	return (
		<section id="cta" className="max-w-(--page-width) mx-auto px-6 pb-32 relative">
			<motion.div
				initial={{ opacity: 0, y: 24 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true, margin: '-80px' }}
				transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
				className="relative rounded-[3rem] p-10 md:p-16 overflow-hidden bg-(--foreground)/35 backdrop-blur-xl border border-(--border)/10 hover:border-(--accent)/40 transition-colors shadow-2xl flex flex-col items-center text-center group"
			>
				<div
					className="absolute inset-0 opacity-[0.07] group-hover:opacity-[0.14] transition-opacity duration-500 pointer-events-none"
					style={{
						backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent) 1.5px, transparent 1.5px)',
						backgroundSize: '20px 20px',
					}}
				/>
				<div className="absolute -top-24 -left-24 w-72 h-72 bg-(--accent)/15 rounded-full blur-3xl pointer-events-none" />
				<div className="absolute -bottom-24 -right-24 w-72 h-72 bg-(--accent)/15 rounded-full blur-3xl pointer-events-none" />

				<h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-(--text) relative z-10" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('www.cta.title')}
				</h2>

				<p className="max-w-2xl text-base md:text-lg text-(--text-muted) leading-relaxed mb-10 relative z-10">{t('www.cta.description')}</p>

				<div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
					<a
						href={getEnvUrl('https://app.xernerx.com')}
						className="px-8 py-4 rounded-2xl bg-(--accent) text-white font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_40px_-10px_var(--accent)] hover:-translate-y-1"
					>
						{t('www.cta.dashboard')}
					</a>
					{type !== 'application' && (
						<Link
							href="/download"
							className="px-8 py-4 rounded-2xl bg-(--foreground)/50 text-(--text) font-bold text-sm hover:bg-(--foreground)/80 transition-all border border-(--border)/10 backdrop-blur-md"
						>
							{t('www.cta.download')}
						</Link>
					)}
					<a
						href={getEnvUrl('https://docs.xernerx.com')}
						className="px-8 py-4 rounded-2xl bg-(--foreground)/30 text-(--text) font-bold text-sm hover:bg-(--foreground)/60 transition-all border border-(--border)/10 backdrop-blur-md"
					>
						{t('www.cta.docs')}
					</a>
					<Link
						href="/invites"
						className="px-6 py-4 rounded-2xl bg-(--foreground)/30 text-(--text) font-bold text-sm hover:bg-(--foreground)/60 transition-all border border-(--border)/10 backdrop-blur-md"
					>
						{t('www.cta.invites')}
					</Link>
					<Link
						href="/applications"
						className="px-6 py-4 rounded-2xl bg-(--foreground)/30 text-(--text) font-bold text-sm hover:bg-(--foreground)/60 transition-all border border-(--border)/10 backdrop-blur-md"
					>
						{t('www.cta.careers')}
					</Link>
					<Link
						href="/contact"
						className="px-6 py-4 rounded-2xl bg-(--foreground)/30 text-(--text) font-bold text-sm hover:bg-(--foreground)/60 transition-all border border-(--border)/10 backdrop-blur-md"
					>
						{t('www.cta.contact')}
					</Link>
				</div>
			</motion.div>
		</section>
	);
}
