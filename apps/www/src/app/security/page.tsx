/** @format */
'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { Bot, CheckCircle2, Database, KeyRound, Lock, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PageFaqSection } from '@/components/PageFaqSection';

type Section = {
	id: string;
	title: string;
	content: React.ReactNode;
};

export default function SecurityPage() {
	const { t } = useDictionary();
	const { getEnvUrl } = useEnvironment();
	const { hide } = useSidebar();

	useEffect(() => {
		hide();
	}, [hide]);

	const pillars = [
		{
			icon: ShieldCheck,
			title: t('www.security.pillars.zeroContent.title'),
			desc: t('www.security.pillars.zeroContent.desc'),
		},
		{
			icon: Lock,
			title: t('www.security.pillars.boundaryIsolation.title'),
			desc: t('www.security.pillars.boundaryIsolation.desc'),
		},
		{
			icon: KeyRound,
			title: t('www.security.pillars.privacyTiers.title'),
			desc: t('www.security.pillars.privacyTiers.desc'),
		},
		{
			icon: Trash2,
			title: t('www.security.pillars.selfService.title'),
			desc: t('www.security.pillars.selfService.desc'),
		},
	];

	const botCards = [
		{
			id: 'virtue',
			href: getEnvUrl('https://app.xernerx.com/bots/virtue'),
			title: t('www.security.sections.bots.virtue.title'),
			badge: t('www.security.sections.bots.virtue.badge'),
			points: [
				t('www.security.sections.bots.virtue.points.0'),
				t('www.security.sections.bots.virtue.points.1'),
				t('www.security.sections.bots.virtue.points.2'),
				t('www.security.sections.bots.virtue.points.3'),
			],
		},
		{
			id: 'todo',
			href: getEnvUrl('https://app.xernerx.com/bots/todo'),
			title: t('www.security.sections.bots.todo.title'),
			badge: t('www.security.sections.bots.todo.badge'),
			points: [t('www.security.sections.bots.todo.points.0'), t('www.security.sections.bots.todo.points.1'), t('www.security.sections.bots.todo.points.2')],
		},
		{
			id: 'metamorphosis',
			href: getEnvUrl('https://app.xernerx.com/bots/metamorphosis'),
			title: t('www.security.sections.bots.metamorphosis.title'),
			badge: t('www.security.sections.bots.metamorphosis.badge'),
			points: [t('www.security.sections.bots.metamorphosis.points.0'), t('www.security.sections.bots.metamorphosis.points.1'), t('www.security.sections.bots.metamorphosis.points.2')],
		},
		{
			id: 'zodiac',
			href: getEnvUrl('https://app.xernerx.com/bots/zodiac'),
			title: t('www.security.sections.bots.zodiac.title'),
			badge: t('www.security.sections.bots.zodiac.badge'),
			points: [t('www.security.sections.bots.zodiac.points.0'), t('www.security.sections.bots.zodiac.points.1'), t('www.security.sections.bots.zodiac.points.2')],
		},
	];

	const sections: Section[] = [
		{
			id: 'overview',
			title: t('www.security.sections.overview.title'),
			content: <p>{t('www.security.sections.overview.content')}</p>,
		},
		{
			id: 'authentication',
			title: t('www.security.sections.authentication.title'),
			content: (
				<ul className="list-disc pl-6 space-y-4">
					<li>
						<strong className="text-(--text)">{t('www.security.sections.authentication.items.oauth.title')}</strong> {t('www.security.sections.authentication.items.oauth.desc')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.security.sections.authentication.items.devices.title')}</strong> {t('www.security.sections.authentication.items.devices.desc')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.security.sections.authentication.items.qr.title')}</strong> {t('www.security.sections.authentication.items.qr.desc')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.security.sections.authentication.items.partitions.title')}</strong> {t('www.security.sections.authentication.items.partitions.desc')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.security.sections.authentication.items.connections.title')}</strong>{' '}
						{t('www.security.sections.authentication.items.connections.desc')}
					</li>
				</ul>
			),
		},
		{
			id: 'privacy-tiers',
			title: t('www.security.sections.privacyTiers.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.security.sections.privacyTiers.intro')}</p>
					<ul className="list-disc pl-6 space-y-4">
						<li>
							<strong className="text-(--text)">{t('www.security.sections.privacyTiers.public.title')}</strong> {t('www.security.sections.privacyTiers.public.desc')}
						</li>
						<li>
							<strong className="text-(--text)">{t('www.security.sections.privacyTiers.limited.title')}</strong> {t('www.security.sections.privacyTiers.limited.desc')}
						</li>
						<li>
							<strong className="text-(--text)">{t('www.security.sections.privacyTiers.private.title')}</strong> {t('www.security.sections.privacyTiers.private.desc')}
						</li>
					</ul>
				</div>
			),
		},
		{
			id: 'bots',
			title: t('www.security.sections.bots.title'),
			content: (
				<div className="space-y-6">
					<p>{t('www.security.sections.bots.intro')}</p>
					<div className="grid grid-cols-1 gap-6">
						{botCards.map((bot) => (
							<div key={bot.id} className="rounded-2xl bg-(--background)/50 border border-(--border)/10 p-6 flex flex-col gap-4">
								<div className="flex flex-wrap items-center justify-between gap-3">
									<a
										href={bot.href}
										className="inline-flex items-center gap-2.5 text-lg font-bold text-(--text) hover:text-(--accent) transition-colors"
										style={{ fontFamily: 'var(--font-fredoka)' }}
									>
										<Bot size={20} className="text-(--accent) shrink-0" />
										<span>{bot.title}</span>
									</a>
									<span className="inline-flex items-center gap-1.5 rounded-full bg-(--accent)/10 border border-(--accent)/30 px-3 py-1 text-xs font-bold text-(--accent)">
										<Sparkles size={12} />
										{bot.badge}
									</span>
								</div>
								<ul className="space-y-2.5 text-sm text-(--text-muted)">
									{bot.points.map((pt, i) => (
										<li key={i} className="flex items-start gap-2.5">
											<CheckCircle2 size={16} className="text-(--accent) shrink-0 mt-0.5" />
											<span>{pt}</span>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
			),
		},
		{
			id: 'api-and-webhooks',
			title: t('www.security.sections.apiAndWebhooks.title'),
			content: (
				<ul className="list-disc pl-6 space-y-4">
					<li>
						<strong className="text-(--text)">{t('www.security.sections.apiAndWebhooks.items.tokens.title')}</strong> {t('www.security.sections.apiAndWebhooks.items.tokens.desc')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.security.sections.apiAndWebhooks.items.webhooks.title')}</strong> {t('www.security.sections.apiAndWebhooks.items.webhooks.desc')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.security.sections.apiAndWebhooks.items.websocket.title')}</strong> {t('www.security.sections.apiAndWebhooks.items.websocket.desc')}
					</li>
				</ul>
			),
		},
		{
			id: 'infrastructure',
			title: t('www.security.sections.infrastructure.title'),
			content: (
				<ul className="list-disc pl-6 space-y-4">
					<li>
						<strong className="text-(--text)">{t('www.security.sections.infrastructure.items.databases.title')}</strong> {t('www.security.sections.infrastructure.items.databases.desc')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.security.sections.infrastructure.items.cdn.title')}</strong> {t('www.security.sections.infrastructure.items.cdn.desc')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.security.sections.infrastructure.items.stripe.title')}</strong> {t('www.security.sections.infrastructure.items.stripe.desc')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.security.sections.infrastructure.items.audit.title')}</strong> {t('www.security.sections.infrastructure.items.audit.desc')}
					</li>
				</ul>
			),
		},
		{
			id: 'data-control',
			title: t('www.security.sections.dataControl.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.security.sections.dataControl.content')}</p>
					<ul className="list-disc pl-6 space-y-2.5">
						<li>{t('www.security.sections.dataControl.items.0')}</li>
						<li>{t('www.security.sections.dataControl.items.1')}</li>
						<li>{t('www.security.sections.dataControl.items.2')}</li>
						<li>{t('www.security.sections.dataControl.items.3')}</li>
						<li>{t('www.security.sections.dataControl.items.4')}</li>
					</ul>
				</div>
			),
		},
		{
			id: 'licensing',
			title: t('www.security.sections.licensing.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.security.sections.licensing.intro')}</p>
					<ul className="list-disc pl-6 space-y-4">
						<li>
							<strong className="text-(--text)">{t('www.security.sections.licensing.proprietaryTitle')}</strong> {t('www.security.sections.licensing.proprietaryDesc')}{' '}
							<span className="inline-flex flex-wrap items-center gap-3 mt-1">
								<Link href="/license" className="text-(--accent) hover:underline font-medium">
									{t('www.security.sections.licensing.proprietaryLink')}
								</Link>
								<span>•</span>
								<Link href="/license#plain-text-license" className="text-(--accent) hover:underline font-medium">
									{t('www.security.sections.licensing.plainTextLink')}
								</Link>
							</span>
						</li>
						<li>
							<strong className="text-(--text)">{t('www.security.sections.licensing.apacheTitle')}</strong> {t('www.security.sections.licensing.apacheDesc')}{' '}
							<span className="inline-flex flex-wrap items-center gap-3 mt-1">
								<a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer" className="text-(--accent) hover:underline font-medium">
									{t('www.security.sections.licensing.apacheLink')}
								</a>
								<span>•</span>
								<a href={getEnvUrl('https://docs.xernerx.com/packages')} className="text-(--accent) hover:underline font-medium">
									{t('www.security.sections.licensing.packagesLink')}
								</a>
								<span>•</span>
								<a href="https://github.com/xernerx" target="_blank" rel="noopener noreferrer" className="text-(--accent) hover:underline font-medium">
									{t('www.security.sections.licensing.githubLink')}
								</a>
							</span>
						</li>
					</ul>
					<p className="text-sm">
						{t('www.security.sections.licensing.policiesPrefix')}
						<Link href="/terms" className="text-(--accent) hover:underline font-medium">
							{t('www.security.sections.licensing.termsLink')}
						</Link>
						{', '}
						<Link href="/privacy" className="text-(--accent) hover:underline font-medium">
							{t('www.security.sections.licensing.privacyLink')}
						</Link>
						{t('www.security.sections.licensing.andText')}
						<Link href="/cookies" className="text-(--accent) hover:underline font-medium">
							{t('www.security.sections.licensing.cookiesLink')}
						</Link>
						.
					</p>
				</div>
			),
		},
		{
			id: 'disclosure',
			title: t('www.security.sections.disclosure.title'),
			content: (
				<div className="space-y-3">
					<p>{t('www.security.sections.disclosure.content')}</p>
					<p>
						{t('www.security.sections.disclosure.emailPrefix')}{' '}
						<a href={`mailto:${t('www.security.sections.disclosure.email')}`} className="text-(--accent) hover:underline font-medium">
							{t('www.security.sections.disclosure.email')}
						</a>{' '}
						<Link href={getEnvUrl('https://info.xernerx.com/issues')} className="text-(--accent) hover:underline font-medium">
							{t('www.security.sections.disclosure.issuesLinkText')}
						</Link>
					</p>
				</div>
			),
		},
	];

	const containerRef = useRef<HTMLElement | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const el = document.getElementById('main-scroll-container');
		if (el) {
			containerRef.current = el;
			setReady(true);
		}
	}, []);

	const { scrollYProgress } = useScroll(ready ? { container: containerRef } : {});
	const scaleX = useSpring(scrollYProgress, {
		stiffness: 100,
		damping: 30,
	});

	const [active, setActive] = useState<string | null>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setActive(entry.target.id);
					}
				});
			},
			{
				root: document.getElementById('main-scroll-container'),
				rootMargin: '-40% 0px -50% 0px',
			}
		);

		sections.forEach((s) => {
			const el = document.getElementById(s.id);
			if (el) observer.observe(el);
		});

		return () => observer.disconnect();
	}, [sections]);

	return (
		<div className="relative">
			<motion.div
				style={{
					scaleX,
					top: 'calc(50px + env(safe-area-inset-top, 0px))',
				}}
				className="fixed left-0 right-0 h-0.75 origin-left bg-(--accent) z-50"
			/>

			<div className="min-h-screen px-6 py-32">
				<div className="max-w-(--page-width) mx-auto w-full grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-16">
					{/* TOC */}
					<aside className="hidden lg:block sticky top-32 self-start">
						<div className="text-sm uppercase tracking-wide text-(--text-muted) mb-6">{t('www.security.toc')}</div>

						<nav className="space-y-4 text-sm">
							{sections.map((section) => (
								<a
									key={section.id}
									href={`#${section.id}`}
									className={`block transition ${active === section.id ? 'text-(--accent) font-medium' : 'text-(--text-muted) hover:text-(--text)'}`}
								>
									{section.title}
								</a>
							))}
						</nav>
					</aside>

					{/* MAIN */}
					<div className="space-y-12">
						<header className="text-center bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl p-10 shadow-sm flex flex-col items-center gap-4">
							<span className="inline-flex items-center gap-2 rounded-full bg-(--accent)/10 border border-(--accent)/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-(--accent)">
								<Database size={14} />
								{t('www.security.header.badge')}
							</span>
							<h1
								className="text-5xl font-extrabold text-(--text) drop-shadow-sm"
								style={{
									fontFamily: 'var(--font-fredoka)',
								}}
							>
								{t('www.security.header.title')}
							</h1>
							<p className="max-w-3xl text-base text-(--text-muted) leading-relaxed">{t('www.security.header.subtitle')}</p>
							<div className="text-xs font-medium tracking-wide uppercase text-(--text-muted)">{t('www.security.header.effectiveDate')} 8 November 2026</div>
						</header>

						{/* Core Security Pillars Bento */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							{pillars.map((pillar) => {
								const Icon = pillar.icon;
								return (
									<div key={pillar.title} className="rounded-3xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 p-6 flex flex-col gap-3 shadow-sm">
										<div className="w-11 h-11 rounded-2xl bg-(--accent)/15 border border-(--accent)/30 flex items-center justify-center text-(--accent)">
											<Icon size={20} />
										</div>
										<h2 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
											{pillar.title}
										</h2>
										<p className="text-sm text-(--text-muted) leading-relaxed">{pillar.desc}</p>
									</div>
								);
							})}
						</div>

						<div className="bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl p-10 shadow-sm space-y-16">
							{sections.map((section) => (
								<section key={section.id} id={section.id} className="scroll-mt-32 pl-6 border-l-2 border-(--accent)">
									<h2
										className="text-2xl font-bold mb-4 text-(--text)"
										style={{
											fontFamily: 'var(--font-fredoka)',
										}}
									>
										{section.title}
									</h2>
									<div className="text-(--text-muted) leading-relaxed">{section.content}</div>
								</section>
							))}
						</div>

						<PageFaqSection
							subtitle={t('www.security.faq.subtitle')}
							items={[
								{ question: t('www.security.faq.q1'), answer: t('www.security.faq.a1') },
								{ question: t('www.security.faq.q2'), answer: t('www.security.faq.a2') },
								{ question: t('www.security.faq.q3'), answer: t('www.security.faq.a3') },
							]}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
