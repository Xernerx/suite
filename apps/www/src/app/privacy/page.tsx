/** @format */

'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSidebar } from '@xernerx/providers';

type Section = {
	id: string;
	title: string;
	content: React.ReactNode;
};

export default function Page() {
	const { hide } = useSidebar();

	useEffect(() => {
		hide();
	}, []);

	const sections: Section[] = [
		{
			id: 'introduction',
			title: '1. Introduction',
			content: <p>This Privacy Policy explains how Xernerx Studios (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) collects, uses, and protects your personal data when you use our services.</p>,
		},
		{
			id: 'data-collected',
			title: '2. Information We Collect',
			content: (
				<ul className="list-disc pl-6 space-y-2">
					<li>
						<strong className="text-(--text)">Account Information:</strong> Email, username, and profile identifiers.
					</li>
					<li>
						<strong className="text-(--text)">Usage Data:</strong> Logs, system interactions, and configuration settings.
					</li>
					<li>
						<strong className="text-(--text)">Integration Data:</strong> Data provided through third-party platforms such as Discord.
					</li>
				</ul>
			),
		},
		{
			id: 'legal-basis',
			title: '3. Legal Basis for Processing',
			content: <p>We process personal data based on contractual necessity, legitimate interests, legal obligations, or user consent where applicable.</p>,
		},
		{
			id: 'usage',
			title: '4. How We Use Information',
			content: (
				<ul className="list-disc pl-6 space-y-2">
					<li>To provide and maintain services.</li>
					<li>To improve reliability and performance.</li>
					<li>To provide support and communicate updates.</li>
					<li>To ensure compliance with legal obligations.</li>
				</ul>
			),
		},
		{
			id: 'sharing',
			title: '5. Data Sharing',
			content: (
				<ul className="list-disc pl-6 space-y-2">
					<li>Hosting and infrastructure providers.</li>
					<li>Authorized third-party integrations.</li>
					<li>Legal authorities when required by law.</li>
				</ul>
			),
		},
		{
			id: 'retention',
			title: '6. Data Retention',
			content: <p>We retain data only as long as necessary to fulfill the purposes outlined in this Policy, unless longer retention is required by law.</p>,
		},
		{
			id: 'security',
			title: '7. Data Security',
			content: <p>We implement technical and organizational security measures to protect data. However, no system is absolutely secure.</p>,
		},
		{
			id: 'rights',
			title: '8. Your Rights',
			content: (
				<ul className="list-disc pl-6 space-y-2">
					<li>Right to access your data.</li>
					<li>Right to correction or deletion.</li>
					<li>Right to restrict or object to processing.</li>
					<li>Right to data portability.</li>
				</ul>
			),
		},
		{
			id: 'cookies',
			title: '9. Cookies & Tracking',
			content: <p>We may use cookies or similar technologies to improve service performance and analytics.</p>,
		},
		{
			id: 'international',
			title: '10. International Transfers',
			content: <p>If data is transferred outside your jurisdiction, appropriate safeguards are implemented to ensure legal compliance.</p>,
		},
		{
			id: 'changes',
			title: '11. Changes to This Policy',
			content: <p>We may update this Privacy Policy periodically. Continued use of services indicates acceptance of the revised version.</p>,
		},
		{
			id: 'contact',
			title: '12. Contact',
			content: (
				<p>
					For privacy-related inquiries contact <span className="text-(--accent) font-medium">legal@xernerx.com</span>.
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
						<h3 className="text-sm uppercase tracking-wide text-(--text-muted) mb-6">Contents</h3>

						<nav className="space-y-4 text-sm">
							{sections.map((section) => (
								<a key={section.id} href={`#${section.id}`} className={`block transition ${active === section.id ? 'text-(--accent) font-medium' : 'text-(--text-muted) hover:text-(--text)'}`}>
									{section.title}
								</a>
							))}
						</nav>
					</aside>

					{/* MAIN */}
					<main className="space-y-20">
						<header className="text-center mb-16">
							<h1 className="text-4xl font-semibold mb-4 text-(--text)">Privacy Policy</h1>
							<p className="text-sm text-(--text-muted)">Effective Date: {new Date().toDateString()}</p>
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
