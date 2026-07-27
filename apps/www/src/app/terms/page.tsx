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
			content: (
				<p>
					These Terms of Service ({'"'}Terms{'"'}) govern your access to and use of services provided by Xernerx Studios ({'"'}we{'"'}, {'"'}our{'"'}, or {'"'}us{'"'}). By accessing or using our
					services, you agree to be legally bound by these Terms.
				</p>
			),
		},
		{
			id: 'eligibility',
			title: '2. Eligibility',
			content: <p>You must meet the minimum legal age in your jurisdiction to use our services. By using our services, you represent that you satisfy this requirement.</p>,
		},
		{
			id: 'acceptable-use',
			title: '3. Acceptable Use',
			content: (
				<ul className="list-disc pl-6 space-y-2">
					<li>Engage in unlawful activities.</li>
					<li>Access data without explicit authorization.</li>
					<li>Attempt to disrupt service infrastructure.</li>
					<li>Reverse-engineer or exploit vulnerabilities.</li>
				</ul>
			),
		},
		{
			id: 'accounts',
			title: '4. User Accounts',
			content: (
				<p>
					You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. We are not liable for losses arising from unauthorized access.
				</p>
			),
		},
		{
			id: 'data',
			title: '5. User Data',
			content: (
				<p>
					By using our services, you agree to our data handling practices as described in our Privacy Policy. Data may include account information, usage metrics, and integration-based data where
					applicable.
				</p>
			),
		},
		{
			id: 'availability',
			title: '6. Service Availability',
			content: <p>We strive for reliable uptime but do not guarantee uninterrupted service. Services may be modified, suspended, or discontinued at any time.</p>,
		},
		{
			id: 'third-party',
			title: '7. Third-Party Services',
			content: <p>Our services may integrate with third-party platforms such as Discord. We are not responsible for third-party policies, availability, or data practices.</p>,
		},
		{
			id: 'intellectual-property',
			title: '8. Intellectual Property',
			content: <p>All software, code, branding, and materials remain the exclusive property of Xernerx Studios or its licensors. Unauthorized reproduction or distribution is prohibited.</p>,
		},
		{
			id: 'warranty',
			title: '9. Disclaimer of Warranties',
			content: <p>Services are provided “as is” without warranties of any kind, whether express or implied.</p>,
		},
		{
			id: 'liability',
			title: '10. Limitation of Liability',
			content: <p>To the fullest extent permitted by law, Xernerx Studios shall not be liable for indirect, incidental, or consequential damages arising from use of our services.</p>,
		},
		{
			id: 'indemnification',
			title: '11. Indemnification',
			content: <p>You agree to indemnify and hold harmless Xernerx Studios from claims or liabilities arising from misuse of our services or violation of these Terms.</p>,
		},
		{
			id: 'governing-law',
			title: '12. Governing Law',
			content: <p>These Terms shall be governed in accordance with applicable laws within your jurisdiction.</p>,
		},
		{
			id: 'changes',
			title: '13. Changes to Terms',
			content: <p>We may update these Terms from time to time. Continued use of our services after updates constitutes acceptance.</p>,
		},
		{
			id: 'contact',
			title: '14. Contact',
			content: (
				<p>
					For legal inquiries contact <span className="text-(--accent) font-medium">legal@xernerx.com</span>.
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

					<main className="space-y-20">
						<header className="text-center mb-16">
							<h1 className="text-4xl font-semibold mb-4 text-(--text)">Terms of Service</h1>
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
