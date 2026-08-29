/** @format */
'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { useDictionary, useSidebar } from '@xernerx/providers';
import { useEffect, useState } from 'react';
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
	const sections: Section[] = [
		{
			id: 'introduction',
			title: t('www.privacy.sections.introduction.title'),
			content: <p>{t('www.privacy.sections.introduction.content')}</p>,
		},
		{
			id: 'data-collected',
			title: t('www.privacy.sections.dataCollected.title'),
			content: (
				<ul className="list-disc pl-6 space-y-2">
					<li>
						<strong className="text-(--text)">{t('www.privacy.sections.dataCollected.account.title')}</strong> {t('www.privacy.sections.dataCollected.account.desc')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.privacy.sections.dataCollected.usage.title')}</strong> {t('www.privacy.sections.dataCollected.usage.desc')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.privacy.sections.dataCollected.integration.title')}</strong> {t('www.privacy.sections.dataCollected.integration.desc')}
					</li>
				</ul>
			),
		},
		{
			id: 'legal-basis',
			title: t('www.privacy.sections.legalBasis.title'),
			content: <p>{t('www.privacy.sections.legalBasis.content')}</p>,
		},
		{
			id: 'usage',
			title: t('www.privacy.sections.usage.title'),
			content: (
				<ul className="list-disc pl-6 space-y-2">
					<li>{t('www.privacy.sections.usage.items.0')}</li>
					<li>{t('www.privacy.sections.usage.items.1')}</li>
					<li>{t('www.privacy.sections.usage.items.2')}</li>
					<li>{t('www.privacy.sections.usage.items.3')}</li>
				</ul>
			),
		},
		{
			id: 'sharing',
			title: t('www.privacy.sections.sharing.title'),
			content: (
				<ul className="list-disc pl-6 space-y-2">
					<li>{t('www.privacy.sections.sharing.items.0')}</li>
					<li>{t('www.privacy.sections.sharing.items.1')}</li>
					<li>{t('www.privacy.sections.sharing.items.2')}</li>
				</ul>
			),
		},
		{
			id: 'retention',
			title: t('www.privacy.sections.retention.title'),
			content: <p>{t('www.privacy.sections.retention.content')}</p>,
		},
		{
			id: 'security',
			title: t('www.privacy.sections.security.title'),
			content: <p>{t('www.privacy.sections.security.content')}</p>,
		},
		{
			id: 'rights',
			title: t('www.privacy.sections.rights.title'),
			content: (
				<ul className="list-disc pl-6 space-y-2">
					<li>{t('www.privacy.sections.rights.items.0')}</li>
					<li>{t('www.privacy.sections.rights.items.1')}</li>
					<li>{t('www.privacy.sections.rights.items.2')}</li>
					<li>{t('www.privacy.sections.rights.items.3')}</li>
				</ul>
			),
		},
		{
			id: 'cookies',
			title: t('www.privacy.sections.cookies.title'),
			content: <p>{t('www.privacy.sections.cookies.content')}</p>,
		},
		{
			id: 'international',
			title: t('www.privacy.sections.international.title'),
			content: <p>{t('www.privacy.sections.international.content')}</p>,
		},
		{
			id: 'changes',
			title: t('www.privacy.sections.changes.title'),
			content: <p>{t('www.privacy.sections.changes.content')}</p>,
		},
		{
			id: 'contact',
			title: t('www.privacy.sections.contact.title'),
			content: (
				<p>
					{t('www.privacy.sections.contact.prefix')} <span className="text-(--accent) font-medium">{t('www.privacy.description')}</span>.
				</p>
			),
		},
	];
	const { scrollYProgress } = useScroll();
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
				}}
				className="fixed top-0 left-0 right-0 h-0.75 origin-left bg-(--accent) z-50"
			/>

			<div className="min-h-screen px-6 py-32">
				<div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-16">
					{/* TOC */}
					<aside className="hidden lg:block sticky top-32 self-start">
						<h3 className="text-sm uppercase tracking-wide text-(--text-muted) mb-6">{t('www.privacy.toc')}</h3>

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
					<main className="space-y-16">
						<header className="text-center mb-16 bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl p-10 shadow-sm">
							<h1
								className="text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm"
								style={{
									fontFamily: 'var(--font-fredoka)',
								}}
							>
								{t('www.privacy.header.title')}
							</h1>
							<p className="text-sm font-medium tracking-wide uppercase text-(--text-muted)">
								{t('www.privacy.header.effectiveDate')} {new Date().toDateString()}
							</p>
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
					</main>
				</div>
			</div>
		</div>
	);
}
