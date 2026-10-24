/** @format */
// Force recompile
'use client';

import {
	Activity,
	BookOpen,
	Briefcase,
	Bug,
	CircleQuestionMark,
	Cookie,
	Download,
	FileText,
	History,
	LifeBuoy,
	Link as LinkIcon,
	Mail,
	Map,
	MessageCircle,
	MessageSquare,
	Package,
	Shield,
	SlidersHorizontal,
} from 'lucide-react';
import { useCookie, useDictionary, useEnvironment } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { BsFacebook, BsGithub, BsLinkedin, BsReddit, BsTwitterX, BsWhatsapp } from 'react-icons/bs';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function Footer() {
	const { getEnvUrl, isReady } = useEnvironment();
	const { openPrompt } = useCookie();
	const { t } = useDictionary();
	const resolveUrl = (url: string) => getEnvUrl(url);

	const [systemOnline, setSystemOnline] = useState<boolean | null>(null);

	useEffect(() => {
		if (!isReady) return;
		fetch('/api/version', { cache: 'no-store' })
			.then((res) => setSystemOnline(res.ok))
			.catch(() => setSystemOnline(false));
	}, [isReady]);

	const shareLinks = [
		{
			href: 'https://twitter.com/intent/tweet?url=https%3A%2F%2Fwww.xernerx.com&text=Xernerx%20Studios%20%E2%80%94%20Modern%20Software%2C%20Bots%20%26%20Developer%20Tools',
			label: t('common.footer.share.twitter'),
			icon: BsTwitterX,
		},
		{
			href: 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.xernerx.com',
			label: t('common.footer.share.facebook'),
			icon: BsFacebook,
		},
		{
			href: 'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fwww.xernerx.com',
			label: t('common.footer.share.linkedin'),
			icon: BsLinkedin,
		},
		{
			href: 'https://www.reddit.com/submit?url=https%3A%2F%2Fwww.xernerx.com&title=Xernerx%20Studios',
			label: t('common.footer.share.reddit'),
			icon: BsReddit,
		},
		{
			href: 'https://api.whatsapp.com/send?text=https%3A%2F%2Fwww.xernerx.com',
			label: t('common.footer.share.whatsapp'),
			icon: BsWhatsapp,
		},
	];

	return (
		<motion.footer
			initial={{ opacity: 1, y: 0 }}
			animate={{ opacity: 1, y: 0 }}
			className="relative z-0 w-full overflow-hidden bg-(--background) backdrop-blur-md"
			style={{ fontSize: 'var(--text-scale, 14px)' }}
		>
			{/* Fading top border */}
			<div className="pointer-events-none absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-(--accent) to-transparent opacity-50" />

			<div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 px-8 py-12 md:grid-cols-[1.6fr_1fr_1fr_1fr] md:px-12" style={{ gap: 'var(--ui-gap)' }}>
				{/* ---------------------------------------------------------------- */}
				{/* Brand */}
				{/* ---------------------------------------------------------------- */}
				<div className="flex flex-col justify-between text-center md:text-left" style={{ gap: 'var(--ui-gap)' }}>
					<div className="flex flex-col items-center md:items-start" style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
						<div className="text-lg font-semibold text-(--text)">{t('components.footer.text1')}</div>

						<p className="max-w-md leading-7 text-(--text-muted)">{t('common.footer.tagline')}</p>

						<div className="mt-1 inline-flex items-center gap-2 rounded-full border border-(--border)/10 bg-(--foreground)/30 backdrop-blur-md shadow-xs px-3 py-1 text-xs font-medium text-(--text-muted)">
							<span
								className={`h-2 w-2 rounded-full ${
									systemOnline === null ? 'bg-(--text-muted) animate-pulse' : systemOnline ? 'bg-(--accent-green) shadow-[0_0_8px_rgba(52,211,153,0.7)]' : 'bg-(--accent-orange)'
								}`}
							/>
							<span>{systemOnline === false ? t('common.footer.links.statusDegraded') : t('common.footer.links.statusOperational')}</span>
						</div>

						<div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-2" aria-label={t('common.footer.share.label')}>
							<span className="text-xs font-semibold uppercase tracking-wider text-(--text-muted) mr-1">{t('common.footer.share.label')}:</span>
							{shareLinks.map((item) => {
								const ShareIcon = item.icon;
								return (
									<a
										key={item.href}
										href={item.href}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={item.label}
										title={item.label}
										className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--border)/10 bg-(--foreground)/30 text-(--text-muted) backdrop-blur-md transition-all hover:border-(--accent)/30 hover:bg-(--accent)/10 hover:text-(--accent)"
									>
										<ShareIcon size={13} />
										<span className="sr-only">{item.label}</span>
									</a>
								);
							})}
						</div>
					</div>

					<div className="text-sm text-(--text-muted)">
						{t('components.footer.text2')} {new Date().getFullYear()} {t('components.footer.text3')}
					</div>
				</div>
				{/* ---------------------------------------------------------------- */}
				{/* Resources */}
				{/* ---------------------------------------------------------------- */}
				<FooterSection title={t('common.footer.sections.resources')}>
					<FooterLink href={resolveUrl('https://www.xernerx.com/download')} icon={Download} label={t('common.footer.links.download')} external={false} />
					<FooterLink href={resolveUrl('https://www.xernerx.com/invites')} icon={LinkIcon} label={t('common.footer.links.invites')} external={false} />
					<FooterLink href={resolveUrl('https://www.xernerx.com/privacy')} icon={Shield} label={t('common.footer.links.privacy')} external={false} />
					<FooterLink href={resolveUrl('https://www.xernerx.com/terms')} icon={FileText} label={t('common.footer.links.terms')} external={false} />
					<FooterLink href={resolveUrl('https://www.xernerx.com/cookies')} icon={Cookie} label={t('common.footer.links.cookies')} external={false} />
					<FooterLink onClick={openPrompt} icon={SlidersHorizontal} label={t('common.footer.links.cookiePreferences')} />
					<FooterLink href={resolveUrl('https://www.xernerx.com/applications')} icon={Briefcase} label={t('common.footer.links.careers')} external={false} />
				</FooterSection>
				{/* ---------------------------------------------------------------- */}
				{/* Support */}
				{/* ---------------------------------------------------------------- */}
				<FooterSection title={t('common.footer.sections.support')}>
					<FooterLink href={resolveUrl('https://info.xernerx.com')} icon={LifeBuoy} label={t('common.footer.links.help')} external={false} />
					<FooterLink href={resolveUrl('https://info.xernerx.com/status')} icon={Activity} label={t('common.footer.links.status')} external={false} />
					<FooterLink href={resolveUrl('https://info.xernerx.com/issues')} icon={Bug} label={t('common.footer.links.issues')} external={false} />
					<FooterLink href={resolveUrl('https://info.xernerx.com/suggestions')} icon={MessageSquare} label={t('common.footer.links.suggestions')} external={false} />
					<FooterLink href={resolveUrl('https://info.xernerx.com/roadmap')} icon={Map} label={t('common.footer.links.roadmap')} external={false} />
					<FooterLink href={resolveUrl('https://info.xernerx.com/changelog')} icon={History} label={t('common.footer.links.changelog')} external={false} />
					<FooterLink href={resolveUrl('https://info.xernerx.com/faq')} icon={CircleQuestionMark} label={t('common.footer.links.faq')} external={false} />
					<FooterLink href={resolveUrl('https://www.xernerx.com/contact')} icon={Mail} label={t('common.footer.links.contact')} external={false} />
				</FooterSection>
				{/* ---------------------------------------------------------------- */}
				{/* Developer */}
				{/* ---------------------------------------------------------------- */}
				<FooterSection title={t('common.footer.sections.developer')}>
					<FooterLink href="https://github.com/xernerx" icon={BsGithub} label={t('common.footer.links.github')} />
					<FooterLink href="https://www.npmjs.com/package/xernerx" icon={Package} label={t('common.footer.links.npm')} />
					<FooterLink href={resolveUrl('https://docs.xernerx.com')} icon={BookOpen} label={t('common.footer.links.documentation')} external={false} />
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
			<div className="text-sm font-semibold uppercase tracking-[0.2em] text-(--text)">{title}</div>

			<div className="flex flex-col w-full" style={{ gap: 'calc(var(--ui-gap) * 0.25)' }}>
				{children}
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Link */
/* -------------------------------------------------------------------------- */

function FooterLink({ href, onClick, icon: Icon, label, external = true }: { href?: string; onClick?: () => void; icon: React.ElementType; label?: string; external?: boolean }) {
	const className =
		'group inline-flex items-center rounded-lg text-(--text-muted) transition-all duration-200 hover:translate-x-0.5 hover:bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] hover:text-(--text) cursor-pointer text-left';

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

	if (onClick) {
		return (
			<button type="button" onClick={onClick} className={className} style={linkStyle}>
				{content}
			</button>
		);
	}

	if (external && href) {
		return (
			<a suppressHydrationWarning href={href} target="_blank" rel="noopener noreferrer" className={className} style={linkStyle}>
				{content}
			</a>
		);
	}

	return (
		<Link suppressHydrationWarning href={href || '#'} className={className} style={linkStyle}>
			{content}
		</Link>
	);
}
