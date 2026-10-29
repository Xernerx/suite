/** @format */
'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { useDictionary, useSidebar } from '@xernerx/providers';
import { useEffect, useRef, useState } from 'react';
type Section = {
	id: string;
	title: string;
	content: React.ReactNode;
};
export default function Page() {
	const { t } = useDictionary();
	const { hide } = useSidebar();
	useEffect(() => {
		hide();
	}, [hide]);
	const rawSections: Section[] = [
		{
			id: 'introduction',
			title: t('www.cookies.sections.introduction.title'),
			content: <p>{t('www.cookies.sections.introduction.content')}</p>,
		},
		{
			id: 'what-are-cookies',
			title: t('www.cookies.sections.whatAreCookies.title'),
			content: <p>{t('www.cookies.sections.whatAreCookies.content')}</p>,
		},
		{
			id: 'categories',
			title: t('www.cookies.sections.categories.title'),
			content: (
				<ul className="list-disc pl-6 space-y-4">
					<li>
						<strong className="text-(--text)">{t('www.cookies.sections.categories.essential.title')}</strong> {t('www.cookies.sections.categories.essential.desc')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.cookies.sections.categories.functional.title')}</strong> {t('www.cookies.sections.categories.functional.desc')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.cookies.sections.categories.analytics.title')}</strong> {t('www.cookies.sections.categories.analytics.desc')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.cookies.sections.categories.marketing.title')}</strong> {t('www.cookies.sections.categories.marketing.desc')}
					</li>
				</ul>
			),
		},
		{
			id: 'cookies-used',
			title: t('www.cookies.sections.cookiesUsed.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.cookies.sections.cookiesUsed.content')}</p>
					<ul className="list-disc pl-6 space-y-4">
						<li>
							<strong className="text-(--text)">{t('www.cookies.sections.cookiesUsed.auth.title')}</strong> {t('www.cookies.sections.cookiesUsed.auth.desc')}
						</li>
						<li>
							<strong className="text-(--text)">{t('www.cookies.sections.cookiesUsed.consent.title')}</strong> {t('www.cookies.sections.cookiesUsed.consent.desc')}
						</li>
						<li>
							<strong className="text-(--text)">{t('www.cookies.sections.cookiesUsed.locale.title')}</strong> {t('www.cookies.sections.cookiesUsed.locale.desc')}
						</li>
						<li>
							<strong className="text-(--text)">{t('www.cookies.sections.cookiesUsed.appearance.title')}</strong> {t('www.cookies.sections.cookiesUsed.appearance.desc')}
						</li>
					</ul>
				</div>
			),
		},
		{
			id: 'local-storage',
			title: t('www.cookies.sections.localStorage.title'),
			content: <p>{t('www.cookies.sections.localStorage.content')}</p>,
		},
		{
			id: 'third-party',
			title: t('www.cookies.sections.thirdParty.title'),
			content: <p>{t('www.cookies.sections.thirdParty.content')}</p>,
		},
		{
			id: 'managing',
			title: t('www.cookies.sections.managing.title'),
			content: <p>{t('www.cookies.sections.managing.content')}</p>,
		},
		{
			id: 'changes',
			title: t('www.cookies.sections.changes.title'),
			content: <p>{t('www.cookies.sections.changes.content')}</p>,
		},
		{
			id: 'contact',
			title: t('www.cookies.sections.contact.title'),
			content: (
				<p>
					{t('www.cookies.sections.contact.prefix')} <span className="text-(--accent) font-medium">{t('www.cookies.description')}</span>.
				</p>
			),
		},
	];
	const sections: Section[] = rawSections.map((section, idx) => ({
		...section,
		title: `${idx + 1}. ${String(section.title).replace(/^\d+\.\s*/, '')}`,
	}));
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
					top: 'env(safe-area-inset-top, 0px)',
				}}
				className="fixed left-0 right-0 h-0.75 origin-left bg-(--accent) z-50"
			/>

			<div className="min-h-screen px-6 py-32">
				<div className="max-w-(--page-width) mx-auto w-full grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-16">
					{/* TOC */}
					<aside className="hidden lg:block sticky top-32 self-start">
						<p className="text-sm uppercase tracking-wide text-(--text-muted) mb-6">{t('www.cookies.toc')}</p>

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
					<div className="space-y-16">
						<header className="text-center mb-16 bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl p-10 shadow-sm">
							<h1
								className="text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm"
								style={{
									fontFamily: 'var(--font-fredoka)',
								}}
							>
								{t('www.cookies.header.title')}
							</h1>
							<p className="text-sm font-medium tracking-wide uppercase text-(--text-muted)">{t('www.cookies.header.effectiveDate')} 21 October 2026</p>
						</header>

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
					</div>
				</div>
			</div>
		</div>
	);
}
