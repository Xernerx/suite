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
	const { hide } = useSidebar();
	const { t } = useDictionary();

	useEffect(() => {
		hide();
	}, [hide]);

	const sections: Section[] = [
		{
			id: 'introduction',
			title: t('www.privacy.sections.introduction.title', {}, '1. Introduction'),
			content: (
				<p>
					{t(
						'www.privacy.sections.introduction.content',
						{},
						'This Privacy Policy explains how Xernerx Studios ("we", "our", "us") collects, uses, and protects your personal data when you use our services.'
					)}
				</p>
			),
		},
		{
			id: 'data-collected',
			title: t('www.privacy.sections.dataCollected.title', {}, '2. Information We Collect'),
			content: (
				<ul className="list-disc pl-6 space-y-2">
					<li>
						<strong className="text-(--text)">{t('www.privacy.sections.dataCollected.account.title', {}, 'Account Information:')}</strong>{' '}
						{t('www.privacy.sections.dataCollected.account.desc', {}, 'Email, username, and profile identifiers.')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.privacy.sections.dataCollected.usage.title', {}, 'Usage Data:')}</strong>{' '}
						{t('www.privacy.sections.dataCollected.usage.desc', {}, 'Logs, system interactions, and configuration settings.')}
					</li>
					<li>
						<strong className="text-(--text)">{t('www.privacy.sections.dataCollected.integration.title', {}, 'Integration Data:')}</strong>{' '}
						{t('www.privacy.sections.dataCollected.integration.desc', {}, 'Data provided through third-party platforms such as Discord.')}
					</li>
				</ul>
			),
		},
		{
			id: 'legal-basis',
			title: t('www.privacy.sections.legalBasis.title', {}, '3. Legal Basis for Processing'),
			content: (
				<p>
					{t(
						'www.privacy.sections.legalBasis.content',
						{},
						'We process personal data based on contractual necessity, legitimate interests, legal obligations, or user consent where applicable.'
					)}
				</p>
			),
		},
		{
			id: 'usage',
			title: t('www.privacy.sections.usage.title', {}, '4. How We Use Information'),
			content: (
				<ul className="list-disc pl-6 space-y-2">
					<li>{t('www.privacy.sections.usage.items.0', {}, 'To provide and maintain services.')}</li>
					<li>{t('www.privacy.sections.usage.items.1', {}, 'To improve reliability and performance.')}</li>
					<li>{t('www.privacy.sections.usage.items.2', {}, 'To provide support and communicate updates.')}</li>
					<li>{t('www.privacy.sections.usage.items.3', {}, 'To ensure compliance with legal obligations.')}</li>
				</ul>
			),
		},
		{
			id: 'sharing',
			title: t('www.privacy.sections.sharing.title', {}, '5. Data Sharing'),
			content: (
				<ul className="list-disc pl-6 space-y-2">
					<li>{t('www.privacy.sections.sharing.items.0', {}, 'Hosting and infrastructure providers.')}</li>
					<li>{t('www.privacy.sections.sharing.items.1', {}, 'Authorized third-party integrations.')}</li>
					<li>{t('www.privacy.sections.sharing.items.2', {}, 'Legal authorities when required by law.')}</li>
				</ul>
			),
		},
		{
			id: 'retention',
			title: t('www.privacy.sections.retention.title', {}, '6. Data Retention'),
			content: (
				<p>
					{t(
						'www.privacy.sections.retention.content',
						{},
						'We retain data only as long as necessary to fulfill the purposes outlined in this Policy, unless longer retention is required by law.'
					)}
				</p>
			),
		},
		{
			id: 'security',
			title: t('www.privacy.sections.security.title', {}, '7. Data Security'),
			content: <p>{t('www.privacy.sections.security.content', {}, 'We implement technical and organizational security measures to protect data. However, no system is absolutely secure.')}</p>,
		},
		{
			id: 'rights',
			title: t('www.privacy.sections.rights.title', {}, '8. Your Rights'),
			content: (
				<ul className="list-disc pl-6 space-y-2">
					<li>{t('www.privacy.sections.rights.items.0', {}, 'Right to access your data.')}</li>
					<li>{t('www.privacy.sections.rights.items.1', {}, 'Right to correction or deletion.')}</li>
					<li>{t('www.privacy.sections.rights.items.2', {}, 'Right to restrict or object to processing.')}</li>
					<li>{t('www.privacy.sections.rights.items.3', {}, 'Right to data portability.')}</li>
				</ul>
			),
		},
		{
			id: 'cookies',
			title: t('www.privacy.sections.cookies.title', {}, '9. Cookies & Tracking'),
			content: <p>{t('www.privacy.sections.cookies.content', {}, 'We may use cookies or similar technologies to improve service performance and analytics.')}</p>,
		},
		{
			id: 'international',
			title: t('www.privacy.sections.international.title', {}, '10. International Transfers'),
			content: (
				<p>{t('www.privacy.sections.international.content', {}, 'If data is transferred outside your jurisdiction, appropriate safeguards are implemented to ensure legal compliance.')}</p>
			),
		},
		{
			id: 'changes',
			title: t('www.privacy.sections.changes.title', {}, '11. Changes to This Policy'),
			content: <p>{t('www.privacy.sections.changes.content', {}, 'We may update this Privacy Policy periodically. Continued use of services indicates acceptance of the revised version.')}</p>,
		},
		{
			id: 'contact',
			title: t('www.privacy.sections.contact.title', {}, '12. Contact'),
			content: (
				<p>
					{t('www.privacy.sections.contact.prefix', {}, 'For privacy-related inquiries contact')} <span className="text-(--accent) font-medium">legal@xernerx.com</span>.
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
			{ rootMargin: '-40% 0px -50% 0px' }
		);

		sections.forEach((s) => {
			const el = document.getElementById(s.id);
			if (el) observer.observe(el);
		});

		return () => observer.disconnect();
	}, [sections]);

	return (
		<div className="relative">
			<motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-0.75 origin-left bg-(--accent) z-50" />

			<div className="min-h-screen px-6 py-32">
				<div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-16">
					{/* TOC */}
					<aside className="hidden lg:block sticky top-32 self-start">
						<h3 className="text-sm uppercase tracking-wide text-(--text-muted) mb-6">{t('www.privacy.toc', {}, 'Contents')}</h3>

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
					<main className="space-y-20">
						<header className="text-center mb-16">
							<h1 className="text-4xl font-semibold mb-4 text-(--text)">{t('www.privacy.header.title', {}, 'Privacy Policy')}</h1>
							<p className="text-sm text-(--text-muted)">
								{t('www.privacy.header.effectiveDate', {}, 'Effective Date:')} {new Date().toDateString()}
							</p>
						</header>

						{sections.map((section) => (
							<section key={section.id} id={section.id} className="scroll-mt-32 pl-6 border-l-2 border-[color-mix(in_srgb,var(--accent)_20%,transparent)]">
								<h2 className="text-2xl font-semibold mb-4 text-(--text)">{section.title}</h2>
								<div className="text-(--text-muted) leading-relaxed">{section.content}</div>
							</section>
						))}
					</main>
				</div>
			</div>
		</div>
	);
}
