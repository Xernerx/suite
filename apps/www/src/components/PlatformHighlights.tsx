/** @format */

'use client';

import { ArrowUpRight, Compass, Lock, Palette } from 'lucide-react';
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
		<section className="max-w-7xl mx-auto px-6 relative" style={{ paddingBottom: 'calc(var(--ui-gap) * 6)' }}>
			<div className="mb-12 max-w-2xl">
				<h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
					{t('www.highlights.title')}
				</h2>
				<p className="text-base text-(--text-muted) leading-relaxed">{t('www.highlights.description')}</p>
			</div>

			<div className="grid md:grid-cols-3 gap-8">
				{cards.map((card) => (
					<div
						key={card.title}
						className="group relative flex flex-col rounded-[2.5rem] p-8 lg:p-10 transition-all overflow-hidden bg-(--foreground)/30 backdrop-blur-xl border border-(--border)/10 hover:border-(--accent)/40 shadow-xl"
					>
						<div className="w-14 h-14 rounded-2xl bg-(--accent)/10 flex items-center justify-center text-(--accent) mb-6">{card.icon}</div>

						<h3 className="text-xl font-bold text-(--text) mb-3 flex items-center justify-between gap-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
							<a href={card.link} className="after:absolute after:inset-0 flex items-center justify-between w-full">
								<span>{card.title}</span>
								<ArrowUpRight size={20} className="text-(--text-muted) shrink-0 group-hover:text-(--accent) group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
							</a>
						</h3>

						<p className="text-sm text-(--text-muted) leading-relaxed">{card.desc}</p>
					</div>
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
		<section className="max-w-7xl mx-auto px-6 pb-32 relative">
			<div className="relative rounded-[3rem] p-10 md:p-16 overflow-hidden bg-(--foreground)/30 backdrop-blur-xl border border-(--border)/10 shadow-2xl flex flex-col items-center text-center">
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
						<a
							href="/download"
							className="px-8 py-4 rounded-2xl bg-(--foreground)/50 text-(--text) font-bold text-sm hover:bg-(--foreground)/80 transition-all border border-(--border)/10 backdrop-blur-md"
						>
							{t('www.cta.download')}
						</a>
					)}
					<a
						href={getEnvUrl('https://docs.xernerx.com')}
						className="px-8 py-4 rounded-2xl bg-(--foreground)/30 text-(--text) font-bold text-sm hover:bg-(--foreground)/60 transition-all border border-(--border)/10 backdrop-blur-md"
					>
						{t('www.cta.docs')}
					</a>
				</div>
			</div>
		</section>
	);
}
