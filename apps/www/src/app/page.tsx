/** @format */
'use client';

import { Boxes, ExternalLink, LayoutDashboard, Package } from 'lucide-react';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';

import Banner from '@/../public/banner.svg';
import Timeline from '@/components/Timeline';
import { useEffect } from 'react';

export default function Home() {
	const { hide } = useSidebar();
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();

	useEffect(() => {
		hide();
	}, [hide]);

	return (
		<div className='flex flex-col'>
			{/* HERO */}
			<section
				className='min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden'
				style={{
					gap: 'calc(var(--ui-gap) * 1.5)',
				}}>
				<div className='relative w-full flex justify-center py-24 overflow-hidden'>
					<Banner className='w-full max-w-6xl h-auto object-contain select-none pointer-events-none text-(--accent)' />
				</div>

				<h1 className='text-5xl md:text-6xl font-semibold tracking-tight text-(--text)'>{t('www.hero.title')}</h1>

				<p className='max-w-2xl text-base text-(--text-muted) leading-relaxed'>{t('www.hero.description')}</p>
			</section>

			{/* ABOUT */}
			<section className='max-w-5xl mx-auto text-center px-6' style={{ padding: 'calc(var(--ui-gap) * 3) 0' }}>
				<h2 className='text-3xl font-semibold mb-6 text-(--text)'>{t('www.about.title')}</h2>

				<p className='text-base text-(--text-muted) leading-relaxed'>{t('www.about.description')}</p>
			</section>

			{/* SERVICES / PACKAGES / APPS */}
			<section className='px-6' style={{ padding: 'calc(var(--ui-gap) * 4) 0' }}>
				<div className='max-w-6xl mx-auto grid md:grid-cols-3 gap-10'>
					{/* COLUMN */}
					{[
						{
							title: t('www.sections.services.title'),
							items: [
								{
									icon: <LayoutDashboard size={18} />,
									title: t('www.services.dashboard.title'),
									desc: t('www.services.dashboard.desc'),
									link: getEnvUrl('https://app.xernerx.com'),
								},
							],
						},
						{
							title: t('www.sections.packages.title'),
							items: [
								{
									icon: <Package size={18} />,
									title: t('www.packages.framework.title'),
									desc: t('www.packages.framework.desc'),
									link: 'https://www.npmjs.com/package/xernerx',
								},
								{
									icon: <Boxes size={18} />,
									title: t('www.packages.stats.title'),
									desc: t('www.packages.stats.desc'),
									link: 'https://www.npmjs.com/package/xernerx-stats',
								},
							],
						},
						{
							title: t('www.sections.applications.title'),
							items: [
								{
									icon: <Boxes size={18} />,
									title: t('www.applications.todo.title'),
									desc: t('www.applications.todo.desc'),
									link: getEnvUrl('https://app.xernerx.com/bots/782105629572464652'),
								},
								{
									icon: <Boxes size={18} />,
									title: t('www.applications.zodiac.title'),
									desc: t('www.applications.zodiac.desc'),
									link: getEnvUrl('https://app.xernerx.com/bots/950251264095162418'),
								},
								{
									icon: <Boxes size={18} />,
									title: t('www.applications.metamorphosis.title'),
									desc: t('www.applications.metamorphosis.desc'),
									link: getEnvUrl('https://app.xernerx.com/bots/881678826906730547'),
								},
							],
						},
					].map((col) => (
						<div key={col.title}>
							<h2 className='text-xl font-semibold mb-6 text-(--text)'>{col.title}</h2>

							<div className='flex flex-col gap-6'>
								{col.items.map((item) => (
									<a key={item.title} href={item.link} className='group rounded-xl p-5 transition relative overflow-hidden bg-transparent border border-(--border)/10 hover:border-(--accent)/40'>
										{/* hover glow */}
										<div
											className='absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none'
											style={{
												background: 'radial-gradient(circle at top, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%)',
											}}
										/>

										<div className='relative flex items-center gap-3 mb-2'>
											<div className='text-(--accent)'>{item.icon}</div>
											<h3 className='font-medium text-sm text-(--text)'>{item.title}</h3>
											<ExternalLink className='ml-auto text-(--text-muted) group-hover:text-(--text) transition' size={14} />
										</div>

										<p className='text-xs text-(--text-muted) leading-relaxed'>{item.desc}</p>
									</a>
								))}
							</div>
						</div>
					))}
				</div>
			</section>

			{/* HISTORY */}
			<section style={{ paddingTop: 'calc(var(--ui-gap) * 4)' }}>
				<div className='max-w-4xl mx-auto px-6 mb-16 text-center'>
					<h2 className='text-3xl font-semibold mb-4 text-(--text)'>{t('www.history.title')}</h2>
					<p className='text-sm text-(--text-muted)'>{t('www.history.description')}</p>
				</div>

				<Timeline />
			</section>
		</div>
	);
}
