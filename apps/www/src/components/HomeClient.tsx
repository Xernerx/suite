/** @format */
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Boxes, Package } from 'lucide-react';
import { useDictionary, useEnvironment, useLoading, useSidebar } from '@xernerx/providers';
import { useEffect, useRef, useState } from 'react';
import Timeline from '@/components/Timeline';
import { LandingCta, PlatformHighlights } from '@/components/PlatformHighlights';
import { PageFaqSection } from '@/components/PageFaqSection';
import { BotProfileData, buildConsumerServiceItems, DeveloperSoftwareCard, ServiceProfileCard } from '@/components/LandingServiceCards';
import { HomeHeroAndFeatures } from '@/components/home/HomeHeroAndFeatures';
import { HomeAboutSection } from '@/components/home/HomeAboutSection';

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
	const servicesTrackRef = useRef<HTMLDivElement>(null);
	const softwareTrackRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLElement | null>(null);
	const [ready, setReady] = useState(false);
	const [matrixConstructed, setMatrixConstructed] = useState(true);
	const [reducedMotion, setReducedMotion] = useState(false);
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

	const internalPackageKeywords = ['@xernerx/ui', '@xernerx/components', '@xernerx/lib', '@xernerx/styles', '@xernerx/providers', '@xernerx/feedback', '@xernerx/cli'];
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
						const cleanDesc = pkg.desc
							?.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
							.replace(/\s*\(https?:\/\/[^)]+\)/g, '')
							.trim();
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
	const servicesX = useTransform(servicesProgress, (v) => {
		const el = servicesTrackRef.current;
		if (!el || !el.parentElement) return '0px';
		const maxShift = Math.max(0, el.scrollWidth - el.parentElement.clientWidth);
		return `${-v * maxShift}px`;
	});

	const { scrollYProgress: softwareProgress } = useScroll(ready ? { target: softwareRef, container: containerRef } : {});
	const softwareX = useTransform(softwareProgress, (v) => {
		const el = softwareTrackRef.current;
		if (!el || !el.parentElement) return '0px';
		const maxShift = Math.max(0, el.scrollWidth - el.parentElement.clientWidth);
		return `${v * maxShift}px`;
	});

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
							bannerUrl: bot.bannerUrl,
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

		const prefersReduced = typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
		setReducedMotion(prefersReduced);

		const isAutomated =
			typeof navigator !== 'undefined' &&
			(Boolean((navigator as any).webdriver) ||
				/bot|crawl|spider|mediapartners|adsbot|google|bing|slurp|duckduck|baidu|yandex|seobility|lighthouse|pagespeed|headless|prerender|facebookexternalhit|twitterbot|discordbot|whatsapp|linkedinbot/i.test(
					navigator.userAgent || ''
				));

		const alreadyConstructed = typeof window !== 'undefined' && Boolean((window as any).__xernerxHomeConstructCompleted);

		let fallbackTimer = 0;
		const handleConstructComplete = () => {
			if (typeof window !== 'undefined') {
				(window as any).__xernerxHomeConstructCompleted = true;
				(window as any).__xernerxConstructPending = false;
				window.dispatchEvent(new CustomEvent('xernerx:stage-preview', { detail: { active: false } }));
			}
			setMatrixConstructed(true);
		};

		if (isAutomated || prefersReduced || alreadyConstructed) {
			handleConstructComplete();
		} else {
			setMatrixConstructed(false);
			(window as any).__xernerxConstructPending = true;
			// Register completion & early-interaction listeners BEFORE firing construct-logo so synchronous completions are never missed
			window.addEventListener('xernerx:construct-complete', handleConstructComplete);
			window.addEventListener('wheel', handleConstructComplete, { passive: true, once: true });
			window.addEventListener('touchmove', handleConstructComplete, { passive: true, once: true });
			window.addEventListener('pointerdown', handleConstructComplete, { passive: true, once: true });
			window.addEventListener('keydown', handleConstructComplete, { once: true });
			window.dispatchEvent(new CustomEvent('xernerx:stage-preview', { detail: { active: true } }));
			window.dispatchEvent(new CustomEvent('xernerx:construct-logo'));
			fallbackTimer = window.setTimeout(handleConstructComplete, 1800);
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
			window.removeEventListener('wheel', handleConstructComplete);
			window.removeEventListener('touchmove', handleConstructComplete);
			window.removeEventListener('pointerdown', handleConstructComplete);
			window.removeEventListener('keydown', handleConstructComplete);
			window.dispatchEvent(new CustomEvent('xernerx:stage-preview', { detail: { active: false } }));
			scrollEl?.removeEventListener('scroll', handleScroll);
			setBackgroundMode(null);
			setDotVariant(null);
		};
	}, [hide, setBackgroundMode, setDotVariant]);

	const pageReady = matrixConstructed && (!isLoading || reducedMotion);

	return (
		<motion.div
			initial={false}
			animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
			transition={{ duration: reducedMotion ? 0 : 0.75, ease: [0.22, 1, 0.36, 1] }}
			className={`flex flex-col selection:bg-(--accent) selection:text-white ${pageReady ? '' : 'pointer-events-none select-none'}`}
		>
			<HomeHeroAndFeatures pageReady={pageReady} reducedMotion={reducedMotion} publicPackages={publicPackages} />

			{/* CONSUMER SERVICES (Horizontal Scroll) */}
			<section id="services" ref={servicesRef} className="relative h-[300dvh]">
				<div className="sticky top-0 h-dvh flex flex-col justify-center overflow-hidden">
					<div className="w-full text-left mb-16 relative z-10 px-6 md:px-12 xl:px-[15vw]">
						<h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.sections.consumer.title')}
						</h2>
						<p className="max-w-2xl text-base text-(--text-muted) leading-relaxed">{t('www.sections.consumer.description')}</p>
					</div>

					<div className="relative z-10 w-full overflow-x-clip flex items-center min-h-[460px] py-6">
						<motion.div ref={servicesTrackRef} style={{ x: servicesX }} className="flex items-stretch gap-8 px-6 md:px-12 xl:px-[15vw] absolute left-0 w-max">
							{consumerServiceItems.map((item) => (
								<ServiceProfileCard key={item.id} item={item} profile={botProfiles[item.botId]} />
							))}
						</motion.div>
					</div>
				</div>
			</section>

			{/* DEVELOPER SOFTWARE (Mirrored Horizontal Scroll) */}
			<section id="software" ref={softwareRef} className="relative h-[300dvh]">
				<div className="sticky top-0 h-dvh flex flex-col justify-center overflow-hidden">
					<div className="w-full text-right mb-16 relative z-10 px-6 md:px-12 xl:px-[15vw]">
						<h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('www.sections.developer.title')}
						</h2>
						<p className="max-w-2xl ml-auto text-base text-(--text-muted) leading-relaxed">{t('www.sections.developer.description')}</p>
					</div>

					<div className="relative z-10 w-full overflow-x-clip flex items-center min-h-[420px] py-6">
						<motion.div ref={softwareTrackRef} style={{ x: softwareX }} className="flex items-stretch gap-8 px-6 md:px-12 xl:px-[15vw] absolute right-0 w-max">
							{softwareItems.map((item) => (
								<DeveloperSoftwareCard key={item.title} item={item} href={getEnvUrl(item.link)} />
							))}
						</motion.div>
					</div>
				</div>
			</section>

			<HomeAboutSection />

			{/* PLATFORM EXPERIENCE HIGHLIGHTS */}
			<PlatformHighlights />

			{/* HISTORY */}
			<Timeline />

			{/* FAQ SCHEMA */}
			<PageFaqSection
				subtitle={t('www.home.faq.subtitle')}
				items={[
					{ question: t('www.home.faq.q1'), answer: t('www.home.faq.a1') },
					{ question: t('www.home.faq.q2'), answer: t('www.home.faq.a2') },
					{ question: t('www.home.faq.q3'), answer: t('www.home.faq.a3') },
					{ question: t('www.home.faq.q4'), answer: t('www.home.faq.a4') },
				]}
			/>

			{/* CLOSING CALL TO ACTION */}
			<LandingCta />
		</motion.div>
	);
}
