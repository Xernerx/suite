/** @format */
'use client';

import {
	ArrowUpRight,
	BookOpen,
	Briefcase,
	Bug,
	CircleQuestionMark,
	Code2,
	Download,
	History,
	LifeBuoy,
	Link as LinkIcon,
	Mail,
	Map,
	MessageCircle,
	MessageSquare,
	Newspaper,
	Package,
	SlidersHorizontal,
	Terminal,
} from 'lucide-react';
import { useCookie, useDictionary, useEnvironment } from '@xernerx/providers';
import { Tooltip } from '@xernerx/ui';
import { useEffect, useId, useState } from 'react';

import { BsBluesky, BsDiscord, BsFacebook, BsGithub, BsInstagram, BsLinkedin, BsReddit, BsTwitterX, BsWhatsapp } from 'react-icons/bs';
import Link from 'next/link';

export function Footer() {
	const { getEnvUrl, isReady } = useEnvironment();
	const { openPrompt } = useCookie();
	const { t } = useDictionary();
	const resolveUrl = (url: string) => getEnvUrl(url);

	const followLabelId = useId();
	const shareLabelId = useId();

	const [systemOnline, setSystemOnline] = useState<boolean | null>(null);

	useEffect(() => {
		if (!isReady) return;
		fetch('/api/version', { cache: 'no-store' })
			.then((res) => setSystemOnline(res.ok))
			.catch(() => setSystemOnline(false));
	}, [isReady]);

	const socialLinks = [
		{
			href: 'https://x.com/XernerxStudios',
			label: t('common.footer.follow.x'),
			icon: BsTwitterX,
		},
		{
			href: 'https://bsky.app/profile/xernerx.com',
			label: t('common.footer.follow.bluesky'),
			icon: BsBluesky,
		},
		{
			href: 'https://www.instagram.com/xernerxstudios/',
			label: t('common.footer.follow.instagram'),
			icon: BsInstagram,
		},
		{
			href: 'https://discord.gg/yrm8gqTuXa',
			label: t('common.footer.follow.discord'),
			icon: BsDiscord,
		},
		{
			href: 'https://github.com/xernerx',
			label: t('common.footer.follow.github'),
			icon: BsGithub,
		},
	];

	const shareLinks = [
		{
			href: 'https://twitter.com/intent/tweet?url=https%3A%2F%2Fwww.xernerx.com&text=Xernerx%20Studios%20%E2%80%94%20Modern%20Software%2C%20Bots%20%26%20Developer%20Tools&via=XernerxStudios',
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

	const legalLinks = [
		{ href: resolveUrl('https://www.xernerx.com/security'), label: t('common.footer.links.security') },
		{ href: resolveUrl('https://www.xernerx.com/privacy'), label: t('common.footer.links.privacy') },
		{ href: resolveUrl('https://www.xernerx.com/terms'), label: t('common.footer.links.terms') },
		{ href: resolveUrl('https://www.xernerx.com/cookies'), label: t('common.footer.links.cookies') },
		{ href: resolveUrl('https://www.xernerx.com/license'), label: t('common.footer.links.license') },
	];

	return (
		<footer
			className="relative z-0 w-full overflow-x-clip bg-(--background) backdrop-blur-md"
			style={{
				fontSize: 'var(--text-scale, 14px)',
				paddingBottom: 'env(safe-area-inset-bottom, 0px)',
				paddingLeft: 'env(safe-area-inset-left, 0px)',
				paddingRight: 'env(safe-area-inset-right, 0px)',
			}}
		>
			{/* Fading accent top border */}
			<div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-(--accent) to-transparent opacity-50" />

			<div
				className="mx-auto w-full max-w-(--page-width) px-6 md:px-10"
				style={{
					paddingBlockStart: 'calc(var(--ui-gap) * 1.75)',
					paddingBlockEnd: 'calc(var(--ui-gap) * 1.25)',
				}}
			>
				{/* ---------------------------------------------------------------- */}
				{/* Primary Grid: Brand + 3 Balanced Navigation Columns              */}
				{/* ---------------------------------------------------------------- */}
				<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,2.65fr)]" style={{ gap: 'calc(var(--ui-gap) * 1.75)' }}>
					{/* Brand, Live Status & Follow */}
					<div className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left" style={{ gap: 'calc(var(--ui-gap) * 0.75)' }}>
						<div className="text-lg font-bold tracking-tight text-(--text)" style={{ fontFamily: 'var(--font-fredoka)' }}>
							{t('components.footer.text1')}
						</div>

						<p className="max-w-sm text-sm leading-relaxed text-(--text-muted)">{t('common.footer.tagline')}</p>

						<Tooltip content={t('common.footer.links.status')} position="top">
							<Link
								suppressHydrationWarning
								href={resolveUrl('https://info.xernerx.com/status')}
								className="group inline-flex min-h-8 items-center gap-2 rounded-full border border-(--border)/10 bg-(--foreground)/30 px-3 py-1 text-xs font-medium text-(--text-muted) shadow-xs backdrop-blur-md transition-all hover:border-(--accent)/30 hover:bg-(--accent)/10 hover:text-(--text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
							>
								<span
									aria-hidden="true"
									className={`h-2 w-2 shrink-0 rounded-full ${
										systemOnline === null ? 'animate-pulse bg-(--text-muted)' : systemOnline ? 'bg-(--accent-green) shadow-[0_0_8px_rgba(52,211,153,0.7)]' : 'bg-(--accent-orange)'
									}`}
								/>
								<span>{systemOnline === false ? t('common.footer.links.statusDegraded') : t('common.footer.links.statusOperational')}</span>
								<ArrowUpRight
									size={13}
									aria-hidden="true"
									className="shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-(--accent) group-hover:opacity-100"
								/>
							</Link>
						</Tooltip>

						<div className="flex flex-wrap items-center justify-center gap-2 pt-1 lg:justify-start">
							<span id={followLabelId} className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted)">
								{t('common.footer.follow.label')}
							</span>
							<ul role="list" aria-labelledby={followLabelId} className="flex flex-wrap items-center justify-center gap-1.5 lg:justify-start">
								{socialLinks.map((item) => {
									const SocialIcon = item.icon;
									return (
										<li key={item.href}>
											<Tooltip content={item.label} position="top">
												<Link
													href={item.href}
													target="_blank"
													rel="me noopener noreferrer"
													aria-label={item.label}
													className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full border border-(--border)/10 bg-(--foreground)/30 text-(--text-muted) backdrop-blur-md transition-all hover:border-(--accent)/30 hover:bg-(--accent)/10 hover:text-(--accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
												>
													<SocialIcon size={13} aria-hidden="true" />
												</Link>
											</Tooltip>
										</li>
									);
								})}
							</ul>
						</div>
					</div>

					{/* Navigation Columns */}
					<div className="grid min-w-0 grid-cols-2 sm:grid-cols-3" style={{ gap: 'calc(var(--ui-gap) * 1.25)' }}>
						{/* Platform */}
						<FooterSection title={t('common.footer.sections.platform')}>
							<FooterLink href={resolveUrl('https://www.xernerx.com/download')} icon={Download} label={t('common.footer.links.download')} external={false} />
							<FooterLink href={resolveUrl('https://www.xernerx.com/invites')} icon={LinkIcon} label={t('common.footer.links.invites')} external={false} />
							<FooterLink href={resolveUrl('https://blog.xernerx.com')} icon={Newspaper} label={t('common.footer.links.blog')} external={false} />
							<FooterLink href={resolveUrl('https://www.xernerx.com/applications')} icon={Briefcase} label={t('common.footer.links.careers')} external={false} />
							<FooterLink href={resolveUrl('https://www.xernerx.com/contact')} icon={Mail} label={t('common.footer.links.contact')} external={false} />
						</FooterSection>

						{/* Support */}
						<FooterSection title={t('common.footer.sections.support')}>
							<FooterLink href={resolveUrl('https://info.xernerx.com')} icon={LifeBuoy} label={t('common.footer.links.help')} external={false} />
							<FooterLink href={resolveUrl('https://info.xernerx.com/faq')} icon={CircleQuestionMark} label={t('common.footer.links.faq')} external={false} />
							<FooterLink href={resolveUrl('https://info.xernerx.com/roadmap')} icon={Map} label={t('common.footer.links.roadmap')} external={false} />
							<FooterLink href={resolveUrl('https://info.xernerx.com/changelog')} icon={History} label={t('common.footer.links.changelog')} external={false} />
							<FooterLink href={resolveUrl('https://info.xernerx.com/suggestions')} icon={MessageSquare} label={t('common.footer.links.suggestions')} external={false} />
							<FooterLink href={resolveUrl('https://info.xernerx.com/issues')} icon={Bug} label={t('common.footer.links.issues')} external={false} />
						</FooterSection>

						{/* Developer */}
						<FooterSection title={t('common.footer.sections.developer')} className="col-span-2 sm:col-span-1" listClassName="grid grid-cols-2 sm:flex sm:flex-col">
							<FooterLink href={resolveUrl('https://docs.xernerx.com')} icon={BookOpen} label={t('common.footer.links.documentation')} external={false} />
							<FooterLink href={resolveUrl('https://portal.xernerx.com')} icon={Code2} label={t('common.footer.links.portal')} external={false} />
							<FooterLink href={resolveUrl('https://www.xernerx.com/developer-policy')} icon={Terminal} label={t('common.footer.links.developerPolicy')} external={false} />
							<FooterLink href="https://github.com/xernerx" icon={BsGithub} label={t('common.footer.links.github')} />
							<FooterLink href="https://www.npmjs.com/package/xernerx" icon={Package} label={t('common.footer.links.npm')} />
							<FooterLink href="https://discord.gg/yrm8gqTuXa" icon={MessageCircle} label={t('common.footer.links.discord')} />
						</FooterSection>
					</div>
				</div>

				{/* ---------------------------------------------------------------- */}
				{/* Compact Bottom Bar: Copyright · Legal & Trust · Share            */}
				{/* ---------------------------------------------------------------- */}
				<div
					className="flex flex-col items-center justify-between gap-3 border-t border-(--border)/10 xl:flex-row"
					style={{
						marginBlockStart: 'calc(var(--ui-gap) * 1.25)',
						paddingBlockStart: 'var(--ui-gap)',
					}}
				>
					<p className="shrink-0 text-xs text-(--text-muted)">
						{t('components.footer.text2')} {new Date().getFullYear()} {t('components.footer.text3')}
					</p>

					<nav aria-label={t('common.footer.sections.legal')} className="min-w-0">
						<ul className="flex flex-wrap-balance items-center justify-center gap-x-1 gap-y-1">
							{legalLinks.map((item) => (
								<li key={item.href}>
									<Link
										suppressHydrationWarning
										href={item.href}
										className="inline-flex min-h-7 items-center rounded-full px-2.5 py-1 text-xs text-(--text-muted) transition-colors hover:bg-(--accent)/10 hover:text-(--text) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent) whitespace-nowrap"
									>
										{item.label}
									</Link>
								</li>
							))}
							<li>
								<button
									type="button"
									onClick={openPrompt}
									className="inline-flex min-h-7 cursor-pointer items-center gap-1.5 rounded-full border border-(--border)/10 bg-(--foreground)/30 px-2.5 py-1 text-xs text-(--text-muted) transition-colors hover:border-(--accent)/30 hover:bg-(--accent)/10 hover:text-(--text) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent) whitespace-nowrap"
								>
									<SlidersHorizontal size={12} aria-hidden="true" className="shrink-0" />
									<span>{t('common.footer.links.cookiePreferences')}</span>
								</button>
							</li>
						</ul>
					</nav>

					<div className="flex shrink-0 items-center gap-1.5">
						<span id={shareLabelId} className="mr-0.5 text-[11px] font-semibold uppercase tracking-wider text-(--text-muted)">
							{t('common.footer.share.label')}
						</span>
						<ul role="list" aria-labelledby={shareLabelId} className="flex items-center gap-1.5">
							{shareLinks.map((item) => {
								const ShareIcon = item.icon;
								return (
									<li key={item.href}>
										<Tooltip content={item.label} position="top">
											<a
												href={item.href}
												target="_blank"
												rel="noopener noreferrer"
												aria-label={item.label}
												className="inline-flex min-h-7 min-w-7 items-center justify-center rounded-full border border-(--border)/10 bg-(--foreground)/30 text-(--text-muted) backdrop-blur-md transition-all hover:border-(--accent)/30 hover:bg-(--accent)/10 hover:text-(--accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
											>
												<ShareIcon size={12} aria-hidden="true" />
											</a>
										</Tooltip>
									</li>
								);
							})}
						</ul>
					</div>
				</div>
			</div>
		</footer>
	);
}

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

function FooterSection({ title, children, className = '', listClassName = 'flex flex-col' }: { title?: string; children: React.ReactNode; className?: string; listClassName?: string }) {
	const headingId = useId();

	return (
		<nav aria-labelledby={headingId} className={`flex min-w-0 flex-col items-start ${className}`} style={{ gap: 'calc(var(--ui-gap) * 0.5)' }}>
			<h2 id={headingId} className="px-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-(--text)">
				{title}
			</h2>

			<ul className={`w-full gap-0.5 ${listClassName}`}>{children}</ul>
		</nav>
	);
}

/* -------------------------------------------------------------------------- */
/* Link                                                                       */
/* -------------------------------------------------------------------------- */

function FooterLink({ href, onClick, icon: Icon, label, external = true }: { href?: string; onClick?: () => void; icon: React.ElementType; label?: string; external?: boolean }) {
	const className =
		'group flex min-h-8 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-sm text-(--text-muted) transition-all duration-150 hover:translate-x-0.5 hover:bg-(--accent)/10 hover:text-(--text) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent)';

	const content = (
		<>
			<Icon size={15} aria-hidden="true" className="shrink-0 text-(--text-muted)/80 transition-colors group-hover:text-(--accent)" />
			<span className="min-w-0 leading-snug">{label}</span>
		</>
	);

	return (
		<li className="min-w-0">
			{onClick ? (
				<button type="button" onClick={onClick} className={className}>
					{content}
				</button>
			) : (
				<Link suppressHydrationWarning href={href || '#'} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={className}>
					{content}
				</Link>
			)}
		</li>
	);
}
