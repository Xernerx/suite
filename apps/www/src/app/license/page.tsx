/** @format */
'use client';

import { Check, Copy, Download, Scale } from 'lucide-react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useDictionary, useSidebar, useToast } from '@xernerx/providers';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@xernerx/ui';
import { PageFaqSection } from '@/components/PageFaqSection';

const PLAIN_TEXT_LICENSE = `XERNERX STUDIOS PROPRIETARY & SAAS LICENSE
Version 1.0 — November 2026

Copyright (c) 2022-2026 Xernerx Studios. All rights reserved.

This software, source code, documentation, visual design system, and associated
services (collectively, the "Software"), including the Xernerx Suite, Virtue,
Metamorphosis, Zodiac, To-Do List Bot, Xernerx App, Xernerx Bot, Xernerx Blog,
Xernerx Haste, Xernerx CDN, and the Xernerx Desktop and Mobile Clients, are the
proprietary property of Xernerx Studios ("Licensor").

1. GRANT OF LIMITED SAAS & CLIENT ACCESS
   Subject to your continuous compliance with this License and the Xernerx
   Studios Terms of Service (https://xernerx.com/terms), Licensor grants you a
   limited, non-exclusive, non-transferable, non-sublicensable, revocable
   license to access and use the Software solely through the official hosted
   web applications (*.xernerx.com), official Discord bot instances, public
   REST/WebSocket APIs, and official Desktop Client binaries distributed by
   Xernerx Studios.

   Authorized Xernerx Studios staff members, moderators, and translators are
   granted limited permission to clone, inspect, and execute this repository
   solely for internal development, testing, and localization on behalf of
   Xernerx Studios.

2. STRICT PROHIBITIONS & RESTRICTIONS
   Except as expressly permitted in writing by Xernerx Studios, you may NOT:
   (a) Copy, reproduce, publish, distribute, sublicense, sell, lease, or
       transfer any part of the source code, compiled binaries, database
       schemas, or UI components of the Software to any third party.
   (b) Host, deploy, or operate a public, private, or commercial instance,
       clone, fork, or derivative service based on the Software (including
       competing Discord bots, dashboards, pastebins, or API gateways).
   (c) Reverse-engineer, decompile, disassemble, scrape, or attempt to extract
       the source code, underlying algorithms, or private API endpoints of the
       Software, except to the minimum extent expressly required by applicable
       law.
   (d) Remove, alter, bypass, or obscure any copyright notices, watermarks,
       telemetry hooks, authentication checks, rate limits, or license controls.

3. TRADEMARKS, BRANDING & VISUAL ASSETS
   This License grants no rights whatsoever to use the trade names, trademarks,
   service marks, logos, mascot artwork, domain names, or branding assets of
   Xernerx Studios—including "Xernerx", "Xernerx Studios", "Xernerx Suite",
   "Virtue", "Metamorphosis", "Zodiac", "To-Do List Bot", and all static media
   in \`packages/public\`. All goodwill generated from the use of Xernerx Studios
   marks inures exclusively to Xernerx Studios.

4. CONTRIBUTOR LICENSE GRANT (CLA)
   By submitting any pull request, code, localization dictionary translation,
   documentation, or other contribution to this repository, you hereby grant
   Xernerx Studios a perpetual, worldwide, non-exclusive, royalty-free,
   irrevocable, transferable license (with the right to sublicense under any
   proprietary or open-source terms) to use, reproduce, modify, distribute,
   and commercialize your contribution as part of the Software.

5. OPEN-SOURCE SDK CARVE-OUT
   Standalone developer SDKs, starter examples, and package documentation
   separately published by Xernerx Studios—specifically \`@xernerx/framework\`,
   \`@xernerx/stats\`, \`@xernerx/commands\`, \`@xernerx/websocket\`,
   \`@xernerx/hooks\`, \`@xernerx/terminal\`, \`@xernerx/extension-builder\`,
   \`xernerx\`, \`Xernerx/examples\`, and \`Xernerx/docs\`—are licensed separately
   under the Apache License, Version 2.0, and are not governed by the
   proprietary restrictions of this License.

6. TERMINATION
   This License is effective until terminated. Your rights under this License
   will terminate automatically and immediately without notice if you breach
   any term hereof. Upon termination, you must immediately cease all use of
   the Software and destroy all local copies of the source code or binaries in
   your possession.

7. DISCLAIMER OF WARRANTIES
   THE SOFTWARE AND SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT
   WARRANTY OF ANY KIND, EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT
   LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
   PURPOSE, TITLE, AND NON-INFRINGEMENT.

8. LIMITATION OF LIABILITY
   IN NO EVENT SHALL XERNERX STUDIOS, ITS FOUNDERS, CONTRIBUTORS, OR AFFILIATES
   BE LIABLE FOR ANY CLAIM, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
   CONSEQUENTIAL DAMAGES (INCLUDING LOSS OF DATA, REVENUE, PROFITS, OR BUSINESS
   INTERRUPTION) ARISING OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THIS
   LICENSE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.`;

type Section = {
	id: string;
	title: string;
	content: React.ReactNode;
};

export default function LicensePage() {
	const { t } = useDictionary();
	const { hide } = useSidebar();
	const { toast } = useToast();
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		hide();
	}, [hide]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(PLAIN_TEXT_LICENSE);
			setCopied(true);
			toast({ type: 'success', title: t('www.license.actions.copied') });
			setTimeout(() => setCopied(false), 2000);
		} catch {}
	};

	const handleDownload = () => {
		const blob = new Blob([PLAIN_TEXT_LICENSE + '\n'], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'LICENSE';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const rawSections: Section[] = [
		{
			id: 'overview',
			title: t('www.license.sections.overview.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.license.sections.overview.content')}</p>
					<ul className="list-disc pl-6 space-y-4">
						<li>
							<strong className="text-(--text)">{t('www.license.sections.overview.proprietaryTitle')}</strong> {t('www.license.sections.overview.proprietaryDesc')}
						</li>
						<li>
							<strong className="text-(--text)">{t('www.license.sections.overview.openSourceTitle')}</strong> {t('www.license.sections.overview.openSourceDesc')}
						</li>
					</ul>
				</div>
			),
		},
		{
			id: 'plain-text-license',
			title: t('www.license.sections.plainText.title'),
			content: (
				<div className="space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<p>{t('www.license.sections.plainText.subtitle')}</p>
						<div className="flex flex-wrap items-center gap-2">
							<Button variant="secondary" size="sm" onClick={handleCopy}>
								{copied ? <Check size={14} className="text-(--accent-green)" /> : <Copy size={14} className="text-(--accent)" />}
								<span>{copied ? t('www.license.actions.copied') : t('www.license.actions.copy')}</span>
							</Button>
							<Button variant="secondary" size="sm" onClick={handleDownload}>
								<Download size={14} className="text-(--accent)" />
								<span>{t('www.license.actions.download')}</span>
							</Button>
						</div>
					</div>
					<pre className="rounded-2xl bg-(--background)/60 border border-(--border)/10 p-6 font-mono text-xs sm:text-sm text-(--text) overflow-x-auto whitespace-pre-wrap leading-relaxed select-all shadow-inner">
						{PLAIN_TEXT_LICENSE}
					</pre>
				</div>
			),
		},
		{
			id: 'open-source-sdks',
			title: t('www.license.sections.openSource.title'),
			content: <p>{t('www.license.sections.openSource.content')}</p>,
		},
		{
			id: 'contact',
			title: t('www.license.sections.contact.title'),
			content: (
				<p>
					{t('www.license.sections.contact.prefix')} <span className="text-(--accent) font-medium">{t('www.license.description')}</span>.
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
					<aside className="hidden lg:block sticky top-32 self-start">
						<div className="text-sm uppercase tracking-wide text-(--text-muted) mb-6">{t('www.license.toc')}</div>
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

					<div className="space-y-16">
						<header className="text-center mb-16 bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 rounded-3xl p-10 shadow-sm">
							<div className="inline-flex items-center gap-2 rounded-full border border-(--accent)/30 bg-(--accent)/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-(--accent) mb-4">
								<Scale size={14} />
								<span>{t('www.license.header.badge')}</span>
							</div>
							<h1
								className="text-5xl font-extrabold mb-4 text-(--text) drop-shadow-sm"
								style={{
									fontFamily: 'var(--font-fredoka)',
								}}
							>
								{t('www.license.header.title')}
							</h1>
							<p className="text-sm text-(--text-muted) max-w-2xl mx-auto mb-4">{t('www.license.header.subtitle')}</p>
							<div className="text-sm font-medium tracking-wide uppercase text-(--text-muted)">{t('www.license.header.effectiveDate')}</div>
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

						<PageFaqSection
							subtitle={t('www.license.faq.subtitle')}
							items={[
								{ question: t('www.license.faq.q1'), answer: t('www.license.faq.a1') },
								{ question: t('www.license.faq.q2'), answer: t('www.license.faq.a2') },
								{ question: t('www.license.faq.q3'), answer: t('www.license.faq.a3') },
							]}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
