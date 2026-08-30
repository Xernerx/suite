/** @format */
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Boxes, ExternalLink, LayoutDashboard, Package } from 'lucide-react';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';

import Banner from '@/../public/banner.svg';
import { useEffect, useRef, useState } from 'react';
import Timeline from '@/components/Timeline';

export default function Home() {
	const { hide } = useSidebar();
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();

	const servicesRef = useRef<HTMLDivElement>(null);
	const softwareRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLElement | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		containerRef.current = document.getElementById('main-scroll-container');
		setReady(true);
	}, []);

	const { scrollYProgress: servicesProgress } = useScroll(ready ? { target: servicesRef, container: containerRef } : {});
	const servicesX = useTransform(servicesProgress, [0, 1], ['0%', '-60%']);

	const { scrollYProgress: softwareProgress } = useScroll(ready ? { target: softwareRef, container: containerRef } : {});
	const softwareX = useTransform(softwareProgress, [0, 1], ['0%', '20%']); // Pans right

	useEffect(() => {
		hide();
	}, [hide]);

	return (
		<div className="flex flex-col selection:bg-(--accent) selection:text-white">
			{/* HERO SECTION */}
			<section className="min-h-[90vh] flex items-center justify-center px-6 pt-20 pb-16 relative">
				<div className="w-full max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center relative z-10">
					{/* LEFT: TEXT */}
					<motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col text-left">
						<h1
							className="text-6xl lg:text-7xl xl:text-[5.5rem] font-extrabold tracking-tight mb-8 leading-[1.05] text-transparent bg-clip-text bg-gradient-to-br from-(--text) via-(--text) to-(--text-muted)"
							style={{ fontFamily: 'var(--font-fredoka)' }}
						>
							{t('www.hero.title')}
						</h1>

						<p className="max-w-xl text-lg text-(--text-muted) leading-relaxed mb-10 border-l-2 border-(--border)/20 pl-6">{t('www.hero.description')}</p>

						<div className="flex flex-wrap items-center gap-4">
							<a
								href="#services"
								className="px-8 py-4 rounded-2xl bg-(--accent) text-white font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_40px_-10px_var(--accent)] hover:shadow-[0_0_60px_-15px_var(--accent)] hover:-translate-y-1"
							>
								Explore Services
							</a>
							<a
								href="#software"
								className="px-8 py-4 rounded-2xl bg-(--foreground)/30 text-(--text) font-bold text-sm hover:bg-(--foreground)/60 transition-all border border-(--border)/10 backdrop-blur-md"
							>
								View Software
							</a>
						</div>
					</motion.div>

					{/* RIGHT: BANNER VISUAL */}
					<motion.div
						initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
						animate={{ opacity: 1, scale: 1, rotate: 0 }}
						transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
						className="relative flex justify-center items-center w-full"
					>
						{/* Floating effect */}
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

			{/* SELLING POINTS (Floating Bento Cards) */}
			<section className="px-6 relative -mt-10 z-20">
				<div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
					{[
						{
							title: 'Built for Scale',
							desc: 'Our infrastructure and tools are designed from the ground up to handle massive communities and workloads effortlessly.',
							icon: (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
								</svg>
							),
						},
						{
							title: 'Open Source Heart',
							desc: 'We believe in transparent development. Our software tools are freely available to push the ecosystem forward.',
							icon: (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
								</svg>
							),
						},
						{
							title: 'User-Centric Design',
							desc: "Whether it's a CLI tool or a web dashboard, we prioritize intuitive interfaces and seamless developer experiences.",
							icon: (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<circle cx="12" cy="12" r="10" />
									<path d="M8 14s1.5 2 4 2 4-2 4-2" />
									<line x1="9" y1="9" x2="9.01" y2="9" />
									<line x1="15" y1="9" x2="15.01" y2="9" />
								</svg>
							),
						},
					].map((point, i) => (
						<motion.div
							key={point.title}
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: '-50px' }}
							transition={{ duration: 0.6, delay: i * 0.15, ease: 'easeOut' }}
							className="bg-(--accent) text-white rounded-[2.5rem] p-8 lg:p-10 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-transform"
						>
							<div
								className="absolute inset-0 opacity-10 pointer-events-none"
								style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 2px, transparent 2px)', backgroundSize: '32px 32px' }}
							/>
							<div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-colors" />

							<div className="relative z-10 flex flex-col items-start gap-4">
								<div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">{point.icon}</div>
								<h3 className="text-xl font-bold mt-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
									{point.title}
								</h3>
								<p className="text-white/90 text-sm leading-relaxed">{point.desc}</p>
							</div>
						</motion.div>
					))}
				</div>
			</section>

			{/* CONSUMER SERVICES (Horizontal Scroll) */}
			<section id="services" ref={servicesRef} className="relative h-[300vh]">
				<div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
					<div className="w-full max-w-7xl mx-auto text-left mb-16 relative z-10 px-6 xl:px-[15vw]">
						<h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							Consumer Services
						</h2>
						<p className="max-w-2xl text-base text-(--text-muted) leading-relaxed">
							Powerful, user-friendly applications and platforms designed to bring communities together and streamline digital experiences.
						</p>
					</div>

					<div className="relative z-10 w-full overflow-hidden flex items-center h-[350px]">
						<motion.div style={{ x: servicesX }} className="flex gap-8 px-6 md:px-12 xl:px-[15vw] absolute left-0 w-max">
							{[
								{
									icon: <LayoutDashboard size={24} />,
									title: t('www.services.dashboard.title'),
									desc: t('www.services.dashboard.desc'),
									link: getEnvUrl('https://app.xernerx.com'),
									tag: 'Platform',
								},
								{
									icon: <Boxes size={24} />,
									title: t('www.applications.todo.title'),
									desc: t('www.applications.todo.desc'),
									link: getEnvUrl('https://app.xernerx.com/bots/782105629572464652'),
									tag: 'Discord Bot',
								},
								{
									icon: <Boxes size={24} />,
									title: t('www.applications.zodiac.title'),
									desc: t('www.applications.zodiac.desc'),
									link: getEnvUrl('https://app.xernerx.com/bots/950251264095162418'),
									tag: 'Discord Bot',
								},
								{
									icon: <Boxes size={24} />,
									title: t('www.applications.metamorphosis.title'),
									desc: t('www.applications.metamorphosis.desc'),
									link: getEnvUrl('https://app.xernerx.com/bots/881678826906730547'),
									tag: 'Discord Bot',
								},
							].map((item) => (
								<a
									key={item.title}
									href={item.link}
									className="group shrink-0 w-[85vw] md:w-[450px] flex flex-col rounded-[2.5rem] p-8 transition-all relative overflow-hidden bg-(--foreground)/30 backdrop-blur-xl border border-(--border)/10 hover:border-(--accent)/40 shadow-xl hover:shadow-[0_10px_40px_-10px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
								>
									<div className="absolute top-0 right-0 p-8 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
										<ExternalLink className="text-(--text)" size={20} />
									</div>
									<div className="w-14 h-14 rounded-2xl bg-(--accent)/10 flex items-center justify-center text-(--accent) mb-6">{item.icon}</div>
									<div className="flex items-center gap-3 mb-3">
										<h3 className="font-bold text-xl text-(--text)">{item.title}</h3>
										<span className="text-[10px] font-bold uppercase tracking-widest text-(--accent) bg-(--accent)/10 px-2.5 py-1 rounded-full">{item.tag}</span>
									</div>
									<p className="text-sm text-(--text-muted) leading-relaxed">{item.desc}</p>
								</a>
							))}
						</motion.div>
					</div>
				</div>
			</section>

			{/* DEVELOPER SOFTWARE (Mirrored Horizontal Scroll) */}
			<section id="software" ref={softwareRef} className="relative h-[200vh]">
				<div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
					<div className="w-full max-w-7xl mx-auto text-right mb-16 relative z-10 px-6 xl:px-[15vw]">
						<h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							Developer Software
						</h2>
						<p className="max-w-2xl ml-auto text-base text-(--text-muted) leading-relaxed">
							Robust, open-source frameworks and libraries built to empower developers to create their own incredible tools.
						</p>
					</div>

					<div className="relative z-10 w-full overflow-hidden flex items-center h-[350px]">
						<motion.div style={{ x: softwareX }} className="flex gap-8 px-6 md:px-12 xl:px-[15vw] absolute right-0 w-max">
							{[
								{
									icon: <Package size={24} />,
									title: t('www.packages.framework.title'),
									desc: t('www.packages.framework.desc'),
									link: 'https://www.npmjs.com/package/xernerx',
									tag: 'Framework',
								},
								{
									icon: <Boxes size={24} />,
									title: t('www.packages.stats.title'),
									desc: t('www.packages.stats.desc'),
									link: 'https://www.npmjs.com/package/xernerx-stats',
									tag: 'Library',
								},
							].map((item) => (
								<a
									key={item.title}
									href={item.link}
									className="group shrink-0 w-[85vw] md:w-[450px] flex flex-col rounded-[2.5rem] p-8 transition-all relative overflow-hidden bg-(--background)/50 backdrop-blur-md border border-(--border)/10 hover:border-(--text)/30 shadow-xl hover:bg-(--foreground)/30"
								>
									<div className="absolute top-0 right-0 p-8 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
										<ExternalLink className="text-(--text)" size={20} />
									</div>
									<div className="w-14 h-14 rounded-2xl bg-(--foreground) flex items-center justify-center text-(--text) border border-(--border)/10 mb-6 group-hover:scale-110 transition-transform duration-300">
										{item.icon}
									</div>
									<div className="flex items-center gap-3 mb-3">
										<h3 className="font-bold text-xl text-(--text) font-mono">{item.title}</h3>
										<span className="text-[10px] font-bold uppercase tracking-widest text-(--text-muted) bg-(--foreground) px-2.5 py-1 rounded-full border border-(--border)/10">
											{item.tag}
										</span>
									</div>
									<p className="text-sm text-(--text-muted) leading-relaxed">{item.desc}</p>
								</a>
							))}
						</motion.div>
					</div>
				</div>
			</section>

			{/* ABOUT SECTION (Asymmetrical Bento-style) */}
			<section className="max-w-7xl mx-auto px-6 relative" style={{ padding: 'calc(var(--ui-gap) * 6) 0' }}>
				<div className="relative grid md:grid-cols-12 gap-8 items-center">
					{/* Massive Watermark */}
					<div
						className="hidden lg:block absolute -left-20 top-1/2 -translate-y-1/2 text-[12rem] font-black text-(--foreground)/20 whitespace-nowrap pointer-events-none select-none -z-10"
						style={{ fontFamily: 'var(--font-fredoka)' }}
					>
						ABOUT US
					</div>

					<motion.div
						initial={{ opacity: 0, y: 40 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: '-100px' }}
						transition={{ duration: 0.8 }}
						className="md:col-span-5 lg:col-span-4"
					>
						<h2 className="text-5xl font-extrabold mb-6 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.about.title')}
						</h2>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 40 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: '-100px' }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className="md:col-span-7 lg:col-span-8 relative"
					>
						<div className="bg-(--foreground)/30 backdrop-blur-xl border border-(--border)/10 p-10 lg:p-14 rounded-[3rem] shadow-xl relative overflow-hidden group hover:border-(--accent)/30 transition-colors">
							<div className="absolute top-0 right-0 w-32 h-32 bg-(--accent)/10 rounded-full blur-3xl group-hover:bg-(--accent)/20 transition-colors" />
							<p className="text-lg lg:text-xl text-(--text-muted) leading-relaxed relative z-10 font-medium">{t('www.about.description')}</p>
						</div>
					</motion.div>
				</div>
			</section>

			{/* HISTORY */}
			<Timeline />
		</div>
	);
}
