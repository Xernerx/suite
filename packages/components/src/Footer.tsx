/** @format */
'use client';

import { BookOpen, CircleQuestionMark, FileText, Mail, MessageCircle, Package, Shield } from 'lucide-react';
import { useDictionary, useEnvironment } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { BsGithub } from 'react-icons/bs';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function Footer() {
	const { getEnvUrl } = useEnvironment();
	const { t } = useDictionary();
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Ensures server and initial client render match identically before applying environment subdomains
	const resolveUrl = (url: string) => {
		if (!isMounted) return url;
		return getEnvUrl(url);
	};

	return (
		<motion.footer
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="relative w-full overflow-hidden bg-(--background) backdrop-blur-md"
			style={{ fontSize: 'var(--text-scale, 14px)' }}
		>
			{/* Fading top border */}
			<div className="pointer-events-none absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-(--accent) to-transparent opacity-50" />

			<div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 px-8 py-12 md:grid-cols-[1.6fr_1fr_1fr] md:px-12" style={{ gap: 'var(--ui-gap)' }}>
				{/* ---------------------------------------------------------------- */}
				{/* Brand */}
				{/* ---------------------------------------------------------------- */}
				<div className="flex flex-col justify-between text-center md:text-left" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex flex-col" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<h2 className="text-lg font-semibold text-(--text)">{t('components.footer.text1')}</h2>

						<p className="max-w-md leading-7 text-(--text-muted)">
							{t('common.footer.tagline', {}, 'Building modern software, infrastructure and developer tools with a focus on performance, simplicity and long-term maintainability.')}
						</p>
					</div>

					<div className="text-sm text-(--text-muted)">
						{t('components.footer.text2')}
						{new Date().getFullYear()}
						{t('components.footer.text3')}
					</div>
				</div>
				{/* ---------------------------------------------------------------- */}
				{/* Resources */}
				{/* ---------------------------------------------------------------- */}
				<FooterSection title={t('common.footer.sections.resources')}>
					<FooterLink href={resolveUrl('https://xernerx.com/privacy')} icon={Shield} label={t('common.footer.links.privacy')} external={false} />
					<FooterLink href={resolveUrl('https://xernerx.com/terms')} icon={FileText} label={t('common.footer.links.terms')} external={false} />
					<FooterLink href={resolveUrl('https://xernerx.com/contact')} icon={Mail} label={t('common.footer.links.contact')} external={false} />
					<FooterLink href={resolveUrl('https://xernerx.com/faq')} icon={CircleQuestionMark} label={t('common.footer.links.faq')} external={false} />
				</FooterSection>
				{/* ---------------------------------------------------------------- */}
				{/* Developer */}
				{/* ---------------------------------------------------------------- */}
				<FooterSection title={t('common.footer.sections.developer')}>
					<FooterLink href="https://github.com/xernerx" icon={BsGithub} label={t('common.footer.links.github')} />
					<FooterLink href="https://www.npmjs.com/package/xernerx" icon={Package} label={t('common.footer.links.npm')} />
					<FooterLink href={resolveUrl('https://docs.xernerx.com')} icon={BookOpen} label={t('common.footer.links.documentation')} />
					<FooterLink href="https://discord.gg/yrm8gqTuXa" icon={MessageCircle} label={t('common.footer.links.discord')} />
				</FooterSection>
			</div>
		</motion.footer>
	);
}

/* -------------------------------------------------------------------------- */
/* Sections */
/* -------------------------------------------------------------------------- */

function FooterSection({ title, children }: { title?: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col items-center md:items-start" style={{ gap: 'var(--ui-gap)' }}>
			<h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-(--text)">{title}</h3>

			<div className="flex flex-col w-full" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				{children}
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Link */
/* -------------------------------------------------------------------------- */

function FooterLink({ href, icon: Icon, label, external = true }: { href: string; icon: React.ElementType; label?: string; external?: boolean }) {
	const className =
		'group inline-flex items-center rounded-lg text-(--text-muted) transition-all duration-200 hover:translate-x-0.5 hover:bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] hover:text-(--text)';

	const linkStyle = {
		padding: 'calc(var(--ui-gap) * 0.5) var(--ui-gap)',
		gap: 'calc(var(--ui-gap) * 0.75)',
	};

	const content = (
		<>
			<Icon size={16} className="transition-colors group-hover:text-(--text) shrink-0" />
			<span className="text-sm">{label}</span>
		</>
	);

	if (external) {
		return (
			<a href={href} target="_blank" rel="noopener noreferrer" className={className} style={linkStyle}>
				{content}
			</a>
		);
	}

	return (
		<Link href={href} className={className} style={linkStyle}>
			{content}
		</Link>
	);
}
