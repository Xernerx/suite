/** @format */
'use client';

import { ReadingProgressBar } from '@xernerx/components';
import { Bot, CheckCircle2, Database, KeyRound, Lock, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { useDictionary, useEnvironment, useSidebar } from '@xernerx/providers';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageFaqSection } from '@/components/PageFaqSection';
import { PolicySubsection, PolicyTocSidebar } from '@/components/PolicySubsection';

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
			id: 'yourapps',
			href: getEnvUrl('https://app.xernerx.com/bots/yourapps'),
			title: t('www.security.sections.bots.yourapps.title'),
			badge: t('www.security.sections.bots.yourapps.badge'),
			points: [
				t('www.security.sections.bots.yourapps.points.0'),
				t('www.security.sections.bots.yourapps.points.1'),
				t('www.security.sections.bots.yourapps.points.2'),
				t('www.security.sections.bots.yourapps.points.3'),
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
				<div className="space-y-3">
					<PolicySubsection code="2.1" id="authentication-2-1" title={t('www.security.sections.authentication.items.oauth.title')}>
						{t('www.security.sections.authentication.items.oauth.desc')}
					</PolicySubsection>
					<PolicySubsection code="2.2" id="authentication-2-2" title={t('www.security.sections.authentication.items.devices.title')}>
						{t('www.security.sections.authentication.items.devices.desc')}
					</PolicySubsection>
					<PolicySubsection code="2.3" id="authentication-2-3" title={t('www.security.sections.authentication.items.qr.title')}>
						{t('www.security.sections.authentication.items.qr.desc')}
					</PolicySubsection>
					<PolicySubsection code="2.4" id="authentication-2-4" title={t('www.security.sections.authentication.items.partitions.title')}>
						{t('www.security.sections.authentication.items.partitions.desc')}
					</PolicySubsection>
					<PolicySubsection code="2.5" id="authentication-2-5" title={t('www.security.sections.authentication.items.connections.title')}>
						{t('www.security.sections.authentication.items.connections.desc')}
					</PolicySubsection>
				</div>
			),
		},
		{
			id: 'privacy-tiers',
			title: t('www.security.sections.privacyTiers.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.security.sections.privacyTiers.intro')}</p>
					<div className="space-y-3">
						<PolicySubsection code="3.1" id="privacy-tiers-3-1" title={t('www.security.sections.privacyTiers.public.title')}>
							{t('www.security.sections.privacyTiers.public.desc')}
						</PolicySubsection>
						<PolicySubsection code="3.2" id="privacy-tiers-3-2" title={t('www.security.sections.privacyTiers.limited.title')}>
							{t('www.security.sections.privacyTiers.limited.desc')}
						</PolicySubsection>
						<PolicySubsection code="3.3" id="privacy-tiers-3-3" title={t('www.security.sections.privacyTiers.private.title')}>
							{t('www.security.sections.privacyTiers.private.desc')}
						</PolicySubsection>
					</div>
				</div>
			),
		},
		{
			id: 'bots',
			title: t('www.security.sections.bots.title'),
			content: (
				<div className="space-y-6">
					<p>{t('www.security.sections.bots.intro')}</p>
					<div className="space-y-6">
						{botCards.map((bot, botIdx) => {
							const botCode = `4.${botIdx + 1}`;
							return (
								<div
									key={bot.id}
									id={`bots-4-${botIdx + 1}`}
									data-policy-subsection="true"
									data-subsection-code={botCode}
									data-subsection-label={bot.title}
									className="scroll-mt-32 space-y-2.5"
								>
									<h3 className="text-lg font-bold text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
										<a href={bot.href} className="hover:text-(--accent) transition-colors">
											{botCode} {bot.title}
										</a>
									</h3>
									<div className="space-y-2 pl-4 border-l border-(--border)/20">
										{bot.points.map((pt, i) => (
											<PolicySubsection key={i} code={`${botCode}.${i + 1}`}>
												{pt}
											</PolicySubsection>
										))}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			),
		},
		{
			id: 'api-and-webhooks',
			title: t('www.security.sections.apiAndWebhooks.title'),
			content: (
				<div className="space-y-3">
					<PolicySubsection code="5.1" id="api-and-webhooks-5-1" title={t('www.security.sections.apiAndWebhooks.items.tokens.title')}>
						{t('www.security.sections.apiAndWebhooks.items.tokens.desc')}
					</PolicySubsection>
					<PolicySubsection code="5.2" id="api-and-webhooks-5-2" title={t('www.security.sections.apiAndWebhooks.items.webhooks.title')}>
						{t('www.security.sections.apiAndWebhooks.items.webhooks.desc')}
					</PolicySubsection>
					<PolicySubsection code="5.3" id="api-and-webhooks-5-3" title={t('www.security.sections.apiAndWebhooks.items.websocket.title')}>
						{t('www.security.sections.apiAndWebhooks.items.websocket.desc')}
					</PolicySubsection>
				</div>
			),
		},
		{
			id: 'infrastructure',
			title: t('www.security.sections.infrastructure.title'),
			content: (
				<div className="space-y-3">
					<PolicySubsection code="6.1" id="infrastructure-6-1" title={t('www.security.sections.infrastructure.items.databases.title')}>
						{t('www.security.sections.infrastructure.items.databases.desc')}
					</PolicySubsection>
					<PolicySubsection code="6.2" id="infrastructure-6-2" title={t('www.security.sections.infrastructure.items.cdn.title')}>
						{t('www.security.sections.infrastructure.items.cdn.desc')}
					</PolicySubsection>
					<PolicySubsection code="6.3" id="infrastructure-6-3" title={t('www.security.sections.infrastructure.items.stripe.title')}>
						{t('www.security.sections.infrastructure.items.stripe.desc')}
					</PolicySubsection>
					<PolicySubsection code="6.4" id="infrastructure-6-4" title={t('www.security.sections.infrastructure.items.audit.title')}>
						{t('www.security.sections.infrastructure.items.audit.desc')}
					</PolicySubsection>
				</div>
			),
		},
		{
			id: 'data-control',
			title: t('www.security.sections.dataControl.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.security.sections.dataControl.content')}</p>
					<div className="space-y-3">
						<PolicySubsection code="7.1" id="data-control-7-1">
							{t('www.security.sections.dataControl.items.0')}
						</PolicySubsection>
						<PolicySubsection code="7.2" id="data-control-7-2">
							{t('www.security.sections.dataControl.items.1')}
						</PolicySubsection>
						<PolicySubsection code="7.3" id="data-control-7-3">
							{t('www.security.sections.dataControl.items.2')}
						</PolicySubsection>
						<PolicySubsection code="7.4" id="data-control-7-4">
							{t('www.security.sections.dataControl.items.3')}
						</PolicySubsection>
						<PolicySubsection code="7.5" id="data-control-7-5">
							{t('www.security.sections.dataControl.items.5')}
						</PolicySubsection>
						<PolicySubsection code="7.6" id="data-control-7-6">
							{t('www.security.sections.dataControl.items.4')}
						</PolicySubsection>
					</div>
				</div>
			),
		},
		{
			id: 'licensing',
			title: t('www.security.sections.licensing.title'),
			content: (
				<div className="space-y-4">
					<p>{t('www.security.sections.licensing.intro')}</p>
					<div className="space-y-3">
						<PolicySubsection code="8.1" id="licensing-8-1" title={t('www.security.sections.licensing.proprietaryTitle')}>
							<p>{t('www.security.sections.licensing.proprietaryDesc')}</p>
							<span className="inline-flex flex-wrap items-center gap-3 mt-2">
								<Link href="/license" className="text-(--accent) hover:underline font-medium">
									{t('www.security.sections.licensing.proprietaryLink')}
								</Link>
								<span>•</span>
								<Link href="/license#plain-text-license" className="text-(--accent) hover:underline font-medium">
									{t('www.security.sections.licensing.plainTextLink')}
								</Link>
							</span>
						</PolicySubsection>
						<PolicySubsection code="8.2" id="licensing-8-2" title={t('www.security.sections.licensing.apacheTitle')}>
							<p>{t('www.security.sections.licensing.apacheDesc')}</p>
							<span className="inline-flex flex-wrap items-center gap-3 mt-2">
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
						</PolicySubsection>
					</div>
					<p className="text-sm">
						{t('www.security.sections.licensing.policiesPrefix')}
						<Link href="/terms" className="text-(--accent) hover:underline font-medium">
							{t('www.security.sections.licensing.termsLink')}
						</Link>
						{', '}
						<Link href="/privacy" className="text-(--accent) hover:underline font-medium">
							{t('www.security.sections.licensing.privacyLink')}
						</Link>
						{', '}
						<Link href="/cookies" className="text-(--accent) hover:underline font-medium">
							{t('www.security.sections.licensing.cookiesLink')}
						</Link>
						{t('www.security.sections.licensing.andText')}
						<Link href="/developer-policy" className="text-(--accent) hover:underline font-medium">
							{t('www.security.sections.licensing.developerPolicyLink')}
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
			<ReadingProgressBar />

			<div className="min-h-screen px-6 py-32">
				<div className="max-w-(--page-width) mx-auto w-full grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-16">
					{/* TOC */}
					<PolicyTocSidebar tocTitle={t('www.security.toc')} sections={sections} activeSectionId={active} onSelectSection={setActive} />

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
							<div className="text-xs font-medium tracking-wide uppercase text-(--text-muted)">{t('www.security.header.effectiveDate')} 20 November 2026</div>
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
