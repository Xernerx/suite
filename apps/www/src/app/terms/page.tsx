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
			title: t('www.terms.sections.introduction.title'),
			content: <p>{t('www.terms.sections.introduction.content')}</p>,
		},
		{
			id: 'eligibility',
			title: t('www.terms.sections.eligibility.title'),
			content: <p>{t('www.terms.sections.eligibility.content')}</p>,
		},
		{
			id: 'acceptable-use',
			title: t('www.terms.sections.acceptableUse.title'),
			content: (
				<ul className="list-disc pl-6 space-y-2">
					<li>{t('www.terms.sections.acceptableUse.items.0')}</li>
					<li>{t('www.terms.sections.acceptableUse.items.1')}</li>
					<li>{t('www.terms.sections.acceptableUse.items.2')}</li>
					<li>{t('www.terms.sections.acceptableUse.items.3')}</li>
				</ul>
			),
		},
		{
			id: 'accounts',
			title: t('www.terms.sections.accounts.title'),
			content: <p>{t('www.terms.sections.accounts.content')}</p>,
		},
		{
			id: 'data',
			title: t('www.terms.sections.data.title'),
			content: <p>{t('www.terms.sections.data.content')}</p>,
		},
		{
			id: 'availability',
			title: t('www.terms.sections.availability.title'),
			content: <p>{t('www.terms.sections.availability.content')}</p>,
		},
		{
			id: 'third-party',
			title: t('www.terms.sections.thirdParty.title'),
			content: <p>{t('www.terms.sections.thirdParty.content')}</p>,
		},
		{
			id: 'intellectual-property',
			title: t('www.terms.sections.intellectualProperty.title'),
			content: <p>{t('www.terms.sections.intellectualProperty.content')}</p>,
		},
		{
			id: 'warranty',
			title: t('www.terms.sections.warranty.title'),
			content: <p>{t('www.terms.sections.warranty.content')}</p>,
		},
		{
			id: 'liability',
			title: t('www.terms.sections.liability.title'),
			content: <p>{t('www.terms.sections.liability.content')}</p>,
		},
		{
			id: 'indemnification',
			title: t('www.terms.sections.indemnification.title'),
			content: <p>{t('www.terms.sections.indemnification.content')}</p>,
		},
		{
			id: 'governing-law',
			title: t('www.terms.sections.governingLaw.title'),
			content: <p>{t('www.terms.sections.governingLaw.content')}</p>,
		},
		{
			id: 'changes',
			title: t('www.terms.sections.changes.title'),
			content: <p>{t('www.terms.sections.changes.content')}</p>,
		},
		{
			id: 'contact',
			title: t('www.terms.sections.contact.title'),
			content: (
				<p>
					{t('www.terms.sections.contact.prefix')} <span className="text-(--accent) font-medium">{t('www.terms.description')}</span>.
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
					<aside className="hidden lg:block sticky top-32 self-start">
						<h3 className="text-sm uppercase tracking-wide text-(--text-muted) mb-6">{t('www.terms.toc')}</h3>
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

					<main className="space-y-16">
						<header className="text-center mb-16 bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl p-10 shadow-sm">
							<h1
								className="text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm"
								style={{
									fontFamily: 'var(--font-fredoka)',
								}}
							>
								{t('www.terms.header.title')}
							</h1>
							<p className="text-sm font-medium tracking-wide uppercase text-(--text-muted)">
								{t('www.terms.header.effectiveDate')} {new Date().toDateString()}
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
