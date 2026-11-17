/** @format */
'use client';

import { motion } from 'framer-motion';
import { Boxes, ChevronLeft, ChevronRight, Package } from 'lucide-react';
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

	const servicesTrackRef = useRef<HTMLDivElement>(null);
	const softwareTrackRef = useRef<HTMLDivElement>(null);
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

	const handleCarouselWheel = (e: React.WheelEvent<HTMLDivElement>) => {
		if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey) {
			return;
		}
		if (e.shiftKey && e.deltaY !== 0) {
			e.currentTarget.scrollLeft += e.deltaY;
		}
	};

	const scrollCarouselBy = (ref: React.RefObject<HTMLDivElement | null>, direction: -1 | 1) => {
		const el = ref.current;
		if (!el) return;
		const step = Math.max(320, Math.round(el.clientWidth * 0.72));
		el.scrollBy({ left: direction * step, behavior: 'smooth' });
	};

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

			{/* CONSUMER SERVICES (Horizontal Carousel — Vertical Wheel Passes Through) */}
			<section id="services" className="relative py-20 md:py-28">
				<div className="flex flex-col justify-center">
					<div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 relative z-10 px-6 md:px-12 xl:px-[15vw]">
						<div className="text-left">
							<h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('www.sections.consumer.title')}
							</h2>
							<p className="max-w-2xl text-base text-(--text-muted) leading-relaxed">{t('www.sections.consumer.description')}</p>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<button
								type="button"
								aria-label={t('common.buttons.previous')}
								onClick={() => scrollCarouselBy(servicesTrackRef, -1)}
								className="h-10 w-10 rounded-full bg-(--foreground)/40 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/40 text-(--text) hover:text-(--accent) backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer"
							>
								<ChevronLeft size={18} />
							</button>
							<button
								type="button"
								aria-label={t('common.buttons.next')}
								onClick={() => scrollCarouselBy(servicesTrackRef, 1)}
								className="h-10 w-10 rounded-full bg-(--foreground)/40 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/40 text-(--text) hover:text-(--accent) backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer"
							>
								<ChevronRight size={18} />
							</button>
						</div>
					</div>

					<div ref={servicesTrackRef} onWheel={handleCarouselWheel} className="relative z-10 w-full overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth py-4">
						<div className="flex items-stretch gap-8 px-6 md:px-12 xl:px-[15vw] w-max">
							{consumerServiceItems.map((item) => (
								<ServiceProfileCard key={item.id} item={item} profile={botProfiles[item.botId]} />
							))}
						</div>
					</div>
				</div>
			</section>

			{/* DEVELOPER SOFTWARE (Horizontal Carousel — Vertical Wheel Passes Through) */}
			<section id="software" className="relative py-20 md:py-28">
				<div className="flex flex-col justify-center">
					<div className="w-full flex flex-col sm:flex-row-reverse sm:items-end justify-between gap-4 mb-10 relative z-10 px-6 md:px-12 xl:px-[15vw]">
						<div className="text-left sm:text-right">
							<h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm" style={{ fontFamily: 'var(--font-fredoka)' }}>
								{t('www.sections.developer.title')}
							</h2>
							<p className="max-w-2xl sm:ml-auto text-base text-(--text-muted) leading-relaxed">{t('www.sections.developer.description')}</p>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<button
								type="button"
								aria-label={t('common.buttons.previous')}
								onClick={() => scrollCarouselBy(softwareTrackRef, -1)}
								className="h-10 w-10 rounded-full bg-(--foreground)/40 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/40 text-(--text) hover:text-(--accent) backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer"
							>
								<ChevronLeft size={18} />
							</button>
							<button
								type="button"
								aria-label={t('common.buttons.next')}
								onClick={() => scrollCarouselBy(softwareTrackRef, 1)}
								className="h-10 w-10 rounded-full bg-(--foreground)/40 hover:bg-(--accent)/15 border border-(--border)/10 hover:border-(--accent)/40 text-(--text) hover:text-(--accent) backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer"
							>
								<ChevronRight size={18} />
							</button>
						</div>
					</div>

					<div ref={softwareTrackRef} onWheel={handleCarouselWheel} className="relative z-10 w-full overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth py-4">
						<div className="flex items-stretch gap-8 px-6 md:px-12 xl:px-[15vw] w-max">
							{softwareItems.map((item) => (
								<DeveloperSoftwareCard key={item.title} item={item} href={getEnvUrl(item.link)} />
							))}
						</div>
					</div>
				</div>
			</section>

			<HomeAboutSection />

			{/* PLATFORM EXPERIENCE HIGHLIGHTS */}
			<PlatformHighlights />

			{/* HISTORY */}
			<Timeline />

			{/* FAQ SECTION */}
			<div className="px-6 pb-16">
				<PageFaqSection
					subtitle={t('www.home.faq.subtitle')}
					items={[
						{ question: t('www.home.faq.q1'), answer: t('www.home.faq.a1') },
						{ question: t('www.home.faq.q2'), answer: t('www.home.faq.a2') },
						{ question: t('www.home.faq.q3'), answer: t('www.home.faq.a3') },
						{ question: t('www.home.faq.q4'), answer: t('www.home.faq.a4') },
					]}
				/>
			</div>

			{/* CLOSING CALL TO ACTION */}
			<LandingCta />
		</motion.div>
	);
}
