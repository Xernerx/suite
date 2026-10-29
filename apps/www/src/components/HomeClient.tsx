/** @format */
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Boxes, Layers, Package, ShieldCheck, Sparkles } from 'lucide-react';
import { useDictionary, useEnvironment, useLoading, useSidebar } from '@xernerx/providers';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Timeline from '@/components/Timeline';
import { LandingCta, PlatformHighlights } from '@/components/PlatformHighlights';
import { WwwDeepSearch } from '@/components/WwwDeepSearch';
import { BotProfileData, buildConsumerServiceItems, DeveloperSoftwareCard, ServiceProfileCard } from '@/components/LandingServiceCards';

export type ShowcasePackage = {
	name: string;
	desc?: string;
	link: string;
};

export default function HomeClient({ initialPackages = [] }: { initialPackages?: ShowcasePackage[] }) {
	const { hide } = useSidebar();
	const { getEnvUrl, isReady } = useEnvironment();
	const { t } = useDictionary();
	const { isLoading, setBackgroundMode, setDotVariant } = useLoading();

	const servicesRef = useRef<HTMLDivElement>(null);
	const softwareRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLElement | null>(null);
	const [ready, setReady] = useState(false);
	const [matrixConstructed, setMatrixConstructed] = useState(true);
	const [botProfiles, setBotProfiles] = useState<Record<string, BotProfileData>>({});

	const consumerServiceItems = buildConsumerServiceItems(t, getEnvUrl);

	const staticSoftwareItems = [
		{
			icon: <Package size={24} />,
			title: 'REST API (v1)',
			desc: t('www.software.apiDesc'),
			link: 'https://docs.xernerx.com/api/v1',
			tag: t('www.software.apiTag'),
		},
		{
			icon: <Boxes size={24} />,
			title: t('docs.home.categories.npm.title'),
			desc: t('docs.home.categories.npm.description'),
			link: 'https://docs.xernerx.com/packages',
			tag: t('www.software.npmPackageTag'),
		},
	];

	const internalPackageKeywords = ['websocket', '@xernerx/ui', '@xernerx/components', '@xernerx/lib', '@xernerx/styles', '@xernerx/providers', '@xernerx/feedback', '@xernerx/cli'];
	const publicPackages = initialPackages.filter((pkg) => {
		const lower = pkg.name.toLowerCase();
		return !internalPackageKeywords.some((kw) => lower.includes(kw));
	});

	const softwareItems =
		publicPackages.length > 0
			? [
					staticSoftwareItems[0],
					...publicPackages.map((pkg) => {
						const fallbackDesc = t('www.software.packageDesc', { name: pkg.name });
						const cleanDesc = pkg.desc?.trim();
						const finalDesc = !cleanDesc ? fallbackDesc : cleanDesc.length < 45 ? `${cleanDesc.endsWith('.') ? cleanDesc : `${cleanDesc}.`} ${fallbackDesc}` : cleanDesc;
						return {
							icon: <Boxes size={24} />,
							title: pkg.name,
							desc: finalDesc,
							link: pkg.link,
							tag: t('www.software.npmPackageTag'),
						};
					}),
				]
			: staticSoftwareItems;

	useEffect(() => {
		containerRef.current = document.getElementById('main-scroll-container');
		setReady(true);
	}, []);

	const { scrollYProgress: servicesProgress } = useScroll(ready ? { target: servicesRef, container: containerRef } : {});
	const servicesX = useTransform(servicesProgress, [0, 1], ['0%', '-60%']);

	const { scrollYProgress: softwareProgress } = useScroll(ready ? { target: softwareRef, container: containerRef } : {});
	const softwareX = useTransform(softwareProgress, [0, 1], ['0%', '70%']);

	useEffect(() => {
		if (!isReady) return;
		let active = true;
		fetch(getEnvUrl('https://api.xernerx.com/info/status/bots'))
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (!active || !Array.isArray(data?.bots)) return;
				const nextMap: Record<string, BotProfileData> = {};
				for (const bot of data.bots) {
					if (bot?.id) {
						nextMap[String(bot.id)] = {
							id: String(bot.id),
							name: bot.name,
							avatarUrl: bot.avatarUrl,
							status: bot.status,
							activity: bot.activity,
							guildCount: bot.guildCount,
							userCount: bot.userCount,
						};
					}
				}
				setBotProfiles((prev) => ({ ...prev, ...nextMap }));
			})
			.catch(() => {});
		return () => {
			active = false;
		};
	}, [isReady, getEnvUrl]);

	useEffect(() => {
		hide();
		setBackgroundMode('sticky-ripple');
		setDotVariant('full');

		const isAutomated =
			typeof navigator !== 'undefined' &&
			(Boolean((navigator as any).webdriver) ||
				/bot|crawl|spider|mediapartners|adsbot|google|bing|slurp|duckduck|baidu|yandex|seobility|lighthouse|pagespeed|headless|prerender|facebookexternalhit|twitterbot|discordbot|whatsapp|linkedinbot/i.test(
					navigator.userAgent || ''
				));

		let fallbackTimer = 0;
		const handleConstructComplete = () => {
			setMatrixConstructed(true);
			window.dispatchEvent(new CustomEvent('xernerx:stage-preview', { detail: { active: false } }));
		};

		if (isAutomated) {
			setMatrixConstructed(true);
		} else {
			setMatrixConstructed(false);
			(window as any).__xernerxConstructPending = true;
			window.dispatchEvent(new CustomEvent('xernerx:stage-preview', { detail: { active: true } }));
			window.dispatchEvent(new CustomEvent('xernerx:construct-logo'));
			window.addEventListener('xernerx:construct-complete', handleConstructComplete);
			fallbackTimer = window.setTimeout(handleConstructComplete, 3550);
		}

		const scrollEl = document.getElementById('main-scroll-container');
		const handleScroll = () => {
			if (!scrollEl) return;
			const vh = scrollEl.clientHeight || window.innerHeight || 800;
			const top = scrollEl.scrollTop;
			const triggerY = vh * 0.58;
			const isPast = (id: string, offset = 0) => {
				const el = document.getElementById(id);
				return el ? el.getBoundingClientRect().top <= triggerY + offset : false;
			};

			if (top < vh * 0.55) {
				setDotVariant('full');
			} else if (isPast('cta', 120)) {
				setDotVariant('vortex');
			} else if (isPast('timeline')) {
				setDotVariant('chronos');
			} else if (isPast('highlights')) {
				setDotVariant('orbit');
			} else if (isPast('about', -vh * 0.35)) {
				setDotVariant('helix');
			} else if (isPast('about')) {
				setDotVariant('infinity');
			} else if (isPast('software')) {
				setDotVariant('prism');
			} else {
				setDotVariant('icon');
			}
		};

		scrollEl?.addEventListener('scroll', handleScroll, { passive: true });
		return () => {
			window.clearTimeout(fallbackTimer);
			window.removeEventListener('xernerx:construct-complete', handleConstructComplete);
			window.dispatchEvent(new CustomEvent('xernerx:stage-preview', { detail: { active: false } }));
			scrollEl?.removeEventListener('scroll', handleScroll);
			setBackgroundMode(null);
			setDotVariant(null);
		};
	}, [hide, setBackgroundMode, setDotVariant]);

	const pageReady = !isLoading && matrixConstructed;

	return (
		<motion.div
			initial={false}
			animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: '56vh' }}
			transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
			className={`flex flex-col selection:bg-(--accent) selection:text-white ${pageReady ? '' : 'pointer-events-none select-none'}`}
		>
			{/* HERO SECTION — Sits cleanly beneath the constructed XERNERX dot-matrix stage */}
			<section className="min-h-dvh flex flex-col items-center justify-start px-6 pt-[52dvh] sm:pt-[54dvh] pb-12 relative z-30">
				<div className="w-full max-w-(--page-width) mx-auto flex flex-col items-center text-center relative z-10">
					<motion.div
						initial={false}
						animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
						transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
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
								href="/invites"
								className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-(--background)/55 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 hover:border-(--accent)/30 backdrop-blur-md transition-colors"
							>
								{t('www.hero.links.invites')}
							</Link>
							<Link
								href="/applications"
								className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-(--background)/55 hover:bg-(--accent)/15 text-(--text-muted) hover:text-(--accent) border border-(--border)/10 hover:border-(--accent)/30 backdrop-blur-md transition-colors"
							>
								{t('www.hero.links.careers')}
							</Link>
							<Link
								href="/contact"
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
							animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
							whileHover={{ y: -8, scale: 1.015 }}
							transition={{ duration: 1.6, delay: 0.25 + i * 0.16, ease: [0.22, 1, 0.36, 1] }}
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

			{/* CONSUMER SERVICES (Horizontal Scroll) */}
			<section id="services" ref={servicesRef} className="relative h-[300dvh]">
				<div className="sticky top-0 h-dvh flex flex-col justify-center overflow-hidden">
					<div className="w-full text-left mb-16 relative z-10 px-6 md:px-12 xl:px-[15vw]">
						<h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.sections.consumer.title')}
						</h2>
						<p className="max-w-2xl text-base text-(--text-muted) leading-relaxed">{t('www.sections.consumer.description')}</p>
					</div>

					<div className="relative z-10 w-full overflow-hidden flex items-center h-[430px]">
						<motion.div style={{ x: servicesX }} className="flex gap-8 px-6 md:px-12 xl:px-[15vw] absolute left-0 w-max">
							{consumerServiceItems.map((item) => (
								<ServiceProfileCard key={item.id} item={item} profile={botProfiles[item.botId]} />
							))}
						</motion.div>
					</div>
				</div>
			</section>

			{/* DEVELOPER SOFTWARE (Mirrored Horizontal Scroll) */}
			<section id="software" ref={softwareRef} className="relative h-[200dvh]">
				<div className="sticky top-0 h-dvh flex flex-col justify-center overflow-hidden">
					<div className="w-full text-right mb-16 relative z-10 px-6 md:px-12 xl:px-[15vw]">
						<h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.sections.developer.title')}
						</h2>
						<p className="max-w-2xl ml-auto text-base text-(--text-muted) leading-relaxed">{t('www.sections.developer.description')}</p>
					</div>

					<div className="relative z-10 w-full overflow-hidden flex items-center h-[370px]">
						<motion.div style={{ x: softwareX }} className="flex gap-8 px-6 md:px-12 xl:px-[15vw] absolute right-0 w-max">
							{softwareItems.map((item) => (
								<DeveloperSoftwareCard key={item.title} item={item} href={getEnvUrl(item.link)} />
							))}
						</motion.div>
					</div>
				</div>
			</section>

			{/* ABOUT SECTION (Asymmetrical Bento-style) */}
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

			{/* PLATFORM EXPERIENCE HIGHLIGHTS */}
			<PlatformHighlights />

			{/* HISTORY */}
			<Timeline />

			{/* CLOSING CALL TO ACTION */}
			<LandingCta />
		</motion.div>
	);
}
